import { createContext, useContext, useState } from "react";

interface FiltersContextValue {
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  selectedChannels: string[];
  setSelectedChannels: (channels: string[]) => void;
  clearFilters: () => void;
}

const FiltersContext = createContext<FiltersContextValue>({
  selectedTags: [],
  setSelectedTags: (_tags: string[]) => {},
  selectedChannels: [],
  setSelectedChannels: (_channels: string[]) => {},
  clearFilters: () => {},
});
const Provider = FiltersContext.Provider;

export function useFilters() {
  return useContext(FiltersContext);
}

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedChannels([]);
  };

  return (
    <Provider
      value={{
        selectedTags,
        setSelectedTags,
        selectedChannels,
        setSelectedChannels,
        clearFilters,
      }}
    >
      {children}
    </Provider>
  );
}
