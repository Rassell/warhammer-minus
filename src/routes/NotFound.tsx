import { Helmet } from "react-helmet-async";
import { SearchX } from "lucide-react";
import { Link } from "react-router";

import EmptyState from "~/components/EmptyState";

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>Página no encontrada - Warhammer Minus</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <EmptyState
        icon={<SearchX className="h-5 w-5" />}
        title="Página no encontrada"
        description="La dirección no existe o el contenido ha cambiado de sitio."
        action={
          <Link
            to="/"
            className="rounded-full bg-gold-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-400"
          >
            Volver al inicio
          </Link>
        }
      />
    </>
  );
}
