import type { Collection, IVideo } from "~/types";

import videosData from "~/videos.json";
import collectionsData from "~/collections.json";

/**
 * Single entry point for the generated catalog.
 *
 * Both JSON files are produced by `be/update_videos.py` and bundled statically,
 * so every page can import from here instead of parsing the data itself.
 */
export const videos = videosData as IVideo[];
export const collections = collectionsData as Collection[];

export const videosById = new Map<string, IVideo>(
  videos.map((video) => [video.videoId, video]),
);

export const collectionsById = new Map<string, Collection>(
  collections.map((collection) => [collection.playlistId, collection]),
);

/**
 * Resolve a collection's ordered video IDs to full video objects.
 *
 * The pipeline only keeps IDs that survived its filters, but the lookup is
 * defensive so a stale `collections.json` can never crash the page.
 */
export function getCollectionVideos(collection: Collection): IVideo[] {
  return collection.videoIds
    .map((videoId) => videosById.get(videoId))
    .filter((video): video is IVideo => video !== undefined);
}

/** Most recent video in a collection, used to order the collections index. */
export function getCollectionLatestDate(collection: Collection): number {
  return collection.videoIds.reduce((latest, videoId) => {
    const publishedAt = videosById.get(videoId)?.publishedAt;
    if (!publishedAt) {
      return latest;
    }

    return Math.max(latest, new Date(publishedAt).getTime());
  }, 0);
}
