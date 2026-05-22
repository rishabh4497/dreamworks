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

  db: "/db",
  gameDb: (id: GameId) => `/db/game/${id}`,
  dbChart: (type: ChartType) => `/db/charts/${type}`,
  dbSales: "/db/sales",
  dbCalendar: "/db/calendar",
  dbAccount: "/db/account",
  dbModeration: "/db/moderation",

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
} as const;
