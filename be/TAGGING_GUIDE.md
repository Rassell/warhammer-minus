# Video Tagging System Guide

## Overview

The video tagging system automatically categorizes Warhammer painting tutorial videos using **five intelligent modes**: Groq LLM (fastest), Gemini LLM, hybrid regex+semantic, pure semantic NLP, or regex pattern matching. All configuration is stored in JSON files for easy editing without touching code.

### Tagging Modes

**1. Groq Mode (Best Overall - RECOMMENDED)**
- Uses Llama 3.3 70B via Groq API
- ~95%+ coverage with near-perfect accuracy
- Extremely fast (~2-5 minutes for 600 videos)
- Very generous free tier (14,400 requests/day)
- Requires free Groq API key

**2. Gemini LLM Mode (Good Accuracy, Slower)**
- Uses Google Gemini 2.5 Flash to understand context like a human
- ~95%+ coverage with near-perfect accuracy
- Zero false positives from paint names
- Requires free Gemini API key
- Warning: Free tier has low quota limits

**3. Hybrid Mode (Best Offline Balance)**
- Combines regex patterns with semantic validation
- 86% coverage, near-zero false positives
- Works offline, no API required

**4. Semantic Mode (Offline NLP)**
- Pure NLP-based matching using sentence transformers
- 53-79% coverage (threshold dependent)
- Context-aware, works offline

**5. Regex Mode (Fallback)**
- Traditional keyword pattern matching
- 100% coverage but prone to false positives
- Fast, deterministic, backwards compatible

## System Architecture

### Configuration Files (JSON)

All tagging rules and filters are stored in editable JSON files:

- **`tag_rules.json`** - 93 regex tagging patterns (used in regex/hybrid modes)
- **`tag_descriptions.json`** - 93+ semantic tag descriptions (used in semantic/hybrid/LLM modes)
- **`tag_hierarchy.json`** - Parent-child tag relationships (all modes)
- **`exclude_patterns.json`** - Title patterns to filter out (promotional content)
- **`exclude_ids.json`** - Specific video IDs to exclude

### Scripts

- **`update_videos.py`** - Unified script that fetches, filters, and tags videos
- **`semantic_tagger.py`** - SemanticTagger class using sentence transformers
- **`analyze_untagged.py`** - Analysis tool to identify missing patterns

## Main Features

### 1. Five Tagging Modes

#### Groq Mode (Best Overall - RECOMMENDED)
- **How it works**: Uses Llama 3.3 70B Versatile via Groq API to read title + description and intelligently assign tags
- **Coverage**: ~95%+ (understands context like a human)
- **Accuracy**: Near-perfect - truly understands what's being painted
- **Speed**: Extremely fast (~2-5 minutes for 600 videos)
- **Use case**: When you want the best tagging quality with fast results
- **Requirements**: Free Groq API key from https://console.groq.com
- **Free tier**: Very generous (14,400 requests/day, 100K tokens/day)
- **Checkpoint/Resume**: Auto-saves progress after each batch to `be/.llm_checkpoint.json`
  - Connection drops? Just re-run the same command - it resumes automatically
  - Rate limit hit? Wait and re-run - starts where it left off

**Example intelligence**: "Liberator Gold" in paint list → Groq knows this is a paint, not a Stormcast unit

#### Gemini LLM Mode (Good Accuracy, Slower)
- **How it works**: Uses Google Gemini 2.5 Flash to read title + description and intelligently assign tags
- **Coverage**: ~95%+ (understands context like a human)
- **Accuracy**: Near-perfect - truly understands what's being painted
- **Speed**: Slow (~30-40 minutes for 600 videos, heavily rate-limited)
- **Use case**: When you don't have Groq access but want LLM-based tagging
- **Requirements**: Free Gemini API key from https://aistudio.google.com/apikey
- **Warning**: Free tier has low quota limits, easily exhausted
- **Checkpoint/Resume**: Auto-saves progress after each batch to `be/.llm_checkpoint.json`
  - Connection drops? Just re-run the same command - it resumes automatically
  - Rate limit hit? Wait and re-run - starts where it left off

