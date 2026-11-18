import { useEffect } from "react";
import {
  Compass,
  Film,
  Home,
  ListVideo,
  Tags,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, NavLink } from "react-router";

import { useSidebar } from "~/hooks/useSidebar";
import { collections } from "~/lib/catalog";
import { cn } from "~/lib/cn";

import BrandMark from "./BrandMark";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const PRIMARY_NAV: NavItem[] = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/explore", label: "Explorar", icon: Compass },
  { to: "/videos", label: "Vídeos", icon: Film },
];

const LIBRARY_NAV: NavItem[] = [
  { to: "/authors", label: "Autores", icon: Users },
  { to: "/collections", label: "Colecciones", icon: ListVideo },
  { to: "/categories", label: "Categorías", icon: Tags },
];

function SidebarLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-ink-800 text-gold-300"
            : "text-mist-400 hover:bg-ink-900 hover:text-mist-100",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gold-500"
            />
          )}
          <Icon
            className={cn(
              "h-5 w-5 shrink-0",
              isActive
                ? "text-gold-400"
                : "text-mist-500 group-hover:text-mist-300",
            )}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

function SidebarBrand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      to="/"
      onClick={onNavigate}
      className="flex items-center gap-2 rounded-lg"
    >
      <BrandMark />
      <span className="font-semibold tracking-tight text-mist-100">
        Warhammer <span className="text-gold-500">Minus</span>
      </span>
    </Link>
  );
}

export default function Sidebar() {
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebar();

  // Lock the page behind the mobile drawer and allow closing it with Escape.
  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileOpen, closeMobile]);

  return (
    <>
      <aside
        aria-label="Navegación lateral"
        className={cn(
          "fixed top-14 left-0 z-40 hidden h-[calc(100vh-3.5rem)] flex-col border-r border-ink-800 bg-ink-950 lg:flex",
          isCollapsed ? "w-[76px]" : "w-60",
        )}
      >
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-0.5">
            {PRIMARY_NAV.map((item) => (
              <SidebarLink
                key={item.to}
                item={item}
                collapsed={isCollapsed}
              />
            ))}
          </div>

          {isCollapsed ? (
            <div className="my-3 border-t border-ink-800" />
          ) : (
            <p className="px-3 pt-5 pb-2 text-[11px] font-semibold tracking-widest text-mist-600 uppercase">
              Biblioteca
            </p>
          )}

          <div className="space-y-0.5">
            {LIBRARY_NAV.map((item) => (
              <SidebarLink
                key={item.to}
                item={item}
                collapsed={isCollapsed}
              />
            ))}
          </div>
        </nav>

        {!isCollapsed && (
          <div className="border-t border-ink-800 px-4 py-3 text-[11px] leading-relaxed text-mist-600">
            {collections.length} colecciones · Tutoriales recopilados de YouTube
          </div>
        )}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={closeMobile}
            aria-hidden="true"
          />

          <aside
            aria-label="Menú de navegación"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-ink-800 bg-ink-950 shadow-2xl"
          >
            <div className="flex h-14 items-center justify-between border-b border-ink-800 px-4">
              <SidebarBrand onNavigate={closeMobile} />
              <button
                type="button"
                onClick={closeMobile}
                aria-label="Cerrar menú"
                className="grid h-9 w-9 place-items-center rounded-full text-mist-400 transition-colors hover:bg-ink-800 hover:text-mist-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3">
              <div className="space-y-0.5">
                {PRIMARY_NAV.map((item) => (
                  <SidebarLink
                    key={item.to}
                    item={item}
                    collapsed={false}
                    onNavigate={closeMobile}
                  />
                ))}
              </div>

              <p className="px-3 pt-5 pb-2 text-[11px] font-semibold tracking-widest text-mist-600 uppercase">
                Biblioteca
              </p>
              <div className="space-y-0.5">
                {LIBRARY_NAV.map((item) => (
                  <SidebarLink
                    key={item.to}
                    item={item}
                    collapsed={false}
                    onNavigate={closeMobile}
                  />
                ))}
              </div>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
