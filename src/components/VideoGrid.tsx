import VideoCard from './VideoCard';

export default function VideoGrid({ videos }: { videos: any[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {videos.map(video => (
        <VideoCard key={video.videoId} video={video} />
      ))}
    </div>
  );
}