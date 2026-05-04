import os
import json
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
# Set your API key here or use an environment variable
API_KEY = os.getenv('YOUTUBE_API_KEY', '')

# Function to search for videos by title in a specific channel
def search_youtube_channel_by_title(channel_id, query, max_results=50):
    youtube = build('youtube', 'v3', developerKey=API_KEY)
    results = []
    next_page_token = None
    try:
        while True:
            search_response = youtube.search().list(
                part='snippet',
                channelId=channel_id,
                q=query,
                type='video',
                maxResults=max_results,
                pageToken=next_page_token
            ).execute()

            for item in search_response.get('items', []):
                thumbnail_url = item['snippet']['thumbnails'].get('maxres', {}).get('url') or item['snippet']['thumbnails'].get('high', {}).get('url') or item['snippet']['thumbnails'].get('default', {}).get('url', '')
                video = {
                    'videoId': item['id']['videoId'],
                    'title': item['snippet']['title'],
                    'description': item['snippet']['description'],
                    'publishedAt': item['snippet']['publishedAt'],
                    'thumbnail': thumbnail_url,
                    'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                }
                results.append(video)

            next_page_token = search_response.get('nextPageToken')
            if not next_page_token:
                break
        return results
    except HttpError as e:
        print(f"An HTTP error occurred: {e}")
        return []

if __name__ == "__main__":
    videos = search_youtube_channel_by_title('UCwdh3MTrFq3sXlB4ct8B-Fg', 'paint', 50)
    if videos:
        print(f"Found {len(videos)} videos. Saving to ./videos.json...")
        with open('./videos.json', 'w', encoding='utf-8') as f:
            json.dump(videos, f, ensure_ascii=False, indent=2)
        print("Saved all results to ./videos.json.")
    else:
        print("No videos found.")
