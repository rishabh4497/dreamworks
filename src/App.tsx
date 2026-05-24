import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DesktopOnly } from "@/components/layout/DesktopOnly";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { RoleGuard } from "@/components/common/RoleGuard";
import { LoginPage } from "@/pages/LoginPage";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";

// Lazy-loaded pages — split into per-page chunks so the initial bundle ships
// only the auth shell. The helper preserves named exports.
function lazyNamed<K extends string, M extends Record<K, ComponentType<unknown>>>(
  loader: () => Promise<M>,
  name: K,
) {
  return lazy(async () => {
    const mod = await loader();
    return { default: mod[name] };
  });
}

const AuthHelperPage = lazyNamed(() => import("@/pages/AuthHelperPage"), "AuthHelperPage");
const StoreHomePage = lazyNamed(() => import("@/pages/StoreHomePage"), "StoreHomePage");
const CategoryPage = lazyNamed(() => import("@/pages/CategoryPage"), "CategoryPage");
const SearchPage = lazyNamed(() => import("@/pages/SearchPage"), "SearchPage");
const GameDetailPage = lazyNamed(() => import("@/pages/GameDetailPage"), "GameDetailPage");
const TagPage = lazyNamed(() => import("@/pages/TagPage"), "TagPage");
const DeveloperPage = lazyNamed(() => import("@/pages/DeveloperPage"), "DeveloperPage");
const DeveloperPortalPage = lazyNamed(() => import("@/pages/DeveloperPortalPage"), "DeveloperPortalPage");
const PublisherPage = lazyNamed(() => import("@/pages/PublisherPage"), "PublisherPage");
const AppListPage = lazyNamed(() => import("@/pages/developer-portal/AppListPage"), "AppListPage");
const AppNewPage = lazyNamed(() => import("@/pages/developer-portal/AppNewPage"), "AppNewPage");
const AppEditorLayout = lazyNamed(() => import("@/pages/developer-portal/AppEditorLayout"), "AppEditorLayout");
const StorePageEditor = lazyNamed(() => import("@/pages/developer-portal/StorePageEditor"), "StorePageEditor");
const BuildsManager = lazyNamed(() => import("@/pages/developer-portal/BuildsManager"), "BuildsManager");
const AchievementsManager = lazyNamed(() => import("@/pages/developer-portal/AchievementsManager"), "AchievementsManager");
const SdkDocsPage = lazyNamed(() => import("@/pages/developer-portal/SdkDocsPage"), "SdkDocsPage");
const PricingManager = lazyNamed(() => import("@/pages/developer-portal/PricingManager"), "PricingManager");
const PublishPage = lazyNamed(() => import("@/pages/developer-portal/PublishPage"), "PublishPage");
const StudioProfileEditor = lazyNamed(() => import("@/pages/developer-portal/StudioProfileEditor"), "StudioProfileEditor");
const PublisherProfileEditor = lazyNamed(() => import("@/pages/developer-portal/PublisherProfileEditor"), "PublisherProfileEditor");
const AnalyticsPage = lazyNamed(() => import("@/pages/developer-portal/AnalyticsPage"), "AnalyticsPage");
const MarketingPage = lazyNamed(() => import("@/pages/developer-portal/MarketingPage"), "MarketingPage");
const LiveOpsPage = lazyNamed(() => import("@/pages/developer-portal/LiveOpsPage"), "LiveOpsPage");
const ModerationQueuePage = lazyNamed(() => import("@/pages/db/ModerationQueuePage"), "ModerationQueuePage");
const AdminPortalPage = lazyNamed(() => import("@/pages/admin/AdminPortalPage"), "AdminPortalPage");
const AdminDashboardPage = lazyNamed(() => import("@/pages/admin/AdminDashboardPage"), "AdminDashboardPage");
const AppSubmissionsQueuePage = lazyNamed(() => import("@/pages/admin/AppSubmissionsQueuePage"), "AppSubmissionsQueuePage");
const AppSubmissionDetailPage = lazyNamed(() => import("@/pages/admin/AppSubmissionDetailPage"), "AppSubmissionDetailPage");
const AppsAdminPage = lazyNamed(() => import("@/pages/admin/AppsAdminPage"), "AppsAdminPage");
const UsersPage = lazyNamed(() => import("@/pages/admin/UsersPage"), "UsersPage");
const UserDetailPage = lazyNamed(() => import("@/pages/admin/UserDetailPage"), "UserDetailPage");
const PublisherReviewPage = lazyNamed(() => import("@/pages/admin/CreatorReviewPage"), "PublisherReviewPage");
const StudioReviewPage = lazyNamed(() => import("@/pages/admin/CreatorReviewPage"), "StudioReviewPage");
const AuditLogPage = lazyNamed(() => import("@/pages/admin/AuditLogPage"), "AuditLogPage");
const CdnAdminPage = lazyNamed(() => import("@/pages/admin/CdnAdminPage"), "CdnAdminPage");
const TeamAccessPage = lazyNamed(() => import("@/pages/admin/TeamAccessPage"), "TeamAccessPage");
const InviteCreatorPage = lazyNamed(() => import("@/pages/admin/InviteCreatorPage"), "InviteCreatorPage");
const ApplicationsQueuePage = lazyNamed(() => import("@/pages/admin/ApplicationsQueuePage"), "ApplicationsQueuePage");
const CreatorApplyPage = lazyNamed(() => import("@/pages/CreatorApplyPage"), "CreatorApplyPage");
const ClaimInvitePage = lazyNamed(() => import("@/pages/ClaimInvitePage"), "ClaimInvitePage");
const ConsolePage = lazyNamed(() => import("@/pages/console/ConsolePage"), "ConsolePage");
const ConsoleUserReportPage = lazyNamed(
  () => import("@/pages/console/ConsoleUserReportPage"),
  "ConsoleUserReportPage",
);
const ConsoleStudioReportPage = lazyNamed(
  () => import("@/pages/console/ConsoleStudioReportPage"),
  "ConsoleStudioReportPage",
);
const ConsolePublisherReportPage = lazyNamed(
  () => import("@/pages/console/ConsolePublisherReportPage"),
  "ConsolePublisherReportPage",
);
const DreamworksWrappedPage = lazyNamed(
  () => import("@/pages/DreamworksWrappedPage"),
  "DreamworksWrappedPage",
);
const StudioInsightsPage = lazyNamed(
  () => import("@/pages/developer-portal/StudioInsightsPage"),
  "StudioInsightsPage",
);
const PublisherInsightsPage = lazyNamed(
  () => import("@/pages/developer-portal/PublisherInsightsPage"),
  "PublisherInsightsPage",
);
const LibraryPage = lazyNamed(() => import("@/pages/LibraryPage"), "LibraryPage");
const LibraryGamePage = lazyNamed(() => import("@/pages/LibraryGamePage"), "LibraryGamePage");
const LibraryCollectionPage = lazyNamed(() => import("@/pages/LibraryCollectionPage"), "LibraryCollectionPage");
const DownloadsPage = lazyNamed(() => import("@/pages/DownloadsPage"), "DownloadsPage");
const WishlistPage = lazyNamed(() => import("@/pages/WishlistPage"), "WishlistPage");
const CartPage = lazyNamed(() => import("@/pages/CartPage"), "CartPage");
const CheckoutPage = lazyNamed(() => import("@/pages/CheckoutPage"), "CheckoutPage");
const OrderConfirmationPage = lazyNamed(() => import("@/pages/OrderConfirmationPage"), "OrderConfirmationPage");
const FeedPage = lazyNamed(() => import("@/pages/FeedPage"), "FeedPage");
const NewsArticlePage = lazyNamed(() => import("@/pages/NewsArticlePage"), "NewsArticlePage");
const ForumPage = lazyNamed(() => import("@/pages/ForumPage"), "ForumPage");
const ThreadPage = lazyNamed(() => import("@/pages/ThreadPage"), "ThreadPage");
const WorkshopHomePage = lazyNamed(() => import("@/pages/workshop/WorkshopHomePage"), "WorkshopHomePage");
const DreamworksPlusPage = lazyNamed(() => import("@/pages/DreamworksPlusPage"), "DreamworksPlusPage");
const ProfilePage = lazyNamed(() => import("@/pages/ProfilePage"), "ProfilePage");
const AvatarCustomizerPage = lazyNamed(() => import("@/pages/AvatarCustomizerPage"), "AvatarCustomizerPage");
const FriendsPage = lazyNamed(() => import("@/pages/FriendsPage"), "FriendsPage");
const SettingsPage = lazyNamed(() => import("@/pages/SettingsPage"), "SettingsPage");
const DiagnosticsPage = lazyNamed(() => import("@/pages/DiagnosticsPage"), "DiagnosticsPage");
const NotFoundPage = lazyNamed(() => import("@/pages/NotFoundPage"), "NotFoundPage");
const DbHomePage = lazyNamed(() => import("@/pages/db/DbHomePage"), "DbHomePage");
const GameDbPage = lazyNamed(() => import("@/pages/db/GameDbPage"), "GameDbPage");
const TopChartsPage = lazyNamed(() => import("@/pages/db/TopChartsPage"), "TopChartsPage");
const SalesTrackerPage = lazyNamed(() => import("@/pages/db/SalesTrackerPage"), "SalesTrackerPage");
const LicensesPage = lazyNamed(() => import("@/pages/LicensesPage"), "LicensesPage");
const CommunityDetailPage = lazyNamed(() => import("@/pages/CommunityDetailPage"), "CommunityDetailPage");

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

