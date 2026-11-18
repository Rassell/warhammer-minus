import type { Author, Collection, IVideo } from "~/types";

import { authors, collections, videos } from "./catalog";

export interface SearchResults {
  query: string;
  videos: IVideo[];
  authors: Author[];
  collections: Collection[];
  total: number;
}

/** Accent-insensitive, case-insensitive normalisation for matching. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function scoreVideo(video: IVideo, needle: string): number {
  const title = normalize(video.title);
  const channel = normalize(video.channelTitle ?? "");
  const tags = video.tags.map(normalize);
  const description = normalize(video.description);

  let score = 0;

  if (title.startsWith(needle)) {
    score += 6;
  } else if (title.includes(needle)) {
    score += 4;
  }

  if (tags.some((tag) => tag === needle)) {
    score += 4;
  } else if (tags.some((tag) => tag.includes(needle))) {
    score += 3;
  }

  if (channel.includes(needle)) {
    score += 2;
  }

  if (description.includes(needle)) {
    score += 1;
  }

  return score;
}

function scoreAuthor(author: Author, needle: string): number {
  const name = normalize(author.name);
  const description = normalize(author.description);

  if (name === needle) {
    return 10;
  }

  if (name.startsWith(needle)) {
    return 7;
  }

  if (name.includes(needle)) {
    return 5;
  }

  if (description.includes(needle)) {
    return 1;
  }

  return 0;
}

function scoreCollection(collection: Collection, needle: string): number {
  const title = normalize(collection.title);
  const channel = normalize(collection.channelTitle);
  const description = normalize(collection.description);

  if (title === needle) {
    return 10;
  }

  if (title.startsWith(needle)) {
    return 7;
  }

  if (title.includes(needle)) {
    return 5;
  }

  if (channel.includes(needle)) {
    return 2;
  }

  if (description.includes(needle)) {
    return 1;
  }

  return 0;
}

/**
 * Search videos, authors and collections in one pass.
 *
 * The catalog is static and small enough (hundreds of entries) to scan on every
 * keystroke-free submit, so no index is needed.
 */
export function searchCatalog(query: string): SearchResults {
  const needle = normalize(query);

  if (needle === "") {
    return { query, videos: [], authors: [], collections: [], total: 0 };
  }

  const matchedVideos = videos
    .map((video) => ({ video, score: scoreVideo(video, needle) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.video.publishedAt).getTime() -
          new Date(a.video.publishedAt).getTime(),
    )
    .slice(0, 60)
    .map((entry) => entry.video);

  const matchedAuthors = authors
    .map((author) => ({ author, score: scoreAuthor(author, needle) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.author.videoCount - a.author.videoCount)
    .slice(0, 12)
    .map((entry) => entry.author);

  const matchedCollections = collections
    .map((collection) => ({
      collection,
      score: scoreCollection(collection, needle),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 24)
    .map((entry) => entry.collection);

  return {
    query,
    videos: matchedVideos,
    authors: matchedAuthors,
    collections: matchedCollections,
    total:
      matchedVideos.length + matchedAuthors.length + matchedCollections.length,
  };
}
