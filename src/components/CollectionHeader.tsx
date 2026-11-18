import { Link } from "react-router";

import {
  authorIdByChannelId,
  authorsById,
  getCollectionTotalDuration,
} from "~/lib/catalog";
import { formatTotalDuration, pluralize } from "~/lib/format";
import type { Collection } from "~/types";

export default function CollectionHeader({
  collection,
}: {
  collection: Collection;
}) {
  const authorId = authorIdByChannelId.get(collection.channelId);
  const author = authorId !== undefined ? authorsById.get(authorId) : undefined;
  const totalDuration = getCollectionTotalDuration(collection);

  return (
    <header className="flex flex-col gap-5 rounded-2xl border border-ink-700/60 bg-ink-900 p-4 sm:p-6 md:flex-row md:items-center">
      <img
        src={collection.thumbnail}
        alt={collection.title}
        className="aspect-video w-full rounded-xl object-cover md:w-72 md:shrink-0"
      />

      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-widest text-gold-400 uppercase">
          Colección
        </p>
        <h1 className="mt-1 text-2xl leading-tight font-semibold tracking-tight text-mist-100 sm:text-3xl">
          {collection.title}
        </h1>

        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-mist-500">
          {author !== undefined ? (
            <Link
              to={`/authors/${author.id}`}
              className="font-medium text-mist-300 transition-colors hover:text-gold-300"
            >
              {collection.channelTitle}
            </Link>
          ) : (
            <span className="font-medium text-mist-300">
              {collection.channelTitle}
            </span>
          )}
          <span aria-hidden="true">·</span>
          <span>{pluralize(collection.videoCount, "vídeo", "vídeos")}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {formatTotalDuration(totalDuration)}
          </span>
        </p>

        {collection.description.trim() !== "" && (
          <p className="mt-3 max-w-3xl text-sm leading-relaxed whitespace-pre-wrap text-mist-400">
            {collection.description}
          </p>
        )}
      </div>
    </header>
  );
}
