import { Navigate, Route, Routes } from "react-router-dom";
import { type ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DesktopOnly } from "@/components/layout/DesktopOnly";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { LoginPage } from "@/pages/LoginPage";
import { AuthHelperPage } from "@/pages/AuthHelperPage";
import { StoreHomePage } from "@/pages/StoreHomePage";
import { CategoryPage } from "@/pages/CategoryPage";
import { SearchPage } from "@/pages/SearchPage";
import { GameDetailPage } from "@/pages/GameDetailPage";
import { TagPage } from "@/pages/TagPage";
import { DeveloperPage } from "@/pages/DeveloperPage";
import { DeveloperPortalPage } from "@/pages/DeveloperPortalPage";
import { PublisherPage } from "@/pages/PublisherPage";
import { AppListPage } from "@/pages/developer-portal/AppListPage";
import { AppNewPage } from "@/pages/developer-portal/AppNewPage";
import { AppEditorLayout } from "@/pages/developer-portal/AppEditorLayout";
import { StorePageEditor } from "@/pages/developer-portal/StorePageEditor";
import { BuildsManager } from "@/pages/developer-portal/BuildsManager";
import { AchievementsManager } from "@/pages/developer-portal/AchievementsManager";
import { PricingManager } from "@/pages/developer-portal/PricingManager";
import { PublishPage } from "@/pages/developer-portal/PublishPage";
import { StudioProfileEditor } from "@/pages/developer-portal/StudioProfileEditor";
import { PublisherProfileEditor } from "@/pages/developer-portal/PublisherProfileEditor";
import {
  AnalyticsPanel,
  MarketingPanel,
  OpsPanel,
} from "@/pages/developer-portal/LegacyPanels";
import { ModerationQueuePage } from "@/pages/db/ModerationQueuePage";
import { RoleGuard } from "@/components/common/RoleGuard";
import { AdminPortalPage } from "@/pages/admin/AdminPortalPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AppSubmissionsQueuePage } from "@/pages/admin/AppSubmissionsQueuePage";
import { AppSubmissionDetailPage } from "@/pages/admin/AppSubmissionDetailPage";
import { AppsAdminPage } from "@/pages/admin/AppsAdminPage";
import { UsersPage } from "@/pages/admin/UsersPage";
import { UserDetailPage } from "@/pages/admin/UserDetailPage";
import { PublisherReviewPage, StudioReviewPage } from "@/pages/admin/CreatorReviewPage";
import { AuditLogPage } from "@/pages/admin/AuditLogPage";
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
import { DiagnosticsPage } from "@/pages/DiagnosticsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { DbHomePage } from "@/pages/db/DbHomePage";
import { GameDbPage } from "@/pages/db/GameDbPage";
import { TopChartsPage } from "@/pages/db/TopChartsPage";
import { SalesTrackerPage } from "@/pages/db/SalesTrackerPage";
import { CalendarPage } from "@/pages/db/CalendarPage";
import { AccountAnalyticsPage } from "@/pages/db/AccountAnalyticsPage";
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
        <Route path="/auth-helper" element={<AuthHelperPage />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <AppLayout />
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
          <Route path="developer-portal" element={<DeveloperPortalPage />}>
            <Route index element={<Navigate to="/developer-portal/apps" replace />} />
            <Route path="apps" element={<AppListPage />} />
            <Route path="apps/new" element={<AppNewPage />} />
            <Route path="apps/:appId" element={<AppEditorLayout />}>
              <Route index element={<Navigate to="store-page" replace />} />
              <Route path="store-page" element={<StorePageEditor />} />
              <Route path="builds" element={<BuildsManager />} />
              <Route path="achievements" element={<AchievementsManager />} />
              <Route path="pricing" element={<PricingManager />} />
              <Route path="publish" element={<PublishPage />} />
            </Route>
            <Route path="studio" element={<StudioProfileEditor />} />
            <Route path="publisher" element={<PublisherProfileEditor />} />
            <Route path="analytics" element={<AnalyticsPanel />} />
            <Route path="marketing" element={<MarketingPanel />} />
            <Route path="ops" element={<OpsPanel />} />
          </Route>

          <Route
            path="admin"
            element={
              <RoleGuard roles={["admin"]}>
                <AdminPortalPage />
              </RoleGuard>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="submissions" element={<AppSubmissionsQueuePage />} />
            <Route path="submissions/:submissionId" element={<AppSubmissionDetailPage />} />
            <Route path="apps" element={<AppsAdminPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/:uid" element={<UserDetailPage />} />
            <Route path="content-moderation" element={<ModerationQueuePage />} />
            <Route path="publishers" element={<PublisherReviewPage />} />
            <Route path="publishers/:id" element={<PublisherReviewPage />} />
            <Route path="studios" element={<StudioReviewPage />} />
            <Route path="studios/:id" element={<StudioReviewPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
          </Route>

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

          <Route path="feed" element={<FeedPage />} />
          <Route path="feed/news/:slug" element={<NewsArticlePage />} />
          <Route path="feed/forums/:gameId" element={<ForumPage />} />
          <Route path="feed/forums/:gameId/:threadId" element={<ThreadPage />} />

          <Route path="news" element={<Navigate to="/feed?tab=news" replace />} />
          <Route path="forums" element={<Navigate to="/feed?tab=forums" replace />} />

          <Route path="plus" element={<DreamworksPlusPage />} />

          <Route path="workshop" element={<WorkshopHomePage />} />
          <Route path="workshop/:gameId" element={<WorkshopHomePage />} />

          <Route path="library" element={<DesktopOnly><LibraryPage /></DesktopOnly>} />
          <Route
            path="library/collection/:collectionId"
            element={<DesktopOnly><LibraryCollectionPage /></DesktopOnly>}
          />
          <Route
            path="library/:gameId"
            element={<DesktopOnly><LibraryGamePage /></DesktopOnly>}
          />
          <Route path="downloads" element={<DesktopOnly><DownloadsPage /></DesktopOnly>} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="cart/checkout" element={<CheckoutPage />} />
          <Route path="cart/order/:orderId" element={<OrderConfirmationPage />} />

          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/:userId" element={<ProfilePage />} />
          <Route path="friends" element={<FriendsPage />} />
          <Route path="settings" element={<DesktopOnly><SettingsPage /></DesktopOnly>} />
          <Route
            path="diagnostics"
            element={<DesktopOnly><DiagnosticsPage /></DesktopOnly>}
          />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
