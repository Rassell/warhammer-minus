import { Helmet } from "react-helmet-async";

import CategoryCard from "~/components/CategoryCard";
import { categories, videos } from "~/lib/catalog";

export default function Categories() {
  return (
    <>
      <Helmet>
        <title>Categorías - Warhammer Minus</title>
        <meta
          name="description"
          content="Explora los tutoriales de pintura de Warhammer por facción y técnica: Space Marines, Caos, Xenos, Age of Sigmar y más."
        />
        <meta property="og:title" content="Categorías - Warhammer Minus" />
        <meta
          property="og:description"
          content="Explora los tutoriales de pintura por facción y técnica."
        />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="space-y-8">
        <header>
          <p className="text-[11px] font-semibold tracking-widest text-gold-400 uppercase">
            Biblioteca
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-mist-100 sm:text-3xl">
            Categorías
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist-400">
            Cada categoría agrupa varias de las etiquetas asignadas a mano a los
            vídeos. Un tutorial puede aparecer en más de una categoría cuando
            trata varios temas.
          </p>
          <p className="mt-2 text-sm text-mist-500">
            {categories.length} categorías · {videos.length} vídeos
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </div>
    </>
  );
}
