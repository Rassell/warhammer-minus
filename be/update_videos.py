import os
import json
import re
import time
import argparse
from typing import List, Dict, Any, Optional
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
API_KEY = os.getenv('YOUTUBE_API_KEY', '')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
GROQ_MODEL = os.getenv('GROQ_MODEL', 'openai/gpt-oss-120b')
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434/v1')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'qwen2.5:14b')

# Checkpoint file for LLM resume functionality
CHECKPOINT_FILE = '.llm_checkpoint.json'

# ============================================================================
# CHECKPOINT HELPERS
# ============================================================================

def get_channel_fingerprint(videos: List[Dict]) -> List[str]:
    """Return the sorted set of channel IDs present in a video list.

    Used to invalidate LLM checkpoints when the channel set changes, so a
    resume can never silently drop videos from a newly added channel.
    """
    return sorted({video.get('channelId', '') for video in videos if video.get('channelId')})

def save_checkpoint(videos: List[Dict], batch_num: int, mode: str) -> None:
    """Save progress checkpoint for LLM tagging."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    checkpoint_path = os.path.join(script_dir, CHECKPOINT_FILE)

    checkpoint = {
        'mode': mode,
        'batch_num': batch_num,
        'timestamp': time.time(),
        'total_videos': len(videos),
        'channels': get_channel_fingerprint(videos),
        'videos': videos
    }

    with open(checkpoint_path, 'w') as f:
        json.dump(checkpoint, f)

def load_checkpoint() -> Optional[Dict]:
    """Load existing checkpoint if it exists."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    checkpoint_path = os.path.join(script_dir, CHECKPOINT_FILE)

    if os.path.exists(checkpoint_path):
        with open(checkpoint_path, 'r') as f:
            return json.load(f)
    return None

def clear_checkpoint() -> None:
    """Remove checkpoint file after successful completion."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    checkpoint_path = os.path.join(script_dir, CHECKPOINT_FILE)

    if os.path.exists(checkpoint_path):
        os.remove(checkpoint_path)

def checkpoint_matches(checkpoint: Dict, mode: str, videos: List[Dict]) -> bool:
    """Check whether a checkpoint is usable for this mode and channel set."""
    if not checkpoint or checkpoint.get('mode') != mode:
        return False

    return checkpoint.get('channels') == get_channel_fingerprint(videos)

# ============================================================================
# CONFIGURATION LOADING
# ============================================================================

def load_config() -> tuple[List[str], Dict[str, List[str]], List[str], List[tuple], Dict[str, List[str]]]:
    """
    Load configuration from JSON files.

    Returns:
        Tuple of (EXCLUDE_PATTERNS, CHANNEL_EXCLUDE_PATTERNS, EXCLUDE_IDS, TAG_RULES, TAG_HIERARCHY)
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Load exclude patterns. Supports either the legacy flat list or
    # {"global": [...], "channels": {"<channelId>": [...]}} for per-channel rules.
    with open(os.path.join(script_dir, 'exclude_patterns.json'), 'r', encoding='utf-8') as f:
        exclude_config = json.load(f)

    if isinstance(exclude_config, dict):
        exclude_patterns = exclude_config.get('global', [])
        channel_exclude_patterns = exclude_config.get('channels', {})
    else:
        exclude_patterns = exclude_config
        channel_exclude_patterns = {}

    # Load exclude IDs
    with open(os.path.join(script_dir, 'exclude_ids.json'), 'r', encoding='utf-8') as f:
        exclude_ids = json.load(f)

    # Load tag rules (convert to list of tuples)
    with open(os.path.join(script_dir, 'tag_rules.json'), 'r', encoding='utf-8') as f:
        tag_rules_list = json.load(f)
        tag_rules = [(tag, pattern) for tag, pattern in tag_rules_list]

    # Load tag hierarchy
    with open(os.path.join(script_dir, 'tag_hierarchy.json'), 'r', encoding='utf-8') as f:
        tag_hierarchy = json.load(f)

    return exclude_patterns, channel_exclude_patterns, exclude_ids, tag_rules, tag_hierarchy

# Load configuration at module level
EXCLUDE_PATTERNS, CHANNEL_EXCLUDE_PATTERNS, EXCLUDE_IDS, TAG_RULES, TAG_HIERARCHY = load_config()

# Default channel list file (next to this script)
CHANNELS_FILE = 'channels.json'

