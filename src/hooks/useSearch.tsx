import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";

/**
 * URL-driven search.
 *
 * The query lives in `?q=` so results are shareable and the header input can be
 * kept in sync with the address bar. No provider is needed anymore.
 */
export function useSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get("q")?.trim() ?? "";

  const submitSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (trimmed === "") {
        void navigate("/search");
        return;
      }

      void navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    },
    [navigate],
  );

  return { query, submitSearch };
}
