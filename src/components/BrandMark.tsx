import { Minus } from "lucide-react";

import { cn } from "~/lib/cn";

interface BrandMarkProps {
  className?: string;
}

/**
 * Brand mark: the gold tile with the "minus" glyph from `public/favicon.svg`.
 *
 * Shared by the header, the mobile drawer and the footer so the logo stays
 * identical everywhere and only has to change in one place.
 */
export default function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold-500 text-ink-950",
        className,
      )}
    >
      <Minus className="h-4 w-4" strokeWidth={3} />
    </span>
  );
}