**Example intelligence**: "Liberator Gold" in paint list → Gemini knows this is a paint, not a Stormcast unit

#### Regex Mode (Default)
- **How it works**: Matches regex patterns in title + cleaned description
- **Coverage**: 100% (all videos get tags)
- **Accuracy**: Prone to false positives from paint names
- **Speed**: Very fast (~5 seconds for 617 videos)
- **Use case**: Quick updates, backwards compatibility

**Example issue**: "Liberator Gold" paint → incorrectly tags `stormcast eternals`

#### Semantic Mode
- **How it works**: Uses sentence transformer embeddings to understand context
- **Coverage**: 53-79% depending on threshold
- **Accuracy**: Highest - understands "painting Orks" vs "Ork Green paint"
- **Speed**: Slower (~3-4 minutes for 617 videos after model download)
- **Use case**: Maximum precision, minimal false positives

**Example fix**: "Liberator Gold" in paint list → does NOT tag `stormcast eternals`

#### Hybrid Mode (Recommended)
- **How it works**: 
  1. Apply regex tags for broad coverage
  2. Validate each tag with semantic similarity
  3. Keep tags with high semantic score OR in video title
  4. Add high-confidence semantic tags missed by regex
- **Coverage**: 86% (530/617 videos)
- **Accuracy**: Near-zero false positives
- **Speed**: Moderate (~3-4 minutes)
- **Use case**: Best balance - production use

**Result**: Combines breadth of regex with precision of semantic matching

### 2. Dual Search (Title + Description)
The system searches both fields, giving more weight to the title:
```python
search_text = f"{title} {title} {description}"
```

### 3. Paint List Cleaning
Before matching, the system removes paint lists from descriptions to avoid false positives:
- "Here's a list of the paints..." → removed
- Direct format (Base:, Layer:, Shade:) → removed
- Prevents paint names like "Dryad Bark" from tagging Sylvaneth

### 4. Automatic Tag Hierarchy
Specific tags automatically inherit general tags (all modes):
- `salamanders` → adds `space marines` + `40k`
- `death guard` → adds `chaos space marines` + `chaos` + `40k` + `horus heresy`
- `cities of sigmar` → adds `aos`

### 5. Confidence Scores (Semantic/Hybrid Only)
Tags include similarity scores (0.0-1.0) showing how confident the model is:
```json
{
  "tags": ["grey knights", "40k", "space marines"],
  "tag_scores": {
    "grey knights": 0.685,
    "40k": 0.850,
    "space marines": 0.780
  }
}
```

### 6. Checkpoint/Resume (LLM Modes Only)

Both Groq and Gemini modes include automatic checkpoint/resume functionality:

**How it works:**
- Saves progress after **each batch** to `be/.llm_checkpoint.json`
- If interrupted (connection drop, rate limit, crash), just re-run the same command
- Automatically detects checkpoint and resumes from where it left off
- Clears checkpoint when tagging completes successfully

**Example:**
```bash
# First run - processes 58 batches, then hits rate limit
python update_videos.py --groq
# ❌ Failed batch 59 after 3 retries: Rate limit exceeded

# Just run again - auto-resumes!
python update_videos.py --groq
# 📂 Found checkpoint: 58/120 batches completed
# 🚀 Resuming Groq LLM tagging (batch 59/120)...
# ✓ Groq LLM tagged 599/599 videos
# 💾 Checkpoint cleared
```

**Benefits:**
- No lost progress from connection issues
- Survives rate limit errors
- Can pause and resume anytime
- Checkpoint file is small (~few MB for 600 videos)

**Note:** Checkpoint is mode-specific - switching modes (Groq ↔ Gemini) starts fresh.

