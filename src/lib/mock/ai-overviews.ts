import type { AIOverview } from "../types";

/**
 * Hand-curated, deterministic AI overviews per game.
 * The bullets are intentionally specific — they mention named systems, studios,
 * DLC, mechanics, or community sentiment that you'd expect a real LLM summary
 * grounded in user reviews to surface. Each bullet stays under ~120 chars.
 */
export const AI_OVERVIEWS: Record<string, AIOverview> = {
  "black-myth-wukong": {
    pros: [
      "Game Science's debut action-RPG, retelling Journey to the West with bombastic Soulslike combat and Unreal Engine 5 spectacle.",
      "Praised for transformation spells, shape-shifting bosses, and a 60+ hour campaign that escalates into mythological set pieces.",
    ],
    cons: [
      "Most-played single-player launch on Dreamworks in 2024; performance on mid-range GPUs is the most common review caveat.",
    ],
    basedOnReviewCount: 312000,
    updatedAt: "2026-05-09T00:00:00.000Z",
  },
  "red-dead-redemption-2": {
    pros: [
      "Rockstar's 1899 western prequel following Arthur Morgan and the Van der Linde gang as the era of outlaws collapses.",
      "Reviewers consistently call out the world's density — NPC schedules, weather, and small-town economies that feel unscripted.",
    ],
    cons: [
      "Pacing is the most polarising element: deliberate first 15 hours, but the slow burn is what most players remember years later.",
    ],
    basedOnReviewCount: 624000,
    updatedAt: "2026-05-04T00:00:00.000Z",
  },
  "gta-5": {
    pros: [
      "Three-protagonist crime sandbox set in Los Santos; the single-player heists are still cited as the genre's high-water mark.",
      "GTA Online has outlived a console generation thanks to recurring DLC drops, player-run businesses, and roleplay communities.",
    ],
    cons: [
      "Reviews skew positive a decade later, with the main critique being how aggressively Online monetises Shark Cards.",
    ],
    basedOnReviewCount: 1450000,
    updatedAt: "2026-05-15T00:00:00.000Z",
  },
  "god-of-war-ragnarok": {
    pros: [
      "Santa Monica's Norse saga finale, pairing Kratos and a now-teenage Atreus across all nine realms as Ragnarok closes in.",
      "Combat layers the Leviathan Axe, Blades of Chaos, and a new Draupnir Spear into the deepest moveset in the series.",
    ],
    cons: [
      "Story and performance capture are the most-praised elements; backtracking through realms is the most common gripe.",
    ],
    basedOnReviewCount: 287000,
    updatedAt: "2026-05-02T00:00:00.000Z",
  },
  "ac-shadows": {
    pros: [
      "Feudal-Japan Assassin's Creed with dual protagonists: Naoe the shinobi for stealth, Yasuke the samurai for open combat.",
      "Seasons and weather meaningfully change stealth — snow leaves footprints, autumn rustles, and shrines unlock parkour shortcuts.",
    ],
    cons: [
      "Reviews split on the hideout-building meta layer: some find it grounding, others see it slowing the main story to a crawl.",
    ],
    basedOnReviewCount: 96000,
    updatedAt: "2026-05-13T00:00:00.000Z",
  },
  "witcher-3": {
    pros: [
      "CD Projekt Red's open-world RPG following Geralt of Rivia hunting Ciri across Velen, Skellige, and Novigrad.",
      "Side quests are routinely ranked above most studios' main quests — Bloody Baron and Hearts of Stone are the usual exemplars.",
    ],
    cons: [
      "The Next-Gen update (2022) is a free upgrade with ray tracing and a new camera; old saves carry over cleanly.",
    ],
    basedOnReviewCount: 715000,
    updatedAt: "2026-04-28T00:00:00.000Z",
  },
  "cyberpunk-2077": {
    pros: [
      "Night City action-RPG that recovered from a famously rough 2020 launch into one of the most-replayed RPGs on the platform.",
      "Update 2.0 rebuilt skill trees, police AI, and vehicle combat; Phantom Liberty added a spy-thriller arc with Idris Elba.",
    ],
    cons: [
      "Reviews now praise quest writing and atmosphere; lingering complaints centre on driving feel and life-path divergence.",
    ],
    basedOnReviewCount: 568000,
    updatedAt: "2026-05-07T00:00:00.000Z",
  },
  "crimson-desert": {
    pros: [
      "Pearl Abyss's open-world action-RPG following Macduff through the war-torn continent of Pywel.",
      "Combat blends grappling, environment-aware brawling, and weapon-swap combos that reviewers compare to Sekiro by way of Yakuza.",
    ],
    cons: [
      "Early consensus: gorgeous traversal and boss design, but the early-game tutorial pacing is its weakest stretch.",
    ],
    basedOnReviewCount: 41000,
    updatedAt: "2026-05-17T00:00:00.000Z",
  },
  "gta-6": {
    pros: [
      "Rockstar's return to Vice City with dual protagonists Lucia and Jason in a Bonnie-and-Clyde-style story arc.",
      "Pre-release coverage focuses on the simulated wildlife, dynamic crowd behaviour, and the most detailed interiors in the series.",
    ],
    cons: [
      "Currently in pre-order; expect this overview to be regenerated from real reviews once the embargo lifts.",
    ],
    basedOnReviewCount: 8200,
    updatedAt: "2026-05-19T00:00:00.000Z",
  },
  "elden-ring": {
    pros: [
      "FromSoftware's sprawling open-world soulslike, with a world co-written by George R. R. Martin.",
      "Praised for non-linear exploration, hand-crafted bosses, and combat that rewards patience over reflex.",
    ],
    cons: [
      "The Shadow of the Erdtree DLC added 30+ hours and is widely considered one of the best expansions ever shipped.",
    ],
    basedOnReviewCount: 478000,
    updatedAt: "2026-05-12T00:00:00.000Z",
  },
  "baldurs-gate-3": {
    pros: [
      "Larian's turn-based D&D 5e RPG; companions, romances, and origin runs are the loop most players sink 100+ hours into.",
      "Act 3 in Baldur's Gate is the most divisive stretch — the city has more side content than some studios' entire games.",
    ],
    cons: [
      "Patch 7 added split-screen on PC, official mod tooling, and a new evil ending; multiplayer parity is now near-flawless.",
    ],
    basedOnReviewCount: 412000,
    updatedAt: "2026-05-06T00:00:00.000Z",
  },
  "hogwarts-legacy": {
    pros: [
      "Open-world 1890s Hogwarts RPG with a fully custom student, Room of Requirement crafting, and a Dark Arts-tinged main quest.",
      "Spell combat is the standout — chaining Accio, Levioso, and Incendio into elemental combos plays better than reviewers expected.",
    ],
    cons: [
      "Common complaints: thin enemy variety outside the main story and a Quidditch-shaped hole in the original game.",
    ],
    basedOnReviewCount: 196000,
    updatedAt: "2026-05-01T00:00:00.000Z",
  },
  "counter-strike-2": {
    pros: [
      "Valve's free-to-play tactical shooter, rebuilt on Source 2 with sub-tick netcode and volumetric smoke grenades.",
      "Premier mode and the CS Rating ladder replaced the old Trust Factor matchmaking; reviews remain split on calibration.",
    ],
    cons: [
      "Skins, cases, and the Steam Market economy carried over from CS:GO — your old inventory still applies one-to-one.",
    ],
    basedOnReviewCount: 1180000,
    updatedAt: "2026-05-14T00:00:00.000Z",
  },
  "helldivers-2": {
    pros: [
      "Arrowhead's 4-player co-op third-person shooter; you spread Managed Democracy by orbital-striking bugs and bots.",
      "The live-service Galactic War — community-driven planetary fronts — is what reviews credit for the long retention curve.",
    ],
    cons: [
      "Mid-2024 PSN-linking controversy is the one consistent black mark; the studio reversed course within 72 hours.",
    ],
    basedOnReviewCount: 348000,
    updatedAt: "2026-05-10T00:00:00.000Z",
  },
  palworld: {
    pros: [
      "Pocketpair's open-world survival-craft hybrid where Pals can be ridden, mounted as weapons, or chained to factory lines.",
      "Hit 25M sales in its first month; reviews credit base-building and faction raids more than the Pokémon-shaped comparisons.",
    ],
    cons: [
      "Still in early access — server stability and late-game progression are the recurring asks in recent reviews.",
    ],
    basedOnReviewCount: 274000,
    updatedAt: "2026-05-08T00:00:00.000Z",
  },
  "marvel-rivals": {
    pros: [
      "NetEase's 6v6 hero shooter with a destructible-environment twist — walls and floors collapse mid-fight to reroute objectives.",
      "Team-up abilities (Hulk + Iron Man's Gamma Charge, etc.) are the standout system that no other hero shooter currently has.",
    ],
    cons: [
      "Free-to-play with a battle pass that reviewers describe as unusually generous for the genre — no power monetisation.",
    ],
    basedOnReviewCount: 218000,
    updatedAt: "2026-05-11T00:00:00.000Z",
  },
  "stardew-valley": {
    pros: [
      "ConcernedApe's solo-developed farming RPG; one designer still hand-patches every update over a decade after launch.",
      "Update 1.6 added new festivals, the Meadowlands farm type, and 100+ small dialogue tweaks for long-time players.",
    ],
    cons: [
      "Multiplayer remains the most-requested area for QoL — split-screen is fine but the join-flow is fiddly on console.",
    ],
    basedOnReviewCount: 681000,
    updatedAt: "2026-04-30T00:00:00.000Z",
  },
  sekiro: {
    pros: [
      "FromSoftware's Sengoku-era action game where posture and deflection replace the usual stamina-bar dance.",
      "Bosses like Genichiro, Owl, and Isshin are the most-cited skill checks in the soulslike genre — no summons, no co-op.",
    ],
    cons: [
      "Free 'Shadows Die Twice' update added boss-rush mode and remappable controls; accessibility is still the main reviewer ask.",
    ],
    basedOnReviewCount: 226000,
    updatedAt: "2026-05-03T00:00:00.000Z",
  },
  "resident-evil-4-remake": {
    pros: [
      "Capcom's RE Engine reimagining of Leon's Spanish-village rescue mission, with reworked parries and over-the-shoulder gunplay.",
      "Side quests, knife durability, and the new merchant request board are the most-praised additions over the 2005 original.",
    ],
    cons: [
      "Separate Ways DLC adds Ada Wong's parallel campaign and the grappling-hook gun, and is bundled with the Gold Edition.",
    ],
    basedOnReviewCount: 167000,
    updatedAt: "2026-05-05T00:00:00.000Z",
  },
  "spider-man-remastered": {
    pros: [
      "Insomniac's Manhattan-spanning superhero game, remastered from PS4 with a new Peter Parker face model and DLSS support.",
      "Web-swinging momentum is still the gold standard — reviewers compare every open-world traversal system back to it.",
    ],
    cons: [
      "Bundles the three 'City That Never Sleeps' DLC chapters; mod support on PC is unusually robust for a Sony port.",
    ],
    basedOnReviewCount: 154000,
    updatedAt: "2026-04-26T00:00:00.000Z",
  },
};
