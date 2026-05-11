import { createContext, useContext, useState } from "react";

const SidebarContext = createContext({
  isSidebarOpen: false,
  toggleSidebar: () => {},
  setSidebarOpen: (open: boolean) => {},
});
const Provider = SidebarContext.Provider;

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <Provider
      value={{
        isSidebarOpen,
        toggleSidebar,
        setSidebarOpen,
      }}
    >
      {children}
    </Provider>
  );
}
