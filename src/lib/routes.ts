import type { ChartType, GameId } from "./types";

export const ROUTES = {
  login: "/login",

  store: "/store",
  storeCategory: (slug: string) => `/store/category/${slug}`,
  storeTag: (slug: string) => `/store/tag/${slug}`,
  storeSearch: "/store/search",
  gameDetail: (id: GameId) => `/store/game/${id}`,
  developer: (slug: string) => `/developer/${slug}`,
  publisher: (slug: string) => `/publisher/${slug}`,
  developerPortal: "/developer-portal",
  devApps: "/developer-portal/apps",
  devAppNew: "/developer-portal/apps/new",
  devApp: (id: string) => `/developer-portal/apps/${id}`,
  devAppStorePage: (id: string) => `/developer-portal/apps/${id}/store-page`,
  devAppBuilds: (id: string) => `/developer-portal/apps/${id}/builds`,
  devAppAchievements: (id: string) => `/developer-portal/apps/${id}/achievements`,
  devAppPricing: (id: string) => `/developer-portal/apps/${id}/pricing`,
  devAppPublish: (id: string) => `/developer-portal/apps/${id}/publish`,
  devStudio: "/developer-portal/studio",
  devPublisher: "/developer-portal/publisher",
  devAnalytics: "/developer-portal/analytics",
  devMarketing: "/developer-portal/marketing",
  devOps: "/developer-portal/ops",
  devModeration: "/developer-portal/moderation",

  db: "/db",
  gameDb: (id: GameId) => `/db/game/${id}`,
  dbChart: (type: ChartType) => `/db/charts/${type}`,
  dbSales: "/db/sales",
  dbCalendar: "/db/calendar",
  dbAccount: "/db/account",

  feed: "/feed",
  news: "/feed?tab=news",
  newsArticle: (slug: string) => `/feed/news/${slug}`,

  forums: "/feed?tab=forums",
  forumGame: (id: GameId) => `/feed/forums/${id}`,
  forumThread: (gameId: GameId, threadId: string) => `/feed/forums/${gameId}/${threadId}`,

  plus: "/plus",

  workshop: "/workshop",
  workshopGame: (id: GameId) => `/workshop/${id}`,

  library: "/library",
  libraryGame: (id: GameId) => `/library/${id}`,
  libraryCollection: (id: string) => `/library/collection/${id}`,
  downloads: "/downloads",
  wishlist: "/wishlist",
  cart: "/cart",
  checkout: "/cart/checkout",
  order: (id: string) => `/cart/order/${id}`,

  profile: "/profile",
  profileOther: (uid: string) => `/profile/${uid}`,
  friends: "/friends",

  settings: "/settings",
  cloudSaves: "/cloud-saves",
  compatibility: "/compatibility",
  diagnostics: "/diagnostics",
} as const;

export const DESKTOP_ONLY_ROUTES: ReadonlySet<string> = new Set([
  ROUTES.library,
  ROUTES.downloads,
  ROUTES.settings,
  ROUTES.cloudSaves,
  ROUTES.compatibility,
  ROUTES.diagnostics,
]);

export function isDesktopOnlyPath(pathname: string): boolean {
  for (const route of DESKTOP_ONLY_ROUTES) {
    if (pathname === route || pathname.startsWith(`${route}/`)) return true;
  }
  return false;
}
