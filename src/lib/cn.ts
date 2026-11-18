/**
 * Minimal class-name joiner.
 *
 * The project intentionally avoids adding a `clsx`-style dependency: every
 * component only needs to drop falsy entries before joining with a space.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
