import { createContext, useCallback, useContext, useState } from "react";

const COLLAPSED_STORAGE_KEY = "warhammer-minus:sidebar-collapsed";

interface SidebarContextValue {
  /** Desktop rail collapsed to icons only. */
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  /** Mobile drawer state (the drawer is always expanded). */
  isMobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isCollapsed: false,
  toggleCollapsed: () => {},
  isMobileOpen: false,
  openMobile: () => {},
  closeMobile: () => {},
});

const Provider = SidebarContext.Provider;

function readCollapsedPreference(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setCollapsed] = useState<boolean>(readCollapsedPreference);
  const [isMobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      } catch {
        // Storage can be unavailable (private mode); the state still works.
      }
      return next;
    });
  }, []);

  const openMobile = useCallback(() => {
    setMobileOpen(true);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <Provider
      value={{
        isCollapsed,
        toggleCollapsed,
        isMobileOpen,
        openMobile,
        closeMobile,
      }}
    >
      {children}
    </Provider>
  );
}
