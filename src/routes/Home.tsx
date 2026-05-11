import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";

import { useSearch } from "~/hooks/useSearch";
import { useSidebar } from "~/hooks/useSidebar";

import VideoGrid from "../components/VideoGrid";
import Sidebar from "../components/Sidebar";

import videos from "../videos.json";

const VIDEOS_PER_PAGE = 16;

export default function Home() {
  const { searchTerm } = useSearch();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(VIDEOS_PER_PAGE);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Filtrado de videos
  const filteredVideos = useMemo(() => {
    return videos
      .filter((video) => {
        const matchesSearch =
          video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (video.description &&
            video.description.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesTags =
          selectedTags.length === 0 ||
          selectedTags.every((tag) => video.tags.includes(tag));

        return matchesSearch && matchesTags;
      })
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
  }, [searchTerm, selectedTags]);

  const visibleVideos = filteredVideos.slice(0, visibleCount);
  const hasMore = visibleCount < filteredVideos.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount((prev) =>
        Math.min(prev + VIDEOS_PER_PAGE, filteredVideos.length),
      );
    }
  }, [hasMore, filteredVideos.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.5 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [loadMore, hasMore]);

  useEffect(() => {
    setVisibleCount(VIDEOS_PER_PAGE);
  }, [searchTerm, selectedTags]);

  return (
    <>
      <Helmet>
        <title>
          Warhammer Minus - Tutoriales de Pintura Warhammer 40k y Age of Sigmar publicados en su canal de youtube
        </title>
        <meta
          name="description"
          content="Colección completa de tutoriales oficiales de pintura Warhammer. Encuentra guías paso a paso para Space Marines, Tyranids, Chaos, Age of Sigmar y más."
        />
        <meta
          name="keywords"
          content="warhammer, warhammer 40k, painting, tutoriales, citadel, space marines, tyranids, age of sigmar, how to paint"
        />

        <meta
          property="og:title"
          content="Warhammer Minus - Tutoriales de Pintura"
        />
        <meta
          property="og:description"
          content="La mejor colección de tutoriales de pintura Warhammer"
        />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <Sidebar selectedTags={selectedTags} setSelectedTags={setSelectedTags} />

      <main className="flex-1 p-4 md:p-6 lg:ml-64">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Warhammer Painting Videos</h1>
          <p className="text-zinc-400">
            Mostrando {visibleVideos.length} de {filteredVideos.length} videos
          </p>
        </div>

        <VideoGrid videos={visibleVideos} />

        {/* Sentinel para Infinite Scroll */}
        {hasMore && (
          <div
            ref={observerTarget}
            className="h-20 flex items-center justify-center mt-8"
          >
            <div className="animate-spin w-6 h-6 border-4 border-zinc-700 border-t-blue-500 rounded-full"></div>
          </div>
        )}

        {!hasMore && filteredVideos.length > 0 && (
          <p className="text-center text-zinc-500 py-12">
            Has visto todos los videos 🎨
          </p>
        )}

        {filteredVideos.length === 0 && (
          <p className="text-center text-zinc-500 py-20 text-xl">
            No se encontraron videos con esos filtros
          </p>
        )}
      </main>
    </>
  );
}
