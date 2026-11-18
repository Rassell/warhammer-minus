import { Compass, Film, Home, ListVideo, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router";

import { cn } from "~/lib/cn";

interface MobileNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const ITEMS: MobileNavItem[] = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/explore", label: "Explorar", icon: Compass },
  { to: "/videos", label: "Vídeos", icon: Film },
  { to: "/authors", label: "Autores", icon: Users },
  { to: "/collections", label: "Colecciones", icon: ListVideo },
];

/** YouTube-style bottom tab bar, only on small screens. */
export default function MobileNav() {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-800 bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
                    isActive ? "text-gold-400" : "text-mist-500",
                  )
                }
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
