import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router";

import VideoGrid from "~/components/VideoGrid";
import { useFilters } from "~/hooks/useFilters";
import { collectionsById, getCollectionVideos } from "~/lib/catalog";
import { matchesVideoFilters } from "~/lib/filters";

export default function CollectionDetail() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const { selectedTags, selectedChannels } = useFilters();

  const collection = playlistId ? collectionsById.get(playlistId) : undefined;

  // Playlist order is meaningful (it is the curated sequence), so it is kept.
  const collectionVideos = useMemo(
    () => (collection ? getCollectionVideos(collection) : []),
    [collection],
  );

  const visibleVideos = useMemo(
    () =>
      collectionVideos.filter((video) =>
        matchesVideoFilters(video, {
          searchTerm: "",
          selectedTags,
          selectedChannels,
        }),
      ),
    [collectionVideos, selectedTags, selectedChannels],
  );

  if (!collection) {
    return (
      <div className="flex-1 p-8 text-center lg:ml-64">
        <h2 className="text-2xl">Colección no encontrada</h2>
        <Link
          to="/collections"
          className="mt-4 inline-block text-blue-500 hover:underline"
        >
          ← Volver a las colecciones
        </Link>
      </div>
    );
  }

  const isFiltered = visibleVideos.length !== collectionVideos.length;
  const description =
    collection.description ||
    `Colección de tutoriales de pintura: ${collection.title}`;

  return (
    <>
      <Helmet>
        {/* A single string child: react-helmet-async blanks the title otherwise */}
        <title>{`${collection.title} - Warhammer Minus`}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={collection.title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={collection.thumbnail} />
        <meta property="og:type" content="website" />
      </Helmet>

      <main className="flex-1 p-4 md:p-6 lg:ml-64">
        <Link
          to="/collections"
          className="text-sm text-zinc-400 hover:text-blue-400"
        >
          ← Todas las colecciones
        </Link>

        <header className="mt-4 mb-8 flex flex-col gap-4 md:flex-row md:items-center">
          <img
            src={collection.thumbnail}
            alt={collection.title}
            className="aspect-video w-full max-w-xs rounded-xl object-cover"
          />

          <div>
            <h1 className="text-2xl leading-tight font-bold md:text-3xl">
              {collection.title}
            </h1>

            <p className="mt-2 text-zinc-400">
              {collection.channelTitle} ·{" "}
              {isFiltered
                ? `${visibleVideos.length} / ${collectionVideos.length}`
                : collectionVideos.length}{" "}
              videos
            </p>

            {collection.description && (
              <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm text-zinc-400">
                {collection.description}
              </p>
            )}
          </div>
        </header>

        {visibleVideos.length > 0 ? (
          <VideoGrid videos={visibleVideos} />
        ) : (
          <p className="py-20 text-center text-xl text-zinc-500">
            No se encontraron videos con esos filtros
          </p>
        )}
      </main>
    </>
  );
}
