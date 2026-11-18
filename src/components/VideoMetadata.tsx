import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { useFilters } from "~/hooks/useFilters";
import { authorIdByChannelId, authorsById } from "~/lib/catalog";
import { cn } from "~/lib/cn";
import { formatLongDate, formatViews, pluralize } from "~/lib/format";
import type { IVideo } from "~/types";

import Avatar from "./Avatar";

/**
 * Title, author, publication date, expandable description and tag chips.
 * Deliberately no likes, comments or subscribe controls.
 */
export default function VideoMetadata({ video }: { video: IVideo }) {
  const [expanded, setExpanded] = useState(false);
  const { toggleTag } = useFilters();
  const navigate = useNavigate();

  const authorId =
    video.channelId !== undefined
      ? authorIdByChannelId.get(video.channelId)
      : undefined;
  const author = authorId !== undefined ? authorsById.get(authorId) : undefined;

  const description = video.description.trim();
  const isLong = description.length > 320;

  return (
    <div className="mt-4">
      <h1 className="text-xl leading-tight font-semibold tracking-tight text-mist-100 sm:text-2xl">
        {video.title}
      </h1>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-b border-ink-800 pb-4">
        <Avatar name={video.channelTitle ?? "Canal"} />

        <div className="min-w-0 flex-1">
          {author !== undefined ? (
            <Link
              to={`/authors/${author.id}`}
              className="font-medium text-mist-100 transition-colors hover:text-gold-300"
            >
              {author.name}
            </Link>
          ) : (
            <span className="font-medium text-mist-100">
              {video.channelTitle}
            </span>
          )}
          <p className="text-xs text-mist-500">
            {author !== undefined
              ? `${pluralize(author.videoCount, "vídeo", "vídeos")} · `
              : ""}
            {formatViews(video.viewCount)}
          </p>
        </div>

        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink-600 px-4 py-2 text-sm font-medium text-mist-300 transition-colors hover:border-gold-500/60 hover:text-gold-300 sm:w-auto"
        >
          Ver en YouTube
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>

      <p className="mt-3 text-xs text-mist-500">
        {formatLongDate(video.publishedAt)}
      </p>

      <div className="mt-4 rounded-xl bg-ink-900 p-4">
        <p
          className={cn(
            "text-sm leading-relaxed whitespace-pre-wrap text-mist-300",
            !expanded && isLong && "line-clamp-4",
          )}
        >
          {description !== "" ? description : "Sin descripción disponible."}
        </p>

        {isLong && (
          <button
            type="button"
            onClick={() => {
              setExpanded((current) => !current);
            }}
            className="mt-2 text-sm font-medium text-gold-400 transition-colors hover:text-gold-300"
          >
            {expanded ? "Mostrar menos" : "Mostrar más"}
          </button>
        )}
      </div>

      {video.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {video.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                toggleTag(tag);
                void navigate("/videos");
              }}
              className="rounded-full border border-ink-700 px-3 py-1 text-xs text-mist-400 transition-colors hover:border-gold-500/50 hover:text-gold-300"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
