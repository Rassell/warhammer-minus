# Video Tagging System Guide

## Overview

The video tagging system automatically categorizes Warhammer painting tutorial videos using regex patterns. All configuration is stored in JSON files for easy editing without touching code.

## System Architecture

### Configuration Files (JSON)

All tagging rules and filters are stored in editable JSON files:

- **`tag_rules.json`** - 93 tagging patterns covering all Warhammer content
- **`tag_hierarchy.json`** - Parent-child tag relationships
- **`exclude_patterns.json`** - Title patterns to filter out (promotional content)
- **`exclude_ids.json`** - Specific video IDs to exclude

### Scripts

- **`update_videos.py`** - Unified script that fetches, filters, and tags videos
- **`analyze_untagged.py`** - Analysis tool to identify missing patterns

## Main Features

### 1. Dual Search (Title + Description)
The system searches both fields, giving more weight to the title:
```python
search_text = f"{title} {title} {description}"
```

### 2. Automatic Tag Hierarchy
Specific tags automatically inherit general tags:
- `salamanders` → adds `space marines` + `40k`
- `death guard` → adds `chaos space marines` + `chaos` + `40k` + `horus heresy`
- `cities of sigmar` → adds `aos`

### 3. Smart Filtering
Videos are filtered by:
- **Search query** - Only videos containing "paint" in title/description
- **Exclude patterns** - Removes promotional content (Warhammer+ shows, etc.)
- **Exclude IDs** - Manually excludes specific video IDs

### 4. Comprehensive Coverage
Current status: **617 videos tagged** (98.5% coverage)

## Tag Categories

### Game Systems
- **Warhammer 40,000**: 403 videos
- **Age of Sigmar**: 148 videos
- **Horus Heresy**: Covered
- **Underworlds**: Covered
- **Middle Earth**: Covered
- **Kill Team, Necromunda, Warcry**: Covered
- **Legions/Aeronautica Imperialis**: Covered

### 40k Factions
- Space Marines and all chapters (Ultramarines, Blood Angels, Dark Angels, etc.)
- Chaos and all legions (Death Guard, Thousand Sons, World Eaters, etc.)
- Xenos: Tyranids, Necrons, Tau, Eldar, Drukhari, Orks
- Imperium: Astra Militarum, Sororitas, Custodes, Adeptus Mechanicus

### AoS Factions
- Stormcast Eternals, Flesh-eater Courts
- Gloomspite Gitz, Cities of Sigmar
- Sylvaneth, Idoneth Deepkin

### Difficulty Levels
- **Beginner**: 307 videos
- **Intermediate**: 166 videos
- **Advanced**: Covered

### Techniques and Materials
- **Painting Essentials**: 276 videos
- **Citadel Products**: 271 videos
- **Skin**: 366 videos
- **Metal**: 112 videos
- **Armour**: 102 videos
- **Textures & Materials**: 174 videos
- **Bases**: 175 videos
- **Contrast Paints**: 123 videos
- **Airbrush**, **Cloth**, **Weapons**, **Vehicles**

### Special Content
- Special Projects (Christmas, servo-skull, community requests)

## Usage

### Quick Start

**Fetch and tag all videos:**
```bash
cd be
python update_videos.py
```

This single command:
1. Fetches all videos from YouTube
2. Filters out promotional content
3. Applies tags based on patterns
4. Saves to `src/videos.json`

### Advanced Usage

**Quiet mode (minimal output):**
```bash
python update_videos.py --quiet
```

**Save intermediate file for debugging:**
```bash
python update_videos.py --save-intermediate
```

**Only fetch (no tagging):**
```bash
python update_videos.py --fetch-only
```

**Only tag existing videos:**
```bash
python update_videos.py --tag-only
```

**Analyze untagged videos:**
```bash
python analyze_untagged.py
```

## Maintenance Workflow

When videos need to be updated or patterns need to be added:

### 1. Update Videos

```bash
cd be
python update_videos.py
```

### 2. Check for Untagged Videos

If the output shows untagged videos, run:
```bash
python analyze_untagged.py
```

### 3. Add New Patterns

Edit **`tag_rules.json`**:
```json
[
  ["tag-name", "pattern1|pattern2|pattern3"],
  ["new-tag", "keyword1|keyword2"]
]
```

**Example:**
```json
["necromunda", "necromunda|ash waste|orlock"]
```

