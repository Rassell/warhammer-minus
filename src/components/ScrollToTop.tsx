import { useEffect } from "react";
import { useLocation } from "react-router";

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  // Only the search query resets the scroll position: view toggles such as
  // `?tab=colecciones` keep the reader where they are.
  const query = new URLSearchParams(search).get("q") ?? "";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, query]);

  return null;
}
