/**
 * Formatting helpers shared by every route.
 *
 * Videos store durations as ISO 8601 (`PT8M15S`) and dates as ISO strings, so
 * all display logic lives here instead of being duplicated in components.
 */

const ISO_DURATION_PATTERN =
  /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;

/** Convert an ISO 8601 duration (`PT1H2M3S`) to seconds. */
export function parseIsoDuration(value: string | undefined): number {
  if (!value) {
    return 0;
  }

  const match = ISO_DURATION_PATTERN.exec(value);
  if (!match) {
    return 0;
  }

  const [, days, hours, minutes, seconds] = match;

  return (
    Number(days ?? 0) * 86_400 +
    Number(hours ?? 0) * 3_600 +
    Number(minutes ?? 0) * 60 +
    Number(seconds ?? 0)
  );
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

/** `95` → `1:35`, `3725` → `1:02:05`. */
export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3_600);
  const minutes = Math.floor((safeSeconds % 3_600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${minutes}:${pad(seconds)}`;
}

/** Duration badge for a video card. Returns an empty string when unknown. */
export function formatVideoDuration(value: string | undefined): string {
  const seconds = parseIsoDuration(value);
  return seconds > 0 ? formatDuration(seconds) : "";
}

/** Human total used by collection headers: `2 h 34 min` / `48 min`. */
export function formatTotalDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) {
    return "—";
  }

  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

const shortDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const relativeDateFormatter = new Intl.RelativeTimeFormat("es-ES", {
  numeric: "auto",
});

const compactNumberFormatter = new Intl.NumberFormat("es-ES", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const integerNumberFormatter = new Intl.NumberFormat("es-ES");

const RELATIVE_DIVISIONS: ReadonlyArray<{
  amount: number;
  unit: Intl.RelativeTimeFormatUnit;
}> = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.345_24, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

/** `30 oct 2026`. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : shortDateFormatter.format(date);
}

/** `viernes, 30 de octubre de 2026`. */
export function formatLongDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : longDateFormatter.format(date);
}

/** `hace 3 semanas`, `ayer`, `el año pasado`. */
export function formatRelativeDate(iso: string, now = Date.now()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  let duration = (date.getTime() - now) / 1_000;

  for (const division of RELATIVE_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return relativeDateFormatter.format(Math.round(duration), division.unit);
    }

    duration /= division.amount;
  }

  return "";
}

/** `31823` → `31,8 mil`. */
export function formatCount(value: number): string {
  return compactNumberFormatter.format(value);
}

/** `31823` → `31,8 mil visualizaciones`. */
export function formatViews(value: number): string {
  return `${formatCount(value)} visualizaciones`;
}

/** `31823` → `31.823`, for totals where the exact figure matters. */
export function formatExactNumber(value: number): string {
  return integerNumberFormatter.format(value);
}

/** Spanish plural helper: `1 vídeo` / `2 vídeos`. */
export function pluralize(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
