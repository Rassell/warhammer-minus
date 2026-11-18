import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { useSearch } from "~/hooks/useSearch";
import { cn } from "~/lib/cn";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

interface SearchBarProps {
  className?: string;
  autoFocus?: boolean;
}

/**
 * Header search field.
 *
 * Submits to `/search?q=`, keeps its value in sync with the URL and can be
 * focused from anywhere with the `/` shortcut.
 */
export default function SearchBar({
  className,
  autoFocus = false,
}: SearchBarProps) {
  const { query, submitSearch } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<{ query: string; value: string } | null>(
    null,
  );

  // The URL is the source of truth. A draft is only kept while it belongs to
  // the current query, so back/forward navigation updates the field without a
  // synchronising effect.
  const value = draft !== null && draft.query === query ? draft.value : query;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !isTypingTarget(event.target)) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch(value);
        setDraft(null);
      }}
      className={cn("relative w-full max-w-xl", className)}
    >
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mist-500"
        aria-hidden="true"
      />

      <input
        ref={inputRef}
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => {
          setDraft({ query, value: event.target.value });
        }}
        placeholder="Buscar en el catálogo"
        aria-label="Buscar en Warhammer Minus"
        className="h-10 w-full rounded-full border border-ink-600 bg-ink-900 pr-10 pl-9 text-sm text-mist-100 transition-colors placeholder:text-mist-500 hover:border-ink-500 focus:border-gold-500/70 focus:bg-ink-850 focus:outline-none sm:pr-16 [&::-webkit-search-cancel-button]:appearance-none"
      />

      {value === "" ? (
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-ink-600 px-1.5 py-0.5 text-[10px] font-medium text-mist-500 sm:block"
        >
          /
        </kbd>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft({ query, value: "" });
            inputRef.current?.focus();
          }}
          aria-label="Borrar búsqueda"
          className="absolute top-1/2 right-2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-mist-500 transition-colors hover:bg-ink-800 hover:text-mist-200"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
