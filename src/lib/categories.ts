import type { Category, CategoryIconKey, IVideo } from "~/types";

/**
 * Curated taxonomy over the manual tags.
 *
 * Tags are assigned by hand (see `be/TAGGING_PROMPT.md`) and there are dozens of
 * them, which is too many for a top-level navigation. Each category below is a
 * named group of existing tag values: a video belongs to a category when it
 * carries at least one of them. No new tag values are introduced here.
 */
interface CategoryDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: CategoryIconKey;
  tags: string[];
}

export const CATEGORY_DEFINITIONS: readonly CategoryDefinition[] = [
  {
    id: "primeros-pasos",
    name: "Primeros pasos",
    slug: "primeros-pasos",
    description:
      "Fundamentos de pintura, materiales y guías para empezar en el hobby.",
    icon: "sparkles",
    tags: [
      "beginner",
      "painting essentials",
      "contrast paints",
      "citadel products",
    ],
  },
  {
    id: "tecnicas",
    name: "Técnicas",
    slug: "tecnicas",
    description:
      "NMM, weathering, telas, pieles, metales y otros efectos explicados paso a paso.",
    icon: "brush",
    tags: [
      "nmm",
      "weathering",
      "textures & materials",
      "metal",
      "cloth",
      "skin",
      "weapons",
      "advanced",
    ],
  },
  {
    id: "space-marines",
    name: "Space Marines",
    slug: "space-marines",
    description:
      "Guías de capítulos, esquemas de color y técnicas para Adeptus Astartes.",
    icon: "shield",
    tags: [
      "space marines",
      "ultramarines",
      "dark angels",
      "blood angels",
      "space wolves",
      "salamanders",
      "imperial fists",
      "raven guard",
      "black templars",
      "iron hands",
      "white scars",
      "grey knights",
    ],
  },
  {
    id: "caos",
    name: "Caos",
    slug: "caos",
    description:
      "Legiones traidoras, dioses del Caos y facciones de Warhammer 40.000 y Age of Sigmar.",
    icon: "flame",
    tags: [
      "chaos",
      "chaos space marines",
      "thousand sons",
      "death guard",
      "world eaters",
      "emperor's children",
      "night lords",
      "black legion",
      "word bearers",
      "alpha legion",
      "iron warriors",
      "red corsairs",
      "sons of horus",
      "slaves to darkness",
      "blades of khorne",
      "disciples of tzeentch",
      "hedonites of slaanesh",
      "maggotkin of nurgle",
    ],
  },
  {
    id: "xenos",
    name: "Xenos",
    slug: "xenos",
    description:
      "Tyránidos, orkos, tau, eldar, necrones y el resto de facciones alienígenas.",
    icon: "bug",
    tags: [
      "tyranids",
      "orks & orruks",
      "tau",
      "eldar",
      "drukhari",
      "necrons",
      "votann",
      "harlequins",
    ],
  },
  {
    id: "age-of-sigmar",
    name: "Age of Sigmar",
    slug: "age-of-sigmar",
    description:
      "Stormcast Eternals, Skaven, Soulblight y el resto de facciones de Age of Sigmar.",
    icon: "crown",
    tags: [
      "aos",
      "stormcast eternals",
      "skaven",
      "cities of sigmar",
      "soulblight gravelords",
      "lumineth realm-lords",
      "seraphon",
      "daughters of khaine",
      "gloomspite gitz",
      "nighthaunt",
      "idoneth deepkin",
      "kharadron overlords",
      "sylvaneth",
      "flesh-eater courts",
      "helsmiths of hashut",
      "grand cathay",
    ],
  },
  {
    id: "bases-escenografia",
    name: "Bases y escenografía",
    slug: "bases-escenografia",
    description:
      "Peanas, terrenos y escenografía para dar contexto a tus miniaturas.",
    icon: "mountain",
    tags: ["bases", "scenery"],
  },
  {
    id: "vehiculos",
    name: "Vehículos y máquinas",
    slug: "vehiculos",
    description:
      "Vehículos, titanes y máquinas de guerra con sus propios trucos de pintura.",
    icon: "truck",
    tags: [
      "vehicles",
      "titanicus",
      "aeronautica imperialis",
      "legions imperialis",
      "adeptus mechanicus",
      "imperial knights",
    ],
  },
  {
    id: "otros-juegos",
    name: "Otros juegos",
    slug: "otros-juegos",
    description:
      "Kill Team, Warcry, Underworlds, Blood Bowl, Necromunda y otros sistemas.",
    icon: "dice",
    tags: [
      "kill team",
      "underworlds",
      "warcry",
      "blood bowl",
      "necromunda",
      "old world",
      "horus heresy",
      "middle earth",
    ],
  },
  {
    id: "imperio",
    name: "Imperio",
    slug: "imperio",
    description:
      "Astra Militarum, Sororitas, Custodes y otras facciones imperiales.",
    icon: "crosshair",
    tags: ["astra militarum", "sororitas", "custodes"],
  },
];

const TAGS_BY_SLUG = new Map(
  CATEGORY_DEFINITIONS.map((category) => [category.slug, category.tags]),
);

/** True when the video carries at least one tag of the given category. */
export function categoryMatchesVideo(video: IVideo, slug: string): boolean {
  const tags = TAGS_BY_SLUG.get(slug);
  if (!tags) {
    return false;
  }

  return tags.some((tag) => video.tags.includes(tag));
}

/** Resolve the curated definitions into categories with live video counts. */
export function buildCategories(videos: readonly IVideo[]): Category[] {
  return CATEGORY_DEFINITIONS.map((definition) => ({
    ...definition,
    videoCount: videos.filter((video) =>
      categoryMatchesVideo(video, definition.slug),
    ).length,
  }));
}
