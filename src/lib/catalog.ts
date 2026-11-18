import type { Author, Category, Collection, IVideo } from "~/types";

import videosData from "~/videos.json";
import collectionsData from "~/collections.json";

import { buildAuthors } from "./authors";
import { buildCategories } from "./categories";
import { parseIsoDuration } from "./format";

/**
 * Single entry point for the generated catalog.
 *
 * Both JSON files are produced by `be/update_videos.py` and bundled statically,
 * so every page imports from here instead of parsing the data itself.
 */
export const videos = videosData as IVideo[];
export const collections = collectionsData as Collection[];

export const videosById = new Map<string, IVideo>(
  videos.map((video) => [video.videoId, video]),
);

export const collectionsById = new Map<string, Collection>(
  collections.map((collection) => [collection.playlistId, collection]),
);

function timestamp(iso: string): number {
  const value = new Date(iso).getTime();
  return Number.isNaN(value) ? 0 : value;
}

/** Newest upload first; the base order for every "recent" section. */
export const videosNewestFirst: IVideo[] = [...videos].sort(
  (a, b) => timestamp(b.publishedAt) - timestamp(a.publishedAt),
);

/** Authors derived from the channel fields of the videos. */
export const authors: Author[] = buildAuthors(videos, collections);

export const authorsById = new Map<string, Author>(
  authors.map((author) => [author.id, author]),
);

export const authorIdByChannelId = new Map<string, string>(
  authors
    .filter((author) => author.channelId !== undefined)
    .map((author) => [author.channelId as string, author.id]),
);

/** Curated thematic taxonomy over the manual tags. */
export const categories: Category[] = buildCategories(videos);

export const categoriesBySlug = new Map<string, Category>(
  categories.map((category) => [category.slug, category]),
);

/** Tag facets for the filter panel, most used first. */
export const tagsWithCounts: Array<{ tag: string; count: number }> = (() => {
  const counts = new Map<string, number>();

  for (const video of videos) {
    for (const tag of video.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
})();

/** Author facets for the filter panel. */
export const authorsWithCounts = authors.map((author) => ({
  id: author.id,
  name: author.name,
  count: author.videoCount,
}));

/**
 * First collection that contains a video, if any.
 *
 * A video can appear in several playlists; the first one in `collections.json`
 * is used for the "part of this collection" card.
 */
export const collectionByVideoId = new Map<string, Collection>();
for (const collection of collections) {
  for (const videoId of collection.videoIds) {
    if (!collectionByVideoId.has(videoId)) {
      collectionByVideoId.set(videoId, collection);
    }
  }
}

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

    return Math.max(latest, timestamp(publishedAt));
  }, 0);
}

/** Sum of the durations of the videos available in the catalog. */
export function getCollectionTotalDuration(collection: Collection): number {
  return getCollectionVideos(collection).reduce(
    (total, video) => total + parseIsoDuration(video.duration),
    0,
  );
}

export function getAuthorVideos(author: Author): IVideo[] {
  return author.videoIds
    .map((videoId) => videosById.get(videoId))
    .filter((video): video is IVideo => video !== undefined);
}

export function getAuthorCollections(author: Author): Collection[] {
  return author.collectionIds
    .map((playlistId) => collectionsById.get(playlistId))
    .filter((collection): collection is Collection => collection !== undefined);
}

export function getVideoCollection(videoId: string): Collection | undefined {
  return collectionByVideoId.get(videoId);
}

export function getCategoryVideos(category: Category): IVideo[] {
  const tags = new Set(category.tags);
  return videosNewestFirst.filter((video) =>
    video.tags.some((tag) => tags.has(tag)),
  );
}

export function getRecentVideos(limit: number): IVideo[] {
  return videosNewestFirst.slice(0, limit);
}

export function getPopularVideos(limit: number): IVideo[] {
  return [...videos]
    .sort(
      (a, b) =>
        b.viewCount - a.viewCount ||
        timestamp(b.publishedAt) - timestamp(a.publishedAt),
    )
    .slice(0, limit);
}

export function getFeaturedCollections(limit: number): Collection[] {
  return [...collections]
    .sort((a, b) => getCollectionLatestDate(b) - getCollectionLatestDate(a))
    .slice(0, limit);
}

/**
 * Hero video: the most viewed upload among the 25 most recent ones, so the
 * featured slot stays fresh without being driven by a single outlier.
 */
export function getFeaturedVideo(): IVideo | undefined {
  const pool = videosNewestFirst.slice(0, 25);

  return pool.reduce<IVideo | undefined>((best, video) => {
    if (best === undefined || video.viewCount > best.viewCount) {
      return video;
    }

    return best;
  }, undefined);
}

/**
 * Related videos: shared tags first, then same channel, then recency. If the
 * scored list is short, it is padded with the most recent uploads.
 */
export function getRelatedVideos(video: IVideo, limit = 8): IVideo[] {
  const tags = new Set(video.tags);
  const scored: Array<{ video: IVideo; score: number }> = [];

  for (const candidate of videos) {
    if (candidate.videoId === video.videoId) {
      continue;
    }

    let score = 0;
    for (const tag of candidate.tags) {
      if (tags.has(tag)) {
        score += 3;
      }
    }
    if (video.channelId !== undefined && candidate.channelId === video.channelId) {
      score += 2;
    }

    if (score > 0) {
      scored.push({ video: candidate, score });
    }
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      timestamp(b.video.publishedAt) - timestamp(a.video.publishedAt),
  );

  const related = scored.slice(0, limit).map((entry) => entry.video);

  if (related.length < limit) {
    const seen = new Set(related.map((entry) => entry.videoId));
    seen.add(video.videoId);

    for (const candidate of videosNewestFirst) {
      if (related.length >= limit) {
        break;
      }
      if (seen.has(candidate.videoId)) {
        continue;
      }

      seen.add(candidate.videoId);
      related.push(candidate);
    }
  }

  return related;
}

/** Total runtime of the whole catalog, shown in the home stats strip. */
export const totalCatalogDurationSeconds = videos.reduce(
  (total, video) => total + parseIsoDuration(video.duration),
  0,
);
