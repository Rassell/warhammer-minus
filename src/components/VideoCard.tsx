import { Link } from "react-router";

import { authorIdByChannelId } from "~/lib/catalog";
import { formatRelativeDate, formatViews } from "~/lib/format";
import type { IVideo } from "~/types";

import MediaThumb from "./MediaThumb";

interface VideoCardProps {
  video: IVideo;
  priority?: boolean;
}

/**
 * Grid card: large thumbnail, two-line title, author and recency. There are no
 * social controls (likes, comments, subscriptions) by design.
 */
export default function VideoCard({
  video,
  priority = false,
}: VideoCardProps) {
  const authorId =
    video.channelId !== undefined
      ? authorIdByChannelId.get(video.channelId)
      : undefined;

  return (
    <article className="group flex flex-col">
      <Link
        to={`/video/${video.videoId}`}
        tabIndex={-1}
        aria-hidden="true"
        className="block rounded-xl"
      >
        <MediaThumb video={video} priority={priority} />
      </Link>

      <div className="mt-2.5 flex-1">
        <h3 className="line-clamp-2 text-sm leading-snug font-medium text-mist-100 transition-colors group-hover:text-gold-300 sm:text-[15px]">
          <Link to={`/video/${video.videoId}`}>{video.title}</Link>
        </h3>

        <div className="mt-1.5 space-y-0.5 text-xs text-mist-500">
          {video.channelTitle !== undefined &&
            (authorId !== undefined ? (
              <Link
                to={`/authors/${authorId}`}
                className="block truncate transition-colors hover:text-mist-300"
              >
                {video.channelTitle}
              </Link>
            ) : (
              <span className="block truncate">{video.channelTitle}</span>
            ))}

          <p className="flex flex-wrap items-center gap-x-1.5">
            <span>{formatViews(video.viewCount)}</span>
            <span aria-hidden="true">·</span>
            <span>{formatRelativeDate(video.publishedAt)}</span>
          </p>
        </div>
      </div>
    </article>
  );
}
