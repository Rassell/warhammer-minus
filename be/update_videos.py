import os
import json
import re
import argparse
from typing import List, Dict, Any, Optional
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
API_KEY = os.getenv('YOUTUBE_API_KEY', '')

# ============================================================================
# CONFIGURATION LOADING
# ============================================================================

def load_config() -> tuple[List[str], List[str], List[tuple], Dict[str, List[str]]]:
    """
    Load configuration from JSON files.

    Returns:
        Tuple of (EXCLUDE_PATTERNS, EXCLUDE_IDS, TAG_RULES, TAG_HIERARCHY)
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Load exclude patterns
    with open(os.path.join(script_dir, 'exclude_patterns.json'), 'r', encoding='utf-8') as f:
        exclude_patterns = json.load(f)

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

    return exclude_patterns, exclude_ids, tag_rules, tag_hierarchy

# Load configuration at module level
EXCLUDE_PATTERNS, EXCLUDE_IDS, TAG_RULES, TAG_HIERARCHY = load_config()

# ============================================================================
# YOUTUBE API FUNCTIONS
# ============================================================================

def get_uploads_playlist_id(channel_id: str) -> str:
    """Convert channel ID to uploads playlist ID (UC -> UU)."""
    if channel_id.startswith('UC'):
        return 'UU' + channel_id[2:]
    return channel_id

def get_all_channel_videos(channel_id: str, max_results: int = 50, quiet: bool = False) -> List[str]:
    """
    Fetch all videos from a channel's uploads playlist.

    Args:
        channel_id: YouTube channel ID
        max_results: Max results per API page
        quiet: Suppress progress messages

    Returns:
        List of video IDs
    """
    youtube = build('youtube', 'v3', developerKey=API_KEY)
    playlist_id = get_uploads_playlist_id(channel_id)
    video_ids = []
    next_page_token = None

    try:
        if not quiet:
            print(f"📂 Fetching all videos from playlist {playlist_id}...")
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
                }
                all_videos.append(video)

            if not quiet:
                print(f"  Processed {min(i+50, len(video_ids))}/{len(video_ids)} videos...")
        except HttpError as e:
            print(f"❌ An HTTP error occurred: {e}")
            continue

    return all_videos

def filter_videos(videos: List[Dict], query: Optional[str]) -> List[Dict]:
    """
    Filter videos by search query in title or description, excluding certain patterns and IDs.

    Args:
        videos: List of video dictionaries
        query: Search query to filter by (None = no query filter)

    Returns:
        Filtered list of videos
    """
    # First, exclude videos by ID
    filtered = [video for video in videos if video['videoId'] not in EXCLUDE_IDS]

    # Then exclude by title patterns
    exclude_regex = re.compile('|'.join(EXCLUDE_PATTERNS), re.IGNORECASE)
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

def fetch_videos(channel_id: str, search_query: Optional[str], max_results: int = 50, quiet: bool = False) -> List[Dict[str, Any]]:
    """
    Orchestrates the full YouTube fetch pipeline.

    Args:
        channel_id: YouTube channel ID
        search_query: Optional search query to filter videos
        max_results: Max results per API page
        quiet: Suppress progress messages

    Returns:
        List of filtered video dictionaries
    """
    # Step 1: Get all video IDs
    video_ids = get_all_channel_videos(channel_id, max_results, quiet)

    if not video_ids:
        print("❌ No videos found.")
        return []

    # Step 2: Get detailed video info
    all_videos = get_video_details(video_ids, quiet)

    # Step 3: Filter by query and exclusions
    filtered_videos = filter_videos(all_videos, search_query)
    excluded_count = len(all_videos) - len(filtered_videos)

    if not quiet:
        if search_query:
            print(f"✓ Filtered to {len(filtered_videos)} videos matching '{search_query}' (excluded {excluded_count})")
        else:
            print(f"✓ Keeping {len(filtered_videos)} videos (excluded {excluded_count} non-tutorial videos)")

    return filtered_videos

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
    videos_without_tags = []

    for video in videos:
        tags = video.get('tags', [])
        title = video.get('title', '')
        video_id = video.get('videoId', '')

        if not tags or tags == ['untagged']:
            videos_without_tags.append({
                'title': title,
                'videoId': video_id,
                'url': video.get('url', '')
            })

        for tag in tags:
            tag_stats[tag] = tag_stats.get(tag, 0) + 1

    print(f"\n📊 Tag Statistics:")
    for tag, count in sorted(tag_stats.items(), key=lambda x: x[1], reverse=True)[:15]:
        print(f"  {tag}: {count} videos")

    if videos_without_tags:
        print(f"\n⚠️  {len(videos_without_tags)} videos without tags:")
        for video in videos_without_tags[:10]:  # Show first 10
            print(f"  - {video['title'][:80]}...")
        if len(videos_without_tags) > 10:
            print(f"  ... and {len(videos_without_tags) - 10} more")
        print(f"\nConsider adding patterns for these videos to TAG_RULES")

def tag_videos_pipeline(videos: List[Dict], quiet: bool = False, no_stats: bool = False) -> List[Dict]:
    """
    Orchestrate all tagging steps.

    Args:
        videos: List of video dictionaries
        quiet: Suppress progress messages
        no_stats: Skip tag statistics output

    Returns:
        Tagged and deduplicated videos
    """
    # Apply tags
    videos = apply_tags(videos)

    # Apply hierarchy
    videos = apply_tag_hierarchy(videos)

    # Mark untagged videos
    for video in videos:
        if not video.get('tags'):
            video['tags'] = ['untagged']
        else:
            # Sort tags for consistency
            video['tags'] = sorted(video['tags'])

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
    channel_id: str,
    search_query: Optional[str],
    save_intermediate: bool = False,
    quiet: bool = False,
    no_stats: bool = False
) -> List[Dict[str, Any]]:
    """
    Execute full fetch + tag + save pipeline.

    Args:
        channel_id: YouTube channel ID
        search_query: Search query to filter videos
        save_intermediate: Save intermediate be/videos.json
        quiet: Suppress progress messages
        no_stats: Skip tag statistics

    Returns:
        List of tagged videos
    """
    if not API_KEY:
        print("❌ Error: YOUTUBE_API_KEY not set. Please set it in .env file.")
        exit(1)

    # Step 1: Fetch videos from YouTube
    videos = fetch_videos(channel_id, search_query, quiet=quiet)

    if not videos:
        print("❌ No videos to process.")
        exit(1)

    # Step 2: Tag videos
    tagged_videos = tag_videos_pipeline(videos, quiet=quiet, no_stats=no_stats)

    # Step 3: Optionally save intermediate file
    if save_intermediate:
        save_videos(videos, './videos.json', 'raw videos')

    # Step 4: Save final tagged videos
    save_videos(tagged_videos, '../src/videos.json', 'tagged videos')

    return tagged_videos

def run_fetch_only(channel_id: str, search_query: Optional[str], quiet: bool = False) -> None:
    """
    Fetch videos and save to be/videos.json.

    Args:
        channel_id: YouTube channel ID
        search_query: Search query to filter videos
        quiet: Suppress progress messages
    """
    if not API_KEY:
        print("❌ Error: YOUTUBE_API_KEY not set. Please set it in .env file.")
        exit(1)

    videos = fetch_videos(channel_id, search_query, quiet=quiet)

    if not videos:
        print("❌ No videos to save.")
        exit(1)

    save_videos(videos, './videos.json', 'videos')

def run_tag_only(input_path: str, output_path: str, quiet: bool = False, no_stats: bool = False) -> None:
    """
    Load videos, tag them, save to output.

    Args:
        input_path: Input JSON file path
        output_path: Output JSON file path
        quiet: Suppress progress messages
        no_stats: Skip tag statistics
    """
    videos = load_videos(input_path)
    tagged_videos = tag_videos_pipeline(videos, quiet=quiet, no_stats=no_stats)
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

  # Custom channel and query
  python update_videos.py --channel UC1234567890 --query "tutorial"
        """
    )

    # Execution modes (mutually exclusive)
    mode_group = parser.add_mutually_exclusive_group()
    mode_group.add_argument('--fetch-only', action='store_true',
                           help='Only fetch videos from YouTube (save to ./videos.json)')
    mode_group.add_argument('--tag-only', action='store_true',
                           help='Only tag existing videos (read from --input)')

    # Configuration arguments
    parser.add_argument('--channel', type=str, default='UCwdh3MTrFq3sXlB4ct8B-Fg',
                       help='YouTube channel ID (default: Warhammer official)')
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

    args = parser.parse_args()

    # Handle --no-query flag
    search_query = None if args.no_query else args.query

    # Execute based on mode
    if args.fetch_only:
        run_fetch_only(args.channel, search_query, args.quiet)
    elif args.tag_only:
        run_tag_only(args.input, args.output, args.quiet, args.no_stats)
    else:
        # Full pipeline (default)
        run_full_pipeline(
            args.channel,
            search_query,
            save_intermediate=args.save_intermediate,
            quiet=args.quiet,
            no_stats=args.no_stats
        )

if __name__ == "__main__":
    main()
