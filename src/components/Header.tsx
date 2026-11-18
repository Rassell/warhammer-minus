import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Shuffle,
} from "lucide-react";
import { Link, useNavigate } from "react-router";

import { useSidebar } from "~/hooks/useSidebar";
import { videos } from "~/lib/catalog";

import BrandMark from "./BrandMark";
import SearchBar from "./SearchBar";

export default function Header() {
  const { isCollapsed, toggleCollapsed, openMobile } = useSidebar();
  const navigate = useNavigate();

  const openRandomVideo = () => {
    const video = videos[Math.floor(Math.random() * videos.length)];
    if (video !== undefined) {
      void navigate(`/video/${video.videoId}`);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-ink-800 bg-ink-950/95 backdrop-blur">
      <div className="flex h-full items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={openMobile}
          aria-label="Abrir menú de navegación"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-mist-300 transition-colors hover:bg-ink-800 hover:text-mist-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={
            isCollapsed ? "Expandir menú lateral" : "Contraer menú lateral"
          }
          aria-pressed={isCollapsed}
          className="hidden h-9 w-9 shrink-0 place-items-center rounded-full text-mist-300 transition-colors hover:bg-ink-800 hover:text-mist-100 lg:grid"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>

        <Link
          to="/"
          aria-label="Warhammer Minus, ir al inicio"
          className="flex shrink-0 items-center gap-2 rounded-lg"
        >
          <BrandMark />
          <span className="hidden text-lg font-semibold tracking-tight text-mist-100 sm:block">
            Warhammer <span className="text-gold-500">Minus</span>
          </span>
        </Link>

        <div className="flex min-w-0 flex-1 justify-center px-1 sm:px-4">
          <SearchBar />
        </div>

        <button
          type="button"
          onClick={openRandomVideo}
          aria-label="Ver un vídeo aleatorio"
          title="Vídeo aleatorio"
          className="hidden h-9 w-9 shrink-0 place-items-center rounded-full text-mist-300 transition-colors hover:bg-ink-800 hover:text-gold-300 sm:grid"
        >
          <Shuffle className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
