# Warhammer Minus

A fan-made web app to browse and filter Warhammer painting tutorial videos from the official Warhammer YouTube channel. Search by title, filter by tags like `#40k`, `#aos`, `#beginner`, `#skin`, and more.

🔗 **Live:** [https://rassell.github.io/warhammer-minus/](https://rassell.github.io/warhammer-minus/)

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 8** (build tool)
- **Tailwind CSS 4** (styling)
- **React Router 7** (routing)
- **Lucide React** (icons)
- Deployed on **GitHub Pages**

## Getting Started

```bash
# Install dependencies
yarn install

# Start dev server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview

# Type check
yarn typecheck
```

## Data Pipeline

The video catalog is generated with Python scripts in `be/`:

1. **`update_videos.py`** — Unified script that fetches videos from YouTube and applies intelligent tagging
2. **`semantic_tagger.py`** — NLP-based semantic tagging using sentence transformers
3. **`analyze_untagged.py`** — (Optional) Analyzes untagged videos and suggests improvements

The output is saved to `src/videos.json` and bundled with the frontend.

### Intelligent Tagging System

**Two tagging modes available:**

- **Hybrid Mode (Recommended)**: Combines pattern matching with semantic validation to eliminate false positives
  - 86% coverage (530/617 videos)
  - Context-aware: Distinguishes "painting Orks" from "Ork Green paint"
  - Zero false positives from paint names

- **Regex Mode (Fallback)**: Traditional pattern matching
  - 100% coverage but prone to false positives
  - Fast and deterministic

**Key Features:**
- **Smart hierarchy**: Child tags inherit parent tags (e.g., `salamanders` → `space marines` + `40k`)
- **Confidence scores**: Hybrid/semantic modes provide 0-1 similarity scores
- **Multiple categories**: Game systems, factions, difficulty levels, techniques
- **Easy maintenance**: Edit `tag_descriptions.json` for semantic tags or `tag_rules.json` for regex patterns

**Quick Start:**
```bash
cd be
source .venv/bin/activate
python update_videos.py --hybrid  # Fetch + tag with hybrid mode
```

See `be/TAGGING_GUIDE.md` for detailed documentation.

## Build & Deploy

```bash
yarn build
```

The production build outputs to `dist/`. Deployment to GitHub Pages is automated via GitHub Actions on push to `main`.

## License

See [LICENSE](LICENSE) for details.

---

Unofficial fan-made tool. Not affiliated with Games Workshop or YouTube.