### 7. Smart Filtering
Videos are filtered by:
- **Search query** - Only videos containing "paint" in title/description
- **Exclude patterns** - Removes promotional content (Warhammer+ shows, etc.)
- **Exclude IDs** - Manually excludes specific video IDs

### 7. Comprehensive Coverage
- **LLM mode**: ~95%+ coverage with near-perfect accuracy
- **Hybrid mode**: 530/617 videos tagged (86%)
- **Semantic mode**: 327-490 videos (53-79% depending on threshold)
- **Regex mode**: 617/617 videos tagged (100% but with false positives)

### 8. LLM Setup (Google Gemini)

To use LLM mode, you need a free Google Gemini API key:

1. **Get API key** at https://aistudio.google.com/apikey
2. **Add to `.env` file** in project root:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. **Run with `--llm` flag**:
   ```bash
   python update_videos.py --llm
   ```

**Free tier limits:**
- 15 requests per minute
- 1,000,000 tokens per day
- More than enough for 617 videos (~8 minutes)

**How batching works:**
- Sends 5 videos per request (reduces runtime from 41min to ~8min)
- Rate limited to 4 seconds between requests (complies with 15 RPM)
- Automatic retry with exponential backoff (3 attempts per batch)

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

**Recommended: LLM Mode (if you have API key)**
```bash
cd be
python update_videos.py --llm
```

**Alternative: Hybrid Mode (no API required)**
```bash
cd be
python update_videos.py --hybrid --threshold 0.50
```

LLM mode:
1. Fetches all videos from YouTube
2. Sends batches to Google Gemini for intelligent tagging
3. Validates tags against tag_descriptions.json
4. Saves to `src/videos.json`

Hybrid mode:
1. Fetches all videos from YouTube
2. Applies regex tags for broad coverage
3. Validates tags with semantic matching
4. Filters out false positives
5. Saves to `src/videos.json`

### Tagging Mode Options

**LLM mode (best accuracy, requires API key):**
```bash
python update_videos.py --llm
```
- Best accuracy: ~95%+ coverage, near-perfect precision
- Understands context like a human
- Requires GEMINI_API_KEY in .env file
- ~8 minutes for full run (rate-limited)

**Hybrid mode (best balance, offline):**
```bash
python update_videos.py --hybrid --threshold 0.50
```
- Best balance: 86% coverage, zero false positives
- Validation threshold: 0.50 (tags need 50% semantic similarity to keep)

**Semantic mode (pure NLP):**
```bash
python update_videos.py --semantic --threshold 0.60
```
- Most conservative: 53-79% coverage depending on threshold
- Higher threshold = fewer tags but higher confidence
- Best for eliminating all false positives

**Regex mode (default/fallback):**
```bash
python update_videos.py
```
- Traditional pattern matching: 100% coverage
- Fast but prone to false positives from paint names

### Threshold Tuning (Semantic/Hybrid)

The `--threshold` parameter controls how strict the semantic matching is:

```bash
# More permissive (more tags, possible false positives)
python update_videos.py --hybrid --threshold 0.45

# Balanced (recommended)
python update_videos.py --hybrid --threshold 0.50

# Stricter (fewer tags, higher precision)
python update_videos.py --hybrid --threshold 0.60
```

**Threshold ranges:**
- `0.45-0.50`: More coverage, some false positives
- `0.50-0.60`: Balanced (recommended for hybrid)
- `0.60-0.70`: Conservative, high precision
- `0.70+`: Very strict, may miss valid tags

### Advanced Usage

**LLM mode (tag existing videos only):**
```bash
python update_videos.py --tag-only --llm
```

**LLM mode (quiet, minimal output):**
```bash
python update_videos.py --llm --quiet
```

**Hybrid mode quiet:**
```bash
python update_videos.py --hybrid --quiet
```

**Save intermediate file for debugging:**
```bash
python update_videos.py --hybrid --save-intermediate
```

