import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { SearchX, X } from "lucide-react";

import AuthorCard from "~/components/AuthorCard";
import CategoryCard from "~/components/CategoryCard";
import CategoryFilter from "~/components/CategoryFilter";
import CollectionCard from "~/components/CollectionCard";
import EmptyState from "~/components/EmptyState";
import FeaturedVideo from "~/components/FeaturedVideo";
import SectionHeader from "~/components/SectionHeader";
import VideoGrid from "~/components/VideoGrid";
import { useFilters } from "~/hooks/useFilters";
import {
  authors,
  categories,
  collections,
  getFeaturedCollections,
  getFeaturedVideo,
  getPopularVideos,
  getRecentVideos,
  totalCatalogDurationSeconds,
  videos,
} from "~/lib/catalog";
import { matchesVideoFilters, sortVideos } from "~/lib/filters";
import { formatCount, formatTotalDuration } from "~/lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-900/40 px-4 py-3">
      <dt className="text-[11px] font-semibold tracking-widest text-mist-600 uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums text-mist-100">
        {value}
      </dd>
    </div>
  );
}

export default function Home() {
  const {
    selectedTags,
    selectedChannels,
    selectedCategories,
    sort,
    clearFilters,
  } = useFilters();

  const isFiltering =
    selectedTags.length > 0 ||
    selectedChannels.length > 0 ||
    selectedCategories.length > 0;

  const featured = getFeaturedVideo();
  const recent = useMemo(() => getRecentVideos(12), []);
  const popular = useMemo(() => getPopularVideos(8), []);
  const featuredCollections = useMemo(() => getFeaturedCollections(8), []);

  const filtered = useMemo(() => {
    if (!isFiltering) {
      return [];
    }

    return sortVideos(
      videos.filter((video) =>
        matchesVideoFilters(video, {
          searchTerm: "",
          selectedTags,
          selectedChannels,
          selectedCategories,
        }),
      ),
      sort,
    );
  }, [
    isFiltering,
    selectedTags,
    selectedChannels,
    selectedCategories,
    sort,
  ]);

  return (
    <>
      <Helmet>
        <title>Warhammer Minus - Tutoriales de pintura de Warhammer</title>
        <meta
          name="description"
          content={`${videos.length} tutoriales de pintura de Warhammer 40.000 y Age of Sigmar recopilados de canales de YouTube. Explora vídeos, autores, colecciones y categorías.`}
        />
        <meta
          property="og:title"
          content="Warhammer Minus - Tutoriales de pintura de Warhammer"
        />
        <meta
          property="og:description"
          content="Descubre tutoriales de pintura de Warhammer organizados por autor, colección y categoría."
        />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="space-y-10">
        {featured !== undefined && <FeaturedVideo video={featured} />}

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Vídeos" value={formatCount(videos.length)} />
          <Stat label="Autores" value={formatCount(authors.length)} />
          <Stat label="Colecciones" value={formatCount(collections.length)} />
          <Stat
            label="Duración total"
            value={formatTotalDuration(totalCatalogDurationSeconds)}
          />
        </dl>

        <CategoryFilter />

        {isFiltering ? (
          <section aria-labelledby="filtered-heading">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="filtered-heading"
                  className="text-lg font-semibold tracking-tight text-mist-100 sm:text-xl"
                >
                  Resultados filtrados
                </h2>
                <p className="mt-0.5 text-sm text-mist-500">
                  {filtered.length} de {videos.length} vídeos
                </p>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-600 px-3 py-1.5 text-sm text-mist-300 transition-colors hover:border-gold-500/60 hover:text-gold-300"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Limpiar filtros
              </button>
            </div>

            {filtered.length > 0 ? (
              <VideoGrid videos={filtered} priorityCount={4} />
            ) : (
              <EmptyState
                icon={<SearchX className="h-5 w-5" />}
                title="Ningún vídeo coincide con los filtros"
                description="Prueba a quitar alguna categoría o etiqueta para ampliar los resultados."
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
          </section>
        ) : (
          <>
            <section aria-labelledby="recent-heading">
              <SectionHeader
                id="recent-heading"
                title="Añadidos recientemente"
                subtitle="Lo último publicado en los canales del catálogo"
                to="/videos"
              />
              <VideoGrid videos={recent} priorityCount={4} />
            </section>

            <section aria-labelledby="popular-heading">
              <SectionHeader
                id="popular-heading"
                title="Más vistos"
                subtitle="Los tutoriales con más reproducciones"
                to="/videos"
              />
              <VideoGrid videos={popular} />
            </section>

            <section aria-labelledby="collections-heading">
              <SectionHeader
                id="collections-heading"
                title="Colecciones destacadas"
                subtitle="Secuencias de vídeos sobre un mismo tema"
                to="/collections"
              />

              <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                {featuredCollections.map((collection) => (
                  <div
                    key={collection.playlistId}
                    className="w-64 shrink-0 snap-start sm:w-72"
                  >
                    <CollectionCard collection={collection} />
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby="authors-heading">
              <SectionHeader
                id="authors-heading"
                title="Autores"
                subtitle="Los creadores detrás de los tutoriales"
                to="/authors"
              />

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {authors.map((author) => (
                  <AuthorCard key={author.id} author={author} />
                ))}
              </div>
            </section>

            <section aria-labelledby="categories-heading">
              <SectionHeader
                id="categories-heading"
                title="Explora por categoría"
                subtitle="Encuentra tutoriales por facción o técnica"
                to="/categories"
              />

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {categories.map((category) => (
                  <CategoryCard
                    key={category.slug}
                    category={category}
                    compact
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
