import { useRef } from "react";

import { cn } from "~/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  /** Prefix for the generated `id`s, so the panel can reference the tabs. */
  idPrefix: string;
  /** Accessible name of the tab list. */
  label: string;
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * Underlined tab bar.
 *
 * Controlled and URL-agnostic: the caller owns the selected value, so the same
 * component works with query params or local state. Arrow keys, Home and End
 * move the selection, as expected from an ARIA tab list.
 */
export default function Tabs({
  idPrefix,
  label,
  items,
  value,
  onChange,
  className,
}: TabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const select = (id: string) => {
    onChange(id);
    refs.current[id]?.focus();
  };

  const selectIndex = (index: number) => {
    const item = items[index];
    if (item !== undefined) {
      select(item.id);
    }
  };

  const move = (index: number, direction: number) => {
    selectIndex((index + direction + items.length) % items.length);
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "no-scrollbar flex gap-1 overflow-x-auto border-b border-ink-800",
        className,
      )}
    >
      {items.map((item, index) => {
        const active = item.id === value;

        return (
          <button
            key={item.id}
            ref={(node) => {
              refs.current[item.id] = node;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${item.id}`}
            aria-selected={active}
            aria-controls={`${idPrefix}-panel-${item.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => {
              onChange(item.id);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                move(index, 1);
              } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                move(index, -1);
              } else if (event.key === "Home") {
                event.preventDefault();
                selectIndex(0);
              } else if (event.key === "End") {
                event.preventDefault();
                selectIndex(items.length - 1);
              }
            }}
            className={cn(
              "-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-gold-500 text-mist-100"
                : "border-transparent text-mist-500 hover:border-ink-600 hover:text-mist-200",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] tabular-nums",
                  active
                    ? "bg-gold-500/15 text-gold-300"
                    : "bg-ink-800 text-mist-500",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
