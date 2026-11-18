import { useFilters } from "~/hooks/useFilters";
import { categories } from "~/lib/catalog";
import { cn } from "~/lib/cn";

import CategoryIcon from "./CategoryIcon";

const CHIP_BASE =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors";

function chipClass(active: boolean): string {
  return cn(
    CHIP_BASE,
    active
      ? "border-gold-500/60 bg-gold-500/15 text-gold-300"
      : "border-ink-700 bg-ink-900 text-mist-300 hover:border-ink-600 hover:text-mist-100",
  );
}

/**
 * Horizontal category chips.
 *
 * They write to the global filter state, so the selection is shared with the
 * Vídeos page and survives navigation.
 */
export default function CategoryFilter({ className }: { className?: string }) {
  const { selectedCategories, toggleCategory, setSelectedCategories } =
    useFilters();

  return (
    <div
      role="group"
      aria-label="Filtrar por categoría"
      className={cn(
        "no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => {
          setSelectedCategories([]);
        }}
        aria-pressed={selectedCategories.length === 0}
        className={chipClass(selectedCategories.length === 0)}
      >
        Todo
      </button>

      {categories.map((category) => {
        const active = selectedCategories.includes(category.slug);

        return (
          <button
            key={category.slug}
            type="button"
            onClick={() => {
              toggleCategory(category.slug);
            }}
            aria-pressed={active}
            className={chipClass(active)}
          >
            <CategoryIcon icon={category.icon} className="h-4 w-4" />
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
