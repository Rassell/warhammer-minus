import { Helmet } from "react-helmet-async";
import { SearchX } from "lucide-react";
import { Link, useParams } from "react-router";

import Breadcrumbs from "~/components/Breadcrumbs";
import EmptyState from "~/components/EmptyState";
import RelatedVideos from "~/components/RelatedVideos";
import VideoMetadata from "~/components/VideoMetadata";
import VideoPlayer from "~/components/VideoPlayer";
import {
  getRelatedVideos,
  getVideoCollection,
  videosById,
} from "~/lib/catalog";
import { pluralize } from "~/lib/format";

export default function VideoDetail() {
  const { videoId } = useParams<{ videoId: string }>();
  const video = videoId !== undefined ? videosById.get(videoId) : undefined;

  if (video === undefined) {
    return (
      <EmptyState
        icon={<SearchX className="h-5 w-5" />}
        title="Vídeo no encontrado"
        description="El vídeo que buscas no está en el catálogo o su enlace ha cambiado."
        action={
          <Link
            to="/videos"
            className="rounded-full bg-gold-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-400"
          >
            Ver todos los vídeos
          </Link>
        }
      />
    );
  }

  const related = getRelatedVideos(video, 10);
  const collection = getVideoCollection(video.videoId);
  const metaDescription =
    video.description.trim().slice(0, 155) ||
    `Tutorial de pintura de Warhammer: ${video.title}`;

  return (
    <>
      <Helmet>
        {/* Single string child: react-helmet-async blanks multi-child titles */}
        <title>{`${video.title} - Warhammer Minus`}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={video.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={video.thumbnail} />
        <meta property="og:type" content="video.other" />
      </Helmet>

      <Breadcrumbs
        items={[
          { label: "Inicio", to: "/" },
          { label: "Vídeos", to: "/videos" },
          { label: video.title },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          <VideoPlayer video={video} />
          <VideoMetadata video={video} />
        </div>

        <aside className="space-y-6">
          {collection !== undefined && (
            <Link
              to={`/collections/${collection.playlistId}`}
              className="group block overflow-hidden rounded-xl border border-ink-800 bg-ink-900/60 transition-colors hover:border-ink-600"
            >
              <div className="flex gap-3 p-3">
                <img
                  src={collection.thumbnail}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-28 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold tracking-widest text-gold-400 uppercase">
                    Colección
                  </p>
                  <p className="line-clamp-2 text-sm font-medium text-mist-100 transition-colors group-hover:text-gold-300">
                    {collection.title}
                  </p>
                  <p className="text-xs text-mist-500">
                    {pluralize(collection.videoCount, "vídeo", "vídeos")}
                  </p>
                </div>
              </div>
            </Link>
          )}

          <RelatedVideos videos={related} />
        </aside>
      </div>
    </>
  );
}
