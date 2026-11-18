import type { IVideo } from "~/types";

import VideoRow from "./VideoRow";

export default function RelatedVideos({ videos }: { videos: IVideo[] }) {
  if (videos.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="related-heading" className="space-y-3">
      <h2
        id="related-heading"
        className="text-sm font-semibold text-mist-100"
      >
        Vídeos relacionados
      </h2>

      <div className="space-y-3">
        {videos.map((video) => (
          <VideoRow key={video.videoId} video={video} />
        ))}
      </div>
    </section>
  );
}
