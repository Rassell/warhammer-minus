import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { useFilters } from "~/hooks/useFilters";
import { authorsWithCounts, tagsWithCounts } from "~/lib/catalog";
import { cn } from "~/lib/cn";

const INITIAL_TAG_COUNT = 24;

function chipClass(active: boolean): string {
  return cn(
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
    active
      ? "border-gold-500/60 bg-gold-500/15 text-gold-300"
      : "border-ink-700 bg-ink-900 text-mist-400 hover:border-ink-600 hover:text-mist-100",
  );
}

/**
 * Facet panel for the Vídeos page: authors and the most used tags.
 * The tag list is collapsed by default because the vocabulary has ~86 values.
 */
export default function VideoFiltersPanel({
  className,
}: {
  className?: string;
}) {
  const [showAllTags, setShowAllTags] = useState(false);
  const {
    selectedTags,
    selectedChannels,
    toggleTag,
    toggleChannel,
    clearFilters,
    activeFilterCount,
  } = useFilters();

  const visibleTags = showAllTags
    ? tagsWithCounts
    : tagsWithCounts.slice(0, INITIAL_TAG_COUNT);

  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-800 bg-ink-900/50 p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-mist-100">
          <SlidersHorizontal
            className="h-4 w-4 text-gold-400"
            aria-hidden="true"
          />
          Filtros
        </h2>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs font-medium text-mist-400 transition-colors hover:text-gold-300"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Limpiar ({activeFilterCount})
          </button>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-[11px] font-semibold tracking-widest text-mist-600 uppercase">
          Autores
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {authorsWithCounts.map((author) => {
            const active = selectedChannels.includes(author.name);

            return (
              <button
                key={author.id}
                type="button"
                onClick={() => {
                  toggleChannel(author.name);
                }}
                aria-pressed={active}
                className={chipClass(active)}
              >
                {author.name}
                <span className="text-[10px] tabular-nums opacity-70">
                  {author.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-[11px] font-semibold tracking-widest text-mist-600 uppercase">
          Etiquetas
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {visibleTags.map(({ tag, count }) => {
            const active = selectedTags.includes(tag);

            return (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  toggleTag(tag);
                }}
                aria-pressed={active}
                className={chipClass(active)}
              >
                #{tag}
                <span className="text-[10px] tabular-nums opacity-70">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {tagsWithCounts.length > INITIAL_TAG_COUNT && (
          <button
            type="button"
            onClick={() => {
              setShowAllTags((current) => !current);
            }}
            className="mt-3 text-xs font-medium text-gold-400 transition-colors hover:text-gold-300"
          >
            {showAllTags
              ? "Ver menos etiquetas"
              : `Ver las ${tagsWithCounts.length} etiquetas`}
          </button>
        )}
      </div>
    </div>
  );
}
