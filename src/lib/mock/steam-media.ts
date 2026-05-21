// Per-Steam-appid media manifest. Populated by the Catalog agent during this
// sprint from Steam's public appdetails API. Any appid missing here falls back
// to template URLs derived from the appid (in images.ts).
import type { Screenshot, Trailer } from "@/lib/types";

export interface SteamMedia {
  /** ss_*.1920x1080.jpg hash IDs from Steam's appdetails screenshots[]. */
  screenshots: string[];
  /** Movie IDs + posters from Steam's appdetails movies[]. */
  trailers: { id: number; poster?: string }[];

  // Overrides — when set, bypass the appid-templated URLs. Used for titles
  // whose Steam CDN paths are missing/broken (e.g. unreleased games).
  headerUrlOverride?: string;
  capsuleUrlOverride?: string;
  coverUrlOverride?: string;
  heroUrlOverride?: string;
  screenshotUrlsOverride?: Array<string | Screenshot>;
  trailerUrlsOverride?: { url: string; posterUrl: string; provider?: Trailer["provider"] }[];
}

export const STEAM_MEDIA: Record<number, SteamMedia> = {
  // Screenshot hashes and movie IDs were sourced from Steam's public
  // appdetails endpoint:
  //   GET https://store.steampowered.com/api/appdetails?appids=<APPID>
  //       &filters=screenshots,movies&cc=in
  // The `ss_*` portion of each `screenshots[].path_full` URL becomes a
  // screenshot id; `movies[].id` becomes a trailer id.

  // Black Myth: Wukong
  2358720: {
    screenshots: [
      "ss_86c4b7462bba219a0d0b89931a35812b9f188976",
      "ss_d9391ab31a4d15dddf7ba4949bfa44f5d9170580",
      "ss_524a39da392ee83dde091033562bc719d46b5838",
      "ss_968bbc9caceb7d798bd0c393e1e9b4c44ed6d835",
      "ss_415397426d4c939ebb8a93ac66831f28ee7199be",
      "ss_63477e8ce2c0582b81c6ed576377d78e692b5642",
    ],
    trailers: [
      { id: 257048125, poster: "movie_600x337.jpg" },
      { id: 257029344, poster: "movie_600x337.jpg" },
    ],
  },

  // Red Dead Redemption 2
  1174180: {
    screenshots: [
      "ss_66b553f4c209476d3e4ce25fa4714002cc914c4f",
      "ss_bac60bacbf5da8945103648c08d27d5e202444ca",
      "ss_668dafe477743f8b50b818d5bbfcec669e9ba93e",
      "ss_4ce07ae360b166f0f650e9a895a3b4b7bf15e34f",
      "ss_d1a8f5a69155c3186c65d1da90491fcfd43663d9",
    ],
    trailers: [
      { id: 256768371, poster: "movie.293x165.jpg" },
      { id: 256768370, poster: "movie.293x165.jpg" },
    ],
  },

  // Grand Theft Auto V
  271590: {
    screenshots: [
      "ss_32aa18ab3175e3002217862dd5917646d298ab6b",
      "ss_2744f112fa060320d191a50e8b3a92441a648a56",
      "ss_da39c16db175f6973770bae6b91d411251763152",
      "ss_bd5db78286be0a7c6b2c62519099a9e27e6b06f3",
      "ss_b1a1cb7959d6a0e6fcb2d06ebf97a66c9055cef3",
      "ss_bc5fc79d3366c837372327717249a4887aa46d63",
      "ss_d2eb9d3e50f9e4cb8db37d2976990b3795da8187",
      "ss_bd944debbec9936769f6dfb39ee456ca605615e3",
    ],
    trailers: [
      { id: 257109786, poster: "movie_600x337.jpg" },
      { id: 257083901, poster: "movie_600x337.jpg" },
    ],
  },

  // God of War Ragnarök
  2322010: {
    screenshots: [
      "ss_7c59382e67eadf779e0e15c3837ee91158237f11",
      "ss_05f27139b15c5410d07cd59b7b52adbdf73e13da",
      "ss_974a7b998c0c14da7fe52a342cf36c98850a57ac",
      "ss_78350297511e81f287b4bc361935efbc3016f6db",
      "ss_7cbcd6847cac4d2d42f496954d0df715c6af0b3a",
      "ss_c6240e5611e6aa1c2219dbf778f79b2b5244d912",
      "ss_5f1bca8b9b0de6e747f1849b0d459b9a6ce614e7",
      "ss_1848b58003fcc199092227f871770a216d9430f9",
    ],
    trailers: [{ id: 257054534, poster: "movie.293x165.jpg" }],
  },

  // Assassin's Creed Shadows
  3159330: {
    // Steam serves this title from hash-scoped store_item_assets paths, so the
    // old flat CDN screenshot/poster templates 404. Keep explicit appdetails
    // URLs for this app instead of guessing from the screenshot id.
    headerUrlOverride:
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3159330/header.jpg?t=1775589420",
    capsuleUrlOverride:
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3159330/header.jpg?t=1775589420",
    screenshots: [
      "ss_7257f31bb96b01f5b596ae5e0fa714319e43d64a",
      "ss_86653e3e54574cb65155452fa6657b7214a8d877",
      "ss_dbadf23ede7af4684012bab610ffb52f33fdb9e2",
      "ss_c6b98b5978b0054173b38d5700dc3c9681d0513c",
      "ss_3e587ce8e677f7381748fdc0a61e4938b76625ba",
      "ss_81bbd04dae05b0a52dc62818dc5219abeb849f8d",
      "ss_e53dc9ec73e3de9b8e680472898de775f0dc1cae",
      "ss_2e74c5442faa027ea699dcfa15be173b43a8d37a",
    ],
    screenshotUrlsOverride: [
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3159330/7257f31bb96b01f5b596ae5e0fa714319e43d64a/ss_7257f31bb96b01f5b596ae5e0fa714319e43d64a.1920x1080.jpg?t=1775589420",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3159330/86653e3e54574cb65155452fa6657b7214a8d877/ss_86653e3e54574cb65155452fa6657b7214a8d877.1920x1080.jpg?t=1775589420",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3159330/dbadf23ede7af4684012bab610ffb52f33fdb9e2/ss_dbadf23ede7af4684012bab610ffb52f33fdb9e2.1920x1080.jpg?t=1775589420",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3159330/c6b98b5978b0054173b38d5700dc3c9681d0513c/ss_c6b98b5978b0054173b38d5700dc3c9681d0513c.1920x1080.jpg?t=1775589420",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3159330/3e587ce8e677f7381748fdc0a61e4938b76625ba/ss_3e587ce8e677f7381748fdc0a61e4938b76625ba.1920x1080.jpg?t=1775589420",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3159330/81bbd04dae05b0a52dc62818dc5219abeb849f8d/ss_81bbd04dae05b0a52dc62818dc5219abeb849f8d.1920x1080.jpg?t=1775589420",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3159330/e53dc9ec73e3de9b8e680472898de775f0dc1cae/ss_e53dc9ec73e3de9b8e680472898de775f0dc1cae.1920x1080.jpg?t=1775589420",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3159330/2e74c5442faa027ea699dcfa15be173b43a8d37a/ss_2e74c5442faa027ea699dcfa15be173b43a8d37a.1920x1080.jpg?t=1775589420",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3159330/e27b352af4e7c1fa74718671c52e865a41449182/ss_e27b352af4e7c1fa74718671c52e865a41449182.1920x1080.jpg?t=1775589420",
    ],
    trailers: [
      { id: 257202269, poster: "movie_600x337.jpg" },
      { id: 257145695, poster: "movie_600x337.jpg" },
    ],
    trailerUrlsOverride: [
      {
        url: "https://video.fastly.steamstatic.com/store_trailers/257202269/movie480_vp9.webm",
        posterUrl:
          "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/257202269/46444c2b050a667a699bd4e6234090dbab0c6caa/movie_600x337.jpg?t=1770145728",
      },
      {
        url: "https://video.fastly.steamstatic.com/store_trailers/257145695/movie480_vp9.webm",
        posterUrl:
          "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/257145695/9318a6b9d2ee3c81602cd1e0e6d9bbf2b1a53e2b/movie_600x337.jpg?t=1770145729",
      },
      {
        url: "https://video.fastly.steamstatic.com/store_trailers/257202281/movie480_vp9.webm",
        posterUrl:
          "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/257202281/1f7f380cf6a6e525618c6a5fcaf3c37ee12522ae/movie_600x337.jpg?t=1758300925",
      },
    ],
  },

  // The Witcher 3: Wild Hunt
  292030: {
    screenshots: [
      "ss_5710298af2318afd9aa72449ef29ac4a2ef64d8e",
      "ss_0901e64e9d4b8ebaea8348c194e7a3644d2d832d",
      "ss_112b1e176c1bd271d8a565eacb6feaf90f240bb2",
      "ss_d1b73b18cbcd5e9e412c7a1dead3c5cd7303d2ad",
      "ss_107600c1337accc09104f7a8aa7f275f23cad096",
      "ss_64eb760f9a2b67f6731a71cce3a8fb684b9af267",
      "ss_eda99e7f705a113d04ab2a7a36068f3e7b343d17",
      "ss_d5b80eb63c12a6484f26796f3e34410651bba068",
    ],
    trailers: [
      { id: 256927226, poster: "movie.293x165.jpg" },
      { id: 256920685, poster: "movie.293x165.jpg" },
    ],
  },

  // Cyberpunk 2077
  1091500: {
    screenshots: [
      "ss_2f649b68d579bf87011487d29bc4ccbfdd97d34f",
      "ss_0e64170751e1ae20ff8fdb7001a8892fd48260e7",
      "ss_af2804aa4bf35d4251043744412ce3b359a125ef",
      "ss_7924f64b6e5d586a80418c9896a1c92881a7905b",
      "ss_4eb068b1cf52c91b57157b84bed18a186ed7714b",
      "ss_b529b0abc43f55fc23fe8058eddb6e37c9629a6a",
      "ss_8640d9db74f7cad714f6ecfb0e1aceaa3f887e58",
      "ss_9284d1c5b248726760233a933dbb83757d7d5d95",
    ],
    trailers: [
      { id: 257081132, poster: "movie_600x337.jpg" },
      { id: 256987121, poster: "movie.293x165.jpg" },
    ],
  },

  // Crimson Desert (Pearl Abyss). Use explicit appdetails URLs because Steam
  // serves this title from hash-scoped store_item_assets paths; the previous
  // appid here pointed at another game and made every image wrong.
  3321460: {
    screenshots: [
      "ss_669119c3747653f41a46c59f213168448d094e04",
      "ss_4b178bdd24ed576458116d8d3383b5352dad0fae",
      "ss_55e514af688f459364b3d0ffb288faf73580c8e5",
      "ss_d889c95c5f37b3a081cc7be68daf4ad2ffb9e291",
      "ss_ab4e6544853a3ecb4e1e714b0fa706c50144fbbb",
      "ss_17861390a1d7e6bbf3c44854605c63d68127afac",
      "ss_acbecac845c724dd50dfece5e420f5c6e4a2d171",
      "ss_10fa299935f8baed56b2311a6d905e2a5d751fa3",
      "ss_2fd06c82a96ba625e5e348e964e48ca372022549",
      "ss_da5b8d5347b66aa994119fc7052ca43896971da9",
      "ss_b64711208534731f57e0a4595241cdbb43a0cbc2",
      "ss_65dce9f0199332d1dc43aa5dd3684e1967d7a551",
      "ss_54b5c0b89a83fd2383b67861c148144461d5a87c",
    ],
    trailers: [
      { id: 257313715, poster: "movie_600x337.jpg" },
      { id: 257233024, poster: "movie_600x337.jpg" },
    ],
    headerUrlOverride:
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/abd7dbdeaede8b6c9a6d40bf116ff2b883f2dd45/header.jpg?t=1777016399",
    capsuleUrlOverride:
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/header.jpg?t=1777016399",
    coverUrlOverride:
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/library_600x900_2x.jpg?t=1777016399",
    heroUrlOverride:
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/library_hero.jpg?t=1777016399",
    screenshotUrlsOverride: [
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/669119c3747653f41a46c59f213168448d094e04/ss_669119c3747653f41a46c59f213168448d094e04.1920x1080.jpg?t=1777016399",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/4b178bdd24ed576458116d8d3383b5352dad0fae/ss_4b178bdd24ed576458116d8d3383b5352dad0fae.1920x1080.jpg?t=1777016399",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/55e514af688f459364b3d0ffb288faf73580c8e5/ss_55e514af688f459364b3d0ffb288faf73580c8e5.1920x1080.jpg?t=1777016399",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/d889c95c5f37b3a081cc7be68daf4ad2ffb9e291/ss_d889c95c5f37b3a081cc7be68daf4ad2ffb9e291.1920x1080.jpg?t=1777016399",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/ab4e6544853a3ecb4e1e714b0fa706c50144fbbb/ss_ab4e6544853a3ecb4e1e714b0fa706c50144fbbb.1920x1080.jpg?t=1777016399",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/17861390a1d7e6bbf3c44854605c63d68127afac/ss_17861390a1d7e6bbf3c44854605c63d68127afac.1920x1080.jpg?t=1777016399",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/acbecac845c724dd50dfece5e420f5c6e4a2d171/ss_acbecac845c724dd50dfece5e420f5c6e4a2d171.1920x1080.jpg?t=1777016399",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/10fa299935f8baed56b2311a6d905e2a5d751fa3/ss_10fa299935f8baed56b2311a6d905e2a5d751fa3.1920x1080.jpg?t=1777016399",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/2fd06c82a96ba625e5e348e964e48ca372022549/ss_2fd06c82a96ba625e5e348e964e48ca372022549.1920x1080.jpg?t=1777016399",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/da5b8d5347b66aa994119fc7052ca43896971da9/ss_da5b8d5347b66aa994119fc7052ca43896971da9.1920x1080.jpg?t=1777016399",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/b64711208534731f57e0a4595241cdbb43a0cbc2/ss_b64711208534731f57e0a4595241cdbb43a0cbc2.1920x1080.jpg?t=1777016399",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/65dce9f0199332d1dc43aa5dd3684e1967d7a551/ss_65dce9f0199332d1dc43aa5dd3684e1967d7a551.1920x1080.jpg?t=1777016399",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/54b5c0b89a83fd2383b67861c148144461d5a87c/ss_54b5c0b89a83fd2383b67861c148144461d5a87c.1920x1080.jpg?t=1777016399",
    ],
    trailerUrlsOverride: [
      {
        url: "https://video.akamai.steamstatic.com/store_trailers/3321460/691224060/fbf5db5bec64266a96fd36f7f7aa881b6ab5a0e4/1776315514/hls_264_master.m3u8?t=1776322393",
        posterUrl:
          "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/257313715/6e7f8201188430e582be50d39f423b00aa4ced65/movie_600x337.jpg?t=1776322393",
      },
      {
        url: "https://video.akamai.steamstatic.com/store_trailers/3321460/1115586514/144676005f415fc40d3331d98de4fbca55a750d9/1773290480/hls_264_master.m3u8?t=1773306012",
        posterUrl:
          "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/257233024/e9c85a458c321fb8d346cb27fb035bf067099921/movie_600x337.jpg?t=1773306012",
      },
    ],
  },

  // Grand Theft Auto VI (pre-release)
  3240220: {
    headerUrlOverride: "https://static.wikia.nocookie.net/gtawiki/images/a/a5/Artwork-Trailer2Thumbnail2-GTAVI.jpg/revision/latest?format=original",
    capsuleUrlOverride: "https://static.wikia.nocookie.net/gtawiki/images/a/a5/Artwork-Trailer2Thumbnail2-GTAVI.jpg/revision/latest?format=original",
    coverUrlOverride: "https://static.wikia.nocookie.net/gtawiki/images/0/05/Artwork-Trailer1-original-GTAVI.png/revision/latest?format=original",
    heroUrlOverride: "https://static.wikia.nocookie.net/gtawiki/images/0/05/Artwork-Trailer1-original-GTAVI.png/revision/latest?format=original",
    screenshotUrlsOverride: [
      "https://static.wikia.nocookie.net/gtawiki/images/c/c9/OfficialScreenshots-GTAVI-PromotionalWebsite-JasonDuval-SS5.jpg/revision/latest?format=original",
      "https://static.wikia.nocookie.net/gtawiki/images/f/f3/OfficialScreenshots-GTAVI-PromotionalWebsite-LuciaCaminos-SS1.jpg/revision/latest?format=original",
      "https://static.wikia.nocookie.net/gtawiki/images/9/9a/OfficialScreenshots-GTAVI-PromotionalWebsite-LeonidaKeys-SS1.jpg/revision/latest?format=original",
      "https://static.wikia.nocookie.net/gtawiki/images/f/fa/OfficialScreenshots-GTAVI-PromotionalWebsite-ViceCity-SS8.jpg/revision/latest?format=original",
      "https://static.wikia.nocookie.net/gtawiki/images/0/0d/OfficialScreenshots-GTAVI-PromotionalWebsite-PortGellhorn-SS1.jpg/revision/latest?format=original",
      "https://static.wikia.nocookie.net/gtawiki/images/4/40/OfficialScreenshots-GTAVI-PromotionalWebsite-Ambrosia-SS1.jpg/revision/latest?format=original",
      "https://static.wikia.nocookie.net/gtawiki/images/6/61/OfficialScreenshots-GTAVI-PromotionalWebsite-Grassrivers-SS4.jpg/revision/latest?format=original",
      "https://static.wikia.nocookie.net/gtawiki/images/e/e2/OfficialScreenshots-GTAVI-PromotionalWebsite-MountKalaga-SS6.jpg/revision/latest?format=original"
    ],
    trailerUrlsOverride: [
      {
        url: "QdBZY2fkU-0", // YouTube video ID for GTA VI Trailer 1
        posterUrl: "https://static.wikia.nocookie.net/gtawiki/images/0/05/Artwork-Trailer1-original-GTAVI.png/revision/latest?format=original",
        provider: "youtube"
      }
    ],
    screenshots: [],
    trailers: [],
  },

  // Elden Ring
  1245620: {
    screenshots: [
      "ss_943bf6fe62352757d9070c1d33e50b92fe8539f1",
      "ss_dcdac9e4b26ac0ee5248bfd2967d764fd00cdb42",
      "ss_3c41384a24d86dddd58a8f61db77f9dc0bfda8b5",
      "ss_e0316c76f8197405c1312d072b84331dd735d60b",
      "ss_ef61b771ee6b269b1f0cb484233e07a0bfb5f81b",
      "ss_b1b91299d7e4b94201ac840aa64de54d9f5cb7f3",
      "ss_510a02cf3045e841e180f2b77fb87545e0c8b59d",
      "ss_c494372930ca791bdc6221eca134f2270fb2cb9f",
    ],
    trailers: [
      { id: 256889456, poster: "movie.293x165.jpg" },
      { id: 256864892, poster: "movie.293x165.jpg" },
    ],
  },

  // Baldur's Gate 3
  1086940: {
    screenshots: [
      "ss_c73bc54415178c07fef85f54ee26621728c77504",
      "ss_73d93bea842b93914d966622104dcb8c0f42972b",
      "ss_cf936d31061b58e98e0c646aee00e6030c410cda",
      "ss_b6a6ee6e046426d08ceea7a4506a1b5f44181543",
      "ss_6b8faba0f6831a406ce015648958da9612d14dbb",
      "ss_8fc5eba770b4a1639b31666908bdd2bbc1aa2ae4",
      "ss_31c13d137706fb4d9a4210513274a3ed9c3c7c96",
      "ss_0efa1a469a37beeb4fd0cb8e16dc99bd36357dc4",
    ],
    trailers: [
      { id: 256987424, poster: "movie.293x165.jpg" },
      { id: 256961600, poster: "movie.293x165.jpg" },
    ],
  },

  // Hogwarts Legacy
  990080: {
    screenshots: [
      "ss_725bf58485beb4aa37a3a69c1e2baa69bf3e4653",
      "ss_df93b5e8a183f7232d68be94ae78920a90de1443",
      "ss_94058497bf0f8fabdde17ee8d59bece609a60663",
      "ss_8e08976236d29b1897769257ac3c64e9264792a5",
      "ss_d4930d675af053dc1e61a876a34fc003e85e261f",
    ],
    trailers: [{ id: 256930504, poster: "movie_600x337.jpg" }],
  },

  // Counter-Strike 2
  730: {
    screenshots: [
      "ss_796601d9d67faf53486eeb26d0724347cea67ddc",
      "ss_d830cfd0550fbb64d80e803e93c929c3abb02056",
      "ss_13bb35638c0267759276f511ee97064773b37a51",
      "ss_0f8cf82d019c614760fd20801f2bb4001da7ea77",
      "ss_ef82850f036dac5772cb07dbc2d1116ea13eb163",
      "ss_76f6730dbb911650ba1f41c8e5b4bac638b5beea",
      "ss_808cdd373d78c3cf3a78e7026ebb1a15895e0670",
      "ss_ef98db5d5a4d877531a5567df082b0fb62d75c80",
    ],
    trailers: [
      { id: 256972298, poster: "movie.293x165.jpg" },
      { id: 256970298, poster: "movie.293x165.jpg" },
    ],
  },

  // Helldivers 2
  553850: {
    screenshots: [
      "ss_0c79f56fc7be1bd0102f2ca1c92c8f0900daf4fb",
      "ss_33e684e9cb2517af1599f0ca2b57d65ee82c2e51",
      "ss_8949ed7dd24a02d5ea13b08fc5c04fab400dc4bd",
      "ss_50afbbc4d811c38fe9f64c1fc8d7eb9d9da6d24c",
      "ss_cb276fe9f0b09683bdbc496f82b405dbe0ffa1f1",
      "ss_d0ac3830833a68d19d4a97c70aef0fba20bf0761",
      "ss_3b08a991443164a65f84f1bd9f1363e6c2ec4581",
      "ss_8f4af550ecbee08abb616b12cbb3896174dce153",
    ],
    trailers: [
      { id: 257283767, poster: "movie_600x337.jpg" },
      { id: 257186746, poster: "movie_600x337.jpg" },
    ],
  },

  // Palworld
  1623730: {
    screenshots: [
      "ss_f81b7c4f20be3b99f76a1415c4cdb9b444c99b97",
      "ss_a9fa84f0c21bc536f00925ab4586e8c4f587c2b7",
      "ss_b3cea7c9f04a67d784d4c6a0c157a11d6268b189",
      "ss_06e27c15c7b4b10233c937b887cf6a6925c83009",
      "ss_0c8cbc20442b948c91b02d9e1b41bf0638a07c08",
      "ss_a99fba5536acde781bd863cb3555c10b5b96c0ae",
      "ss_1e47bb8bbfaaaf3282bfb5d253378832b55c4e56",
      "ss_6ce0960860f1009b7d10ba225ead4cc377286115",
    ],
    trailers: [
      { id: 257251173, poster: "movie_600x337.jpg" },
      { id: 257063169, poster: "movie_600x337.jpg" },
    ],
  },

  // Marvel Rivals
  2767030: {
    screenshots: [
      "ss_4aa8355a56a75f44f365db8a6cbff0eec5a7265a",
      "ss_896a2342ddb3515f291f88adf991f77f1f484663",
      "ss_4e3f25e1864028fff9ebe96a92081a5a732bd22d",
      "ss_ffa8f90ec0513b98ad417331c1e369ae990097f8",
      "ss_c085dbaddb04d70875333400e8ff564ca9778620",
      "ss_6b131db0a7190b40f0c1305a05bdc2b6a1daea32",
      "ss_9c62d5330eab8df3a2c76e68662767bf68d755c2",
      "ss_f2e75daef3f7177d896409b6dd69b62e4088dc23",
    ],
    trailers: [
      { id: 257337215, poster: "movie_600x337.jpg" },
      { id: 257321337, poster: "movie_600x337.jpg" },
    ],
  },

  // Stardew Valley
  413150: {
    screenshots: [
      "ss_b887651a93b0525739049eb4194f633de2df75be",
      "ss_9ac899fe2cda15d48b0549bba77ef8c4a090a71c",
      "ss_4fa0866709ede3753fdf2745349b528d5e8c4054",
      "ss_d836f0a5b0447fb6a2bdb0a6ac5f954949d3c41e",
      "ss_10628b4a811c0a925a1433d4323f78c7017dbbe4",
      "ss_6422d297347258086b389e3d5d9c0e0c698312e4",
      "ss_a3ddf22cda3bd722df77dbdd58dbec393906b654",
      "ss_30aeedc47e731232ade368831a598d6545346f70",
    ],
    trailers: [{ id: 256815967, poster: "movie.293x165.jpg" }],
  },

  // Sekiro: Shadows Die Twice
  814380: {
    screenshots: [
      "ss_0f7b0f8ed9ffc49aba26f9328caa9a1d59ad60f0",
      "ss_2685dd844a2a523b6c7ec207d46a538db6a908cd",
      "ss_15f0e9982621aed44900215ad283811af0779b1d",
      "ss_1e6f5540866a5564d65df915c22fe1e57e336a6f",
      "ss_3d6b38c382c0eafb02dc90d22f33fd292e4e5cf3",
    ],
    trailers: [
      { id: 256806899, poster: "movie.293x165.jpg" },
      { id: 256770769, poster: "movie.293x165.jpg" },
    ],
  },

  // Resident Evil 4 (2023 Remake)
  2050650: {
    screenshots: [
      "ss_59d1b19964cc532213df92c8287b75a0bffeb33c",
      "ss_ab807f8ad9e968a620777caf483cb6020367b9ee",
      "ss_0442f7fb4327d79802c2db8ea8d23d228a28d896",
      "ss_69810f4cd155912fdfdd21da70181df7d454c874",
      "ss_0596bac955340495562f3ff2538756ebd9a7f073",
      "ss_0554b945aafc847d55f780f7968de00aafa968a3",
      "ss_29ffb23060c862bcbe1d1434e83d41ab10484d8e",
      "ss_22d21ef8c4e54cc5f8418f9b233178bf7869ee01",
    ],
    trailers: [
      { id: 256998130, poster: "movie.293x165.jpg" },
      { id: 256938322, poster: "movie.293x165.jpg" },
    ],
  },

  // Marvel's Spider-Man Remastered
  1817070: {
    screenshots: [
      "ss_dfe778bf6d66e952e4acd4e1f926f7615b609ddf",
      "ss_427677cf78195df94702f0a963cd9eaeb9d8935a",
      "ss_dfba6f2477bfa42be69ddfdffbd421d3943d20bf",
      "ss_5b5448df07bc74ba236f2c007fd0ec19cc1d22b6",
      "ss_ad14a7daa190cb150fbb070afc70bc64d66a5e2e",
      "ss_000ef57509c773d07a94c1b8c27a8f8966274d62",
      "ss_7be97aa12cfc0e8feccdbb95dac3de71480f2140",
      "ss_7c2b250a3dfcf7a48b61e6b911894be1d78be8ec",
    ],
    trailers: [{ id: 256900369, poster: "movie.293x165.jpg" }],
  },
};

