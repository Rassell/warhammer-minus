import { Link } from "react-router";

export default function VideoCard({ video }: { video: any }) {
  const date = new Date(video.publishedAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link to={`/video/${video.videoId}`} className="group block">
      <div className="relative rounded-xl overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="mt-3">
        <h3 className="font-medium line-clamp-2 leading-tight group-hover:text-blue-400">
          {video.title}
        </h3>

        <p className="text-sm text-zinc-500 mt-2">{date}</p>

        {video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {video.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded text-zinc-400"
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
