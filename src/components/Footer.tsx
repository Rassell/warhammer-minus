import { Code2, Play } from "lucide-react";
import { Link } from "react-router";

import { collections, videos, videosNewestFirst } from "~/lib/catalog";
import { formatDate } from "~/lib/format";

const EXPLORE_LINKS = [
  { to: "/", label: "Inicio" },
  { to: "/explore", label: "Explorar" },
  { to: "/videos", label: "Todos los vídeos" },
];

const LIBRARY_LINKS = [
  { to: "/authors", label: "Autores" },
  { to: "/collections", label: "Colecciones" },
  { to: "/categories", label: "Categorías" },
];

export default function Footer() {
  const latestVideo = videosNewestFirst[0];

  return (
    <footer className="border-t border-ink-800 bg-ink-900/40">
      <div className="mx-auto w-full max-w-[1600px] px-4 pt-10 pb-24 sm:px-6 lg:px-8 lg:pb-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 rounded-lg">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold-500 text-ink-950">
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              </span>
              <span className="font-semibold tracking-tight text-mist-100">
                Warhammer <span className="text-gold-500">Minus</span>
              </span>
            </Link>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-mist-500">
              Tutoriales de pintura de Warhammer recopilados de varios canales
              de YouTube. {videos.length} vídeos y {collections.length}{" "}
              colecciones para descubrir, explorar y aprender a pintar.
            </p>

            <a
              href="https://github.com/Rassell/warhammer-minus"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-mist-400 transition-colors hover:text-gold-300"
            >
              <Code2 className="h-4 w-4" aria-hidden="true" />
              Ver el proyecto en GitHub
            </a>
          </div>

          <div>
            <h2 className="text-[11px] font-semibold tracking-widest text-mist-600 uppercase">
              Explorar
            </h2>
            <ul className="mt-3 space-y-2">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="rounded text-sm text-mist-400 transition-colors hover:text-mist-100"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[11px] font-semibold tracking-widest text-mist-600 uppercase">
              Biblioteca
            </h2>
            <ul className="mt-3 space-y-2">
              {LIBRARY_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="rounded text-sm text-mist-400 transition-colors hover:text-mist-100"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-ink-800 pt-6 text-xs text-mist-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Herramienta no oficial hecha por y para la comunidad. No está
            afiliada a Games Workshop ni a YouTube.
          </p>
          {latestVideo !== undefined && (
            <p>Último vídeo añadido: {formatDate(latestVideo.publishedAt)}</p>
          )}
        </div>
      </div>
    </footer>
  );
}
