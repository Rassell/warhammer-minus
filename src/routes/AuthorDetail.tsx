import { Helmet } from "react-helmet-async";
import { SearchX } from "lucide-react";
import { Link, useParams } from "react-router";

import AuthorHeader from "~/components/AuthorHeader";
import Breadcrumbs from "~/components/Breadcrumbs";
import CollectionGrid from "~/components/CollectionGrid";
import EmptyState from "~/components/EmptyState";
import SectionHeader from "~/components/SectionHeader";
import VideoGrid from "~/components/VideoGrid";
import {
  authorsById,
  getAuthorCollections,
  getAuthorVideos,
} from "~/lib/catalog";
import { pluralize } from "~/lib/format";

export default function AuthorDetail() {
  const { authorId } = useParams<{ authorId: string }>();
  const author = authorId !== undefined ? authorsById.get(authorId) : undefined;

  if (author === undefined) {
    return (
      <EmptyState
        icon={<SearchX className="h-5 w-5" />}
        title="Autor no encontrado"
        description="Este autor no forma parte del catálogo actual."
        action={
          <Link
            to="/authors"
            className="rounded-full bg-gold-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-400"
          >
            Ver todos los autores
          </Link>
        }
      />
    );
  }

  const authorVideos = getAuthorVideos(author);
  const authorCollections = getAuthorCollections(author);

  return (
    <>
      <Helmet>
        <title>{`${author.name} - Warhammer Minus`}</title>
        <meta name="description" content={author.description} />
        <meta property="og:title" content={`${author.name} - Warhammer Minus`} />
        <meta property="og:description" content={author.description} />
        <meta property="og:type" content="profile" />
      </Helmet>

      <Breadcrumbs
        items={[
          { label: "Inicio", to: "/" },
          { label: "Autores", to: "/authors" },
          { label: author.name },
        ]}
      />

      <AuthorHeader author={author} />

      {authorCollections.length > 0 && (
        <section className="mt-10" aria-labelledby="author-collections">
          <SectionHeader
            id="author-collections"
            title="Colecciones"
            subtitle={`${pluralize(
              authorCollections.length,
              "colección",
              "colecciones",
            )} de ${author.name}`}
            to="/collections"
          />
          <CollectionGrid collections={authorCollections} />
        </section>
      )}

      <section className="mt-10" aria-labelledby="author-videos">
        <SectionHeader
          id="author-videos"
          title="Todos los vídeos"
          subtitle={pluralize(authorVideos.length, "vídeo", "vídeos")}
        />
        <VideoGrid videos={authorVideos} />
      </section>
    </>
  );
}