### 4. Add Tag Hierarchy (if needed)

Edit **`tag_hierarchy.json`**:
```json
{
  "new-tag": ["parent-tag", "grandparent-tag"]
}
```

**Example:**
```json
{
  "salamanders": ["space marines", "40k"]
}
```

### 5. Add Exclusions (if needed)

**Exclude by title pattern** - Edit **`exclude_patterns.json`**:
```json
[
  "This Week on Warhammer\\+",
  "Coming Soon"
]
```

**Exclude by video ID** - Edit **`exclude_ids.json`**:
```json
[
  "bsfQgbx3nNc",
  "9Rm-jDBesyk"
]
```

### 6. Re-run and Verify

```bash
python update_videos.py
```

### 7. Repeat Until 100% Coverage

Check the output statistics and add patterns as needed until all videos are tagged.

## Regex Pattern Tips

### Name Variants
```json
// ✅ Good - covers variants
["eldar", "eldars?|aeldari|craftworld"]

// ❌ Bad - too specific
["eldar", "eldar"]
```

### Word Boundaries
```json
// ✅ Good - avoids false positives
["chaos", "\\bchaos\\b"]

// Optional - when you need flexibility
["chaos", "chaos"]  // Matches chaos, chaotic, etc.
```

### Escaping Special Characters
In JSON, you need to double-escape backslashes:
```json
// ✅ Correct
["40k", "40[.,]?000|40k"]
["skin", "\\bskin\\b"]

// ❌ Wrong
["40k", "40[.,]?000|40k"]  // Single backslash won't work in JSON
```

### Case Insensitive
All patterns are applied with `re.IGNORECASE`, no need to cover upper/lowercase.

## Current Statistics (as of latest run)

```
✓ Tagged 617 unique videos
✓ Videos saved to ../src/videos.json

📊 Top 15 Tags:
  40k: 403 videos
  skin: 366 videos
  beginner: 307 videos
  painting essentials: 276 videos
  citadel products: 271 videos
  space marines: 204 videos
  bases: 175 videos
  textures & materials: 174 videos
  intermediate: 166 videos
  chaos: 151 videos
  aos: 148 videos
  contrast paints: 123 videos
  metal: 112 videos
  armour: 102 videos
  chaos space marines: 88 videos

⚠️  9 videos without tags (1.5%)
```

## Automated Updates

The system runs automatically every Monday at 9:00 AM UTC via GitHub Actions:
- Fetches latest videos from YouTube
- Applies tagging rules
- Commits changes if new videos are found
- Triggers site deployment

**Manual trigger:** Go to GitHub Actions → "Update Videos Weekly" → Run workflow

## Best Practices

1. **Edit JSON files, not Python code** - All configuration is in JSON
2. **Test patterns locally** before committing
3. **Be specific** - Avoid overly broad patterns that cause false positives
4. **Use hierarchy** - Don't repeat parent tags in child tag patterns
5. **Check statistics** - Ensure tags are balanced and useful
6. **Keep patterns organized** - Group related patterns together in tag_rules.json
7. **Document complex patterns** - Add comments in git commits explaining unusual patterns

## Troubleshooting

### Script fails to load config files

**Error:** `FileNotFoundError: tag_rules.json`

**Solution:** Make sure you're running from the `be/` directory:
```bash
cd be
python update_videos.py
```

### No videos match after filtering

**Problem:** All videos are excluded

**Solution:** Check `exclude_patterns.json` - patterns might be too broad

### Tag not applying

**Diagnosis:**
1. Check pattern syntax in `tag_rules.json`
2. Test regex pattern: `python -c "import re; print(re.search(r'pattern', 'test text', re.IGNORECASE))"`
3. Check if video title/description actually contains the keywords

### Untagged videos persist

**Steps:**
1. Run `analyze_untagged.py` to see common keywords
2. Add patterns for those keywords to `tag_rules.json`
3. Re-run `update_videos.py`

## File Locations

```
be/
├── update_videos.py          # Main script
├── analyze_untagged.py       # Analysis tool
├── tag_rules.json            # 93 tagging patterns
├── tag_hierarchy.json        # Tag relationships
├── exclude_patterns.json     # Title exclusions
├── exclude_ids.json          # Video ID exclusions
└── videos.json              # Intermediate data
```

The system is designed to grow organically with the content while remaining easy to maintain through JSON configuration files.
