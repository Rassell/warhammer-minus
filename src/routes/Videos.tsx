import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { SearchX, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router";

import CategoryFilter from "~/components/CategoryFilter";
import EmptyState from "~/components/EmptyState";
import VideoFiltersPanel from "~/components/VideoFiltersPanel";
import VideoGrid from "~/components/VideoGrid";
import { useFilters } from "~/hooks/useFilters";
import { videos } from "~/lib/catalog";
import {
  matchesVideoFilters,
  SORT_OPTIONS,
  sortVideos,
  type VideoSort,
} from "~/lib/filters";

const PAGE_SIZE = 24;

export default function Videos() {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("q") ?? "";

  const {
    selectedTags,
    selectedChannels,
    selectedCategories,
    sort,
    setSort,
    clearFilters,
    activeFilterCount,
  } = useFilters();

  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(
    () =>
      sortVideos(
        videos.filter((video) =>
          matchesVideoFilters(video, {
            searchTerm,
            selectedTags,
            selectedChannels,
            selectedCategories,
          }),
        ),
        sort,
      ),
    [searchTerm, selectedTags, selectedChannels, selectedCategories, sort],
  );

  // Reset the visible window whenever the filter set changes without an effect:
  // the current page is only valid for the key it was created with.
  const filterKey = [
    searchTerm,
    sort,
    ...selectedTags,
    ...selectedChannels,
    ...selectedCategories,
  ].join("|");
  const [page, setPage] = useState<{ key: string; count: number }>({
    key: filterKey,
    count: PAGE_SIZE,
  });
  const visibleCount = page.key === filterKey ? page.count : PAGE_SIZE;
  const visibleVideos = filtered.slice(0, visibleCount);

  const loadMore = () => {
    setPage({
      key: filterKey,
      count: Math.min(visibleCount + PAGE_SIZE, filtered.length),
    });
  };

  return (
    <>
      <Helmet>
        <title>Vídeos - Warhammer Minus</title>
        <meta
          name="description"
          content="Explora todos los tutoriales de pintura de Warhammer del catálogo y filtra por categoría, etiqueta o autor."
        />
        <meta property="og:title" content="Vídeos - Warhammer Minus" />
        <meta
          property="og:description"
          content="Explora todos los tutoriales de pintura de Warhammer del catálogo."
        />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-gold-400 uppercase">
              Biblioteca
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-mist-100 sm:text-3xl">
              Vídeos
            </h1>
            <p className="mt-1 text-sm text-mist-500">
              {filtered.length} de {videos.length} vídeos
              {searchTerm !== "" && ` para «${searchTerm}»`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowFilters((current) => !current);
              }}
              aria-expanded={showFilters}
              aria-controls="video-filters"
              className="inline-flex items-center gap-2 rounded-full border border-ink-600 px-3.5 py-2 text-sm font-medium text-mist-300 transition-colors hover:border-gold-500/60 hover:text-gold-300"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-gold-500 px-1.5 text-[11px] font-semibold text-ink-950">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <label className="inline-flex items-center gap-2 text-xs text-mist-500">
              <span className="hidden sm:inline">Ordenar por</span>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as VideoSort);
                }}
                aria-label="Ordenar vídeos"
                className="rounded-lg border border-ink-600 bg-ink-900 px-2.5 py-2 text-sm text-mist-200 transition-colors hover:border-ink-500 focus:border-gold-500/70 focus:outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <CategoryFilter />

        {showFilters && (
          <div id="video-filters">
            <VideoFiltersPanel />
          </div>
        )}

        {visibleVideos.length > 0 ? (
          <>
            <VideoGrid videos={visibleVideos} priorityCount={4} />

            {visibleVideos.length < filtered.length && (
              <div className="flex flex-col items-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={loadMore}
                  className="rounded-full border border-ink-600 px-5 py-2.5 text-sm font-medium text-mist-200 transition-colors hover:border-gold-500/60 hover:text-gold-300"
                >
                  Cargar más vídeos
                </button>
                <p className="text-xs text-mist-600">
                  {visibleVideos.length} de {filtered.length}
                </p>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={<SearchX className="h-5 w-5" />}
            title="No hay vídeos con estos filtros"
            description="Cambia la búsqueda o elimina alguna etiqueta, categoría o autor."
            action={
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full bg-gold-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-400"
              >
                Limpiar filtros
              </button>
            }
          />
        )}
      </div>
    </>
  );
}
