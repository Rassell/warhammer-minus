import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

import { cn } from "~/lib/cn";

interface SectionHeaderProps {
  id?: string;
  title: string;
  subtitle?: string;
  to?: string;
  linkLabel?: string;
  className?: string;
}

/** Consistent heading + "see all" row used by every content section. */
export default function SectionHeader({
  id,
  title,
  subtitle,
  to,
  linkLabel = "Ver todo",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1",
        className,
      )}
    >
      <div>
        <h2
          id={id}
          className="text-lg font-semibold tracking-tight text-mist-100 sm:text-xl"
        >
          {title}
        </h2>
        {subtitle !== undefined && (
          <p className="mt-0.5 text-sm text-mist-500">{subtitle}</p>
        )}
      </div>

      {to !== undefined && (
        <Link
          to={to}
          className="group inline-flex items-center gap-1 rounded text-sm font-medium text-mist-400 transition-colors hover:text-gold-300"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
