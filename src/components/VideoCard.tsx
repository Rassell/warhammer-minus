import { Link } from "react-router";

import type { IVideo } from "~/types";

export default function VideoCard({ video }: { video: IVideo }) {
  const date = new Date(video.publishedAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link to={`/video/${video.videoId}`} className="group block">
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="mt-3">
        <h3 className="line-clamp-2 leading-tight font-medium group-hover:text-blue-400">
          {video.title}
        </h3>

        <p className="mt-2 text-sm text-zinc-500">{date}</p>

        {video.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {video.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