**Only fetch (no tagging):**
```bash
python update_videos.py --fetch-only
```

**Only tag existing videos:**
```bash
python update_videos.py --tag-only --hybrid
```

**Skip statistics output:**
```bash
python update_videos.py --hybrid --no-stats
```

**Analyze untagged videos:**
```bash
python analyze_untagged.py
```

### First-Time Setup (Semantic/Hybrid Modes)

When you first run semantic or hybrid mode, the sentence transformer model (~500MB) will be downloaded automatically:

```bash
python update_videos.py --hybrid
```

Output:
```
🤖 Loading semantic model: all-MiniLM-L6-v2...
Downloading model... (this happens only once)
```

The model is cached in `.venv/` and reused for all future runs.

## Maintenance Workflow

### LLM Mode (Best Accuracy)

#### 1. Set Up API Key (First Time Only)

```bash
# Get free API key at https://aistudio.google.com/apikey
# Add to be/.env:
GEMINI_API_KEY=your_gemini_api_key_here
```

#### 2. Update Videos

```bash
cd be
python update_videos.py --llm
```

Expected output:
```
🤖 Starting LLM tagging (617 videos in 124 batches)...
  Tagged 50/617 videos (batch 5/124)...
  Tagged 100/617 videos (batch 10/124)...
  ...
✓ LLM tagged 587/617 videos
```

#### 3. Check Results

LLM mode typically achieves:
- **Coverage**: 95%+ (most videos get tags)
- **Accuracy**: Near-perfect (understands context)
- **False positives**: Zero (knows paint names from faction names)

Untagged videos should be non-tutorial content (shows, announcements).

#### 4. Improve Tag Descriptions (Optional)

If LLM misses some videos, improve `tag_descriptions.json`:

```json
{
  "tau": "Videos about painting Tau Empire, T'au, battlesuits, Fire Warriors, Kroot auxiliary models, pathfinders, or Farsight Enclaves from Warhammer 40,000"
}
```

More detailed descriptions help the LLM understand what content to match.

#### 5. No Regex Patterns Needed

Unlike hybrid/regex modes, LLM mode doesn't use `tag_rules.json`. It reads natural language descriptions from `tag_descriptions.json` and reasons about the content.

### Hybrid Mode (Best Balance)

#### 1. Update Videos

```bash
cd be
python update_videos.py --hybrid --threshold 0.50
```

#### 2. Check Statistics

Review the output for:
- Coverage percentage (target: 85-90%)
- Untagged videos (should be non-tutorial content)
- False positives (should be near-zero)

#### 3. Handle False Positives

If you see tags that shouldn't be there:

**Edit `tag_descriptions.json`** to be more specific:
```json
{
  "stormcast eternals": "Videos about painting Stormcast Eternals warriors from Age of Sigmar in golden armor (not Stormhost Silver paint, not Liberator Gold paint)"
}
```

Add exclusions in parentheses to help the model understand what NOT to match.

#### 4. Handle Missing Tags

If legitimate videos are untagged:

**Option A: Lower threshold**
```bash
python update_videos.py --hybrid --threshold 0.45
```

**Option B: Improve tag descriptions**
Edit `tag_descriptions.json` to better match the video content:
```json
{
  "tau": "Videos about painting Tau Empire battlesuits, Fire Warriors, Kroot auxiliary models, or T'au forces"
}
```

**Option C: Add regex patterns**
Edit `tag_rules.json` to catch specific keywords:
```json
["tau", "\\btaus?\\b|Farsight|fire warrior|pathfinder|crisis suit|kroot"]
```

#### 5. Adjust Tag Hierarchy

Edit `tag_hierarchy.json` to ensure parent tags are added:
```json
{
  "new-faction": ["parent-faction", "game-system"]
}
```

#### 6. Re-run and Verify

```bash
python update_videos.py --hybrid --threshold 0.50
```

