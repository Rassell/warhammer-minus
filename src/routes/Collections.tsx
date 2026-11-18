import { useMemo } from "react";
import { Helmet } from "react-helmet-async";

import CollectionCard from "~/components/CollectionCard";
import { collections, getCollectionLatestDate } from "~/lib/catalog";

export default function Collections() {
  // Newest collection first: the playlist itself carries no update timestamp,
  // so order by the most recent video it contains.
  const sortedCollections = useMemo(
    () =>
      [...collections].sort(
        (a, b) => getCollectionLatestDate(b) - getCollectionLatestDate(a),
      ),
    [],
  );

  return (
    <>
      <Helmet>
        <title>Colecciones - Warhammer Minus</title>
        <meta
          name="description"
          content="Colecciones de tutoriales de pintura Warhammer organizadas por tema: NMM, armaduras, pieles, peanas y más."
        />
        <meta property="og:title" content="Colecciones - Warhammer Minus" />
        <meta
          property="og:description"
          content="Tutoriales de pintura Warhammer organizados en colecciones"
        />
        <meta property="og:type" content="website" />
      </Helmet>

      <main className="flex-1 p-4 md:p-6 lg:ml-64">
        <div className="mb-6">
          <h1 className="text-2xl font-bold md:text-3xl">Colecciones</h1>
          <p className="mt-2 text-zinc-400">
            {sortedCollections.length} colecciones de tutoriales agrupadas por
            tema
          </p>
        </div>

        {sortedCollections.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {sortedCollections.map((collection) => (
              <CollectionCard
                key={collection.playlistId}
                collection={collection}
              />
            ))}
          </div>
        ) : (
          <p className="py-20 text-center text-xl text-zinc-500">
            Todavía no hay colecciones disponibles
          </p>
        )}
      </main>
    </>
  );
}
