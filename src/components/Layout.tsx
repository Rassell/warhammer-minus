import { Outlet } from "react-router";

import { SearchProvider } from "~/hooks/useSearch";
import { SidebarProvider } from "~/hooks/useSidebar";

import ScrollToTop from "./ScrollToTop";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <SearchProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-zinc-950 text-white">
          <Navbar />
          <ScrollToTop />
          <div className="flex pt-14">
            <Outlet />
          </div>
        </div>
        <footer className="py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-killteam-steel text-sm">
              Unofficial fan-made tool. Not affiliated with Games Workshop Or
              YouTuBe
            </p>
            <div className="mt-6 flex flex-col items-center gap-1">
              <span className="text-killteam-gold text-sm">
                Created with{" "}
                <span role="img" aria-label="love">
                  ❤️
                </span>{" "}
                for the Warhammer community
              </span>
              <a
                href="https://github.com/Rassell/warhammer-minus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-killteam-steel underline text-xs hover:text-killteam-gold transition"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </footer>
      </SidebarProvider>
    </SearchProvider>
  );
}
