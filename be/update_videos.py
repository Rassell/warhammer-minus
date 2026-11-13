"""Fetch Warhammer painting tutorial videos from YouTube.

This script only ingests data. It fetches the videos of every channel listed in
`channels.json`, filters them, and carries over the tags that were assigned
manually to the previous `videos.json` (matched by `videoId`).

Tags are NOT generated here. They are produced by asking a generic AI assistant
and pasting the result back into the JSON file - see `TAGGING_PROMPT.md`.

Usage:
    python update_videos.py
    python update_videos.py --list-channels
    python update_videos.py --channel @SomePainter
"""

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

# A video this long (or shorter) is considered a short / clip and dropped.
# YouTube Shorts are capped at 60 seconds, so anything at or below that is not a
# tutorial. Set "short_video_max_seconds" in exclude_patterns.json to tune it
# (0 disables the filter).
DEFAULT_SHORT_VIDEO_MAX_SECONDS = 60

def load_config() -> tuple[List[str], Dict[str, List[str]], List[str], int]:
    """
    Load exclusion configuration from JSON files.

    Returns:
        Tuple of (EXCLUDE_PATTERNS, CHANNEL_EXCLUDE_PATTERNS, EXCLUDE_IDS,
        SHORT_VIDEO_MAX_SECONDS)
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Load exclude patterns. Supports either the legacy flat list or
    # {"global": [...], "channels": {"<channelId>": [...]}} for per-channel rules.
    with open(os.path.join(script_dir, 'exclude_patterns.json'), 'r', encoding='utf-8') as f:
        exclude_config = json.load(f)

    if isinstance(exclude_config, dict):
        exclude_patterns = exclude_config.get('global', [])
        channel_exclude_patterns = exclude_config.get('channels', {})
        short_video_max_seconds = int(exclude_config.get(
            'short_video_max_seconds', DEFAULT_SHORT_VIDEO_MAX_SECONDS
        ))
    else:
        exclude_patterns = exclude_config
        channel_exclude_patterns = {}
        short_video_max_seconds = DEFAULT_SHORT_VIDEO_MAX_SECONDS

    # Load exclude IDs
    with open(os.path.join(script_dir, 'exclude_ids.json'), 'r', encoding='utf-8') as f:
        exclude_ids = json.load(f)

    return exclude_patterns, channel_exclude_patterns, exclude_ids, short_video_max_seconds

# Load configuration at module level
EXCLUDE_PATTERNS, CHANNEL_EXCLUDE_PATTERNS, EXCLUDE_IDS, SHORT_VIDEO_MAX_SECONDS = load_config()

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

def parse_iso8601_duration(duration: str) -> Optional[int]:
    """
    Convert a YouTube ISO 8601 duration (e.g. "PT1M30S") into seconds.

    Args:
        duration: ISO 8601 duration string as returned by the YouTube API

    Returns:
        Duration in seconds, or None when the value cannot be parsed
    """
    if not duration:
        return None

    match = re.fullmatch(r'P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration)
    if not match:
        return None

    days, hours, minutes, seconds = (int(group) if group else 0 for group in match.groups())
    return days * 86400 + hours * 3600 + minutes * 60 + seconds

def is_short_video(duration: str, max_seconds: int) -> bool:
    """
    Whether a video is too short to be a tutorial (a short / clip).

    Unknown or unparseable durations are never considered short, so a missing
    value cannot silently drop a video.

    Args:
        duration: ISO 8601 duration string
        max_seconds: Videos at or below this length are shorts (0 disables)

    Returns:
        True when the video should be dropped as a short
    """
    if max_seconds <= 0:
        return False

    total_seconds = parse_iso8601_duration(duration)
    return total_seconds is not None and total_seconds <= max_seconds

def filter_videos(videos: List[Dict], query: Optional[str],
                  extra_exclude_patterns: Optional[List[str]] = None,
                  short_video_max_seconds: Optional[int] = None) -> List[Dict]:
    """
    Filter videos by search query in title or description, excluding certain patterns and IDs.

    Args:
        videos: List of video dictionaries
        query: Search query to filter by (None = no query filter)
        extra_exclude_patterns: Additional regex patterns (e.g. per-channel rules)
        short_video_max_seconds: Drop videos at or below this length
            (None = use the configured value, 0 = keep shorts)

    Returns:
        Filtered list of videos
    """
    max_seconds = SHORT_VIDEO_MAX_SECONDS if short_video_max_seconds is None else short_video_max_seconds

    # First, exclude videos by ID
    filtered = [video for video in videos if video['videoId'] not in EXCLUDE_IDS]

    # Then drop shorts / clips, which are not tutorials
    filtered = [
        video for video in filtered
        if not is_short_video(video.get('duration', ''), max_seconds)
    ]

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
                 quiet: bool = False,
                 short_video_max_seconds: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Orchestrates the full YouTube fetch pipeline across every configured channel.

    Args:
        channels: Resolved channels (channelId, channelTitle, uploadsPlaylistId, query)
        max_results: Max results per API page
        quiet: Suppress progress messages
        short_video_max_seconds: Drop videos at or below this length
            (None = use the configured value, 0 = keep shorts)

    Returns:
        Deduplicated list of filtered video dictionaries
    """
    max_seconds = SHORT_VIDEO_MAX_SECONDS if short_video_max_seconds is None else short_video_max_seconds
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
        shorts_count = sum(
            1 for video in channel_videos
            if is_short_video(video.get('duration', ''), max_seconds)
        )
        kept_videos = filter_videos(
            channel_videos, channel.get('query'), channel_patterns, max_seconds
        )
        excluded_count = len(channel_videos) - len(kept_videos)

        if not quiet:
            if channel.get('query'):
                print(f"✓ Filtered to {len(kept_videos)} videos matching "
                      f"'{channel['query']}' (excluded {excluded_count})")
            else:
                print(f"✓ Keeping {len(kept_videos)} videos "
                      f"(excluded {excluded_count} non-tutorial videos)")
            if shorts_count:
                print(f"  Dropped {shorts_count} short videos "
                      f"(<= {max_seconds}s)")

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
# UTILITIES
# ============================================================================

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

