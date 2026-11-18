import { ExternalLink } from "lucide-react";

import { formatCount, pluralize } from "~/lib/format";
import type { Author } from "~/types";

import Avatar from "./Avatar";

export default function AuthorHeader({ author }: { author: Author }) {
  return (
    <header className="overflow-hidden rounded-2xl border border-ink-700/60 bg-ink-900">
      <div
        aria-hidden="true"
        className="h-28 bg-ink-800 bg-[radial-gradient(120%_120%_at_20%_0%,rgba(214,168,75,0.28),transparent_60%)] sm:h-36"
      />

      <div className="px-5 pb-6 sm:px-8">
        <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end">
          <Avatar
            name={author.name}
            size="xl"
            className="ring-4 ring-ink-900"
          />

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-mist-100 sm:text-3xl">
              {author.name}
            </h1>
            <p className="mt-1 text-sm text-mist-500">
              {pluralize(author.videoCount, "vídeo", "vídeos")} ·{" "}
              {pluralize(author.collectionCount, "colección", "colecciones")} ·{" "}
              {formatCount(author.totalViewCount)} visualizaciones
            </p>
          </div>

          {author.channelId !== undefined && (
            <a
              href={`https://www.youtube.com/channel/${author.channelId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-ink-600 px-4 py-2 text-sm font-medium text-mist-300 transition-colors hover:border-gold-500/60 hover:text-gold-300"
            >
              Ver canal en YouTube
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-mist-400">
          {author.description}
        </p>

        {author.topTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {author.topTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-ink-700 px-2.5 py-1 text-xs text-mist-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
