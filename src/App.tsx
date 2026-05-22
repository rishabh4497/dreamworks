import { Navigate, Route, Routes } from "react-router-dom";
import { type ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StuckHelperOverlay } from "@/components/social/StuckHelperOverlay";
import { OverlayBrowser } from "@/components/social/OverlayBrowser";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { LoginPage } from "@/pages/LoginPage";
import { StoreHomePage } from "@/pages/StoreHomePage";
import { CategoryPage } from "@/pages/CategoryPage";
import { SearchPage } from "@/pages/SearchPage";
import { GameDetailPage } from "@/pages/GameDetailPage";
import { TagPage } from "@/pages/TagPage";
import { DeveloperPage } from "@/pages/DeveloperPage";
import { DeveloperPortalPage } from "@/pages/DeveloperPortalPage";
import { PublisherPage } from "@/pages/PublisherPage";
import { LibraryPage } from "@/pages/LibraryPage";
import { LibraryGamePage } from "@/pages/LibraryGamePage";
import { LibraryCollectionPage } from "@/pages/LibraryCollectionPage";
import { DownloadsPage } from "@/pages/DownloadsPage";
import { WishlistPage } from "@/pages/WishlistPage";
import { CartPage } from "@/pages/CartPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { OrderConfirmationPage } from "@/pages/OrderConfirmationPage";
import { FeedPage } from "@/pages/FeedPage";
import { NewsArticlePage } from "@/pages/NewsArticlePage";
import { ForumPage } from "@/pages/ForumPage";
import { ThreadPage } from "@/pages/ThreadPage";
import { WorkshopHomePage } from "@/pages/workshop/WorkshopHomePage";
import { DreamworksPlusPage } from "@/pages/DreamworksPlusPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { FriendsPage } from "@/pages/FriendsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { DbHomePage } from "@/pages/db/DbHomePage";
import { GameDbPage } from "@/pages/db/GameDbPage";
import { TopChartsPage } from "@/pages/db/TopChartsPage";
import { SalesTrackerPage } from "@/pages/db/SalesTrackerPage";
import { CalendarPage } from "@/pages/db/CalendarPage";
import { AccountAnalyticsPage } from "@/pages/db/AccountAnalyticsPage";
import { ModerationQueuePage } from "@/pages/db/ModerationQueuePage";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";

function IndexRoute() {
  const startupLocation = useUiStore((s) => s.settings?.startupLocation || "store");
  return <Navigate to={`/${startupLocation}`} replace />;
}

function AuthGuard({ children }: { children: ReactNode }) {
  const authState = useAuthStore((s) => s.authState);
  if (authState.type !== "Authenticated") {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <AppLayout />
              <StuckHelperOverlay />
              {/* <OverlayBrowser /> Hidden by default, toggled via hotkey in real app */}
            </AuthGuard>
          }
        >
          <Route index element={<IndexRoute />} />
          <Route path="store" element={<StoreHomePage />} />
          <Route path="store/category/:slug" element={<CategoryPage />} />
          <Route path="store/tag/:slug" element={<TagPage />} />
          <Route path="store/search" element={<SearchPage />} />
          <Route path="store/game/:gameId" element={<GameDetailPage />} />
          <Route path="developer/:slug" element={<DeveloperPage />} />
          <Route path="publisher/:slug" element={<PublisherPage />} />
          <Route path="developer-portal" element={<DeveloperPortalPage />} />

          <Route path="db" element={<DbHomePage />} />
          <Route path="db/game/:gameId" element={<GameDbPage />} />
          <Route path="db/charts/top-played" element={<TopChartsPage />} />
          <Route path="db/charts/top-wishlisted" element={<TopChartsPage />} />
          <Route path="db/charts/trending" element={<TopChartsPage />} />
          <Route path="db/charts/recently-updated" element={<TopChartsPage />} />
          <Route path="db/charts/free" element={<TopChartsPage />} />
          <Route path="db/sales" element={<SalesTrackerPage />} />
          <Route path="db/calendar" element={<CalendarPage />} />
          <Route path="db/account" element={<AccountAnalyticsPage />} />
          <Route path="db/moderation" element={<ModerationQueuePage />} />

          <Route path="feed" element={<FeedPage />} />
          <Route path="feed/news/:slug" element={<NewsArticlePage />} />
          <Route path="feed/forums/:gameId" element={<ForumPage />} />
          <Route path="feed/forums/:gameId/:threadId" element={<ThreadPage />} />

          <Route path="news" element={<Navigate to="/feed?tab=news" replace />} />
          <Route path="forums" element={<Navigate to="/feed?tab=forums" replace />} />

          <Route path="plus" element={<DreamworksPlusPage />} />

          <Route path="workshop" element={<WorkshopHomePage />} />
          <Route path="workshop/:gameId" element={<WorkshopHomePage />} />

          <Route path="library" element={<LibraryPage />} />
          <Route path="library/collection/:collectionId" element={<LibraryCollectionPage />} />
          <Route path="library/:gameId" element={<LibraryGamePage />} />
          <Route path="downloads" element={<DownloadsPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="cart/checkout" element={<CheckoutPage />} />
          <Route path="cart/order/:orderId" element={<OrderConfirmationPage />} />

          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/:userId" element={<ProfilePage />} />
          <Route path="friends" element={<FriendsPage />} />
          <Route path="settings" element={<SettingsPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
