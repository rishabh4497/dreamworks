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
  devAppSdk: (id: string) => `/developer-portal/apps/${id}/sdk`,
  devAppPricing: (id: string) => `/developer-portal/apps/${id}/pricing`,
  devAppPublish: (id: string) => `/developer-portal/apps/${id}/publish`,
  devStudio: "/developer-portal/studio",
  devPublisher: "/developer-portal/publisher",
  devAnalytics: "/developer-portal/analytics",
  devMarketing: "/developer-portal/marketing",
  devOps: "/developer-portal/ops",

  admin: "/admin",
  adminSubmissions: "/admin/submissions",
  adminSubmissionDetail: (id: string) => `/admin/submissions/${id}`,
  adminApps: "/admin/apps",
  adminUsers: "/admin/users",
  adminUserDetail: (uid: string) => `/admin/users/${uid}`,
  adminContentModeration: "/admin/content-moderation",
  adminPublishers: "/admin/publishers",
  adminPublisherDetail: (id: string) => `/admin/publishers/${id}`,
  adminStudios: "/admin/studios",
  adminStudioDetail: (id: string) => `/admin/studios/${id}`,
  adminAuditLog: "/admin/audit-log",

  // Admin Console (observability / god-view). Top-level route, role-gated to
  // admins. Six top-level tabs; deeper sections live under ?sub=… on People,
  // Creators, and Health.
  console: "/console",
  consoleOverview: "/console?tab=overview",
  consolePeople: "/console?tab=people",
  consoleUsers: "/console?tab=people&sub=users",
  consoleDevices: "/console?tab=people&sub=rigs",
  consoleCreators: "/console?tab=creators",
  consoleStudios: "/console?tab=creators&sub=studios",
  consolePublishers: "/console?tab=creators&sub=publishers",
  consoleMoney: "/console?tab=money",
  consoleHealth: "/console?tab=health",
  consolePerformance: "/console?tab=health&sub=performance",
  consoleErrors: "/console?tab=health&sub=errors",
  consoleQuality: "/console?tab=health&sub=friction",
  consoleFeatures: "/console?tab=health&sub=usage",
  consoleReports: "/console?tab=reports",
  // Per-actor deep-dive reports.
  consoleUserReport: (uid: string) => `/console/report/user/${uid}`,
  consoleStudioReport: (id: string) => `/console/report/studio/${id}`,
  consolePublisherReport: (id: string) => `/console/report/publisher/${id}`,
  // User-facing Wrapped recap.
  wrapped: "/wrapped",
  // Developer/Publisher self-service insights inside the developer portal.
  devStudioInsights: "/developer-portal/studio-insights",
  devPublisherInsights: "/developer-portal/publisher-insights",

  db: "/db",
  gameDb: (id: GameId) => `/db/game/${id}`,
  dbChart: (type: ChartType) => `/db/charts/${type}`,
  dbSales: "/db/sales",
  // Calendar and My Analytics live as tabs inside the DB overview.
  dbCalendar: "/db?tab=calendar",
  dbAccount: "/db?tab=account",

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
  avatarCustomizer: "/profile/avatar",
  profileOther: (uid: string) => `/profile/${uid}`,
  friends: "/friends",

  settings: "/settings",
  licenses: "/settings/licenses",
  cloudSaves: "/cloud-saves",
  compatibility: "/compatibility",
  diagnostics: "/diagnostics",

  // CDN admin
  adminCdn: "/admin/cdn",

  // Voice + Communities live as tabs inside the Feed page.
  voice: "/feed?tab=voice",
  communities: "/feed?tab=communities",
  // Community detail still has its own route.
  community: (slug: string) => `/communities/${slug}`,
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
