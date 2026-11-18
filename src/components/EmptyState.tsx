import type { ReactNode } from "react";

import { cn } from "~/lib/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-700 bg-ink-900/40 px-6 py-14 text-center",
        className,
      )}
    >
      {icon !== undefined && (
        <span className="grid h-12 w-12 place-items-center rounded-full bg-ink-800 text-mist-500">
          {icon}
        </span>
      )}

      <div className="space-y-1">
        <h2 className="text-base font-semibold text-mist-100">{title}</h2>
        {description !== undefined && (
          <p className="mx-auto max-w-md text-sm text-mist-500">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}