### Semantic Mode Workflow

Similar to hybrid, but focus on tag descriptions rather than regex patterns:

#### 1. Update Videos

```bash
python update_videos.py --semantic --threshold 0.60
```

#### 2. Tune Threshold

If coverage is too low, decrease threshold:
```bash
python update_videos.py --semantic --threshold 0.55
```

If false positives appear, increase threshold:
```bash
python update_videos.py --semantic --threshold 0.65
```

#### 3. Improve Tag Descriptions

The quality of `tag_descriptions.json` directly impacts accuracy:

**Good description:**
```json
{
  "orcs": "Videos about painting Ork boyz, vehicles, or greenskin models from 40k (not Orlock gang from Necromunda, not Ork paint color names)"
}
```

**Bad description:**
```json
{
  "orcs": "Orks"  // Too vague
}
```

### Regex Mode Workflow

#### 1. Update Videos

```bash
python update_videos.py
```

#### 2. Check for Untagged Videos

If the output shows untagged videos, run:
```bash
python analyze_untagged.py
```

#### 3. Add New Patterns

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

#### 4. Add Tag Hierarchy (if needed)

Edit **`tag_hierarchy.json`**:
```json
{
  "new-tag": ["parent-tag", "grandparent-tag"]
}
```

#### 5. Re-run Until 100% Coverage

```bash
python update_videos.py
```

## How Semantic Tagging Works

### Sentence Transformers

The semantic mode uses **sentence-transformers**, a library that converts text into numerical vectors (embeddings) that capture meaning:

1. **Tag descriptions** are converted to embeddings (done once at startup)
2. **Video title + description** are combined and converted to an embedding
3. **Cosine similarity** is calculated between video and each tag
4. **Tags above threshold** are applied to the video

### Example

**Tag description:**
```
"orcs": "Videos about painting Ork boyz, vehicles, or greenskin models from 40k"
```

**Video A:** "How to Paint Ork Boyz"
- Semantic score: **0.82** → Tag applied ✅

**Video B:** "How to Paint Metal with Orlock Green Paint"  
- Semantic score: **0.31** → Tag NOT applied ✅ (even though "Orlock" matches)

**Why it works:** The model understands that Video A is about painting Orks, while Video B is about a painting technique using a paint color.

### Model Details

- **Model**: `all-MiniLM-L6-v2`
- **Size**: ~80MB (downloaded once, cached)
- **Speed**: ~0.5 seconds per video
- **Accuracy**: Good for short texts (video titles/descriptions)

### Hybrid Mode Advantage

Hybrid mode gets the best of both worlds:

1. **Regex catches obvious matches** → "Ultramarines" in title → apply tag
2. **Semantic validates ambiguous cases** → "Ultramarine Blue" paint → reject tag
3. **High-confidence semantic additions** → Model finds tags regex missed

**Result:** Broad coverage with high accuracy

## Configuration Files Deep Dive

### tag_descriptions.json

Controls semantic and hybrid tagging. Each tag has a natural language description:

```json
{
  "grey knights": "Videos about painting Grey Knights Space Marines in silver armor",
  "chaos": "Videos about painting Chaos Space Marines, Chaos daemons, or chaos-aligned models (not just mentioning chaos as enemies)",
  "beginner": "Beginner-friendly painting tutorials or battle-ready painting guides"
}
```

**Best practices:**
- Be specific about what the video should be ABOUT
- Mention paint names or false positives to exclude (in parentheses)
- Use natural language, not keywords
- Focus on video purpose, not just keyword presence

### tag_rules.json

Controls regex and hybrid tagging. Each rule is a `[tag, pattern]` pair:

```json
[
  ["40k", "40[.,]?000|40k|warhammer 40k"],
  ["orcs", "\\bboyz\\b|\\borcs?\\b|\\borks?\\b|gretchin"],
  ["skin", "\\bskin\\b|\\bflesh\\b|\\bface\\b"]
]
```

