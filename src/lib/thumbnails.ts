/**
 * YouTube thumbnails are not guaranteed to exist at the highest resolution:
 * `maxresdefault.jpg` is missing for some uploads. Fall back progressively
 * instead of leaving a broken image in the grid.
 */
export function fallbackThumbnail(thumbnail: string): string {
  if (thumbnail.includes("maxresdefault")) {
    return thumbnail.replace("maxresdefault", "hqdefault");
  }

  if (thumbnail.includes("sddefault")) {
    return thumbnail.replace("sddefault", "hqdefault");
  }

  if (thumbnail.includes("hqdefault")) {
    return thumbnail.replace("hqdefault", "mqdefault");
  }

  return thumbnail;
}
