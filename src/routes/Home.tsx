import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";

import { useSearch } from "~/hooks/useSearch";
import { useSidebar } from "~/hooks/useSidebar";

import VideoGrid from "../components/VideoGrid";
import Sidebar from "../components/Sidebar";

import type { IVideo } from "~/types";

import videos from "../videos.json";

const VIDEOS_PER_PAGE = 16;

export default function Home() {
  const { searchTerm } = useSearch();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(VIDEOS_PER_PAGE);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Filtrado de videos
  const filteredVideos = useMemo(() => {
    return (videos as IVideo[])
      .filter((video) => {
        const matchesSearch = video.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        const matchesTags =
          selectedTags.length === 0 ||
          selectedTags.some((tag) => video.tags.includes(tag));

        const matchesChannels =
          selectedChannels.length === 0 ||
          (!!video.channelTitle &&
            selectedChannels.includes(video.channelTitle));

        return matchesSearch && matchesTags && matchesChannels;
      })
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
  }, [searchTerm, selectedTags, selectedChannels]);

  const visibleVideos = filteredVideos.slice(0, visibleCount);
  const hasMore = visibleCount < filteredVideos.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount((prev) =>
        Math.min(prev + VIDEOS_PER_PAGE, filteredVideos.length)
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
      { threshold: 0.5 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [loadMore, hasMore]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(VIDEOS_PER_PAGE);
  }, [searchTerm, selectedTags, selectedChannels]);

  return (
    <>
      <Helmet>
        <title>
          Warhammer Minus - Tutoriales de Pintura Warhammer 40k y Age of Sigmar
          recopilados de varios canales de YouTube
        </title>
        <meta
          name="description"
          content="Colección de tutoriales de pintura Warhammer recopilados de varios canales de YouTube. Encuentra guías paso a paso para Space Marines, Tyranids, Chaos, Age of Sigmar y más."
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
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <Sidebar
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        selectedChannels={selectedChannels}
        setSelectedChannels={setSelectedChannels}
      />

      <main className="flex-1 p-4 md:p-6 lg:ml-64">
        <div className="mb-6">
          <p className="text-zinc-400">
            {visibleVideos.length} / {filteredVideos.length} videos
            {selectedChannels.length > 0 && ` · ${selectedChannels.join(", ")}`}
          </p>
        </div>

        <VideoGrid videos={visibleVideos} />

        {/* Sentinel para Infinite Scroll */}
        {hasMore && (
          <div
            ref={observerTarget}
            className="mt-8 flex h-20 items-center justify-center"
          >
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500"></div>
          </div>
        )}

        {!hasMore && filteredVideos.length > 0 && (
          <p className="py-12 text-center text-zinc-500">
            Has visto todos los videos 🎨
          </p>
        )}

        {filteredVideos.length === 0 && (
          <p className="py-20 text-center text-xl text-zinc-500">
            No se encontraron videos con esos filtros
          </p>
        )}
      </main>
    </>
  );
}