function RouteFallback() {
  return <LoadingSpinner />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
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
            <Route
              path="developer-portal"
              element={
                <RoleGuard
                  roles={["creator-developer", "creator-publisher"]}
                  fallbackPath="/become-a-creator"
                >
                  <DeveloperPortalPage />
                </RoleGuard>
              }
            >
              <Route index element={<Navigate to="/developer-portal/apps" replace />} />
              <Route path="apps" element={<AppListPage />} />
              <Route path="apps/new" element={<AppNewPage />} />
              <Route path="apps/:appId" element={<AppEditorLayout />}>
                <Route index element={<Navigate to="store-page" replace />} />
                <Route path="store-page" element={<StorePageEditor />} />
                <Route path="builds" element={<BuildsManager />} />
                <Route path="achievements" element={<AchievementsManager />} />
                <Route path="sdk" element={<SdkDocsPage />} />
                <Route path="pricing" element={<PricingManager />} />
                <Route path="publish" element={<PublishPage />} />
              </Route>
              <Route path="studio" element={<StudioProfileEditor />} />
              <Route path="publisher" element={<PublisherProfileEditor />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="marketing" element={<MarketingPage />} />
              <Route path="ops" element={<LiveOpsPage />} />
              <Route path="studio-insights" element={<StudioInsightsPage />} />
              <Route path="publisher-insights" element={<PublisherInsightsPage />} />
            </Route>

            <Route
              path="admin"
              element={
                <RoleGuard permission="admin.access">
                  <AdminPortalPage />
                </RoleGuard>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="submissions" element={<AppSubmissionsQueuePage />} />
              <Route path="submissions/:submissionId" element={<AppSubmissionDetailPage />} />
              <Route path="applications" element={<ApplicationsQueuePage />} />
              <Route path="apps" element={<AppsAdminPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="users/:uid" element={<UserDetailPage />} />
              <Route path="team" element={<TeamAccessPage />} />
              <Route path="invite-creator" element={<InviteCreatorPage />} />
              <Route path="content-moderation" element={<ModerationQueuePage />} />
              <Route path="publishers" element={<PublisherReviewPage />} />
              <Route path="publishers/:id" element={<PublisherReviewPage />} />
              <Route path="studios" element={<StudioReviewPage />} />
              <Route path="studios/:id" element={<StudioReviewPage />} />
              <Route path="audit-log" element={<AuditLogPage />} />
              <Route path="cdn" element={<CdnAdminPage />} />
            </Route>

            <Route
              path="console"
              element={
                <RoleGuard permission="console.access">
                  <ConsolePage />
                </RoleGuard>
              }
            />
            <Route
              path="console/report/user/:uid"
              element={
                <RoleGuard permission="console.people.users.read">
                  <ConsoleUserReportPage />
                </RoleGuard>
              }
            />
            <Route
              path="console/report/studio/:id"
              element={
                <RoleGuard permission="console.creators.studios.read">
                  <ConsoleStudioReportPage />
                </RoleGuard>
              }
            />
            <Route
              path="console/report/publisher/:id"
              element={
                <RoleGuard permission="console.creators.publishers.read">
                  <ConsolePublisherReportPage />
                </RoleGuard>
              }
            />

            <Route path="become-a-creator" element={<CreatorApplyPage />} />
            <Route path="claim-invite" element={<ClaimInvitePage />} />

            <Route path="wrapped" element={<DreamworksWrappedPage />} />

            <Route path="db" element={<DbHomePage />} />
            <Route path="db/game/:gameId" element={<GameDbPage />} />
            <Route path="db/charts/top-played" element={<TopChartsPage />} />
            <Route path="db/charts/top-wishlisted" element={<TopChartsPage />} />
            <Route path="db/charts/trending" element={<TopChartsPage />} />
            <Route path="db/charts/recently-updated" element={<TopChartsPage />} />
            <Route path="db/charts/free" element={<TopChartsPage />} />
            <Route path="db/sales" element={<SalesTrackerPage />} />
            <Route path="db/calendar" element={<Navigate to="/db?tab=calendar" replace />} />
            <Route path="db/account" element={<Navigate to="/db?tab=account" replace />} />

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
            <Route path="profile/avatar" element={<AvatarCustomizerPage />} />
            <Route path="profile/:userId" element={<ProfilePage />} />
            <Route path="friends" element={<FriendsPage />} />
            <Route path="settings" element={<DesktopOnly><SettingsPage /></DesktopOnly>} />
            <Route path="settings/licenses" element={<LicensesPage />} />

            <Route path="voice" element={<Navigate to="/feed?tab=voice" replace />} />
            <Route path="communities" element={<Navigate to="/feed?tab=communities" replace />} />
            <Route path="communities/:slug" element={<CommunityDetailPage />} />
            <Route
              path="diagnostics"
              element={<DesktopOnly><DiagnosticsPage /></DesktopOnly>}
            />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
