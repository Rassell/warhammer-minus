import { useMemo } from "react";

import { useSidebar } from "~/hooks/useSidebar";

import type { IVideo } from "~/types";

import videos from "../videos.json";

interface SidebarProps {
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  selectedChannels: string[];
  setSelectedChannels: (channels: string[]) => void;
}

export default function Sidebar({
  selectedTags,
  setSelectedTags,
  selectedChannels,
  setSelectedChannels,
}: SidebarProps) {
  const { isSidebarOpen, setSidebarOpen } = useSidebar();

  const tags = useMemo(() => {
    // Get all unique tags from the videos
    const uniqueTags = new Set<string>();
    videos.forEach((video) => {
      video.tags.forEach((tag) => {
        uniqueTags.add(tag);
      });
    });

    return Array.from(uniqueTags).sort((a, b) => a.localeCompare(b));
  }, []);

  const channels = useMemo(() => {
    // Get unique channel names with their video counts
    const counts = new Map<string, number>();
    (videos as IVideo[]).forEach((video) => {
      if (!video.channelTitle) return;
      counts.set(video.channelTitle, (counts.get(video.channelTitle) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, []);

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }

    // Close sidebar on mobile after selecting a tag
    closeSidebarOnMobile();
  };

  const toggleChannel = (channel: string) => {
    if (selectedChannels.includes(channel)) {
      setSelectedChannels(selectedChannels.filter((c) => c !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }

    // Close sidebar on mobile after selecting a channel
    closeSidebarOnMobile();
  };

  return (
    <aside
      className={`fixed top-14 z-40 h-[calc(100vh-56px)] w-64 overflow-y-auto border-r border-zinc-800 bg-zinc-950 p-4 transition-transform duration-300 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
    >
      {channels.length > 1 && (
        <>
          <h3 className="mb-3 text-sm font-semibold text-zinc-400">CANALES</h3>
          <div className="mb-6 flex flex-col gap-2">
            {channels.map(({ name, count }) => {
              const isSelected = selectedChannels.includes(name);

              return (
                <button
                  key={name}
                  onClick={() => toggleChannel(name)}
                  aria-pressed={isSelected}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  <span className="truncate">{name}</span>
                  <span
                    className={`shrink-0 text-xs ${
                      isSelected ? "text-blue-100" : "text-zinc-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tags.length > 0 && (
        <>
          <h3 className="mb-3 text-sm font-semibold text-zinc-400">TAGS</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  selectedTags.includes(tag)
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-zinc-700 hover:border-zinc-500"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
