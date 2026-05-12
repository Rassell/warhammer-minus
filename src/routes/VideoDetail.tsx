import { useParams, Link } from "react-router";

import videos from "../videos.json";

export default function VideoDetail() {
  const { videoId } = useParams<{ videoId: string }>();

  const video = videos.find((v) => v.videoId === videoId);

  if (!video) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl">Vídeo no encontrado</h2>
        <Link
          to="/"
          className="text-blue-500 hover:underline mt-4 inline-block"
        >
          ← Volver al inicio
        </Link>
      </div>
    );
  }

  const publishedDate = new Date(video.publishedAt).toLocaleDateString(
    "es-ES",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <main className="flex-1 p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video + Info */}
        <div className="lg:col-span-2">
          <div className="aspect-video bg-black rounded-xl overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${video.videoId}`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mt-6 leading-tight">
            {video.title}
          </h1>

          <p className="text-zinc-500 mt-2">{publishedDate}</p>
        </div>

        {/* Sidebar de info */}
        <div className="lg:col-span-1">
          {/* Descripción */}
          <div className="bg-zinc-900 rounded-xl p-6">
            <h3 className="font-semibold mb-3 text-zinc-300">Descripción</h3>
            <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {video.description || "Sin descripción disponible."}
            </p>
          </div>

          {/* Tags */}
          {video.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {video.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-zinc-800 text-zinc-300 text-sm px-4 py-1.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
