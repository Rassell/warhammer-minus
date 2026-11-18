import { Link } from "react-router";

import { formatRelativeDate, formatViews } from "~/lib/format";
import type { IVideo } from "~/types";

import MediaThumb from "./MediaThumb";

/** Compact horizontal row used by related videos and search results. */
export default function VideoRow({ video }: { video: IVideo }) {
  return (
    <Link to={`/video/${video.videoId}`} className="group flex gap-2.5">
      <div className="w-36 shrink-0 sm:w-40">
        <MediaThumb video={video} className="rounded-lg" />
      </div>

      <div className="min-w-0 py-0.5">
        <p className="line-clamp-2 text-sm leading-snug font-medium text-mist-100 transition-colors group-hover:text-gold-300">
          {video.title}
        </p>
        {video.channelTitle !== undefined && (
          <p className="mt-1 truncate text-xs text-mist-500">
            {video.channelTitle}
          </p>
        )}
        <p className="text-xs text-mist-500">
          {formatViews(video.viewCount)} ·{" "}
          {formatRelativeDate(video.publishedAt)}
        </p>
      </div>
    </Link>
  );
}
