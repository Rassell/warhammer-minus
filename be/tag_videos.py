import json
import re

# Define your tagging rules here as (tag, regex pattern) tuples
TAG_RULES = [
    ("40k", r"40[.,]?000|40k|warhammer 40k"),
    ("aos", r"age of sigmar|aos"),
    ('old world', r'old world|warhammer fantasy|wfb'),
    ('warcry', r'warcry'),
    ('kill team', r'kill team'),
    ('necromunda', r'necromunda'),
    ('tyranids', r'tyranids?|nids?|Termagants?|Leviathan|Hormagaunts?'),
    ('space marines', r'Raven Guard|Salamander|Black Templars?|Ravenguard|space marines|Grand Master|sm|ultramarines|blood angels|dark angels|space wolves|grey knights|marines|imperial fists|iron hands|white scars'),
    ('chaos', r'chaos|chaotic|daemon|daemons|Vashtorr|Khorne|Tzeentch|Nurgle|Slaanesh'),
    ('chaos space marines', r'chaos space marines|csm|Iron Warriors|black legion|world eaters|death guard|thousand sons|emperor\'s children'),
    ('eldar', r'eldars?|aeldari|harlequins?|craftworlds'),
    ('orcs', r'boyz|orcs?|orks?|gretchin|Squig|Orlock'),
    ('necrons', r'necrons?'),
    ('tau', r'taus?|Farsight'),
    ('horus heresy', r'horus heresy|heresy|HH'),
    ('genestealer cults', r'genestealer cults?|genestealers?'),
    ('bases', r'bases?|base building|scenery|terrain'),
    ('intermediate', r'intermediate|mid-level|mid level|medium|intermediate painting'),
    ('advanced', r'advanced|high-level|high level|expert|master painting'),
    ('beginner', r'beginner|basic|entry-level|entry level|starter painting|Battle Ready'),
    ('textures & materials', r'Stubble?|Stripes?|Horns?|Warpflame|gems|weathering|rust|chipping|battle damage|mud|dirt|blood|corrosion|stone|wood|glass|water|ice|stone|wood|glass|water|ice|texture'),
    ('skin', r'skin|flesh|face|head|hands|Scars|wrinkles|veins'),
    ('cloth', r'cloth|fabric|robes|capes|clothing|Leather'),
    ('metal', r'metal|armor|weapons|guns|swords|axes'),
    ('sororitas', r'sororitas|sisters of battle|soB'),
    ('drukhari', r'drukhari|dark eldars?|incubi|wyches?|haemonculus|Kabals?'),
    ('armour', r'armour|armor|power armor|plate|carapace'),
    ('vehicles', r'vehicles?|tanks?|dreadnoughts?|walkers?|bikes?|flyers?|droppods?|gargants?|monsters?|dreadnoughts?|walkers?|bikes?|flyers?|droppods?|gargants?|monsters?'),
    ('astra militarum', r'astra militarum|Imperialis Solar|imperial guard|guardsmen|cadians?|catachans?|valhallans?|Krieg|death korps of krieg|steel legion'),
    ('space wolves', r'space wolves|wolf guard|wolf scouts?|blood claws?|grey hunters?'),
    ('salamanders', r'salamanders'),
]

if __name__ == "__main__":
    with open('./videos.json', 'r', encoding='utf-8') as f:
        videos = json.load(f)

    # remove duplicate videos based on videoId
    unique_videos = {}

    for video in videos:
        video_id = video.get('videoId')
        if video_id not in unique_videos:
            unique_videos[video_id] = video
        title = video.get('title', '')
        tags = set(video.get('tags', []))
        for tag, pattern in TAG_RULES:
            if re.search(pattern, title, re.IGNORECASE):
                tags.add(tag)
        video['tags'] = list(tags)

    with open('../src/videos.json', 'w', encoding='utf-8') as f:
        json.dump(list(unique_videos.values()), f, ensure_ascii=False, indent=2)
    print(f"Tagged videos saved to ../src/videos.json")
