import { Link } from "react-router";

import type { Collection } from "~/types";

interface CollectionCardProps {
  collection: Collection;
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link to={`/collections/${collection.playlistId}`} className="group block">
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={collection.thumbnail}
          alt={collection.title}
          loading="lazy"
          className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute right-2 bottom-2 rounded bg-black/80 px-2 py-0.5 text-xs font-medium text-white">
          {collection.videoCount} videos
        </span>
      </div>

      <h3 className="mt-3 line-clamp-2 leading-tight font-medium group-hover:text-blue-400">
        {collection.title}
      </h3>

      <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500">
        <span className="truncate">{collection.channelTitle}</span>
      </p>
    </Link>
  );
}
