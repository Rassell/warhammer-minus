# Video Tagging System Guide

## Improvement Summary

### Before
- ❌ Only searched in titles
- ❌ 35/496 untagged videos (7%)
- ❌ No tag hierarchy
- ❌ Incomplete patterns
- ❌ No statistics

### Now
- ✅ Searches in titles AND descriptions
- ✅ **496/496 videos tagged (100%)**
- ✅ Automatic tag hierarchy
- ✅ Expanded and complete patterns
- ✅ Detailed statistics when running

## Main Features

### 1. Dual Search (Title + Description)
The script now searches both fields, giving more weight to the title:
```python
search_text = f"{title} {title} {description}"
```

### 2. Automatic Tag Hierarchy
Specific tags automatically inherit general tags:
- `salamanders` → adds `space marines` + `40k`
- `death guard` → adds `chaos space marines` + `chaos` + `40k` + `horus heresy`
- `cities of sigmar` → adds `aos`

### 3. Covered Game Systems
- **Warhammer 40,000**: 291 videos
- **Age of Sigmar**: 86 videos
- **Horus Heresy**: 51 videos
- **Underworlds**: Covered
- **Middle Earth**: Covered
- **Legions/Aeronautica Imperialis**: Covered

### 4. Tag Categories

#### 40k Factions
- Space Marines and all chapters (Ultramarines, Blood Angels, Dark Angels, etc.)
- Chaos and all legions
- Xenos: Tyranids, Necrons, Tau, Eldar, Drukhari, Orks
- Imperium: Astra Militarum, Sororitas, Custodes, Adeptus Mechanicus

#### AoS Factions
- Stormcast Eternals
- Flesh-eater Courts
- Gloomspite Gitz
- Cities of Sigmar
- Sylvaneth
- Idoneth Deepkin

#### Difficulty Levels
- Beginner: 140 videos
- Intermediate: 97 videos
- Advanced: Covered

#### Techniques and Materials
- Painting Essentials: 39 videos
- Citadel Products: 24 videos
- Skin, Cloth, Metal, Armour
- Textures & Materials: 79 videos
- Bases: 24 videos
- Contrast Paints, Airbrush

#### Special Content
- Special Projects (Christmas, servo-skull, community requests)

## Available Tools

### `tag_videos.py`
Main tagging script.

**Usage:**
```bash
cd be
python3 tag_videos.py
```

**Output:**
- Tags all videos
- Copies `videos.json` to `../src/videos.json`
- Shows statistics of the top 15 most common tags
- Lists untagged videos (if any)

### `analyze_untagged.py`
Analysis tool to identify missing patterns.

**Usage:**
```bash
python3 analyze_untagged.py
```

**Output:**
- Number of untagged videos
- Most common keywords in untagged titles
- Sample of untagged titles
- Action suggestions

## Maintenance Workflow

When the video list is updated:

1. **Run the tagging script:**
   ```bash
   cd be
   python3 tag_videos.py
   ```

2. **If there are untagged videos:**
   ```bash
   python3 analyze_untagged.py
   ```

3. **Identify common patterns** in the displayed keywords

4. **Add new patterns** to `TAG_RULES` in `tag_videos.py`:
   ```python
   ('new-tag', r'pattern1|pattern2|pattern3'),
   ```

5. **If it's a specific tag, add hierarchy** in `TAG_HIERARCHY`:
   ```python
   'new-tag': ['parent-tag', 'grandparent-tag'],
   ```

6. **Re-run** `tag_videos.py` to verify

7. **Repeat** until achieving 100% coverage

## Regex Pattern Tips

### Name Variants
```python
# ✅ Good - covers variants
r'eldars?|aeldari|craftworld'

# ❌ Bad - too specific
r'eldar'
```

### Word Boundaries
```python
# ✅ Good - avoids false positives
r'\bchaos\b'  # Doesn't match "chaotic" alone

# Optional - when you need flexibility
r'chaos'  # Matches chaos, chaotic, etc.
```

### HTML Entities
```python
# ✅ Good - handles HTML entities
r'lion\s*el.{0,5}jonson'  # Matches "El'Jonson" and "El&#39;Jonson"
```

### Case Insensitive
All patterns are applied with `re.IGNORECASE`, no need to cover upper/lowercase.

## Current Statistics

```
✓ Tagged 496 unique videos
✓ Videos saved to ../src/videos.json

📊 Top 15 Tags:
  40k: 291 videos (59%)
  beginner: 140 videos (28%)
  space marines: 103 videos (21%)
  intermediate: 97 videos (20%)
  aos: 86 videos (17%)
  textures & materials: 79 videos
  chaos: 59 videos
  horus heresy: 51 videos
  skin: 50 videos
  orcs: 49 videos
  armour: 42 videos
  painting essentials: 39 videos
  chaos space marines: 29 videos
  cloth: 27 videos
  bases: 24 videos
```

## Future Maintenance

To keep the tagging system organic and complete:

1. **Run regularly** after updating videos
2. **Review untagged videos** with `analyze_untagged.py`
3. **Add patterns gradually** - not all at once
4. **Check statistics** to balance tags
5. **Avoid overloading** - not every video needs 10 tags

The system is now optimized to grow organically with the content.
