import { Suspense } from "react";
import { Outlet } from "react-router";

import { FiltersProvider } from "~/hooks/useFilters";
import { SidebarProvider, useSidebar } from "~/hooks/useSidebar";
import { cn } from "~/lib/cn";

import Footer from "./Footer";
import Header from "./Header";
import MobileNav from "./MobileNav";
import PageLoader from "./PageLoader";
import ScrollToTop from "./ScrollToTop";
import Sidebar from "./Sidebar";

function AppShell() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-ink-950 text-mist-100">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-gold-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-950"
      >
        Saltar al contenido
      </a>

      <Header />
      <Sidebar />

      <div
        className={cn(
          "flex min-h-[calc(100vh-3.5rem)] flex-col pt-14 transition-[padding] duration-200",
          isCollapsed ? "lg:pl-[76px]" : "lg:pl-60",
        )}
      >
        <ScrollToTop />

        <main
          id="contenido"
          className="mx-auto w-full max-w-[1600px] flex-1 px-4 pt-6 pb-24 sm:px-6 lg:px-8 lg:pb-16"
        >
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>

        <Footer />
      </div>

      <MobileNav />
    </div>
  );
}

/**
 * Application shell.
 *
 * Owns the persistent chrome (header, collapsible sidebar, mobile tabs, footer)
 * and the global filter state. Pages only render their own content, so the
 * per-route `lg:ml-64` offsets of the previous layout are gone.
 */
export default function AppLayout() {
  return (
    <SidebarProvider>
      <FiltersProvider>
        <AppShell />
      </FiltersProvider>
    </SidebarProvider>
  );
}
