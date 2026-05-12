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
    // with an unique thumbnail for each tag (the first video that has that tag)
    const tagMap: Record<string, string> = {};
    videos.forEach((video) => {
      video.tags.forEach((tag) => {
        if (!tagMap[tag]) {
          tagMap[tag] = video.thumbnail;
        }
      });
    });

    return Object.entries(tagMap).map(([tag, thumbnail]) => ({
      tag,
      thumbnail,
    }));
  }, []);

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
    <aside className={`w-64 fixed top-14 border-r border-zinc-800 h-[calc(100vh-56px)] overflow-y-auto p-4 bg-zinc-950 z-40 transition-transform duration-300 ${
      isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:translate-x-0`}>
      <h3 className="text-sm font-semibold text-zinc-400 mb-3">TAGS</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map(({ tag }) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-4 py-1.5 text-sm rounded-full border transition-colors cursor-pointer ${
              selectedTags.includes(tag)
                ? "bg-blue-600 border-blue-600 text-white"
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
