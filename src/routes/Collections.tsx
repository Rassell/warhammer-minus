import { Helmet } from "react-helmet-async";

import CollectionGrid from "~/components/CollectionGrid";
import {
  collections,
  getCollectionLatestDate,
  getCollectionTotalDuration,
} from "~/lib/catalog";
import { formatTotalDuration } from "~/lib/format";

export default function Collections() {
  // The playlist itself carries no update timestamp, so order by the most
  // recent video it contains.
  const sortedCollections = [...collections].sort(
    (a, b) => getCollectionLatestDate(b) - getCollectionLatestDate(a),
  );

  const totalDuration = collections.reduce(
    (total, collection) => total + getCollectionTotalDuration(collection),
    0,
  );

  return (
    <>
      <Helmet>
        <title>Colecciones - Warhammer Minus</title>
        <meta
          name="description"
          content="Playlists de tutoriales de pintura de Warhammer organizadas por tema: NMM, armaduras, pieles, peanas y más."
        />
        <meta property="og:title" content="Colecciones - Warhammer Minus" />
        <meta
          property="og:description"
          content="Playlists de tutoriales de pintura de Warhammer organizadas por tema."
        />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="space-y-8">
        <header>
          <p className="text-[11px] font-semibold tracking-widest text-gold-400 uppercase">
            Biblioteca
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-mist-100 sm:text-3xl">
            Colecciones
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist-400">
            Secuencias de vídeos que siguen un orden de reproducción. Cada
            colección reúne tutoriales de un mismo tema o de un mismo autor.
          </p>
          <p className="mt-2 text-sm text-mist-500">
            {collections.length} colecciones ·{" "}
            {formatTotalDuration(totalDuration)} de contenido
          </p>
        </header>

        <CollectionGrid collections={sortedCollections} />
      </div>
    </>
  );
}
