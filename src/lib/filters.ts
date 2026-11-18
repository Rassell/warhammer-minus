import type { IVideo } from "~/types";

import { categoryMatchesVideo } from "./categories";
import { parseIsoDuration } from "./format";

export type VideoSort = "recent" | "oldest" | "popular" | "duration";

export const SORT_OPTIONS: ReadonlyArray<{ value: VideoSort; label: string }> = [
  { value: "recent", label: "Más recientes" },
  { value: "popular", label: "Más vistos" },
  { value: "duration", label: "Mayor duración" },
  { value: "oldest", label: "Más antiguos" },
];

export interface VideoFilters {
  searchTerm: string;
  selectedTags: string[];
  selectedChannels: string[];
  selectedCategories: string[];
}

/**
 * Shared filter predicate used by every video grid.
 *
 * Search matches the title, channel and tags; the three facet groups are OR-ed
 * within themselves and AND-ed together.
 */
export function matchesVideoFilters(
  video: IVideo,
  {
    searchTerm,
    selectedTags,
    selectedChannels,
    selectedCategories,
  }: VideoFilters,
): boolean {
  const needle = searchTerm.trim().toLowerCase();

  const matchesSearch =
    needle === "" ||
    video.title.toLowerCase().includes(needle) ||
    (video.channelTitle ?? "").toLowerCase().includes(needle) ||
    video.tags.some((tag) => tag.toLowerCase().includes(needle));

  const matchesTags =
    selectedTags.length === 0 ||
    selectedTags.some((tag) => video.tags.includes(tag));

  const matchesChannels =
    selectedChannels.length === 0 ||
    (!!video.channelTitle && selectedChannels.includes(video.channelTitle));

  const matchesCategories =
    selectedCategories.length === 0 ||
    selectedCategories.some((slug) => categoryMatchesVideo(video, slug));

  return matchesSearch && matchesTags && matchesChannels && matchesCategories;
}

function timestamp(iso: string): number {
  const value = new Date(iso).getTime();
  return Number.isNaN(value) ? 0 : value;
}

/** Sort a filtered list without mutating the input. */
export function sortVideos(videos: readonly IVideo[], sort: VideoSort): IVideo[] {
  const sorted = [...videos];

  switch (sort) {
    case "oldest":
      return sorted.sort(
        (a, b) => timestamp(a.publishedAt) - timestamp(b.publishedAt),
      );
    case "popular":
      return sorted.sort(
        (a, b) =>
          b.viewCount - a.viewCount ||
          timestamp(b.publishedAt) - timestamp(a.publishedAt),
      );
    case "duration":
      return sorted.sort(
        (a, b) =>
          parseIsoDuration(b.duration) - parseIsoDuration(a.duration) ||
          timestamp(b.publishedAt) - timestamp(a.publishedAt),
      );
    case "recent":
    default:
      return sorted.sort(
        (a, b) => timestamp(b.publishedAt) - timestamp(a.publishedAt),
      );
  }
}
