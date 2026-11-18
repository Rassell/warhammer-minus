import { Helmet } from "react-helmet-async";
import { ListVideo, SearchX, Video } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router";

import AuthorHeader from "~/components/AuthorHeader";
import Breadcrumbs from "~/components/Breadcrumbs";
import CollectionGrid from "~/components/CollectionGrid";
import EmptyState from "~/components/EmptyState";
import Tabs from "~/components/Tabs";
import VideoGrid from "~/components/VideoGrid";
import {
  authorsById,
  getAuthorCollections,
  getAuthorVideos,
} from "~/lib/catalog";

const TABS = ["videos", "colecciones"] as const;
type AuthorTab = (typeof TABS)[number];

function isAuthorTab(value: string | null): value is AuthorTab {
  return value !== null && TABS.includes(value as AuthorTab);
}

export default function AuthorDetail() {
  const { authorId } = useParams<{ authorId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab");
  const tab: AuthorTab = isAuthorTab(tabParam) ? tabParam : "videos";

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

  // The tab lives in the URL so the view is shareable and back/forward work.
  // `replace` keeps tab switching out of the history stack.
  const selectTab = (id: string) => {
    const next = new URLSearchParams(searchParams);

    if (id === "videos") {
      next.delete("tab");
    } else {
      next.set("tab", id);
    }

    setSearchParams(next, { replace: true });
  };

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

      <Tabs
        idPrefix="author"
        label="Contenido del autor"
        className="mt-8"
        items={[
          { id: "videos", label: "Vídeos", count: authorVideos.length },
          {
            id: "colecciones",
            label: "Colecciones",
            count: authorCollections.length,
          },
        ]}
        value={tab}
        onChange={selectTab}
      />

      <div
        role="tabpanel"
        id={`author-panel-${tab}`}
        aria-labelledby={`author-tab-${tab}`}
        tabIndex={0}
        className="mt-6 focus-visible:outline-none"
      >
        {tab === "videos" ? (
          authorVideos.length > 0 ? (
            <VideoGrid videos={authorVideos} priorityCount={4} />
          ) : (
            <EmptyState
              icon={<Video className="h-5 w-5" />}
              title="Este autor no tiene vídeos"
              description="Todavía no hay tutoriales de este autor en el catálogo."
            />
          )
        ) : authorCollections.length > 0 ? (
          <CollectionGrid collections={authorCollections} />
        ) : (
          <EmptyState
            icon={<ListVideo className="h-5 w-5" />}
            title="Este autor no tiene colecciones"
            description="Sus vídeos no están organizados en playlists públicas."
            action={
              <button
                type="button"
                onClick={() => {
                  selectTab("videos");
                }}
                className="rounded-full border border-ink-600 px-4 py-2 text-sm font-medium text-mist-300 transition-colors hover:border-gold-500/60 hover:text-gold-300"
              >
                Ver sus vídeos
              </button>
            }
          />
        )}
      </div>
    </>
  );
}
