import { Search } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { useSearch } from "~/hooks/useSearch";

export default function Navbar() {
  const navigate = useNavigate();
  const { searchTerm, setSearchTerm } = useSearch();

  function search() {
    navigate(`/?q=${encodeURIComponent(searchTerm)}`);
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-zinc-900 border-b border-zinc-800 z-50">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo + Menú */}
        <div className="items-center gap-4 hidden md:flex">
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
          <Link
            to={{ pathname: "/", search: "" }}
            reloadDocument
            className="font-bold text-xl tracking-tighter"
          >
            Warhammer Minus
          </Link>
        </div>

        {/* Buscador */}
        <div className="flex-1 max-w-2xl ml-2">
          <div className="relative group">
            <input
              type="text"
              value={searchTerm}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  search();
                }
              }}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar videos..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-full py-2 pl-5 pr-12 focus:outline-none focus:border-blue-500"
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              onClick={search}
            >
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
