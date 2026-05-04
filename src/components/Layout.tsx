import { Outlet } from "react-router";

import ScrollToTop from "./ScrollToTop";

export default function Layout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
      <footer className="border-t border-killteam-steel/20 py-8 mt-12">
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
    </>
  );
}
