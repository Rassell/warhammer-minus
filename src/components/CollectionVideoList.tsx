import { Play } from "lucide-react";
import { Link } from "react-router";

import { formatRelativeDate } from "~/lib/format";
import type { IVideo } from "~/types";

import MediaThumb from "./MediaThumb";

/**
 * Ordered playlist rows.
 *
 * Playlist order is curated and therefore preserved; the index is shown so the
 * sequence is obvious when scanning the list.
 */
export default function CollectionVideoList({
  videos,
}: {
  videos: IVideo[];
}) {
  return (
    <ol className="divide-y divide-ink-800 overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/40">
      {videos.map((video, index) => (
        <li key={video.videoId}>
          <Link
            to={`/video/${video.videoId}`}
            className="group flex items-center gap-3 px-3 py-3 transition-colors hover:bg-ink-900 sm:px-4"
          >
            <span className="w-6 shrink-0 text-center text-sm tabular-nums text-mist-500">
              {index + 1}
            </span>

            <div className="w-32 shrink-0 sm:w-40">
              <MediaThumb video={video} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium text-mist-100 transition-colors group-hover:text-gold-300">
                {video.title}
              </p>
              <p className="mt-1 truncate text-xs text-mist-500">
                {video.channelTitle} · {formatRelativeDate(video.publishedAt)}
              </p>
            </div>

            <Play
              className="hidden h-4 w-4 shrink-0 text-mist-600 transition-colors group-hover:text-gold-400 sm:block"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ol>
  );
}
