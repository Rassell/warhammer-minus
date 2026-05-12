import json
import re
from collections import Counter

def extract_keywords(text, min_length=4):
    """Extract potential keywords from text"""
    # Remove common words
    stop_words = {'paint', 'painting', 'warhammer', 'video', 'tutorial', 'guide',
                  'level', 'using', 'with', 'from', 'this', 'that', 'have', 'your',
                  'more', 'show', 'step', 'watch', 'follow', 'learn', 'check'}

    # Extract words
    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
    keywords = [w for w in words if len(w) >= min_length and w not in stop_words]
    return keywords

if __name__ == "__main__":
    with open('./videos.json', 'r', encoding='utf-8') as f:
        videos = json.load(f)

    # Run tag_videos logic to identify untagged
    from tag_videos import TAG_RULES, TAG_HIERARCHY

    untagged_videos = []
    all_keywords = []

    for video in videos:
        title = video.get('title', '')
        description = video.get('description', '')
        search_text = f"{title} {title} {description}"

        tags = set()
        for tag, pattern in TAG_RULES:
            if re.search(pattern, search_text, re.IGNORECASE):
                tags.add(tag)

        # Apply hierarchy
        tags_to_add = set()
        for tag in tags:
            if tag in TAG_HIERARCHY:
                tags_to_add.update(TAG_HIERARCHY[tag])
        tags.update(tags_to_add)

        if not tags:
            untagged_videos.append(video)
            keywords = extract_keywords(title + ' ' + description)
            all_keywords.extend(keywords)

    print(f"📋 Analysis of {len(untagged_videos)} untagged videos\n")

    if untagged_videos:
        print(f"🔤 Most common keywords in untagged videos:")
        keyword_counts = Counter(all_keywords)
        for keyword, count in keyword_counts.most_common(20):
            print(f"  {keyword}: {count} occurrences")

        print(f"\n📝 Sample untagged video titles:")
        for i, video in enumerate(untagged_videos[:15], 1):
            print(f"  {i}. {video['title']}")

        print(f"\n💡 Suggested actions:")
        print(f"  1. Review the common keywords above")
        print(f"  2. Add new patterns to TAG_RULES in tag_videos.py")
        print(f"  3. Run tag_videos.py again to re-tag")
    else:
        print("✓ All videos are tagged!")