def load_channels(path: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Load the list of YouTube channels to ingest.

    Args:
        path: Path to channels.json (default: channels.json next to this script)

    Returns:
        List of enabled channel config entries
    """
    if path:
        channels_path = path
    else:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        channels_path = os.path.join(script_dir, CHANNELS_FILE)

    try:
        with open(channels_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: File not found: {channels_path}")
        exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in {channels_path}: {e}")
        exit(1)

    entries = config.get('channels', []) if isinstance(config, dict) else config
    channels = [entry for entry in entries if entry.get('enabled', True)]

    if not channels:
        print(f"❌ Error: No enabled channels in {channels_path}")
        exit(1)

    return channels

def channel_entry_from_cli(ref: str) -> Dict[str, Any]:
    """Build a channel entry from a CLI value (channel ID or @handle)."""
    if ref.startswith('@') or not re.fullmatch(r'UC[\w-]{22}', ref):
        return {'handle': ref}

    return {'id': ref}

# ============================================================================
# YOUTUBE API FUNCTIONS
# ============================================================================

def resolve_channel(channel_ref: Dict[str, Any], default_query: Optional[str] = None,
                    quiet: bool = False) -> Optional[Dict[str, Any]]:
    """
    Resolve a channel config entry (ID or handle) to a concrete channel identity.

    Uses channels.list so @handles work and the uploads playlist comes from the
    API (more reliable than the old UC -> UU string substitution).

    Args:
        channel_ref: Dict with either 'id' or 'handle', plus optional 'label'/'query'
        default_query: Query used when the entry has no explicit 'query' key
        quiet: Suppress progress messages

    Returns:
        Dict with channelId, channelTitle, uploadsPlaylistId and query, or None
    """
    youtube = build('youtube', 'v3', developerKey=API_KEY)
    channel_id = channel_ref.get('id')
    handle = channel_ref.get('handle')

    params: Dict[str, Any] = {'part': 'snippet,contentDetails'}
    if channel_id:
        params['id'] = channel_id
    elif handle:
        params['forHandle'] = handle if handle.startswith('@') else f'@{handle}'
    else:
        print(f"❌ Error: Channel entry needs an 'id' or a 'handle': {channel_ref}")
        return None

    try:
        response = youtube.channels().list(**params).execute()
    except HttpError as e:
        print(f"❌ Could not resolve channel {channel_id or handle}: {e}")
        return None

    items = response.get('items', [])
    if not items:
        print(f"❌ Channel not found: {channel_id or handle}")
        return None

    item = items[0]
    title = item['snippet']['title']
    resolved = {
        'channelId': item['id'],
        'channelTitle': title,
        'uploadsPlaylistId': item['contentDetails']['relatedPlaylists']['uploads'],
        # An explicit "query": null in channels.json disables the filter for that channel
        'query': channel_ref['query'] if 'query' in channel_ref else default_query,
    }

    if not quiet:
        label = channel_ref.get('label') or title
        print(f"✓ {label}: {title} ({resolved['channelId']})")

    return resolved

def resolve_channels(channel_entries: List[Dict[str, Any]], default_query: Optional[str] = None,
                     quiet: bool = False) -> List[Dict[str, Any]]:
    """
    Resolve every channel entry, skipping any that fail.

    Args:
        channel_entries: Raw entries from channels.json (or CLI overrides)
        default_query: Query used when an entry has no explicit 'query' key
        quiet: Suppress progress messages

    Returns:
        List of resolved channel dicts
    """
    if not API_KEY:
        print("❌ Error: YOUTUBE_API_KEY not set. Please set it in .env file.")
        exit(1)

    resolved = []
    for entry in channel_entries:
        channel = resolve_channel(entry, default_query=default_query, quiet=quiet)
        if channel:
            resolved.append(channel)

    if not resolved:
        print("❌ Error: No channels could be resolved.")
        exit(1)

    return resolved

def get_all_channel_videos(uploads_playlist_id: str, channel_title: str = '',
                           max_results: int = 50, quiet: bool = False) -> List[str]:
    """
    Fetch all videos from a channel's uploads playlist.

    Args:
        uploads_playlist_id: Uploads playlist ID (from channels.list)
        channel_title: Channel name, used for progress messages
        max_results: Max results per API page
        quiet: Suppress progress messages

    Returns:
        List of video IDs
    """
    youtube = build('youtube', 'v3', developerKey=API_KEY)
    playlist_id = uploads_playlist_id
    video_ids = []
    next_page_token = None

    try:
        if not quiet:
            print(f"📂 Fetching all videos from {channel_title or playlist_id}...")
        while True:
            playlist_response = youtube.playlistItems().list(
                part='contentDetails',
                playlistId=playlist_id,
                maxResults=max_results,
                pageToken=next_page_token
            ).execute()

            for item in playlist_response.get('items', []):
                video_ids.append(item['contentDetails']['videoId'])

            next_page_token = playlist_response.get('nextPageToken')
            if not next_page_token:
                break

        if not quiet:
            print(f"✓ Found {len(video_ids)} total videos")
        return video_ids
    except HttpError as e:
        print(f"❌ An HTTP error occurred: {e}")
        return []

def get_video_details(video_ids: List[str], quiet: bool = False) -> List[Dict[str, Any]]:
    """
    Fetch detailed information for a list of video IDs.

    Args:
        video_ids: List of YouTube video IDs
        quiet: Suppress progress messages

    Returns:
        List of video dictionaries with full metadata
    """
    youtube = build('youtube', 'v3', developerKey=API_KEY)
    all_videos = []

    if not quiet:
        print(f"📂 Fetching details for {len(video_ids)} videos...")
    for i in range(0, len(video_ids), 50):
        batch_ids = video_ids[i:i+50]

        try:
            response = youtube.videos().list(
                part='snippet,contentDetails,statistics',
                id=','.join(batch_ids)
            ).execute()

            for item in response.get('items', []):
                thumbnail_url = item['snippet']['thumbnails'].get('maxres', {}).get('url') or \
                               item['snippet']['thumbnails'].get('high', {}).get('url') or \
                               item['snippet']['thumbnails'].get('default', {}).get('url', '')

                video = {
                    'videoId': item['id'],
                    'title': item['snippet']['title'],
                    'description': item['snippet']['description'],
                    'publishedAt': item['snippet']['publishedAt'],
                    'thumbnail': thumbnail_url,
                    'url': f"https://www.youtube.com/watch?v={item['id']}",
                    'duration': item['contentDetails'].get('duration', ''),
                    'viewCount': int(item['statistics'].get('viewCount', 0)),
                    'likeCount': int(item['statistics'].get('likeCount', 0)),
                    'channelId': item['snippet']['channelId'],
                    'channelTitle': item['snippet']['channelTitle'],
                }
                all_videos.append(video)

            if not quiet:
                print(f"  Processed {min(i+50, len(video_ids))}/{len(video_ids)} videos...")
        except HttpError as e:
            print(f"❌ An HTTP error occurred: {e}")
            continue

    return all_videos

def filter_videos(videos: List[Dict], query: Optional[str],
                  extra_exclude_patterns: Optional[List[str]] = None) -> List[Dict]:
    """
    Filter videos by search query in title or description, excluding certain patterns and IDs.

    Args:
        videos: List of video dictionaries
        query: Search query to filter by (None = no query filter)
        extra_exclude_patterns: Additional regex patterns (e.g. per-channel rules)

    Returns:
        Filtered list of videos
    """
    # First, exclude videos by ID
    filtered = [video for video in videos if video['videoId'] not in EXCLUDE_IDS]

    # Then exclude by title patterns (global + per-channel)
    patterns = list(EXCLUDE_PATTERNS)
    if extra_exclude_patterns:
        patterns.extend(extra_exclude_patterns)

    if patterns:
        exclude_regex = re.compile('|'.join(patterns), re.IGNORECASE)
        filtered = [
            video for video in filtered
            if not exclude_regex.search(video['title'])
        ]

    # Finally apply search query filter if provided
    if query:
        query_pattern = re.compile(re.escape(query), re.IGNORECASE)
        filtered = [
            video for video in filtered
            if query_pattern.search(video['title']) or query_pattern.search(video['description'])
        ]

    return filtered

def fetch_videos(channels: List[Dict[str, Any]], max_results: int = 50,
                 quiet: bool = False) -> List[Dict[str, Any]]:
    """
    Orchestrates the full YouTube fetch pipeline across every configured channel.

    Args:
        channels: Resolved channels (channelId, channelTitle, uploadsPlaylistId, query)
        max_results: Max results per API page
        quiet: Suppress progress messages

    Returns:
        Deduplicated list of filtered video dictionaries
    """
    all_videos: List[Dict[str, Any]] = []

    for channel in channels:
        channel_title = channel.get('channelTitle') or channel['channelId']
        if not quiet:
            print(f"\n📺 {channel_title}")

        # Step 1: Get all video IDs
        video_ids = get_all_channel_videos(
            channel['uploadsPlaylistId'], channel_title, max_results, quiet
        )

        if not video_ids:
            if not quiet:
                print(f"⚠️  No videos found for {channel_title}, skipping")
            continue

        # Step 2: Get detailed video info
        channel_videos = get_video_details(video_ids, quiet)

        # Step 3: Filter by this channel's query and exclusions
        channel_patterns = CHANNEL_EXCLUDE_PATTERNS.get(channel['channelId'], [])
        kept_videos = filter_videos(channel_videos, channel.get('query'), channel_patterns)
        excluded_count = len(channel_videos) - len(kept_videos)

        if not quiet:
            if channel.get('query'):
                print(f"✓ Filtered to {len(kept_videos)} videos matching "
                      f"'{channel['query']}' (excluded {excluded_count})")
            else:
                print(f"✓ Keeping {len(kept_videos)} videos "
                      f"(excluded {excluded_count} non-tutorial videos)")

        all_videos.extend(kept_videos)

    # Step 4: Merge channels, removing cross-channel duplicates
    unique_videos = deduplicate_videos(all_videos)

    if not quiet:
        duplicates = len(all_videos) - len(unique_videos)
        print(f"\n✓ Total: {len(unique_videos)} unique videos from {len(channels)} channel(s)")
        if duplicates:
            print(f"  Removed {duplicates} duplicate videos")

    return unique_videos

# ============================================================================
# TAGGING FUNCTIONS
# ============================================================================

def clean_description_for_tagging(description: str) -> str:
    """
    Remove paint lists and other content that can cause false positive tags.

    Paint names often contain faction names or keywords that trigger false positives:
    - "Dryad Bark" contains "Dryad" (Sylvaneth unit)
    - "Mephiston Red" contains "Mephiston" (Blood Angels character)
    - "Caliban Green" contains "Caliban" (Dark Angels homeworld)
    - "Black Legion" / "Black Templar" (Contrast paint names)
    - "Flesh Tearers Red" contains "Flesh Tearers" (Blood Angels successor)
    - "Iron Hands Steel" / "Iron Warriors" (paint names)
    - "Fenrisian Blue" contains "Fenrisian" (Space Wolves)
    - "Genestealer Purple" contains "Genestealer"
    - "Stormhost Silver" contains "Stormhost" (Stormcast unit)

    Args:
        description: Raw video description

    Returns:
        Cleaned description without paint lists
    """
    # Pattern 1: Standard format with introduction
    # Variations: "Here's a list of the paints", "Here are the colours we used"
    paint_list_patterns = [
        r'Here.s\s+a\s+list\s+of\s+the\s+paints.*?(?=Follow\s+for\s+more|If\s+you\s+enjoyed|$)',
        r'Here\s+are\s+the\s+(?:paints|colours).*?(?=Follow\s+for\s+more|If\s+you\s+enjoyed|$)',
        r'Paints\s+used:.*?(?=Follow\s+for\s+more|If\s+you\s+enjoyed|$)',
        r'In\s+this\s+video.*?(?:paints|tools).*?(?=Follow\s+for\s+more|If\s+you\s+enjoyed|$)',
    ]

    # Pattern 2: Direct paint list format (no introduction)
    # Starts with paint category headers like "Base:", "Contrast:", "Layer:"
    # Often follows a model/unit name line
    # Ends before social media links
    direct_paint_list = r'''
        (?:^|\n)                           # Start of line
        (?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\n)?  # Optional model name (e.g., "Asurmen", "Fuegan")
        (?:                                # Paint categories
            (?:Base|Layer|Shade|Contrast|Technical|Air|Dry|Glaze|Texture)s?:?\s*\n
            (?:[A-Z].*?\n)*?               # Paint names (capitalized lines)
        ){2,}                              # At least 2 categories
        .*?                                # Rest of paint list
        (?=Follow\s+for\s+more|If\s+you\s+enjoyed|Sign\s+up|Subscribe|$)
    '''

    cleaned = description

    # Apply standard patterns
    for pattern in paint_list_patterns:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE | re.DOTALL)

    # Apply direct paint list pattern
    cleaned = re.sub(direct_paint_list, '', cleaned, flags=re.MULTILINE | re.DOTALL | re.VERBOSE)

    return cleaned

def apply_tags(videos: List[Dict]) -> List[Dict]:
    """
    Apply TAG_RULES to videos based on title/description.

    Args:
        videos: List of video dictionaries

    Returns:
        Videos with tags applied
    """
    for video in videos:
        title = video.get('title', '')
        description = video.get('description', '')

        # Clean description to avoid false positives from paint names
        cleaned_description = clean_description_for_tagging(description)

        # Combine title and description for matching (title has more weight)
        search_text = f"{title} {title} {cleaned_description}"

        # Start with empty tags (don't preserve existing tags)
        tags = set()

        # Apply tag rules
        for tag, pattern in TAG_RULES:
            if re.search(pattern, search_text, re.IGNORECASE):
                tags.add(tag)

        video['tags'] = list(tags)

    return videos

def apply_tags_semantic(videos: List[Dict], threshold: float = 0.65,
                        model_name: str = 'all-MiniLM-L6-v2') -> List[Dict]:
    """
    Apply tags using semantic matching with sentence transformers.

    Args:
        videos: List of video dictionaries
        threshold: Similarity threshold for tagging
        model_name: Sentence transformer model to use

    Returns:
        Videos with semantic tags and confidence scores
    """
    from semantic_tagger import SemanticTagger

    print(f"🤖 Initializing semantic tagger (model: {model_name}, threshold: {threshold})...")
    tagger = SemanticTagger(model_name=model_name)

    print(f"📊 Tagging {len(videos)} videos semantically...")
    tagged_videos = tagger.tag_videos_batch(videos, threshold=threshold)

    return tagged_videos

def apply_tags_hybrid(videos: List[Dict], threshold: float = 0.70,
                     model_name: str = 'all-MiniLM-L6-v2') -> List[Dict]:
    """
    Hybrid approach: Use regex for high-confidence matches, semantic for validation.

    Strategy:
    1. Apply regex tags as usual
    2. For each regex tag, validate with semantic similarity
    3. Keep tag if semantic score >= threshold OR tag appears in title (lower threshold)
    4. Add any high-confidence semantic tags that regex missed

    Args:
        videos: List of video dictionaries
        threshold: Semantic validation threshold (higher for hybrid)
        model_name: Sentence transformer model to use

    Returns:
        Videos with validated tags
    """
    from semantic_tagger import SemanticTagger

    # Step 1: Apply regex tags
    print("🔍 Applying regex tags...")
    videos_with_regex = apply_tags(videos)

    # Step 2: Get semantic scores
    print(f"🤖 Computing semantic scores (model: {model_name})...")
    tagger = SemanticTagger(model_name=model_name)

    for video in videos_with_regex:
        title = video.get('title', '')
        description = clean_description_for_tagging(video.get('description', ''))

        # Get semantic scores for all tags
        all_semantic_scores = tagger.tag_video(title, description, threshold=0.0)

        # Validate regex tags
        regex_tags = set(video.get('tags', []))
        validated_tags = set()

        for tag in regex_tags:
            semantic_score = all_semantic_scores.get(tag, 0.0)

            # Title boost: if tag appears in title, use lower threshold
            tag_in_title = tag.lower() in title.lower()
            effective_threshold = threshold - 0.15 if tag_in_title else threshold

            # Keep if: high semantic score OR tag explicitly in title
            if semantic_score >= effective_threshold:
                validated_tags.add(tag)

        # Add high-confidence semantic tags that regex missed
        for tag, score in all_semantic_scores.items():
            if score >= 0.80 and tag not in validated_tags:  # Very high confidence
                validated_tags.add(tag)

        # Update video
        video['tags'] = list(validated_tags)
        video['tag_scores'] = {tag: all_semantic_scores.get(tag, 0.0)
                              for tag in validated_tags}

    return videos_with_regex

def parse_llm_video_result(raw_result: Any, tag_descriptions: Dict[str, str]) -> tuple:
    """
    Parse a single video's LLM result into (valid_tags, needs_review).

    Accepts either the current {"tags": [...], "review": bool} shape or a
    bare list of tags (older prompt format / model that ignored the shape).
    """
    if isinstance(raw_result, dict):
        video_tags = raw_result.get('tags', [])
        needs_review = bool(raw_result.get('review', False))
    else:
        video_tags = raw_result or []
        needs_review = False

    valid_tags = [t for t in video_tags if t in tag_descriptions]
    return valid_tags, needs_review

def apply_tags_llm(videos: List[Dict], quiet: bool = False, batch_size: int = 2) -> List[Dict]:
    """
    Apply tags using Google Gemini LLM for intelligent context-aware tagging.

    Sends batches of videos to Gemini 2.0 Flash for classification.
    Rate limited to 15 requests/minute (free tier).
    Using 2 videos per batch and 8-second delays = ~7.5 RPM (very conservative).
    """
    from google import genai
    from google.genai.types import GenerateContentConfig

    if not GEMINI_API_KEY:
        print("❌ Error: GEMINI_API_KEY not set in .env file.")
        print("   Get a free key at: https://aistudio.google.com/apikey")
        exit(1)

    client = genai.Client(api_key=GEMINI_API_KEY)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(script_dir, 'tag_descriptions.json'), 'r') as f:
        tag_descriptions = json.load(f)

    # Check for existing checkpoint
    checkpoint = load_checkpoint()
    start_batch = 0

    if checkpoint and checkpoint.get('mode') == 'gemini':
        if not checkpoint_matches(checkpoint, 'gemini', videos):
            if not quiet:
                print("⚠️  Found checkpoint for a different channel set, restarting...")
            clear_checkpoint()
        else:
            if not quiet:
                completed = checkpoint.get('batch_num', 0)
                total = (len(videos) + batch_size - 1) // batch_size
                print(f"📂 Found checkpoint: {completed}/{total} batches completed")
                print(f"   Resuming from batch {completed + 1}...")

            # Restore previously tagged videos
            videos = checkpoint['videos']
            start_batch = checkpoint['batch_num'] + 1
    elif checkpoint and checkpoint.get('mode') != 'gemini':
        if not quiet:
            print(f"⚠️  Found checkpoint for different mode ({checkpoint.get('mode')}), ignoring...")
        clear_checkpoint()

    tag_list_text = "\n".join(
        f"- {tag}: {desc}" for tag, desc in tag_descriptions.items()
    )

    # Load system prompt from file
    with open(os.path.join(script_dir, 'llm_system_prompt.txt'), 'r') as f:
        system_prompt_template = f.read()

    system_prompt = system_prompt_template.replace('{TAG_LIST}', tag_list_text)

    tagged_count = 0
    total_batches = (len(videos) + batch_size - 1) // batch_size

    if not quiet:
        if start_batch > 0:
            print(f"🤖 Resuming Gemini LLM tagging (batch {start_batch + 1}/{total_batches})...")
        else:
            print(f"🤖 Starting Gemini LLM tagging ({len(videos)} videos in {total_batches} batches)...")
        print(f"   Rate limit safety: 8s delays = ~7.5 RPM (very conservative)")
        print(f"   Estimated time: ~{(total_batches * 8) // 60} minutes")
        print(f"   💾 Auto-saving progress after each batch (resume on failure)")

    # Initial delay to avoid hitting any leftover rate limits or burst limits
    if start_batch == 0 and not quiet:
        print(f"   Waiting 10s to clear any burst limits...")
        time.sleep(10)

    for batch_start in range(start_batch * batch_size, len(videos), batch_size):
        batch = videos[batch_start:batch_start + batch_size]
        batch_num = batch_start // batch_size

        videos_text = ""
        for j, video in enumerate(batch):
            title = video.get('title', '')
            desc = video.get('description', '')[:500]
            videos_text += f"\nVideo {j + 1}:\nTitle: {title}\nDescription: {desc}\n"

        user_prompt = (
            f"{videos_text}\n\nReturn a JSON object mapping video numbers "
            f'(as strings) to {{"tags": [...], "review": bool}} objects. '
            f'Example: {{"1": {{"tags": ["40k", "space marines"], "review": false}}, '
            f'"2": {{"tags": ["aos", "beginner"], "review": false}}}}'
        )

        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=f"{system_prompt}\n\n{user_prompt}",
                    config=GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1,
                    )
                )

                results = json.loads(response.text)

                for j, video in enumerate(batch):
                    valid_tags, needs_review = parse_llm_video_result(
                        results.get(str(j + 1), {}), tag_descriptions)
                    video['tags'] = valid_tags
                    video['needs_review'] = needs_review or not valid_tags
                    if valid_tags:
                        tagged_count += 1
                break

            except Exception as e:
                if attempt < max_retries - 1:
                    # Check if it's a rate limit error (429)
                    if "429" in str(e) or "Resource has been exhausted" in str(e):
                        wait_time = 10 * (attempt + 1)  # Longer backoff for rate limits
                        if not quiet:
                            print(f"  ⚠️  Rate limit hit, waiting {wait_time}s before retry {attempt + 1}/{max_retries}...")
                    else:
                        wait_time = 5 * (attempt + 1)  # Normal retry backoff
                        if not quiet:
                            print(f"  ⚠️  Retry {attempt + 1}/{max_retries} for batch {batch_num}: {e}")
                    time.sleep(wait_time)
                else:
                    if not quiet:
                        print(f"  ❌ Failed batch {batch_num} after {max_retries} retries: {e}")
                    for video in batch:
                        if 'tags' not in video:
                            video['tags'] = []

        # Save checkpoint after each batch
        save_checkpoint(videos, batch_num, 'gemini')

        if batch_start + batch_size < len(videos):
            time.sleep(8)  # 8 seconds = ~7.5 RPM (very conservative, well under 15 RPM limit)

        if not quiet and batch_num % 5 == 0:
            processed = min(batch_start + batch_size, len(videos))
            print(f"  Tagged {processed}/{len(videos)} videos (batch {batch_num + 1}/{total_batches})...")

    # Clear checkpoint on successful completion
    clear_checkpoint()

    if not quiet:
        print(f"✓ LLM tagged {tagged_count}/{len(videos)} videos")
        print(f"  💾 Checkpoint cleared")

    return videos

def apply_tags_llm_groq(videos: List[Dict], quiet: bool = False, batch_size: int = 8) -> List[Dict]:
    """
    Apply tags using Groq LLM (model from GROQ_MODEL, default openai/gpt-oss-120b) for
    intelligent context-aware tagging.

    A large Groq-hosted model reasons about content far more reliably than a
    small model (fewer missed factions/techniques, fewer paint-name false
    positives), while Groq's inference speed keeps this fast even at the larger
    model size.
    Using 8 videos per batch with 1-second delays = safe for free tier.
    Supports checkpoint/resume in case of connection loss.
    """
    from groq import Groq

    if not GROQ_API_KEY:
        print("❌ Error: GROQ_API_KEY not set in .env file.")
        print("   Get a free key at: https://console.groq.com")
        exit(1)

    client = Groq(api_key=GROQ_API_KEY)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(script_dir, 'tag_descriptions.json'), 'r') as f:
        tag_descriptions = json.load(f)

    # Check for existing checkpoint
    checkpoint = load_checkpoint()
    start_batch = 0

    if checkpoint and checkpoint.get('mode') == 'groq':
        if not checkpoint_matches(checkpoint, 'groq', videos):
            if not quiet:
                print("⚠️  Found checkpoint for a different channel set, restarting...")
            clear_checkpoint()
        else:
            if not quiet:
                completed = checkpoint.get('batch_num', 0)
                total = (len(videos) + batch_size - 1) // batch_size
                print(f"📂 Found checkpoint: {completed}/{total} batches completed")
                print(f"   Resuming from batch {completed + 1}...")

            # Restore previously tagged videos
            videos = checkpoint['videos']
            start_batch = checkpoint['batch_num'] + 1
    elif checkpoint and checkpoint.get('mode') != 'groq':
        if not quiet:
            print(f"⚠️  Found checkpoint for different mode ({checkpoint.get('mode')}), ignoring...")
        clear_checkpoint()


    tag_list_text = "\n".join(
        f"- {tag}: {desc}" for tag, desc in tag_descriptions.items()
    )

    # Load system prompt from file
    with open(os.path.join(script_dir, 'llm_system_prompt.txt'), 'r') as f:
        system_prompt_template = f.read()

    system_prompt = system_prompt_template.replace('{TAG_LIST}', tag_list_text)

    tagged_count = 0
    total_batches = (len(videos) + batch_size - 1) // batch_size

    if not quiet:
        if start_batch > 0:
            print(f"🚀 Resuming Groq LLM tagging (batch {start_batch + 1}/{total_batches})...")
        else:
            print(f"🚀 Starting Groq LLM tagging ({len(videos)} videos in {total_batches} batches)...")
        print(f"   Using {GROQ_MODEL} - strong reasoning, still very fast")
        print(f"   Estimated time: ~{(total_batches * 2) // 60} minutes")
        print(f"   💾 Auto-saving progress after each batch (resume on failure)")

    for batch_start in range(start_batch * batch_size, len(videos), batch_size):
        batch = videos[batch_start:batch_start + batch_size]
        batch_num = batch_start // batch_size

        videos_text = ""
        for j, video in enumerate(batch):
            title = video.get('title', '')
            desc = video.get('description', '')[:500]
            videos_text += f"\nVideo {j + 1}:\nTitle: {title}\nDescription: {desc}\n"

        user_prompt = (
            f"{videos_text}\n\nReturn a JSON object mapping video numbers "
            f'(as strings) to {{"tags": [...], "review": bool}} objects. '
            f'Example: {{"1": {{"tags": ["40k", "space marines"], "review": false}}, '
            f'"2": {{"tags": ["aos", "beginner"], "review": false}}}}'
        )

        max_retries = 3
        for attempt in range(max_retries):
            try:
                request_kwargs: Dict[str, Any] = {
                    'model': GROQ_MODEL,
                    'messages': [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    'response_format': {"type": "json_object"},
                    'temperature': 0.1,
                    'max_tokens': 4000,
                }

                # gpt-oss models spend most of their budget on reasoning by default;
                # low effort keeps tagging fast without hurting tag quality.
                if GROQ_MODEL.startswith('openai/gpt-oss'):
                    request_kwargs['reasoning_effort'] = 'low'

                response = client.chat.completions.create(**request_kwargs)

                results = json.loads(response.choices[0].message.content)

                for j, video in enumerate(batch):
                    valid_tags, needs_review = parse_llm_video_result(
                        results.get(str(j + 1), {}), tag_descriptions)
                    video['tags'] = valid_tags
                    video['needs_review'] = needs_review or not valid_tags
                    if valid_tags:
                        tagged_count += 1
                break

            except Exception as e:
                if attempt < max_retries - 1:
                    error_str = str(e)
                    # Check if it's a rate limit error (429)
                    if "429" in error_str or "rate_limit" in error_str.lower():
                        # Try to parse the retry time from the error message
                        # Format: "Please try again in 23m55.967999999s"
                        import re
                        retry_match = re.search(r'try again in (\d+)m([\d.]+)s', error_str)
                        if retry_match:
                            minutes = int(retry_match.group(1))
                            seconds = float(retry_match.group(2))
                            wait_time = (minutes * 60) + seconds + 5  # Add 5s buffer

                            if not quiet:
                                print(f"  ⏳ Rate limit hit. Waiting {int(wait_time // 60)}m {int(wait_time % 60)}s for quota to reset...")
                                print(f"     (Groq free tier: 100K tokens/day - you're close to the limit)")
                        else:
                            wait_time = 10 * (attempt + 1)
                            if not quiet:
                                print(f"  ⚠️  Rate limit hit, waiting {wait_time}s before retry {attempt + 1}/{max_retries}...")
                    else:
                        wait_time = 3 * (attempt + 1)
                        if not quiet:
                            print(f"  ⚠️  Retry {attempt + 1}/{max_retries} for batch {batch_num}: {e}")
                    time.sleep(wait_time)
                else:
                    if not quiet:
                        print(f"  ❌ Failed batch {batch_num} after {max_retries} retries: {e}")
                    for video in batch:
                        if 'tags' not in video:
                            video['tags'] = []

        # Save checkpoint after each batch
        save_checkpoint(videos, batch_num, 'groq')

        # Groq is very fast and has generous rate limits, but still add small delay
        if batch_start + batch_size < len(videos):
            time.sleep(1)  # 1 second between batches (very fast)

        if not quiet and batch_num % 10 == 0:
            processed = min(batch_start + batch_size, len(videos))
            print(f"  Tagged {processed}/{len(videos)} videos (batch {batch_num + 1}/{total_batches})...")

    # Clear checkpoint on successful completion
    clear_checkpoint()

    if not quiet:
        print(f"✓ Groq LLM tagged {tagged_count}/{len(videos)} videos")
        print(f"  💾 Checkpoint cleared")

    return videos

def apply_tags_llm_local(videos: List[Dict], quiet: bool = False, batch_size: int = 8,
                         base_url: str = OLLAMA_BASE_URL, model: str = OLLAMA_MODEL) -> List[Dict]:
    """
    Apply tags using a locally-hosted LLM served through Ollama's
    OpenAI-compatible API (no API key, no rate limits, runs offline).

    Recommended model: qwen2.5:14b (pull via `ollama pull qwen2.5:14b`).
    Requires Ollama running locally (`brew services start ollama` or
    `ollama serve`) and the `openai` Python package installed.
    """
    from openai import OpenAI

    client = OpenAI(base_url=base_url, api_key="ollama")

    script_dir = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(script_dir, 'tag_descriptions.json'), 'r') as f:
        tag_descriptions = json.load(f)

    # Check for existing checkpoint
    checkpoint = load_checkpoint()
    start_batch = 0

    if checkpoint and checkpoint.get('mode') == 'local':
        if not checkpoint_matches(checkpoint, 'local', videos):
            if not quiet:
                print("⚠️  Found checkpoint for a different channel set, restarting...")
            clear_checkpoint()
        else:
            if not quiet:
                completed = checkpoint.get('batch_num', 0)
                total = (len(videos) + batch_size - 1) // batch_size
                print(f"📂 Found checkpoint: {completed}/{total} batches completed")
                print(f"   Resuming from batch {completed + 1}...")

            videos = checkpoint['videos']
            start_batch = checkpoint['batch_num'] + 1
    elif checkpoint and checkpoint.get('mode') != 'local':
        if not quiet:
            print(f"⚠️  Found checkpoint for different mode ({checkpoint.get('mode')}), ignoring...")
        clear_checkpoint()

    tag_list_text = "\n".join(
        f"- {tag}: {desc}" for tag, desc in tag_descriptions.items()
    )

    with open(os.path.join(script_dir, 'llm_system_prompt.txt'), 'r') as f:
        system_prompt_template = f.read()

    system_prompt = system_prompt_template.replace('{TAG_LIST}', tag_list_text)

    tagged_count = 0
    total_batches = (len(videos) + batch_size - 1) // batch_size

    if not quiet:
        if start_batch > 0:
            print(f"🖥️  Resuming local LLM tagging (batch {start_batch + 1}/{total_batches})...")
        else:
            print(f"🖥️  Starting local LLM tagging via Ollama ({len(videos)} videos in {total_batches} batches)...")
        print(f"   Model: {model} at {base_url}")
        print(f"   💾 Auto-saving progress after each batch (resume on failure)")

    for batch_start in range(start_batch * batch_size, len(videos), batch_size):
        batch = videos[batch_start:batch_start + batch_size]
        batch_num = batch_start // batch_size

        videos_text = ""
        for j, video in enumerate(batch):
            title = video.get('title', '')
            desc = video.get('description', '')[:500]
            videos_text += f"\nVideo {j + 1}:\nTitle: {title}\nDescription: {desc}\n"

        user_prompt = (
            f"{videos_text}\n\nReturn a JSON object mapping video numbers "
            f'(as strings) to {{"tags": [...], "review": bool}} objects. '
            f'Example: {{"1": {{"tags": ["40k", "space marines"], "review": false}}, '
            f'"2": {{"tags": ["aos", "beginner"], "review": false}}}}'
        )

        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1,
                )

                results = json.loads(response.choices[0].message.content)

                for j, video in enumerate(batch):
                    valid_tags, needs_review = parse_llm_video_result(
                        results.get(str(j + 1), {}), tag_descriptions)
                    video['tags'] = valid_tags
                    video['needs_review'] = needs_review or not valid_tags
                    if valid_tags:
                        tagged_count += 1
                break

            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = 3 * (attempt + 1)
                    if not quiet:
                        print(f"  ⚠️  Retry {attempt + 1}/{max_retries} for batch {batch_num}: {e}")
                    time.sleep(wait_time)
                else:
                    if not quiet:
                        print(f"  ❌ Failed batch {batch_num} after {max_retries} retries: {e}")
                        print(f"     Is Ollama running? Try: ollama serve")
                    for video in batch:
                        if 'tags' not in video:
                            video['tags'] = []
                            video['needs_review'] = True

        # Save checkpoint after each batch
        save_checkpoint(videos, batch_num, 'local')

        if not quiet and batch_num % 10 == 0:
            processed = min(batch_start + batch_size, len(videos))
            print(f"  Tagged {processed}/{len(videos)} videos (batch {batch_num + 1}/{total_batches})...")

    # Clear checkpoint on successful completion
    clear_checkpoint()

    if not quiet:
        print(f"✓ Local LLM tagged {tagged_count}/{len(videos)} videos")
        print(f"  💾 Checkpoint cleared")

    return videos

def apply_tag_hierarchy(videos: List[Dict]) -> List[Dict]:
    """
    Add parent tags based on TAG_HIERARCHY.

    Args:
        videos: List of video dictionaries with tags

    Returns:
        Videos with hierarchical tags applied
    """
    for video in videos:
        tags = set(video.get('tags', []))

        # Apply tag hierarchy (add parent tags)
        tags_to_add = set()
        for tag in tags:
            if tag in TAG_HIERARCHY:
                tags_to_add.update(TAG_HIERARCHY[tag])
        tags.update(tags_to_add)

        video['tags'] = list(tags)

    return videos

def deduplicate_videos(videos: List[Dict]) -> List[Dict]:
    """
    Remove duplicate videos by videoId.

    Args:
        videos: List of video dictionaries

    Returns:
        List of unique videos
    """
    unique_videos = {}
    for video in videos:
        video_id = video.get('videoId')
        if video_id and video_id not in unique_videos:
            unique_videos[video_id] = video

    return list(unique_videos.values())

def print_tag_statistics(videos: List[Dict]) -> None:
    """
    Print tag distribution and untagged videos.

    Args:
        videos: List of tagged video dictionaries
    """
    tag_stats = {}
    channel_stats = {}
    videos_without_tags = []
    videos_needing_review = []

    for video in videos:
        tags = video.get('tags', [])
        title = video.get('title', '')
        video_id = video.get('videoId', '')
        channel = video.get('channelTitle') or 'Unknown channel'

        channel_stats[channel] = channel_stats.get(channel, 0) + 1

        if not tags or tags == ['untagged']:
            videos_without_tags.append({
                'title': title,
                'videoId': video_id,
                'url': video.get('url', '')
            })

        if video.get('needs_review'):
            videos_needing_review.append({
                'title': title,
                'videoId': video_id,
                'url': video.get('url', '')
            })

        for tag in tags:
            tag_stats[tag] = tag_stats.get(tag, 0) + 1

    print(f"\n� Videos per channel:")
    for channel, count in sorted(channel_stats.items(), key=lambda x: x[1], reverse=True):
        print(f"  {channel}: {count} videos")

    print(f"\n�📊 Tag Statistics:")
    for tag, count in sorted(tag_stats.items(), key=lambda x: x[1], reverse=True)[:15]:
        print(f"  {tag}: {count} videos")

    if videos_without_tags:
        print(f"\n⚠️  {len(videos_without_tags)} videos without tags:")
        for video in videos_without_tags[:10]:  # Show first 10
            print(f"  - {video['title'][:80]}...")
        if len(videos_without_tags) > 10:
            print(f"  ... and {len(videos_without_tags) - 10} more")
        print(f"\nConsider adding patterns for these videos to TAG_RULES")

    if videos_needing_review:
        print(f"\n🔎 {len(videos_needing_review)} videos flagged as edge cases for manual review:")
        for video in videos_needing_review[:10]:  # Show first 10
            print(f"  - {video['title'][:80]}...")
        if len(videos_needing_review) > 10:
            print(f"  ... and {len(videos_needing_review) - 10} more")

def tag_videos_pipeline(videos: List[Dict], quiet: bool = False, no_stats: bool = False,
                       semantic: bool = False, hybrid: bool = False, llm: bool = False,
                       groq: bool = False, local: bool = False, threshold: float = 0.65,
                       model_name: str = 'all-MiniLM-L6-v2',
                       batch_size: Optional[int] = None) -> List[Dict]:
    """
    Orchestrate all tagging steps.

    Args:
        videos: List of video dictionaries
        quiet: Suppress progress messages
        no_stats: Skip tag statistics
        semantic: Use semantic tagging instead of regex
        hybrid: Use hybrid (regex + semantic validation)
        llm: Use Google Gemini LLM tagging
        groq: Use Groq LLM tagging (fast, generous free tier)
        local: Use a locally-hosted LLM via Ollama (no API key, offline)
        threshold: Semantic similarity threshold
        model_name: Sentence transformer model to use
        batch_size: Videos per LLM request (None = mode default)

    Returns:
        Tagged and deduplicated videos
    """
    if not quiet:
        mode = ("local" if local else "groq") if (local or groq) else (
            "llm" if llm else ("semantic" if semantic else ("hybrid" if hybrid else "regex")))
        print(f"🏷️  Tagging videos ({mode} mode)...")

    # Apply tagging based on mode
    llm_kwargs: Dict[str, Any] = {'quiet': quiet}
    if batch_size:
        llm_kwargs['batch_size'] = batch_size

    if groq:
        videos = apply_tags_llm_groq(videos, **llm_kwargs)
    elif local:
        videos = apply_tags_llm_local(videos, **llm_kwargs)
    elif llm:
        videos = apply_tags_llm(videos, **llm_kwargs)
    elif semantic:
        videos = apply_tags_semantic(videos, threshold, model_name)
    elif hybrid:
        videos = apply_tags_hybrid(videos, threshold, model_name)
    else:
        videos = apply_tags(videos)  # Original regex

    # Apply hierarchy (works with any tagging mode)
    videos = apply_tag_hierarchy(videos)

    # Mark untagged videos as needing review; keep any review flag an LLM mode already set
    for video in videos:
        if not video.get('tags'):
            video['tags'] = ['untagged']
            video['needs_review'] = True
        else:
            # Sort tags for consistency
            video['tags'] = sorted(video['tags'])
            video.setdefault('needs_review', False)

    # Deduplicate
    videos = deduplicate_videos(videos)

    if not quiet:
        print(f"✓ Tagged {len(videos)} unique videos")

    # Print stats unless disabled
    if not no_stats:
        print_tag_statistics(videos)

    return videos

# ============================================================================
# FILE I/O FUNCTIONS
# ============================================================================

def load_videos(input_path: str) -> List[Dict[str, Any]]:
    """
    Load videos from JSON file with error handling.

    Args:
        input_path: Path to input JSON file

    Returns:
        List of video dictionaries
    """
    try:
        print(f"📂 Loading videos from {input_path}...")
        with open(input_path, 'r', encoding='utf-8') as f:
            videos = json.load(f)
        print(f"✓ Loaded {len(videos)} videos")
        return videos
    except FileNotFoundError:
        print(f"❌ Error: File not found: {input_path}")
        exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in {input_path}: {e}")
        exit(1)

def save_videos(videos: List[Dict], output_path: str, label: str = "videos") -> None:
    """
    Save videos to JSON file with success message.

    Args:
        videos: List of video dictionaries
        output_path: Path to output JSON file
        label: Label for success message
    """
    try:
        print(f"💾 Saving {len(videos)} {label} to {output_path}...")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(videos, f, ensure_ascii=False, indent=2)
        print(f"✓ Saved to {output_path}")
    except IOError as e:
        print(f"❌ Error: Could not write to {output_path}: {e}")
        exit(1)

# ============================================================================
# ORCHESTRATION FUNCTIONS
# ============================================================================

def run_full_pipeline(
    channels: List[Dict[str, Any]],
    search_query: Optional[str],
    save_intermediate: bool = False,
    quiet: bool = False,
    no_stats: bool = False,
    semantic: bool = False,
    hybrid: bool = False,
    llm: bool = False,
    groq: bool = False,
    local: bool = False,
    threshold: float = 0.65,
    model_name: str = 'all-MiniLM-L6-v2',
    batch_size: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Execute full fetch + tag + save pipeline.

    Args:
        channels: Raw channel entries (channel ID or @handle, plus optional query)
        search_query: Default search query for channels without an explicit one
        save_intermediate: Save intermediate be/videos.json
        quiet: Suppress progress messages
        no_stats: Skip tag statistics
        semantic: Use semantic tagging
        hybrid: Use hybrid tagging
        llm: Use Google Gemini LLM tagging
        groq: Use Groq LLM tagging
        local: Use a locally-hosted LLM via Ollama
        threshold: Semantic similarity threshold
        model_name: Sentence transformer model to use

    Returns:
        List of tagged videos
    """
    if not API_KEY:
        print("❌ Error: YOUTUBE_API_KEY not set. Please set it in .env file.")
        exit(1)

    # Step 1: Resolve channels and fetch videos from YouTube
    resolved_channels = resolve_channels(channels, default_query=search_query, quiet=quiet)
    videos = fetch_videos(resolved_channels, quiet=quiet)

    if not videos:
        print("❌ No videos to process.")
        exit(1)

    # Step 2: Tag videos
    tagged_videos = tag_videos_pipeline(videos, quiet=quiet, no_stats=no_stats,
                                       semantic=semantic, hybrid=hybrid, llm=llm,
                                       groq=groq, local=local, threshold=threshold,
                                       model_name=model_name, batch_size=batch_size)

    # Step 3: Optionally save intermediate file
    if save_intermediate:
        save_videos(videos, './videos.json', 'raw videos')

    # Step 4: Save final tagged videos
    save_videos(tagged_videos, '../src/videos.json', 'tagged videos')

    return tagged_videos

def run_fetch_only(channels: List[Dict[str, Any]], search_query: Optional[str], quiet: bool = False) -> None:
    """
    Fetch videos and save to be/videos.json.

    Args:
        channels: Raw channel entries (channel ID or @handle, plus optional query)
        search_query: Default search query for channels without an explicit one
        quiet: Suppress progress messages
    """
    if not API_KEY:
        print("❌ Error: YOUTUBE_API_KEY not set. Please set it in .env file.")
        exit(1)

    resolved_channels = resolve_channels(channels, default_query=search_query, quiet=quiet)
    videos = fetch_videos(resolved_channels, quiet=quiet)

    if not videos:
        print("❌ No videos to save.")
        exit(1)

    save_videos(videos, './videos.json', 'videos')

def run_tag_only(input_path: str, output_path: str, quiet: bool = False, no_stats: bool = False,
                semantic: bool = False, hybrid: bool = False, llm: bool = False,
                groq: bool = False, local: bool = False, threshold: float = 0.65,
                model_name: str = 'all-MiniLM-L6-v2',
                batch_size: Optional[int] = None) -> None:
    """
    Load videos, tag them, save to output.

    Args:
        input_path: Input JSON file path
        output_path: Output JSON file path
        quiet: Suppress progress messages
        no_stats: Skip tag statistics
        semantic: Use semantic tagging
        hybrid: Use hybrid tagging
        llm: Use Google Gemini LLM tagging
        groq: Use Groq LLM tagging
        local: Use a locally-hosted LLM via Ollama
        threshold: Semantic similarity threshold
        model_name: Sentence transformer model to use
    """
    videos = load_videos(input_path)
    tagged_videos = tag_videos_pipeline(videos, quiet=quiet, no_stats=no_stats,
                                       semantic=semantic, hybrid=hybrid, llm=llm,
                                       groq=groq, local=local, threshold=threshold,
                                       model_name=model_name, batch_size=batch_size)
    save_videos(tagged_videos, output_path, 'tagged videos')

# ============================================================================
# CLI PARSING & MAIN
# ============================================================================

def main():
    """Main entry point with CLI argument parsing."""
    parser = argparse.ArgumentParser(
        description='Fetch Warhammer videos from YouTube and apply automatic tagging',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Full pipeline (fetch + tag + save)
  python update_videos.py

  # Save intermediate file for debugging
  python update_videos.py --save-intermediate

  # Only fetch videos
  python update_videos.py --fetch-only

  # Only tag existing videos
  python update_videos.py --tag-only

  # Fetch all videos (no query filter)
  python update_videos.py --no-query

  # Show the configured channels (from channels.json)
  python update_videos.py --list-channels

  # One-off channel override (repeatable)
  python update_videos.py --channel @SomePainter --channel UC1234567890abcdefghijkl
        """
    )

    # Execution modes (mutually exclusive)
    mode_group = parser.add_mutually_exclusive_group()
    mode_group.add_argument('--fetch-only', action='store_true',
                           help='Only fetch videos from YouTube (save to ./videos.json)')
    mode_group.add_argument('--tag-only', action='store_true',
                           help='Only tag existing videos (read from --input)')

    # Configuration arguments
    parser.add_argument('--channel', action='append', metavar='ID_OR_HANDLE',
                       help='YouTube channel ID or @handle (repeatable, overrides --channels)')
    parser.add_argument('--channels', type=str, default=None,
                       help='Path to channels.json (default: channels.json next to this script)')
    parser.add_argument('--list-channels', action='store_true',
                       help='Resolve and print the configured channels, then exit')
    parser.add_argument('--query', type=str, default='paint',
                       help='Search query filter (default: "paint")')
    parser.add_argument('--no-query', action='store_true',
                       help='Disable query filter, get all videos')
    parser.add_argument('--save-intermediate', action='store_true',
                       help='Save intermediate ./videos.json in full pipeline mode')
    parser.add_argument('--input', type=str, default='./videos.json',
                       help='Input file for --tag-only mode (default: ./videos.json)')
    parser.add_argument('--output', type=str, default='../src/videos.json',
                       help='Output file path (default: ../src/videos.json)')
    parser.add_argument('--quiet', action='store_true',
                       help='Suppress progress messages')
    parser.add_argument('--no-stats', action='store_true',
                       help='Skip tag statistics output')

    # Tagging mode arguments
    tagging_mode = parser.add_mutually_exclusive_group()
    tagging_mode.add_argument('--semantic', action='store_true',
                              help='Use semantic tagging instead of regex (slower but more accurate)')
    tagging_mode.add_argument('--hybrid', action='store_true',
                              help='Use hybrid: regex for obvious matches, semantic for validation')
    tagging_mode.add_argument('--llm', action='store_true',
                              help='Use Google Gemini LLM for intelligent tagging (requires GEMINI_API_KEY)')
    tagging_mode.add_argument('--groq', action='store_true',
                              help='Use Groq LLM (model from GROQ_MODEL, default openai/gpt-oss-120b) - strong reasoning, still very fast, generous free tier (requires GROQ_API_KEY)')
    tagging_mode.add_argument('--local', action='store_true',
                              help='Use a locally-hosted LLM via Ollama - no API key, no rate limits, runs offline (requires `ollama serve` and a pulled model, e.g. `ollama pull qwen2.5:14b`)')
    parser.add_argument('--threshold', type=float, default=0.65,
                       help='Semantic similarity threshold (0.0-1.0, default: 0.65)')
    parser.add_argument('--batch-size', type=int, default=None,
                       help='Videos per LLM request (default: 8 for Groq/local, 2 for Gemini)')
    parser.add_argument('--model', type=str, default='all-distilroberta-v1',
                       choices=['all-MiniLM-L6-v2', 'all-mpnet-base-v2',
                               'paraphrase-MiniLM-L6-v2', 'all-distilroberta-v1'],
                       help='Sentence transformer model (default: all-MiniLM-L6-v2)')

    args = parser.parse_args()

    # Handle --no-query flag
    search_query = None if args.no_query else args.query

    # Channel source: --channel overrides take precedence over channels.json
    if args.channel:
        channel_entries = [channel_entry_from_cli(ref) for ref in args.channel]
    else:
        channel_entries = load_channels(args.channels)

    if args.list_channels:
        resolve_channels(channel_entries, default_query=search_query)
        return

    # Execute based on mode
    if args.fetch_only:
        run_fetch_only(channel_entries, search_query, args.quiet)
    elif args.tag_only:
        run_tag_only(args.input, args.output, args.quiet, args.no_stats,
                    semantic=args.semantic, hybrid=args.hybrid, llm=args.llm,
                    groq=args.groq, local=args.local, threshold=args.threshold,
                    model_name=args.model, batch_size=args.batch_size)
    else:
        # Full pipeline (default)
        run_full_pipeline(
            channel_entries,
            search_query,
            save_intermediate=args.save_intermediate,
            quiet=args.quiet,
            no_stats=args.no_stats,
            semantic=args.semantic,
            hybrid=args.hybrid,
            llm=args.llm,
            groq=args.groq,
            local=args.local,
            threshold=args.threshold,
            model_name=args.model,
            batch_size=args.batch_size
        )

if __name__ == "__main__":
    main()
