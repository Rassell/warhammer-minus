import os
import json
import re
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
# Set your API key here or use an environment variable
API_KEY = os.getenv('YOUTUBE_API_KEY', '')

def get_uploads_playlist_id(channel_id):
    """Convert channel ID to uploads playlist ID (UC -> UU)"""
    if channel_id.startswith('UC'):
        return 'UU' + channel_id[2:]
    return channel_id

def get_all_channel_videos(channel_id, max_results=50):
    """Fetch all videos from a channel's uploads playlist"""
    youtube = build('youtube', 'v3', developerKey=API_KEY)
    playlist_id = get_uploads_playlist_id(channel_id)
    video_ids = []
    next_page_token = None

    try:
        print(f"Fetching all videos from playlist {playlist_id}...")
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

        print(f"Found {len(video_ids)} total videos")
        return video_ids
    except HttpError as e:
        print(f"An HTTP error occurred: {e}")
        return []

def get_video_details(video_ids):
    """Fetch detailed information for a list of video IDs"""
    youtube = build('youtube', 'v3', developerKey=API_KEY)
    all_videos = []

    # Videos API allows up to 50 IDs per request
    print(f"Fetching details for {len(video_ids)} videos...")
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
                    'commentCount': int(item['statistics'].get('commentCount', 0)),
                }
                all_videos.append(video)

            print(f"Processed {min(i+50, len(video_ids))}/{len(video_ids)} videos...")
        except HttpError as e:
            print(f"An HTTP error occurred: {e}")
            continue

    return all_videos

# Patterns to exclude from results (non-tutorial content)
EXCLUDE_PATTERNS = [
    r'This Week on Warhammer\+',
    r'Warhammer\+ Flashback',
    r'New Warhammer\+',
    r'Coming Soon',
    r'Warhammer Fest',
    r'This Week\'s Warhammer\+ Shows',
    r'This is Week on Warhammer\+',
]

# Specific video IDs to exclude (manually curated)
EXCLUDE_IDS = [
    'bsfQgbx3nNc',  # Add video IDs here to manually exclude
]

def filter_videos(videos, query):
    """Filter videos by search query in title or description, excluding certain patterns and IDs"""
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

if __name__ == "__main__":
    channel_id = 'UCwdh3MTrFq3sXlB4ct8B-Fg'
    search_query = 'paint'  # Set to None or '' to get all videos

    # Step 1: Get all video IDs from channel
    video_ids = get_all_channel_videos(channel_id)

    if not video_ids:
        print("No videos found.")
        exit(1)

    # Step 2: Get detailed info for all videos
    all_videos = get_video_details(video_ids)

    # Step 3: Filter by search query and exclusions
    filtered_videos = filter_videos(all_videos, search_query)
    excluded_count = len(all_videos) - len(filtered_videos)

    if search_query:
        print(f"Filtered to {len(filtered_videos)} videos matching '{search_query}' (excluded {excluded_count})")
    else:
        print(f"Keeping {len(filtered_videos)} videos (excluded {excluded_count} non-tutorial videos)")

    # Step 4: Save to JSON
    if filtered_videos:
        print(f"Saving {len(filtered_videos)} videos to ./videos.json...")
        with open('./videos.json', 'w', encoding='utf-8') as f:
            json.dump(filtered_videos, f, ensure_ascii=False, indent=2)
        print("Saved all results to ./videos.json.")
    else:
        print("No videos matched the filter.")
