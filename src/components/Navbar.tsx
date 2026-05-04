import { Search, Mic, Video, Bell, User } from "lucide-react";

interface NavbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function Navbar({ searchTerm, setSearchTerm }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-zinc-900 border-b border-zinc-800 z-50">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo + Menú */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-zinc-800 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="font-bold text-xl tracking-tighter">
            Warhammer Minus
          </span>
        </div>

        {/* Buscador */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative group">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar videos..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-full py-2 pl-5 pr-12 focus:outline-none focus:border-blue-500"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
              <Search size={20} />
            </button>
          </div>
        </div>

        {/* Iconos derecha */}
        <div className="flex items-center gap-2"></div>
      </div>
    </nav>
  );
}
