import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

import { pluralize } from "~/lib/format";
import type { Category } from "~/types";

import CategoryIcon from "./CategoryIcon";

interface CategoryCardProps {
  category: Category;
  /** Hide the description on dense layouts. */
  compact?: boolean;
}

export default function CategoryCard({
  category,
  compact = false,
}: CategoryCardProps) {
  return (
    <Link
      to={`/categories/${category.slug}`}
      className="group flex h-full items-start gap-4 rounded-xl border border-ink-700/60 bg-ink-900/60 p-4 transition-colors hover:border-ink-600 hover:bg-ink-900"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-ink-800 text-gold-400 ring-1 ring-ink-700 ring-inset">
        <CategoryIcon icon={category.icon} className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-mist-100 transition-colors group-hover:text-gold-300">
          {category.name}
        </h3>

        {!compact && (
          <p className="mt-0.5 line-clamp-2 text-xs text-mist-500">
            {category.description}
          </p>
        )}

        <p className="mt-2 text-[11px] font-medium text-mist-600">
          {pluralize(category.videoCount, "vídeo", "vídeos")}
        </p>
      </div>

      <ChevronRight
        className="mt-1 h-4 w-4 shrink-0 text-mist-600 transition-colors group-hover:text-gold-400"
        aria-hidden="true"
      />
    </Link>
  );
}
