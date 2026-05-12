import json
import re

# Define your tagging rules here as (tag, regex pattern) tuples
TAG_RULES = [
    # Warhammer Systems
    ("40k", r"40[.,]?000|40k|warhammer 40k|space marine|guardsmen|tyranid|necron|tau|eldar|ork|chaos"),
    ("aos", r"age of sigmar|aos|stormcast|flesh-eater|nighthaunt|ossiarch|lumineth"),
    ('underworlds', r'underworlds|warhammer underworlds|nethermaze|shadespire|nightvault|beastgrave|direchasm|harrowdeep|gnarlwood|deathgorge|elathain|soulraid|kainan|reapers|infinity.?s lament'),
    ('old world', r'old world|warhammer fantasy|wfb|tomb kings|bretonnia'),
    ('middle earth', r'middle earth|lotr|lord of the rings|hobbit|witch-king|angmar|rohan|gondor|mordor|isengard'),
    ('warcry', r'warcry'),
    ('kill team', r'kill team'),
    ('necromunda', r'necromunda'),
    ('horus heresy', r'horus heresy|heresy\b|HH\b'),
    ('legions imperialis', r'legions imperialis|legiones astartes'),
    ('aeronautica imperialis', r'aeronautica imperialis'),

    # Xenos - Tyranids
    ('tyranids', r'tyranids?|nids?|Termagants?|Leviathan|Hormagaunts?|carnifex|hive tyrant|genestealer\b'),

    # Imperium - Space Marines (general primero, específicos después)
    ('space marines', r'space marines?|marines?\b|tactical marine|intercessor|primaris|terminator|scout marine|infernus marine|chaplain|librarian|techmarine|apothecary|dreadnought\b|captain\b|lieutenant\b|sergeant\b|veteran'),
    ('ultramarines', r'ultramarines?|ultramarine chapter'),
    ('blood angels', r'blood angels?|sanguinary|dante'),
    ('dark angels', r'dark angels?|deathwing|ravenwing|asmodai|lion\s*el.{0,5}jonson'),
    ('space wolves', r'space wolves|wolf guard|wolf scouts?|blood claws?|grey hunters?|fenrisian'),
    ('grey knights', r'grey knights?'),
    ('imperial fists', r'imperial fists?'),
    ('iron hands', r'iron hands?'),
    ('white scars', r'white scars?'),
    ('salamanders', r'salamanders?'),
    ('raven guard', r'raven guard|ravenguard|raptors chapter'),
    ('black templars', r'black templars?'),

    # Chaos
    ('chaos', r'\bchaos\b|chaotic|daemon\b|daemons|Vashtorr|Khorne|Tzeentch|Nurgle|Slaanesh|warp|great unclean one|bloodthirster|lord of change|keeper of secrets'),
    ('chaos space marines', r'chaos space marines|CSM\b|traitor|heretic astartes'),
    ('iron warriors', r'iron warriors'),
    ('black legion', r'black legion'),
    ('world eaters', r'world eaters'),
    ('death guard', r'death guard|plague marine'),
    ('thousand sons', r'thousand sons|rubric marine'),
    ("emperor's children", r"emperor'?s children"),

    # Xenos - Eldar
    ('eldar', r'eldars?|aeldari|craftworld|aspect warrior|farseer|autarch'),
    ('harlequins', r'harlequins?|solitaire|troupe'),
    ('drukhari', r'drukhari|dark eldars?|incubi|wyches?|haemonculus|Kabals?|kabalite'),

    # Xenos - Orks
    ('orcs', r'\bboyz\b|orcs?|orks?|gretchin|Squig|Orlock|warboss|nob|kommando|red gobbo|da gobbo'),

    # Xenos - Others
    ('necrons', r'necrons?|skorpekh|immortal\b|warrior\b|tomb blade'),
    ('tau', r'\btaus?\b|Farsight|fire warrior|pathfinder|crisis suit|kroot'),
    ('genestealer cults', r'genestealer cults?|genestealers?\b|neophyte|acolyte'),

    # Imperium - Other
    ('astra militarum', r'astra militarum|Imperialis Solar|imperial guard|guardsmen|cadians?|catachans?|valhallans?|Krieg|death korps of krieg|steel legion|sentinel\b|leman russ'),
    ('sororitas', r'sororitas|sisters of battle|soB|battle sister|canoness|seraphim'),
    ('adeptus mechanicus', r'adeptus mechanicus|admech|skitarii|tech-priest'),
    ('custodes', r'custodes|adeptus custodes'),
    ('imperial knights', r'imperial knights?|knight\b'),

    # AoS Factions
    ('stormcast eternals', r'stormcast|eternals|lord-vigilant|gryph|liberator|sequitor'),
    ('flesh-eater courts', r'flesh-eater|cryptguard|crypt|ghoul|mordant'),
    ('gloomspite gitz', r'gloomspite|gitz|grots|squigs|troggoths|moonclan'),
    ('cities of sigmar', r'cities of sigmar|freeguild|steelhelm|collegiate arcane|callis|toll'),
    ('sylvaneth', r'sylvaneth|dryad|treelord|branchwych|athelorn'),
    ('idoneth deepkin', r'idoneth|deepkin|namarti|akhelian|eidolon|soul-raid'),

    # Difficulty Levels
    ('beginner', r'beginner|basic|entry-level|entry level|starter painting|Battle Ready'),
    ('intermediate', r'intermediate|mid-level|mid level|medium|intermediate painting'),
    ('advanced', r'advanced|high-level|high level|expert|master painting'),

    # Painting Techniques & Materials
    ('painting essentials', r'painting essentials|introduction to painting|how to paint with|thinning paints|build your mini|batch paint|biggest armies|paint.*armies'),
    ('citadel products', r'citadel colour|air paints|contrast paint\b|layer paints|base paints|shade paints|technical paints'),
    ('airbrush', r'airbrush|air paint'),
    ('contrast paints', r'contrast paint|contrast\b'),
    ('bases', r'\bbases?\b|base building|basing|scenery|terrain|rocks?|ruins?|barricades?|cityscapes?|buildings?|trees?|grass|water effects?|battle sanctum|statue\b'),
    ('textures & materials', r'Stubble|Stripes|Horns|Warpflame|gems?|weathering|rust|chipping|battle damage|mud|dirt|blood|corrosion|texture|feathers?|wings?|stained glass'),
    ('skin', r'\bskin\b|flesh|face|head\b|hands|Scars|wrinkles|veins'),
    ('cloth', r'cloth|fabric|robes?|capes?|clothing|Leather\b|camo'),
    ('metal', r'\bmetal\b|metallic|gold|silver|bronze|brass'),
    ('armour', r'armour|armor|power armor|plate|carapace'),
    ('vehicles', r'vehicles?|tanks?|walkers?|bikes?|flyers?|droppods?|immolator'),
    ('weapons', r'weapons?|guns?|swords?|axes|bolter|plasma|melta'),
    ('special projects', r'christmas|bauble|servo-skull|painting palette|community request|manticore'),
]

