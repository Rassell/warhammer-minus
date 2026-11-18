import { cn } from "~/lib/cn";

const SIZE_CLASSES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-2xl",
} as const;

const GRADIENTS = [
  "from-gold-400 to-gold-600",
  "from-amber-300 to-amber-600",
  "from-stone-300 to-stone-500",
  "from-slate-300 to-slate-500",
] as const;

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function gradientFor(name: string): string {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) % GRADIENTS.length;
  }

  return GRADIENTS[hash];
}

interface AvatarProps {
  name: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

/**
 * Deterministic initials avatar.
 *
 * The pipeline does not download channel avatars, so authors are represented by
 * a stable monogram instead of a placeholder image request.
 */
export default function Avatar({
  name,
  size = "md",
  className,
}: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-linear-to-br font-semibold tracking-tight text-ink-950 ring-1 ring-white/10",
        SIZE_CLASSES[size],
        gradientFor(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
