import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

import { getAuthorVideos } from "~/lib/catalog";
import { pluralize } from "~/lib/format";
import type { Author } from "~/types";

import Avatar from "./Avatar";

export default function AuthorCard({ author }: { author: Author }) {
  const latest = getAuthorVideos(author).slice(0, 3);

  return (
    <Link
      to={`/authors/${author.id}`}
      className="group flex h-full flex-col rounded-2xl border border-ink-700/60 bg-ink-900/60 p-5 transition-colors hover:border-ink-600 hover:bg-ink-900"
    >
      <div className="flex items-center gap-3">
        <Avatar name={author.name} size="lg" />
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-mist-100 transition-colors group-hover:text-gold-300">
            {author.name}
          </h3>
          <p className="text-xs text-mist-500">
            {pluralize(author.videoCount, "vídeo", "vídeos")} ·{" "}
            {pluralize(author.collectionCount, "colección", "colecciones")}
          </p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-mist-400">
        {author.description}
      </p>

      {latest.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-1.5">
          {latest.map((video) => (
            <img
              key={video.videoId}
              src={video.thumbnail}
              alt=""
              loading="lazy"
              decoding="async"
              className="aspect-video w-full rounded-md object-cover"
            />
          ))}
        </div>
      )}

      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gold-400">
        Ver autor
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
