import { useState } from "react";

import { cn } from "~/lib/cn";
import { formatVideoDuration } from "~/lib/format";
import { fallbackThumbnail } from "~/lib/thumbnails";
import type { IVideo } from "~/types";

interface MediaThumbProps {
  video: IVideo;
  className?: string;
  /** Load eagerly for above-the-fold media (hero, first row). */
  priority?: boolean;
}

/**
 * 16:9 thumbnail with the duration badge and a graceful fallback.
 *
 * `maxresdefault.jpg` is missing for some uploads, so an error swaps to
 * `hqdefault` instead of leaving a broken image.
 */
export default function MediaThumb({
  video,
  className,
  priority = false,
}: MediaThumbProps) {
  const [failed, setFailed] = useState(false);
  const duration = formatVideoDuration(video.duration);
  const src = failed ? fallbackThumbnail(video.thumbnail) : video.thumbnail;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-ink-800",
        className,
      )}
    >
      <img
        src={src}
        alt={video.title}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={() => {
          setFailed(true);
        }}
        className="aspect-video h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />

      {duration !== "" && (
        <span className="absolute right-1.5 bottom-1.5 rounded-md bg-black/85 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
          {duration}
        </span>
      )}
    </div>
  );
}