def apply_saved_tags(videos: List[Dict], tags_path: Optional[str],
                     quiet: bool = False) -> List[Dict]:
    """
    Carry over the tags that were assigned manually in a previous videos.json.

    Tags are matched by videoId. Videos with no saved tags (new videos, or ones
    that were never tagged) get an empty list and are flagged for review.

    Args:
        videos: Fetched video dictionaries
        tags_path: Path to the JSON file holding the manually assigned tags
        quiet: Suppress progress messages

    Returns:
        Videos with 'tags' and 'needs_review' filled in
    """
    saved_tags: Dict[str, List[str]] = {}

    if tags_path and os.path.exists(tags_path):
        try:
            with open(tags_path, 'r', encoding='utf-8') as f:
                for entry in json.load(f):
                    video_id = entry.get('videoId')
                    if video_id:
                        saved_tags[video_id] = entry.get('tags') or []
        except (json.JSONDecodeError, OSError) as e:
            print(f"⚠️  Could not read tags from {tags_path}: {e}")
    elif not quiet:
        print(f"ℹ️  No previous tags found at {tags_path}, starting from scratch")

    tagged_count = 0
    for video in videos:
        tags = saved_tags.get(video.get('videoId'), [])
        # Normalise: drop empties, remove duplicates, keep the order stable
        tags = sorted({tag for tag in tags if isinstance(tag, str) and tag.strip()})
        video['tags'] = tags
        video['needs_review'] = not tags
        if tags:
            tagged_count += 1

    if not quiet:
        print(f"🏷️  Carried over tags for {tagged_count}/{len(videos)} videos "
              f"({len(videos) - tagged_count} still untagged)")

    return videos

def public_video(video: Dict[str, Any]) -> Dict[str, Any]:
    """
    Project a fetched video onto the exact field set consumed by the frontend.

    Keeps the JSON schema stable: fetch-only fields (if any are ever added) and
    the per-channel bookkeeping never leak into src/videos.json.
    """
    return {
        'videoId': video['videoId'],
        'title': video.get('title', ''),
        'description': video.get('description', ''),
        'publishedAt': video.get('publishedAt', ''),
        'thumbnail': video.get('thumbnail', ''),
        'url': video.get('url', ''),
        'duration': video.get('duration', ''),
        'viewCount': video.get('viewCount', 0),
        'likeCount': video.get('likeCount', 0),
        'channelId': video.get('channelId', ''),
        'channelTitle': video.get('channelTitle', ''),
        'tags': video.get('tags', []),
        'needs_review': video.get('needs_review', True),
    }

