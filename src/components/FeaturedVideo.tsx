import { useState } from "react";
import { Play, Sparkles } from "lucide-react";
import { Link } from "react-router";

import {
  formatRelativeDate,
  formatVideoDuration,
  formatViews,
} from "~/lib/format";
import { fallbackThumbnail } from "~/lib/thumbnails";
import type { IVideo } from "~/types";

interface FeaturedVideoProps {
  video: IVideo;
}

/**
 * Hero card for the home page.
 *
 * The overlay is a single directional gradient so the artwork keeps the visual
 * weight while the title stays legible at every breakpoint.
 */
export default function FeaturedVideo({ video }: FeaturedVideoProps) {
  const [failed, setFailed] = useState(false);
  const src = failed ? fallbackThumbnail(video.thumbnail) : video.thumbnail;
  const duration = formatVideoDuration(video.duration);

  return (
    <Link
      to={`/video/${video.videoId}`}
      className="group block overflow-hidden rounded-2xl border border-ink-700/70 bg-ink-900"
    >
      <div className="relative">
        <div className="relative aspect-video sm:aspect-auto sm:h-[400px] xl:h-[460px]">
          <img
            src={src}
            alt=""
            loading="eager"
            decoding="async"
            onError={() => {
              setFailed(true);
            }}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 hidden bg-linear-to-r from-ink-950 via-ink-950/85 to-ink-950/15 sm:block"
          />
        </div>

        <div className="flex flex-col gap-3 p-4 sm:absolute sm:inset-0 sm:max-w-xl sm:justify-center sm:p-8 xl:max-w-2xl xl:p-10">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Destacado
          </span>

          <h2 className="line-clamp-3 text-xl leading-tight font-semibold tracking-tight text-mist-100 sm:text-3xl xl:text-4xl">
            {video.title}
          </h2>

          <p className="hidden max-w-xl text-sm leading-relaxed text-mist-400 sm:line-clamp-2">
            {video.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mist-400">
            {video.channelTitle !== undefined && (
              <span className="font-medium text-mist-300">
                {video.channelTitle}
              </span>
            )}
            <span aria-hidden="true">·</span>
            <span>{formatRelativeDate(video.publishedAt)}</span>
            <span aria-hidden="true">·</span>
            <span>{formatViews(video.viewCount)}</span>
            {duration !== "" && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{duration}</span>
              </>
            )}
          </div>

          <span className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-gold-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors group-hover:bg-gold-400">
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            Ver vídeo
          </span>
        </div>
      </div>
    </Link>
  );
}
