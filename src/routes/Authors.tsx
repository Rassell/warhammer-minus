import { Helmet } from "react-helmet-async";

import AuthorCard from "~/components/AuthorCard";
import { authors, videos } from "~/lib/catalog";

export default function Authors() {
  return (
    <>
      <Helmet>
        <title>Autores - Warhammer Minus</title>
        <meta
          name="description"
          content="Descubre los canales de YouTube que publican los tutoriales de pintura de Warhammer del catálogo."
        />
        <meta property="og:title" content="Autores - Warhammer Minus" />
        <meta
          property="og:description"
          content="Descubre los canales que publican los tutoriales de pintura del catálogo."
        />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="space-y-8">
        <header>
          <p className="text-[11px] font-semibold tracking-widest text-gold-400 uppercase">
            Biblioteca
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-mist-100 sm:text-3xl">
            Autores
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist-400">
            Los autores son los canales de YouTube incluidos en el catálogo. Cada
            uno reúne sus vídeos, sus colecciones y las temáticas que trata.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {authors.map((author) => (
            <AuthorCard key={author.id} author={author} />
          ))}
        </div>

        <p className="text-xs text-mist-600">
          {authors.length} autores · {videos.length} vídeos indexados
        </p>
      </div>
    </>
  );
}
