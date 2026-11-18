import type { IVideo } from "~/types";

export interface VideoFilters {
  searchTerm: string;
  selectedTags: string[];
  selectedChannels: string[];
}

/**
 * Shared filter predicate used by the video grid pages.
 *
 * Search matches the title, tags and channels are OR-ed within their own group
 * and the three groups are AND-ed together.
 */
export function matchesVideoFilters(
  video: IVideo,
  { searchTerm, selectedTags, selectedChannels }: VideoFilters,
): boolean {
  const matchesSearch = video.title
    .toLowerCase()
    .includes(searchTerm.toLowerCase());

  const matchesTags =
    selectedTags.length === 0 ||
    selectedTags.some((tag) => video.tags.includes(tag));

  const matchesChannels =
    selectedChannels.length === 0 ||
    (!!video.channelTitle && selectedChannels.includes(video.channelTitle));

  return matchesSearch && matchesTags && matchesChannels;
}
