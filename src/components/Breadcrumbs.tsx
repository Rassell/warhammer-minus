import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

/** Small trail used on detail pages to keep the hierarchy visible. */
export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Migas de pan" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-mist-500">
        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <li aria-hidden="true" className="text-mist-600">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
            )}
            <li className="min-w-0">
              {item.to !== undefined ? (
                <Link
                  to={item.to}
                  className="rounded transition-colors hover:text-mist-200"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="block max-w-[65vw] truncate text-mist-300"
                  aria-current="page"
                >
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