const STEAM_ASSET_CDN = "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps";
const STEAM_VIDEO_CDN = "https://video.fastly.steamstatic.com/store_trailers";

export function buildScreenshots(appid: number): Screenshot[] {
  const m = STEAM_MEDIA[appid];
  if (m?.screenshotUrlsOverride && m.screenshotUrlsOverride.length > 0) {
    return m.screenshotUrlsOverride.map((entry) => {
      if (typeof entry !== "string") return entry;
      return {
        url: entry,
        thumbUrl: entry.replace(".1920x1080.", ".600x338."),
      };
    });
  }
  const ids = m?.screenshots ?? [];
  if (ids.length > 1 && new Set(ids).size !== ids.length) {
    // Soft guard — surfaces accidental dup paste during curation.
    console.warn(`[steam-media] duplicate screenshots for appid ${appid}`);
  }
  return ids.map((id) => ({
    url: `${STEAM_ASSET_CDN}/${appid}/${id}.1920x1080.jpg`,
    thumbUrl: `${STEAM_ASSET_CDN}/${appid}/${id}.600x338.jpg`,
  }));
}

export function buildTrailers(appid: number): Trailer[] {
  const m = STEAM_MEDIA[appid];
  if (m?.trailerUrlsOverride && m.trailerUrlsOverride.length > 0) {
    return m.trailerUrlsOverride.map((t, i) => ({
      id: `trailer-${i}`,
      provider: t.provider ?? "self",
      url: t.url,
      posterUrl: t.posterUrl,
    }));
  }
  const movies = m?.trailers ?? [];
  return movies.map((mv) => {
    // `poster` may be either a full URL or a bare Steam filename like
    // "movie_600x337.jpg". When it's a filename we join it with the
    // movie-id-keyed asset path used by Steam's CDN.
    let posterUrl: string;
    if (!mv.poster) {
      posterUrl = `${STEAM_ASSET_CDN}/${mv.id}/movie.293x165.jpg`;
    } else if (mv.poster.startsWith("http")) {
      posterUrl = mv.poster;
    } else {
      posterUrl = `${STEAM_ASSET_CDN}/${mv.id}/${mv.poster}`;
    }
    return {
      id: String(mv.id),
      provider: "self" as const,
      url: `${STEAM_VIDEO_CDN}/${mv.id}/movie480_vp9.webm`,
      posterUrl,
    };
  });
}
