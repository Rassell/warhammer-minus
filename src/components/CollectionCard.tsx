import { ListVideo } from "lucide-react";
import { Link } from "react-router";

import { getCollectionTotalDuration } from "~/lib/catalog";
import { formatTotalDuration, pluralize } from "~/lib/format";
import type { Collection } from "~/types";

interface CollectionCardProps {
  collection: Collection;
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  const totalDuration = getCollectionTotalDuration(collection);

  return (
    <Link
      to={`/collections/${collection.playlistId}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-xl bg-ink-800">
        <img
          src={collection.thumbnail}
          alt={collection.title}
          loading="lazy"
          decoding="async"
          className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-linear-to-t from-black/85 via-black/40 to-transparent px-3 pt-8 pb-2 text-[11px] font-medium text-white">
          <span className="inline-flex items-center gap-1">
            <ListVideo className="h-3.5 w-3.5" aria-hidden="true" />
            {pluralize(collection.videoCount, "vídeo", "vídeos")}
          </span>
          <span className="tabular-nums">
            {formatTotalDuration(totalDuration)}
          </span>
        </div>
      </div>

      <h3 className="mt-3 line-clamp-2 leading-snug font-medium text-mist-100 transition-colors group-hover:text-gold-300">
        {collection.title}
      </h3>
      <p className="mt-1 truncate text-xs text-mist-500">
        {collection.channelTitle}
      </p>
    </Link>
  );
}
