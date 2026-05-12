import { createContext, useContext, useState } from "react";
import { useSearchParams } from "react-router";

const SearchContext = createContext({
  searchTerm: "",
  setSearchTerm: (_term: string) => {},
});
const Provider = SearchContext.Provider;

export function useSearch() {
  return useContext(SearchContext);
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchParams] = useSearchParams();
  const initialSearchTerm = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  return (
    <Provider
      value={{
        searchTerm,
        setSearchTerm,
      }}
    >
      {children}
    </Provider>
  );
}