**Best practices:**
- Use word boundaries (`\\b`) to avoid partial matches
- Cover common variants (orcs/orks, singular/plural)
- Escape special regex characters in JSON (double backslash)

### tag_hierarchy.json

Defines parent-child relationships (all modes):

```json
{
  "salamanders": ["space marines", "40k"],
  "death guard": ["chaos space marines", "chaos", "40k", "horus heresy"]
}
```

When a child tag is applied, all parent tags are automatically added.

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

## Current Statistics

### LLM Mode (best accuracy)

```
✓ Uses Google Gemini 2.5 Flash for intelligent tagging
✓ Expected Coverage: ~95%+ (near-perfect understanding)
✓ Accuracy: Near-perfect - understands context like a human
✓ Runtime: ~8 minutes for 617 videos (batched, rate-limited)

📊 Expected Results:
  - Zero false positives from paint names
  - Untagged videos are legitimately non-tutorial content
  - LLM knows "Liberator Gold" is a paint, not Stormcast Eternals
  - Understands "daemon hunters" doesn't mean painting Chaos models
  - Recognizes technique vs faction references

✅ Best tagging quality available
✅ Requires free Gemini API key from https://aistudio.google.com/apikey
```

### Hybrid Mode (threshold=0.50, best offline balance)

```
✓ Tagged 617 unique videos
✓ Coverage: 86% (530/617 videos tagged)
✓ Untagged: 87 videos (non-tutorial content)

📊 Top 15 Tags:
  40k: 292 videos
  beginner: 163 videos
  citadel products: 137 videos
  space marines: 128 videos
  intermediate: 109 videos
  aos: 78 videos
  horus heresy: 56 videos
  chaos: 49 videos
  textures & materials: 45 videos
  chaos space marines: 39 videos
  armour: 35 videos
  skin: 25 videos
  ultramarines: 24 videos
  tyranids: 24 videos
  stormcast eternals: 18 videos

✅ Zero false positives from paint names
✅ Untagged videos are legitimately non-tutorial (shows, announcements, etc.)
```

### Semantic Mode (threshold=0.60)

```
✓ Tagged 617 unique videos  
✓ Coverage: 53% (326/617 videos tagged)
✓ Untagged: 291 videos

Most conservative mode - highest precision, lowest coverage
```

### Regex Mode (default)

```
✓ Tagged 617 unique videos
✓ Coverage: 100% (617/617 videos)

⚠️  Contains false positives from paint names:
  - "Liberator Gold" → stormcast eternals
  - "White Scar" → white scars
  - "Dryad Bark" → sylvaneth
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

### LLM Mode Issues

#### GEMINI_API_KEY not set

**Error:**
```
❌ Error: GEMINI_API_KEY not set in .env file.
   Get a free key at: https://aistudio.google.com/apikey
