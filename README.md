# Warhammer Minus

A fan-made web app to browse and filter Warhammer painting tutorial videos from the official Warhammer YouTube channel. Search by title, filter by tags like `#40k`, `#aos`, `#beginner`, `#skin`, and more.

🔗 **Live:** [https://gonzalosorianodesoto.github.io/warhammer-minus/](https://gonzalosorianodesoto.github.io/warhammer-minus/)

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

1. **`youtube_channel_search.py`** — Fetches video metadata from the Warhammer YouTube channel via the YouTube Data API.
2. **`tag_videos.py`** — Applies tags to videos based on regex patterns in their titles (e.g., `40k`, `beginner`, `tyranids`).

The output is saved to `src/videos.json` and bundled with the frontend.

## Build & Deploy

```bash
yarn build
```

The production build outputs to `dist/`. Deployment to GitHub Pages is automated via GitHub Actions on push to `main`.

## License

See [LICENSE](LICENSE) for details.

---

Unofficial fan-made tool. Not affiliated with Games Workshop or YouTube.
