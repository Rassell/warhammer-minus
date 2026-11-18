import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { VideoSort } from "~/lib/filters";

interface FiltersContextValue {
  selectedTags: string[];
  selectedChannels: string[];
  selectedCategories: string[];
  sort: VideoSort;
  /** Number of active facet selections, shown as a badge in the filter bar. */
  activeFilterCount: number;
  setSelectedTags: (tags: string[]) => void;
  setSelectedChannels: (channels: string[]) => void;
  setSelectedCategories: (categories: string[]) => void;
  setSort: (sort: VideoSort) => void;
  toggleTag: (tag: string) => void;
  toggleChannel: (channel: string) => void;
  toggleCategory: (slug: string) => void;
  clearFilters: () => void;
}

const FiltersContext = createContext<FiltersContextValue>({
  selectedTags: [],
  selectedChannels: [],
  selectedCategories: [],
  sort: "recent",
  activeFilterCount: 0,
  setSelectedTags: () => {},
  setSelectedChannels: () => {},
  setSelectedCategories: () => {},
  setSort: () => {},
  toggleTag: () => {},
  toggleChannel: () => {},
  toggleCategory: () => {},
  clearFilters: () => {},
});

const Provider = FiltersContext.Provider;

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function useFilters() {
  return useContext(FiltersContext);
}

/**
 * Global filter state.
 *
 * The sidebar filters were already shared across routes, so the new category
 * chips and the sort order join the same provider: a selection made on Home is
 * still applied on the Vídeos page.
 */
export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sort, setSort] = useState<VideoSort>("recent");

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((current) => toggleValue(current, tag));
  }, []);

  const toggleChannel = useCallback((channel: string) => {
    setSelectedChannels((current) => toggleValue(current, channel));
  }, []);

  const toggleCategory = useCallback((slug: string) => {
    setSelectedCategories((current) => toggleValue(current, slug));
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedTags([]);
    setSelectedChannels([]);
    setSelectedCategories([]);
  }, []);

  const activeFilterCount =
    selectedTags.length + selectedChannels.length + selectedCategories.length;

  const value = useMemo<FiltersContextValue>(
    () => ({
      selectedTags,
      selectedChannels,
      selectedCategories,
      sort,
      activeFilterCount,
      setSelectedTags,
      setSelectedChannels,
      setSelectedCategories,
      setSort,
      toggleTag,
      toggleChannel,
      toggleCategory,
      clearFilters,
    }),
    [
      selectedTags,
      selectedChannels,
      selectedCategories,
      sort,
      activeFilterCount,
      toggleTag,
      toggleChannel,
      toggleCategory,
      clearFilters,
    ],
  );

  return <Provider value={value}>{children}</Provider>;
}
