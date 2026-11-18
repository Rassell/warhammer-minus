import { Loader2 } from "lucide-react";

/** Suspense fallback for lazily loaded routes. */
export default function PageLoader() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-mist-500"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-6 w-6 animate-spin text-gold-400" aria-hidden="true" />
      <p className="text-sm">Cargando contenido…</p>
    </div>
  );
}
