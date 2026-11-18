import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Search as SearchIcon, SearchX } from "lucide-react";
import { Link, useSearchParams } from "react-router";

import AuthorCard from "~/components/AuthorCard";
import CollectionGrid from "~/components/CollectionGrid";
import EmptyState from "~/components/EmptyState";
import SectionHeader from "~/components/SectionHeader";
import VideoGrid from "~/components/VideoGrid";
import { categories, tagsWithCounts } from "~/lib/catalog";
import { pluralize } from "~/lib/format";
import { searchCatalog } from "~/lib/search";

const POPULAR_TAGS = tagsWithCounts.slice(0, 12);

function TagSuggestions() {
  return (
    <div className="flex flex-wrap gap-2">
      {POPULAR_TAGS.map(({ tag }) => (
        <Link
          key={tag}
          to={`/search?q=${encodeURIComponent(tag)}`}
          className="rounded-full border border-ink-700 px-3 py-1.5 text-xs text-mist-400 transition-colors hover:border-gold-500/50 hover:text-gold-300"
        >
          #{tag}
        </Link>
      ))}
    </div>
  );
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";

  const results = useMemo(() => searchCatalog(query), [query]);

  // Video results are capped by the search helper; be explicit about it.
  const videosLabel =
    results.videos.length >= 60
      ? "60+ vídeos"
      : pluralize(results.videos.length, "vídeo", "vídeos");

  if (query === "") {
    return (
      <>
        <Helmet>
          <title>Buscar - Warhammer Minus</title>
          <meta
            name="description"
            content="Busca tutoriales de pintura de Warhammer por título, autor, etiqueta o colección."
          />
          <meta property="og:title" content="Buscar - Warhammer Minus" />
          <meta property="og:type" content="website" />
        </Helmet>

        <div className="rounded-2xl border border-ink-800 bg-ink-900/40 p-6 sm:p-8">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-ink-800 text-gold-400">
            <SearchIcon className="h-5 w-5" aria-hidden="true" />
          </span>

          <h1 className="mt-4 text-xl font-semibold tracking-tight text-mist-100 sm:text-2xl">
            Busca en el catálogo
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-mist-400">
            Puedes buscar por título de vídeo, nombre de autor, etiqueta o
            colección. Usa la barra superior o empieza por una de las etiquetas
            más frecuentes.
          </p>

          <div className="mt-6">
            <p className="text-[11px] font-semibold tracking-widest text-mist-600 uppercase">
              Etiquetas populares
            </p>
            <div className="mt-2">
              <TagSuggestions />
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[11px] font-semibold tracking-widest text-mist-600 uppercase">
              Categorías
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category.slug}
                  to={`/categories/${category.slug}`}
                  className="rounded-full border border-ink-700 px-3 py-1.5 text-xs text-mist-400 transition-colors hover:border-gold-500/50 hover:text-gold-300"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (results.total === 0) {
    return (
      <>
        <Helmet>
          <title>{`Buscar «${query}» - Warhammer Minus`}</title>
          <meta name="robots" content="noindex" />
        </Helmet>

        <EmptyState
          icon={<SearchX className="h-5 w-5" />}
          title={`Sin resultados para «${query}»`}
          description="Prueba con otra palabra, una etiqueta o el nombre de un autor o colección."
          action={
            <Link
              to="/videos"
              className="rounded-full bg-gold-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-400"
            >
              Explorar todos los vídeos
            </Link>
          }
        />

        <div className="mt-8">
          <p className="text-[11px] font-semibold tracking-widest text-mist-600 uppercase">
            Etiquetas populares
          </p>
          <div className="mt-2">
            <TagSuggestions />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Buscar «${query}» - Warhammer Minus`}</title>
        <meta
          name="description"
          content={`Resultados de búsqueda para «${query}» en el catálogo de tutoriales de pintura de Warhammer.`}
        />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="space-y-10">
        <header>
          <p className="text-[11px] font-semibold tracking-widest text-gold-400 uppercase">
            Búsqueda
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-mist-100 sm:text-3xl">
            Resultados para «{query}»
          </h1>
          <p className="mt-1 text-sm text-mist-500">
            {pluralize(results.authors.length, "autor", "autores")} ·{" "}
            {pluralize(results.collections.length, "colección", "colecciones")}{" "}
            · {videosLabel}
          </p>
        </header>

        {results.authors.length > 0 && (
          <section aria-labelledby="search-authors">
            <SectionHeader
              id="search-authors"
              title="Autores"
              subtitle={pluralize(results.authors.length, "autor", "autores")}
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.authors.map((author) => (
                <AuthorCard key={author.id} author={author} />
              ))}
            </div>
          </section>
        )}

        {results.collections.length > 0 && (
          <section aria-labelledby="search-collections">
            <SectionHeader
              id="search-collections"
              title="Colecciones"
              subtitle={pluralize(
                results.collections.length,
                "colección",
                "colecciones",
              )}
            />
            <CollectionGrid collections={results.collections} />
          </section>
        )}

        {results.videos.length > 0 && (
          <section aria-labelledby="search-videos">
            <SectionHeader
              id="search-videos"
              title="Vídeos"
              subtitle={videosLabel}
            />
            <VideoGrid videos={results.videos} priorityCount={4} />
          </section>
        )}
      </div>
    </>
  );
}