# Tag hierarchy: if a specific tag is found, add parent tags
TAG_HIERARCHY = {
    # Space Marine Chapters -> Space Marines
    'ultramarines': ['space marines', '40k'],
    'blood angels': ['space marines', '40k'],
    'dark angels': ['space marines', '40k'],
    'space wolves': ['space marines', '40k'],
    'grey knights': ['space marines', '40k'],
    'imperial fists': ['space marines', '40k'],
    'iron hands': ['space marines', '40k'],
    'white scars': ['space marines', '40k'],
    'salamanders': ['space marines', '40k'],
    'raven guard': ['space marines', '40k'],
    'black templars': ['space marines', '40k'],

    # Chaos Legions -> Chaos Space Marines -> Chaos
    'iron warriors': ['chaos space marines', 'chaos', '40k', 'horus heresy'],
    'black legion': ['chaos space marines', 'chaos', '40k'],
    'world eaters': ['chaos space marines', 'chaos', '40k'],
    'death guard': ['chaos space marines', 'chaos', '40k', 'horus heresy'],
    'thousand sons': ['chaos space marines', 'chaos', '40k'],
    "emperor's children": ['chaos space marines', 'chaos', '40k'],

    # Other 40k factions
    'tyranids': ['40k'],
    'necrons': ['40k'],
    'tau': ['40k'],
    'eldar': ['40k'],
    'drukhari': ['eldar', '40k'],
    'harlequins': ['eldar', '40k'],
    'orcs': ['40k'],
    'genestealer cults': ['40k'],
    'astra militarum': ['40k'],
    'sororitas': ['40k'],
    'adeptus mechanicus': ['40k'],
    'custodes': ['40k'],
    'imperial knights': ['40k'],

    # AoS factions
    'stormcast eternals': ['aos'],
    'flesh-eater courts': ['aos'],
    'gloomspite gitz': ['aos'],
    'cities of sigmar': ['aos'],
    'sylvaneth': ['aos'],
    'idoneth deepkin': ['aos'],

    # Space Marines -> 40k
    'space marines': ['40k'],
    'chaos space marines': ['chaos', '40k'],
}

if __name__ == "__main__":
    with open('./videos.json', 'r', encoding='utf-8') as f:
        videos = json.load(f)

    # remove duplicate videos based on videoId
    unique_videos = {}
    videos_without_tags = []
    tag_stats = {}

    for video in videos:
        video_id = video.get('videoId')
        if video_id not in unique_videos:
            unique_videos[video_id] = video

        title = video.get('title', '')
        description = video.get('description', '')
        # Combine title and description for matching (title has more weight)
        search_text = f"{title} {title} {description}"

        tags = set(video.get('tags', []))

        # Apply tag rules
        for tag, pattern in TAG_RULES:
            if re.search(pattern, search_text, re.IGNORECASE):
                tags.add(tag)

        # Apply tag hierarchy (add parent tags)
        tags_to_add = set()
        for tag in tags:
            if tag in TAG_HIERARCHY:
                tags_to_add.update(TAG_HIERARCHY[tag])
        tags.update(tags_to_add)

        # If no tags were found, add a default 'untagged' tag for easier filtering
        if not tags:
            tags.add('untagged')
            videos_without_tags.append({
                'title': title,
                'videoId': video_id,
                'url': video['url']
            })

        video['tags'] = sorted(list(tags))  # Sort for consistency

        # Update statistics
        for tag in tags:
            tag_stats[tag] = tag_stats.get(tag, 0) + 1

    # Save to output file
    with open('../src/videos.json', 'w', encoding='utf-8') as f:
        json.dump(list(unique_videos.values()), f, ensure_ascii=False, indent=2)

    # Print statistics
    print(f"✓ Tagged {len(unique_videos)} unique videos")
    print(f"✓ Videos saved to ../src/videos.json")
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
