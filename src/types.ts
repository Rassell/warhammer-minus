export interface Video {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
  url: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  tags: string[];
  /** YouTube channel ID. Present once the multi-channel pipeline has run. */
  channelId?: string;
  /** YouTube channel name. Present once the multi-channel pipeline has run. */
  channelTitle?: string;
}

export type IVideo = Video;
