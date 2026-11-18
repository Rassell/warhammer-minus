import type { IVideo } from "~/types";

/**
 * Privacy-friendly YouTube embed.
 *
 * `youtube-nocookie.com` avoids setting tracking cookies until playback, and the
 * `rel=0` parameter keeps the end screen limited to the same channel.
 */
export default function VideoPlayer({ video }: { video: IVideo }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-800 bg-black">
      <div className="aspect-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.videoId}?rel=0`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          loading="lazy"
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}
