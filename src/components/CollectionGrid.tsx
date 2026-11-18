import { cn } from "~/lib/cn";
import type { Collection } from "~/types";

import CollectionCard from "./CollectionCard";

interface CollectionGridProps {
  collections: Collection[];
  className?: string;
}

export default function CollectionGrid({
  collections,
  className,
}: CollectionGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {collections.map((collection) => (
        <CollectionCard
          key={collection.playlistId}
          collection={collection}
        />
      ))}
    </div>
  );
}
