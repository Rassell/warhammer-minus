import { Helmet } from "react-helmet-async";

import AuthorCard from "~/components/AuthorCard";
import CategoryCard from "~/components/CategoryCard";
import CategoryFilter from "~/components/CategoryFilter";
import CollectionGrid from "~/components/CollectionGrid";
import SectionHeader from "~/components/SectionHeader";
import VideoGrid from "~/components/VideoGrid";
import {
  authors,
  categories,
  getFeaturedCollections,
  getPopularVideos,
  getRecentVideos,
} from "~/lib/catalog";

export default function Explore() {
  const popular = getPopularVideos(8);
  const recent = getRecentVideos(8);
  const featuredCollections = getFeaturedCollections(4);

  return (
    <>
      <Helmet>
        <title>Explorar - Warhammer Minus</title>
        <meta
          name="description"
          content="Descubre tutoriales de pintura de Warhammer por categoría, popularidad y novedad."
        />
        <meta property="og:title" content="Explorar - Warhammer Minus" />
        <meta
          property="og:description"
          content="Descubre tutoriales de pintura de Warhammer por categoría, popularidad y novedad."
        />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="space-y-10">
        <header>
          <p className="text-[11px] font-semibold tracking-widest text-gold-400 uppercase">
            Descubrir
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-mist-100 sm:text-3xl">
            Explorar
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist-400">
            Recorre el catálogo por temática, encuentra los tutoriales más
            vistos y descubre las colecciones y autores con más contenido.
          </p>
        </header>

        <CategoryFilter />

        <section aria-labelledby="explore-categories">
          <SectionHeader
            id="explore-categories"
            title="Categorías"
            subtitle="Agrupaciones temáticas de las etiquetas del catálogo"
            to="/categories"
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {categories.map((category) => (
              <CategoryCard key={category.slug} category={category} compact />
            ))}
          </div>
        </section>

        <section aria-labelledby="explore-popular">
          <SectionHeader
            id="explore-popular"
            title="Tutoriales populares"
            subtitle="Los vídeos con más reproducciones"
            to="/videos"
          />
          <VideoGrid videos={popular} />
        </section>

        <section aria-labelledby="explore-recent">
          <SectionHeader
            id="explore-recent"
            title="Últimos vídeos"
            subtitle="Publicaciones recientes del catálogo"
            to="/videos"
          />
          <VideoGrid videos={recent} />
        </section>

        <section aria-labelledby="explore-collections">
          <SectionHeader
            id="explore-collections"
            title="Colecciones recomendadas"
            subtitle="Playlists organizadas por tema"
            to="/collections"
          />
          <CollectionGrid collections={featuredCollections} />
        </section>

        <section aria-labelledby="explore-authors">
          <SectionHeader
            id="explore-authors"
            title="Autores destacados"
            subtitle="Canales que publican tutoriales de pintura"
            to="/authors"
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {authors.map((author) => (
              <AuthorCard key={author.id} author={author} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
