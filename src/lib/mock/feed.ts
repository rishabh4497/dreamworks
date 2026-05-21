import type { SocialPost } from "../types";

// Seed data for the social feed
export const MOCK_CREATOR_AVATARS: Record<string, string> = {
  playstation: "https://api.dicebear.com/7.x/identicon/svg?seed=playstation",
  xbox: "https://api.dicebear.com/7.x/identicon/svg?seed=xbox",
  rockstargames: "https://api.dicebear.com/7.x/identicon/svg?seed=rockstar",
  cdprojektred: "https://api.dicebear.com/7.x/identicon/svg?seed=cdprojektred",
  hadesgame: "https://api.dicebear.com/7.x/identicon/svg?seed=hades",
  ign: "https://api.dicebear.com/7.x/identicon/svg?seed=ign",
  fromsoftware: "https://api.dicebear.com/7.x/identicon/svg?seed=fromsoftware",
};

export const PRESET_POST_IMAGES = [
  { label: "Night City Neon", url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80" },
  { label: "Elden Tree", url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80" },
  { label: "Vice City Beach", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80" },
  { label: "Wukong Forest", url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80" },
  { label: "Retro Arcade", url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80" },
];

export const SEED_POSTS: SocialPost[] = [
  {
    id: "post-1",
    authorUid: "rockstar-official",
    authorName: "Rockstar Games",
    authorHandle: "@rockstargames",
    authorAvatarUrl: MOCK_CREATOR_AVATARS.rockstargames,
    content: "Welcome back to Vice City. GTA VI is pushing the absolute boundaries of our proprietary RAGE engine. The level of density, pedestrian AI, and volumetric lighting is beyond anything we've done before. Pre-orders are now active on the Dreamworks Store!",
    imageUrl: "https://static.wikia.nocookie.net/gtawiki/images/a/a5/Artwork-Trailer2Thumbnail2-GTAVI.jpg/revision/latest?format=original",
    gameId: "gta-6",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    likes: 8521,
    likedByMe: false,
    reposts: 2410,
    repostedByMe: false,
    replies: [
      {
        id: "reply-1-1",
        authorUid: "friend-1",
        authorName: "kira_w",
        authorHandle: "@kira_w",
        authorAvatarUrl: "https://picsum.photos/seed/kira_w/96/96",
        content: "TAKE MY MONEY IMMEDIATELY! Standard or Ultimate Edition? I think I'm going Ultimate for the soundtracks.",
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        likes: 142,
        likedByMe: false,
      },
      {
        id: "reply-1-2",
        authorUid: "friend-3",
        authorName: "bytecount",
        authorHandle: "@bytecount",
        authorAvatarUrl: "https://picsum.photos/seed/bytecount/96/96",
        content: "Cannot wait to see the PC specs required for this. Time to upgrade my GPU again...",
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        likes: 85,
        likedByMe: false,
      }
    ]
  },
  {
    id: "post-2",
    authorUid: "friend-1",
    authorName: "kira_w",
    authorHandle: "@kira_w",
    authorAvatarUrl: "https://picsum.photos/seed/kira_w/96/96",
    content: "Finally defeated Malenia, Blade of Miquella! Took me 47 tries, but my hybrid Frost/Bleed build got the job done. Elden Ring continues to be the greatest combat sandbox ever created. If you are struggling, try using the Swarm of Flies incantation!",
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg",
    gameId: "elden-ring",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    likes: 412,
    likedByMe: false,
    reposts: 38,
    repostedByMe: false,
    replies: [
      {
        id: "reply-2-1",
        authorUid: "fromsoftware-official",
        authorName: "FromSoftware",
        authorHandle: "@fromsoftware",
        authorAvatarUrl: MOCK_CREATOR_AVATARS.fromsoftware,
        content: "Well fought, Tarnished. Your strength warrants the crown.",
        createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
        likes: 310,
        likedByMe: false,
      },
      {
        id: "reply-2-2",
        authorUid: "friend-4",
        authorName: "ferris",
        authorHandle: "@ferris",
        authorAvatarUrl: "https://picsum.photos/seed/ferris/96/96",
        content: "Congrats! Still stuck in the Haligtree myself. Those bubble-blowing knights are a nightmare.",
        createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
        likes: 24,
        likedByMe: false,
      }
    ]
  },
  {
    id: "post-3",
    authorUid: "cdprojektred-official",
    authorName: "CD PROJEKT RED",
    authorHandle: "@cdprojektred",
    authorAvatarUrl: MOCK_CREATOR_AVATARS.cdprojektred,
    content: "Night City is glowing brighter than ever. Patch 2.2 is officially live, introducing full FSR 3.1 frame generation support, custom vehicle livery modifications, and optimized path-tracing for mid-range GPUs. Thank you for continuing to explore the streets with V.",
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg",
    gameId: "cyberpunk-2077",
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
    likes: 1250,
    likedByMe: false,
    reposts: 580,
    repostedByMe: false,
    replies: [
      {
        id: "reply-3-1",
        authorUid: "friend-2",
        authorName: "low.tide",
        authorHandle: "@low.tide",
        authorAvatarUrl: "https://picsum.photos/seed/low.tide/96/96",
        content: "Just tested the path-tracing optimizations on my RTX 4070. Gained a solid 15 FPS in heavy areas like Kabuki! Amazing work.",
        createdAt: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
        likes: 42,
        likedByMe: false,
      }
    ]
  },
  {
    id: "post-4",
    authorUid: "ign-news",
    authorName: "IGN",
    authorHandle: "@ign",
    authorAvatarUrl: MOCK_CREATOR_AVATARS.ign,
    content: "EXCLUSIVE: Black Myth: Wukong developer Game Science talks about their upcoming DLC expansion, confirming it will explore the Eastern Sea and Dragon Palace lore. Check out the full interview on our website. Expected release: Late 2026.",
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/2358720/header.jpg",
    gameId: "black-myth-wukong",
    createdAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(), // 8 hours ago
    likes: 3120,
    likedByMe: false,
    reposts: 924,
    repostedByMe: false,
    replies: []
  },
  {
    id: "post-5",
    authorUid: "friend-5",
    authorName: "annika.io",
    authorHandle: "@annika.io",
    authorAvatarUrl: "https://picsum.photos/seed/annika.io/96/96",
    content: "If you need a break from high-octane bosses, please go play Stardew Valley. I've spent the last 3 nights just planting cranberries, organizing my cheese makers, and listening to the cozy autumn music. Best therapy after a rough day at work.",
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg",
    gameId: "stardew-valley",
    createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(), // 12 hours ago
    likes: 341,
    likedByMe: false,
    reposts: 12,
    repostedByMe: false,
    replies: [
      {
        id: "reply-5-1",
        authorUid: "friend-6",
        authorName: "porter",
        authorHandle: "@porter",
        authorAvatarUrl: "https://picsum.photos/seed/porter/96/96",
        content: "Totally agree. I have 300+ hours and still come back every winter. Who did you marry in this playthrough?",
        createdAt: new Date(Date.now() - 1000 * 60 * 700).toISOString(),
        likes: 19,
        likedByMe: false,
      }
    ]
  }
];