def print_pipeline_summary(videos: List[Dict]) -> None:
    """
    Print per-channel counts and the videos that still have no tags.

    Args:
        videos: List of videos (after tags have been merged)
    """
    channel_counts: Dict[str, int] = {}
    untagged = []

    for video in videos:
        channel = video.get('channelTitle') or 'Unknown channel'
        channel_counts[channel] = channel_counts.get(channel, 0) + 1
        if not video.get('tags'):
            untagged.append(video)

    print("\n📺 Videos per channel:")
    for channel, count in sorted(channel_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {channel}: {count} videos")

    tagged_count = len(videos) - len(untagged)
    print(f"\n🏷️  Tags: {tagged_count}/{len(videos)} videos tagged, {len(untagged)} pending")

    if untagged:
        print("\n📝 Still untagged (see TAGGING_PROMPT.md):")
        for video in untagged[:10]:
            print(f"  - {video['videoId']}  {video.get('title', '')[:70]}")
        if len(untagged) > 10:
            print(f"  ... and {len(untagged) - 10} more")

# ============================================================================
# FILE I/O FUNCTIONS
# ============================================================================

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

def run_pipeline(
    channels: List[Dict[str, Any]],
    search_query: Optional[str],
    output_path: str = '../src/videos.json',
    tags_from: Optional[str] = None,
    save_intermediate: bool = False,
    quiet: bool = False,
    no_stats: bool = False,
    short_video_max_seconds: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Execute the fetch -> filter -> merge tags -> save pipeline.

    Args:
        channels: Raw channel entries (channel ID or @handle, plus optional query)
        search_query: Default search query for channels without an explicit one
        output_path: Where the final videos.json is written
        tags_from: File to read manually assigned tags from (defaults to output_path)
        save_intermediate: Save the raw fetch to be/videos.json
        quiet: Suppress progress messages
        no_stats: Skip the end-of-run summary
        short_video_max_seconds: Drop videos at or below this length
            (None = use the configured value, 0 = keep shorts)

    Returns:
        The saved videos
    """
    if not API_KEY:
        print("❌ Error: YOUTUBE_API_KEY not set. Please set it in .env file.")
        exit(1)

    # Step 1: Resolve channels and fetch videos from YouTube
    resolved_channels = resolve_channels(channels, default_query=search_query, quiet=quiet)
    videos = fetch_videos(
        resolved_channels, quiet=quiet, short_video_max_seconds=short_video_max_seconds
    )

    if not videos:
        print("❌ No videos to process.")
        exit(1)

    # Step 2: Optionally save the raw fetch for debugging
    if save_intermediate:
        save_videos(videos, './videos.json', 'raw videos')

    # Step 3: Carry over the tags that were assigned manually
    videos = apply_saved_tags(videos, tags_from or output_path, quiet=quiet)

    # Step 4: Keep the public schema stable and save
    videos = [public_video(video) for video in videos]
    save_videos(videos, output_path, 'videos')

    if not no_stats:
        print_pipeline_summary(videos)

    return videos

# ============================================================================
# CLI PARSING & MAIN
# ============================================================================

def main():
    """Main entry point with CLI argument parsing."""
    parser = argparse.ArgumentParser(
        description='Fetch Warhammer videos from YouTube and keep manually assigned tags',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Fetch videos, keep the tags already in src/videos.json, save
  python update_videos.py

  # Save the raw fetch to be/videos.json as well (for debugging)
  python update_videos.py --save-intermediate

  # Fetch all videos (no query filter)
  python update_videos.py --no-query

  # Keep shorts as well (disable the duration filter)
  python update_videos.py --shorts-max-seconds 0

  # Show the configured channels (from channels.json)
  python update_videos.py --list-channels

  # One-off channel override (repeatable)
  python update_videos.py --channel @SomePainter --channel UC1234567890abcdefghijkl

Tags are added manually with the prompt in TAGGING_PROMPT.md, never by this script.
        """
    )

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
                       help='Save the raw fetch to ./videos.json')
    parser.add_argument('--output', type=str, default='../src/videos.json',
                       help='Output file path (default: ../src/videos.json)')
    parser.add_argument('--tags-from', type=str, default=None,
                       help='File to read manually assigned tags from (default: the --output file)')
    parser.add_argument('--quiet', action='store_true',
                       help='Suppress progress messages')
    parser.add_argument('--no-stats', action='store_true',
                       help='Skip the end-of-run summary')
    parser.add_argument('--shorts-max-seconds', type=int, default=None, metavar='SECONDS',
                       help='Drop videos this long or shorter as shorts '
                            '(default: short_video_max_seconds from exclude_patterns.json; 0 keeps them)')

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

    run_pipeline(
        channel_entries,
        search_query,
        output_path=args.output,
        tags_from=args.tags_from,
        save_intermediate=args.save_intermediate,
        quiet=args.quiet,
        no_stats=args.no_stats,
        short_video_max_seconds=args.shorts_max_seconds
    )

if __name__ == "__main__":
    main()