```

**Solution:**
1. Go to https://aistudio.google.com/apikey
2. Create a free API key
3. Add to `be/.env`:
   ```
   GEMINI_API_KEY=your_key_here
   ```

#### Rate limit errors

**Error:** `429 Resource has been exhausted`

**Solution:**
- Free tier allows 15 requests/minute
- Script already rate-limits to 4s between requests
- If error persists, you may have hit daily quota (1M tokens)
- Wait 24 hours or upgrade to paid tier

#### Connection errors

**Error:** `Connection refused` or `Timeout`

**Solution:**
1. Check internet connection
2. Check if Google AI Studio is down
3. Try again (temporary network issue)
4. Fallback to hybrid mode:
   ```bash
   python update_videos.py --hybrid
   ```

#### Invalid JSON response

**Error:** `JSONDecodeError: Expecting value`

**Solution:**
- Gemini occasionally returns malformed JSON
- Script automatically retries (3 attempts)
- If batch fails after 3 retries, those videos get empty tags
- Re-run to retry failed batches

#### Slow performance

**Expected:** ~8 minutes for 617 videos
**Actual:** Much slower

**Solution:**
- Script sleeps 4 seconds between requests (rate limiting)
- 124 batches × 4 seconds = ~8 minutes is normal
- If much slower, check network latency
- Use `--quiet` flag to reduce output overhead

### General Issues

### Script fails to load config files

**Error:** `FileNotFoundError: tag_rules.json`

**Solution:** Make sure you're running from the `be/` directory:
```bash
cd be
python update_videos.py
```

### Model download fails (Semantic/Hybrid)

**Error:** `Connection error downloading model`

**Solutions:**
1. Check internet connection
2. Try again (temporary network issue)
3. Set HuggingFace token (optional, for higher rate limits):
   ```bash
   export HF_TOKEN=your_token_here
   ```

### Semantic mode very slow on first run

**Expected behavior:** First run downloads ~500MB model

**Progress:**
```
🤖 Loading semantic model: all-MiniLM-L6-v2...
Downloading... (this happens only once)
```

**Subsequent runs:** Fast (~3-4 minutes total)

### False positives in hybrid/semantic mode

**Problem:** Tag is being applied incorrectly

**Solution:** Edit `tag_descriptions.json` to be more specific:
```json
{
  "orcs": "Videos about painting Ork boyz, vehicles, or greenskin models from 40k (not Orlock gang from Necromunda, not Ork paint color names)"
}
```

Add explicit exclusions in parentheses.

### Too many untagged videos (Semantic/Hybrid)

**Problem:** Coverage below 80%

**Solutions:**

1. **Lower threshold:**
   ```bash
   python update_videos.py --hybrid --threshold 0.45
   ```

2. **Improve tag descriptions:**
   Make them more inclusive and match actual video language:
   ```json
   {
     "tau": "Videos about painting Tau Empire, T'au, battlesuits, Fire Warriors, Kroot, or Farsight Enclaves"
   }
   ```

3. **Add regex patterns (hybrid mode):**
   Edit `tag_rules.json` to catch specific keywords

### Tags not applying in regex mode

**Diagnosis:**
1. Check pattern syntax in `tag_rules.json`
2. Test regex pattern: 
   ```bash
   python -c "import re; print(re.search(r'pattern', 'test text', re.IGNORECASE))"
   ```
3. Check if video title/description actually contains the keywords

### Untagged videos persist (Regex mode)

**Steps:**
1. Run `analyze_untagged.py` to see common keywords
2. Add patterns for those keywords to `tag_rules.json`
3. Re-run `update_videos.py`

### Memory errors (Semantic/Hybrid)

**Error:** `OutOfMemoryError` during model loading

**Solutions:**
1. Close other applications
2. Use a machine with more RAM (model needs ~2GB RAM)
3. Fallback to regex mode:
   ```bash
   python update_videos.py  # no semantic flags
   ```

### Threshold confusion

**Question:** What threshold should I use?

**Answer:**
- **Hybrid mode**: Start with `0.50`, adjust based on results
- **Semantic mode**: Start with `0.60`, lower for more coverage
- **Lower = more tags** (more coverage, potential false positives)
- **Higher = fewer tags** (higher precision, may miss valid tags)

## File Locations

```
be/
├── update_videos.py          # Main script (all 4 modes)
├── semantic_tagger.py        # SemanticTagger class
├── analyze_untagged.py       # Analysis tool
├── tag_rules.json            # 93 regex patterns (regex/hybrid modes)
├── tag_descriptions.json     # 93+ semantic descriptions (semantic/hybrid/LLM modes)
├── tag_hierarchy.json        # Tag relationships (all modes)
├── exclude_patterns.json     # Title exclusions
├── exclude_ids.json          # Video ID exclusions
└── videos.json               # Intermediate data
```

## Best Practices

### For All Modes

1. **Test locally before committing** - Run on your machine first
2. **Check statistics** - Ensure tags are balanced and useful
3. **Monitor untagged videos** - Should be non-tutorial content
4. **Use hierarchy wisely** - Don't repeat parent tags in patterns
5. **Keep exclusions updated** - Add new promotional content patterns

### For LLM Mode (Best Accuracy)

1. **Get free API key** - Sign up at https://aistudio.google.com/apikey
2. **Add to .env file** - Keep API keys secure, never commit
3. **Trust the LLM** - It understands context better than regex patterns
4. **Improve tag descriptions** - More detailed descriptions = better results
5. **Monitor rate limits** - Free tier: 15 RPM, 1M tokens/day (sufficient for this project)
6. **Review results** - LLM should achieve ~95%+ coverage with near-perfect accuracy
7. **No regex needed** - LLM mode only uses tag_descriptions.json, not tag_rules.json

### For Hybrid Mode (Best Offline Balance)

1. **Start with threshold 0.50** - Good balance point
2. **Tune based on results** - Adjust up for precision, down for coverage
3. **Focus on tag descriptions** - Quality descriptions = better accuracy
4. **Use regex for new factions** - Add patterns first, descriptions second
5. **Validate false positives** - Check and improve tag descriptions

### For Semantic Mode

1. **Use higher threshold** - Start with 0.60 or above
2. **Write detailed descriptions** - More context = better matching
3. **Include exclusions** - Explicitly state what NOT to match
4. **Accept lower coverage** - Trade-off for zero false positives
5. **Monitor edge cases** - Videos with ambiguous titles

### For Regex Mode

1. **Use word boundaries** - `\\bword\\b` prevents partial matches
2. **Test patterns** - Use Python regex tester before adding
3. **Be specific** - Avoid overly broad patterns
4. **Document complex patterns** - Git commit messages
5. **Aim for 100% coverage** - Add patterns until all videos tagged

### Tag Description Quality (Semantic/Hybrid/LLM)

**✅ Good:**
```json
{
  "tau": "Videos about painting Tau Empire battlesuits, Fire Warriors, Kroot auxiliary models, or T'au forces from Warhammer 40,000 (not just mentioning tau as enemies)"
}
```
- Specific about what to match
- Includes common terms and variants
- Excludes false positive cases
- Natural language, descriptive

**❌ Bad:**
```json
{
  "tau": "Tau"
}
```
- Too vague
- No context
- No exclusions
- Just a keyword

### Regex Pattern Quality

**✅ Good:**
```json
["orcs", "\\bboyz\\b|\\borcs?\\b|\\borks?\\b|gretchin|Squig|warboss|\\bnob\\b|kommando"]
```
- Word boundaries prevent false matches
- Covers variants (ork/orc, singular/plural)
- Includes related terms
- Specific enough to avoid "Orlock"

**❌ Bad:**
```json
["orcs", "ork"]
```
- No word boundaries (matches "work", "Orlock")
- Missing variants
- Too simple

## Summary

The tagging system offers four modes to suit different needs:

- **LLM**: Best accuracy - uses Google Gemini to understand context like a human (~95%+ coverage, near-perfect accuracy, requires API key)
- **Hybrid**: Best balance - combines regex coverage with semantic validation (86%, zero false positives, works offline)
- **Semantic**: Best precision - pure NLP understanding (53-79%, highest accuracy, works offline)  
- **Regex**: Best speed - traditional pattern matching (100%, some false positives, works offline)

All configuration is in JSON files, making the system maintainable without touching code. The semantic modes use sentence transformers to understand context, and the LLM mode uses Google Gemini for human-like reasoning, both eliminating false positives from paint names.

**Recommended workflow:** 
- Use LLM mode (`--llm`) if you have a Gemini API key for the best tagging quality
- Use hybrid mode (`--hybrid --threshold 0.50`) for the best offline balance of coverage and accuracy
