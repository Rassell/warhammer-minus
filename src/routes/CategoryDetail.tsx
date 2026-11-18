import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Tags } from "lucide-react";
import { Link, useParams } from "react-router";

import Breadcrumbs from "~/components/Breadcrumbs";
import CategoryIcon from "~/components/CategoryIcon";
import EmptyState from "~/components/EmptyState";
import VideoGrid from "~/components/VideoGrid";
import { useFilters } from "~/hooks/useFilters";
import { categoriesBySlug, getCategoryVideos } from "~/lib/catalog";
import { pluralize } from "~/lib/format";
import { SORT_OPTIONS, sortVideos, type VideoSort } from "~/lib/filters";

export default function CategoryDetail() {
  const { slug } = useParams<{ slug: string }>();
  const category = slug !== undefined ? categoriesBySlug.get(slug) : undefined;
  const { sort, setSort } = useFilters();

  const categoryVideos = useMemo(
    () => (category !== undefined ? getCategoryVideos(category) : []),
    [category],
  );
  const sortedVideos = useMemo(
    () => sortVideos(categoryVideos, sort),
    [categoryVideos, sort],
  );

  if (category === undefined) {
    return (
      <EmptyState
        icon={<Tags className="h-5 w-5" />}
        title="Categoría no encontrada"
        description="Esta categoría no existe en el catálogo actual."
        action={
          <Link
            to="/categories"
            className="rounded-full bg-gold-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-400"
          >
            Ver todas las categorías
          </Link>
        }
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${category.name} - Warhammer Minus`}</title>
        <meta name="description" content={category.description} />
        <meta
          property="og:title"
          content={`${category.name} - Warhammer Minus`}
        />
        <meta property="og:description" content={category.description} />
        <meta property="og:type" content="website" />
      </Helmet>

      <Breadcrumbs
        items={[
          { label: "Inicio", to: "/" },
          { label: "Categorías", to: "/categories" },
          { label: category.name },
        ]}
      />

      <header className="flex flex-col gap-4 rounded-2xl border border-ink-700/60 bg-ink-900 p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-ink-800 text-gold-400 ring-1 ring-ink-700 ring-inset">
          <CategoryIcon icon={category.icon} className="h-6 w-6" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-widest text-gold-400 uppercase">
            Categoría
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-mist-100 sm:text-3xl">
            {category.name}
          </h1>
          <p className="mt-1 text-sm text-mist-500">
            {category.description} ·{" "}
            {pluralize(categoryVideos.length, "vídeo", "vídeos")}
          </p>
        </div>

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
      </header>

      <div className="mt-6">
        {sortedVideos.length > 0 ? (
          <VideoGrid videos={sortedVideos} priorityCount={4} />
        ) : (
          <EmptyState
            icon={<Tags className="h-5 w-5" />}
            title="No hay vídeos en esta categoría"
            description="Todavía no hay tutoriales etiquetados con esta temática."
          />
        )}
      </div>
    </>
  );
}
