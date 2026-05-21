import type { NewsArticle } from "../types";
import { newsHeroUrl } from "./images";
import { GAMES } from "./games";

const ARTICLES = [
  {
    title: "What's new in May — Dreamworks Spring Sale arrives",
    excerpt: "Big discounts across every tier of the store, plus a handful of surprises tucked in the corners.",
    related: ["gta-5", "witcher-3"],
    tags: ["sale", "store"],
  },
  {
    title: "Inside Black Myth: Wukong — a year on, still selling out shelves",
    excerpt: "We talk to Game Science about pacing, transformations, and the staff-combat problem.",
    related: ["black-myth-wukong"],
    tags: ["interview", "feature"],
  },
  {
    title: "Cyberpunk 2077 hits a new all-time CCU peak after the latest patch",
    excerpt: "How a year of follow-up patches reshaped the conversation around Night City.",
    related: ["cyberpunk-2077"],
    tags: ["news", "feature"],
  },
  {
    title: "Elden Ring Nightreign-style multiplayer comes to the Lands Between",
    excerpt: "Co-op runs, weekly bosses, and how the existing fanbase is reacting to permanence.",
    related: ["elden-ring"],
    tags: ["news"],
  },
  {
    title: "Five open worlds to play this long weekend",
    excerpt: "From Vice City to Wuthering Heights — hand-picked by the staff.",
    related: ["red-dead-redemption-2", "witcher-3", "elden-ring"],
    tags: ["recommendations"],
  },
  {
    title: "AC Shadows post-mortem: what feudal Japan looks like on PC",
    excerpt: "Two heroes, one story, and a year of patches that finally made it land.",
    related: ["ac-shadows"],
    tags: ["postmortem"],
  },
  {
    title: "God of War Ragnarök update adds NG+ challenge tier",
    excerpt: "The harder difficulty everyone has been asking for, plus armor transmog.",
    related: ["god-of-war-ragnarok"],
    tags: ["patch-notes"],
  },
  {
    title: "Crimson Desert hands-on: the open-world we didn't expect",
    excerpt: "Pearl Abyss finally let the press loose on a 20-hour build. Here's how it played.",
    related: ["crimson-desert"],
    tags: ["preview"],
  },
  {
    title: "GTA VI release window narrows — what we still don't know",
    excerpt: "A long, careful read of every Rockstar communication of the last twelve months.",
    related: ["gta-6"],
    tags: ["feature"],
  },
  {
    title: "Witcher 3 modding scene is somehow still bigger than ever",
    excerpt: "REDkit, REDmod, and the slow tide of community total-conversions.",
    related: ["witcher-3"],
    tags: ["modding", "feature"],
  },
  {
    title: "Patch parade: a roundup of this week's updates",
    excerpt: "Highlights from a busy week of updates across the catalog.",
    related: ["red-dead-redemption-2", "cyberpunk-2077"],
    tags: ["digest"],
  },
  {
    title: "Black Myth: Wukong is the best-selling single-player game of the year",
    excerpt: "Putting the 30M-unit number into context — what it means for the genre.",
    related: ["black-myth-wukong"],
    tags: ["feature"],
  },
  // ── Catalog v2 studios (Larian, Arrowhead, ConcernedApe, Activision,
  //    Capcom, NetEase, Avalanche, Insomniac, Pocketpair). These reference
  //    game IDs being added by the catalog-expansion agent in parallel; if
  //    a referenced id isn't in GAMES yet, the filter below drops it
  //    silently and the article remains in NEWS but unattached. Once the
  //    catalog lands, the news rail picks them up automatically.
  {
    title: "Larian announces post-BG3 roadmap — \"a brand new RPG world\"",
    excerpt:
      "Swen Vincke confirms the next project is not BG4 and not D&D — but it is bigger.",
    related: ["baldurs-gate-3"],
    tags: ["news", "interview"],
  },
  {
    title: "Arrowhead's Helldivers 2 wins Game of the Year 2024",
    excerpt:
      "A 12-month run that turned a co-op shooter into the year's biggest live-service comeback.",
    related: ["helldivers-2"],
    tags: ["awards", "feature"],
  },
  {
    title: "Stardew Valley 1.6 patch lands on Steam with farm types",
    excerpt:
      "ConcernedApe's biggest content drop in three years adds meadowlands, beach, and forest farms.",
    related: ["stardew-valley"],
    tags: ["patch-notes"],
  },
  {
    title: "Capcom's RE4 Remake DLC drops next month — Separate Ways details",
    excerpt:
      "Ada Wong returns in a five-hour campaign that retells the original's parallel storyline.",
    related: ["resident-evil-4-remake", "resident-evil-4"],
    tags: ["news"],
  },
  {
    title: "Marvel Rivals crosses 20M players in launch week",
    excerpt:
      "NetEase's hero shooter is the fastest-growing free-to-play launch on Steam this year.",
    related: ["marvel-rivals"],
    tags: ["news", "feature"],
  },
  {
    title: "Hogwarts Legacy DLC tease: Avalanche hints at a Quidditch chapter",
    excerpt:
      "First post-launch content reveal — release window pegged for the holiday season.",
    related: ["hogwarts-legacy"],
    tags: ["news"],
  },
];

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const NEWS: NewsArticle[] = ARTICLES.map((a, i) => {
  const slug = slugify(a.title);
  return {
    slug,
    title: a.title,
    excerpt: a.excerpt,
    body:
      a.excerpt +
      "\n\n" +
      "It's a longer piece. There are sections, anecdotes, and the kind of paragraph that ends on a comma — but for v1, we'll keep the body short and let the layout do the work.",
    authorName: ["Sage Park", "M. Vasquez", "L. Iqbal"][i % 3],
    publishedAt: daysAgoIso(i * 2 + 1),
    heroUrl: newsHeroUrl(slug),
    tags: a.tags,
    relatedGameIds: a.related.filter((id) => GAMES.some((g) => g.id === id)),
  };
});

export function getNewsArticle(slug: string): NewsArticle | undefined {
  return NEWS.find((a) => a.slug === slug);
}
