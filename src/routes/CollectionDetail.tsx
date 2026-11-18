import { Helmet } from "react-helmet-async";
import { ListVideo } from "lucide-react";
import { Link, useParams } from "react-router";

import AuthorCard from "~/components/AuthorCard";
import Breadcrumbs from "~/components/Breadcrumbs";
import CollectionCard from "~/components/CollectionCard";
import CollectionHeader from "~/components/CollectionHeader";
import CollectionVideoList from "~/components/CollectionVideoList";
import EmptyState from "~/components/EmptyState";
import SectionHeader from "~/components/SectionHeader";
import {
  authorIdByChannelId,
  authorsById,
  collectionsById,
  getAuthorCollections,
  getCollectionVideos,
} from "~/lib/catalog";

export default function CollectionDetail() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const collection =
    playlistId !== undefined ? collectionsById.get(playlistId) : undefined;

  if (collection === undefined) {
    return (
      <EmptyState
        icon={<ListVideo className="h-5 w-5" />}
        title="Colección no encontrada"
        description="Esta colección no está en el catálogo o su enlace ha cambiado."
        action={
          <Link
            to="/collections"
            className="rounded-full bg-gold-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-400"
          >
            Ver todas las colecciones
          </Link>
        }
      />
    );
  }

  const collectionVideos = getCollectionVideos(collection);
  const authorId = authorIdByChannelId.get(collection.channelId);
  const author = authorId !== undefined ? authorsById.get(authorId) : undefined;

  const otherCollections =
    author !== undefined
      ? getAuthorCollections(author).filter(
          (entry) => entry.playlistId !== collection.playlistId,
        )
      : [];

  const description =
    collection.description.trim() !== ""
      ? collection.description
      : `Colección de tutoriales de pintura: ${collection.title}`;

  return (
    <>
      <Helmet>
        <title>{`${collection.title} - Warhammer Minus`}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={collection.title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={collection.thumbnail} />
        <meta property="og:type" content="website" />
      </Helmet>

      <Breadcrumbs
        items={[
          { label: "Inicio", to: "/" },
          { label: "Colecciones", to: "/collections" },
          { label: collection.title },
        ]}
      />

      <CollectionHeader collection={collection} />

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="collection-videos">
          <SectionHeader
            id="collection-videos"
            title="Vídeos de la colección"
            subtitle="En el orden de reproducción de la playlist"
          />

          {collectionVideos.length > 0 ? (
            <CollectionVideoList videos={collectionVideos} />
          ) : (
            <EmptyState
              icon={<ListVideo className="h-5 w-5" />}
              title="Esta colección no tiene vídeos disponibles"
              description="Los vídeos de la playlist no han superado los filtros del catálogo."
            />
          )}
        </section>

        <aside className="space-y-6">
          {author !== undefined && <AuthorCard author={author} />}

          {otherCollections.length > 0 && (
            <section aria-labelledby="more-collections">
              <h2
                id="more-collections"
                className="mb-3 text-sm font-semibold text-mist-100"
              >
                Más de {author?.name ?? collection.channelTitle}
              </h2>

              <div className="space-y-5">
                {otherCollections.slice(0, 3).map((entry) => (
                  <CollectionCard
                    key={entry.playlistId}
                    collection={entry}
                  />
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
