import type { Author, Collection, IVideo } from "~/types";

import { parseIsoDuration } from "./format";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function countTags(videos: readonly IVideo[]): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();

  for (const video of videos) {
    for (const tag of video.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

function latestDate(videos: readonly IVideo[]): string {
  return videos.reduce((latest, video) => {
    if (!latest) {
      return video.publishedAt;
    }

    return new Date(video.publishedAt).getTime() >
      new Date(latest).getTime()
      ? video.publishedAt
      : latest;
  }, "");
}

/**
 * Derive authors from the channel fields of the videos.
 *
 * There is no author entity in the generated JSON: a "channel" is the author of
 * the content, so grouping by `channelId` (falling back to the channel title)
 * keeps the model aligned with the existing data without duplicating entities.
 */
export function buildAuthors(
  videos: readonly IVideo[],
  collections: readonly Collection[],
): Author[] {
  const groups = new Map<string, { name: string; channelId?: string; videos: IVideo[] }>();

  for (const video of videos) {
    const name = video.channelTitle?.trim() ?? "";
    const key = video.channelId ?? slugify(name) ?? "canal";

    const group = groups.get(key);
    if (group) {
      group.videos.push(video);
      continue;
    }

    groups.set(key, {
      name: name || "Canal sin nombre",
      channelId: video.channelId,
      videos: [video],
    });
  }

  const usedIds = new Set<string>();

  return Array.from(groups.entries())
    .map(([key, group]) => {
      const videosNewestFirst = [...group.videos].sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() -
          new Date(a.publishedAt).getTime(),
      );

      const baseId = slugify(group.name) || slugify(key) || "canal";
      let id = baseId;
      let suffix = 2;
      while (usedIds.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }
      usedIds.add(id);

      const authorCollections = collections.filter(
        (collection) =>
          (group.channelId !== undefined &&
            collection.channelId === group.channelId) ||
          collection.channelTitle === group.name,
      );

      const topTags = countTags(videosNewestFirst)
        .slice(0, 6)
        .map((entry) => entry.tag);

      const totalDurationSeconds = videosNewestFirst.reduce(
        (total, video) => total + parseIsoDuration(video.duration),
        0,
      );

      const description =
        topTags.length > 0
          ? `${videosNewestFirst.length} tutoriales de pintura sobre ${topTags
              .slice(0, 3)
              .join(", ")}.`
          : `${videosNewestFirst.length} tutoriales de pintura de Warhammer.`;

      return {
        id,
        channelId: group.channelId,
        name: group.name,
        description,
        videoCount: videosNewestFirst.length,
        collectionCount: authorCollections.length,
        totalDurationSeconds,
        totalViewCount: videosNewestFirst.reduce(
          (total, video) => total + video.viewCount,
          0,
        ),
        latestPublishedAt: latestDate(videosNewestFirst),
        topTags,
        videoIds: videosNewestFirst.map((video) => video.videoId),
        collectionIds: authorCollections.map(
          (collection) => collection.playlistId,
        ),
      } satisfies Author;
    })
    .sort((a, b) => b.videoCount - a.videoCount);
}
