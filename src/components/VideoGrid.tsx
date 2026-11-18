import { cn } from "~/lib/cn";
import type { IVideo } from "~/types";

import VideoCard from "./VideoCard";

interface VideoGridProps {
  videos: IVideo[];
  className?: string;
  /** Number of cards loaded eagerly (above-the-fold rows). */
  priorityCount?: number;
}

export default function VideoGrid({
  videos,
  className,
  priorityCount = 0,
}: VideoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {videos.map((video, index) => (
        <VideoCard
          key={video.videoId}
          video={video}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}
