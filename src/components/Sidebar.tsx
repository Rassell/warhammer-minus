import { useMemo } from "react";

import { useSidebar } from "~/hooks/useSidebar";

import videos from "../videos.json";

interface SidebarProps {
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
}

export default function Sidebar({
  selectedTags,
  setSelectedTags,
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

    return Array.from(uniqueTags).sort((a, b) => {
      const aSelected = selectedTags.includes(a);
      const bSelected = selectedTags.includes(b);

      // Selected tags come first
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;

      // Within each group, sort alphabetically
      return a.localeCompare(b);
    });
  }, [selectedTags]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }

    // Close sidebar on mobile after selecting a tag
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside
      className={`fixed top-14 z-40 h-[calc(100vh-56px)] w-64 overflow-y-auto border-r border-zinc-800 bg-zinc-950 p-4 transition-transform duration-300 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
    >
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
    </aside>
  );
}
