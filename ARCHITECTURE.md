# Architecture

This document is the canonical map of how Dreamworks fits together. If you're touching the codebase, read this first; every shortcut here is documented in deeper detail under [docs/](docs/).

## 1. Goals and constraints

- **Dual-target from a single bundle.** The same React app runs in the browser (Vite) and inside a Tauri 2 native shell. No file outside [src/lib/platform.ts](src/lib/platform.ts) imports `@tauri-apps/*` at the top level. The web bundle must compile and run without exercising a single Tauri code path.
- **Mock-first, Firebase-ready.** Every view reads through a thin API façade ([src/lib/api/](src/lib/api/)) that today returns mock seed data and tomorrow returns Firestore documents. Swapping is a one-file change per resource. Pages, components, hooks and stores never import from [src/lib/mock/](src/lib/mock/) directly.
- **Single source of truth for shapes.** Every interface lives in [src/lib/types.ts](src/lib/types.ts).
- **Glassmorphic dark UI** that mirrors the sister `dreams-launcher` project. Tokens live in [src/styles/globals.css](src/styles/globals.css) — no hard-coded hex values in components.
- **Yarn only.** `package-lock.json` must never appear in the repo.

The full list of non-negotiables is in [CLAUDE.md](CLAUDE.md); the rest of this doc shows how those rules manifest as code.

## 2. Runtime view

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Host process                                                                 │
│   • Browser                                  • Tauri 2 native shell           │
│     yarn dev → http://localhost:5173           yarn tauri:dev (1400×900)      │
│     yarn build → static dist/                  yarn tauri:build → installers  │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ React 19 app (single Vite bundle)                                            │
│                                                                              │
│   main.tsx                                                                   │
│     • createQueryClient → QueryClientProvider                                │
│     • useThemeStore.getState(); useAuthStore.initialize()                    │
│     • Global click handler → openExternal() for http(s) anchors              │
│     • BrowserRouter → <App />                                                │
│                                                                              │
│   App.tsx                                                                    │
│     • ErrorBoundary                                                          │
│     • Public:  /login, /auth-helper                                          │
│     • Private: AuthGuard → AppLayout (Sidebar + Topbar + <Outlet/>)          │
│       └── Desktop-only routes wrapped in <DesktopOnly>                       │
│       └── Admin routes wrapped in <RoleGuard roles={['admin']}>              │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ State + data layer                                                           │
│                                                                              │
│   Zustand stores (src/stores/*)              React Query hooks (src/hooks/*) │
│     • Local / cross-page UI state              • One hook per server resource│
│     • auth, cart, library, wishlist, theme,    • use-games, use-apps,        │
│       feed, forums, notifications, profile,      use-friends, use-forums,    │
│       toast, ui, accent, downloads, …            use-charts, use-admin, …    │
│                                                                              │
│   src/lib/api/* — async façade (32 modules, one per resource)                │
│     │                                                                        │
│     ├── mock branch  →  src/lib/mock/* + _delay() for realistic loading      │
│     └── firebase branch  →  Firestore via getDb(), Auth via                  │
│                              getFirebaseAuth(), Storage via uploadAsset()    │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Backends                                                                     │
│   • Firebase Auth                  • Firebase Storage (uploadAsset)          │
│   • Firestore (dw_* collections)   • Firebase Functions (Gemini proxy)       │
│   • Local FS via Tauri plugin-fs (desktop scanner / install manifests)       │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 3. Layered breakdown

### 3.1 Entry and providers

- [src/main.tsx](src/main.tsx) creates the React root, wires `StrictMode` → `QueryClientProvider` → `BrowserRouter` → `<App/>`. It triggers store init side-effects (`useThemeStore.getState()`, `useAuthStore.getState().initialize()`) and registers a document-level click handler that redirects external `<a>` clicks through `openExternal()` so the Tauri webview never opens them in-window.
- [src/lib/query-client.ts](src/lib/query-client.ts) constructs the `QueryClient`.

### 3.2 Routing and guards

- All path strings live in [src/lib/routes.ts](src/lib/routes.ts) as `ROUTES`, plus a `DESKTOP_ONLY_ROUTES` set covering `/library`, `/downloads`, `/settings`, `/cloud-saves`, `/compatibility`, `/diagnostics`.
- [src/App.tsx](src/App.tsx) declares the route tree. Public routes (`/login`, `/auth-helper`) sit outside the guard. Everything else is wrapped in `AuthGuard → AppLayout`. Desktop-only pages wrap their element in `<DesktopOnly>`; admin pages wrap a `<RoleGuard roles={['admin']}>` around `<AdminPortalPage />`.
- The index route reads `useUiStore().settings.startupLocation` so users can pick which screen the app opens on.

See [docs/routing.md](docs/routing.md).

### 3.3 UI shell

- [src/components/layout/AppLayout.tsx](src/components/layout/AppLayout.tsx) is the chrome: sidebar on the left, top bar across the top, `<Outlet/>` for the routed page, and a portal for `<Toaster/>`. A dynamic accent gradient pulled from `useAccentStore` tints the background per visited game.
- [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx) builds the nav from `ROUTES`, hides desktop-only sections on web (via `usePlatform`), and shows admin links only when the auth profile has the right role.
- [src/components/layout/DesktopOnly.tsx](src/components/layout/DesktopOnly.tsx) renders its children when `isDesktop()`, otherwise an explanation card.
- [src/components/common/RoleGuard.tsx](src/components/common/RoleGuard.tsx) checks `useAuthStore().profile.role` against an allow-list.

See [docs/design-system.md](docs/design-system.md).

### 3.4 Pages

Pages are organized by domain:

- [src/pages/](src/pages/) — store, cart/checkout, library, feed/forums, profile, settings, etc.
- [src/pages/admin/](src/pages/admin/) — submissions queue, app review, users, audit log, creator review.
- [src/pages/db/](src/pages/db/) — Dreamworks DB analytics (top charts, sales tracker, calendar, game DB, account analytics).
- [src/pages/developer-portal/](src/pages/developer-portal/) — apps list, store-page editor, builds manager, achievements, pricing, publish workflow, publisher / studio profile editors.
- [src/pages/workshop/](src/pages/workshop/) — workshop home.

### 3.5 Components

- [src/components/ui/](src/components/ui/) — primitive widgets (button, card, badge, modal, input, switch, skeleton, chart container, price tag, rating bar, toggle-row).
- Feature folders mirror the page domains: [store/](src/components/store/), [home/](src/components/home/), [library/](src/components/library/), [downloads/](src/components/downloads/), [community/](src/components/community/), [forums/](src/components/forums/), [social/](src/components/social/), [notifications/](src/components/notifications/), [wishlist/](src/components/wishlist/), [cart/](src/components/cart/), [profile/](src/components/profile/), [avatar/](src/components/avatar/), [settings/](src/components/settings/), [db/](src/components/db/), [admin/](src/components/admin/), [developer/](src/components/developer/), [workshop/](src/components/workshop/), [features/](src/components/features/).
- [src/components/common/](src/components/common/) — `ErrorBoundary`, `EmptyState`, `ImageDropzone`, `LoadingSpinner`, `RoleGuard`, `Toaster`.

### 3.6 State

- **Zustand stores** in [src/stores/](src/stores/): `auth-store`, `cart-store`, `library-store`, `wishlist-store`, `download-store`, `feed-store`, `forums-store`, `notifications-store`, `profile-store`, `recently-viewed-store`, `theme-store`, `toast-store`, `ui-store`, `user-reviews-store`, `accent-store`. One store per file, exported as `useXxxStore`.
- **React Query hooks** in [src/hooks/](src/hooks/): one hook per server resource (`use-games`, `use-apps`, `use-friends`, `use-forums`, `use-charts`, `use-admin`, `use-audit-log`, `use-submissions`, `use-cloud-saves`, `use-recommendations`, `use-news`, …). Each returns the React Query result object directly.

See [docs/state-management.md](docs/state-management.md).

### 3.7 Data façade

- [src/lib/api/](src/lib/api/) holds 32 modules — `games.ts`, `apps.ts`, `app-builds.ts`, `app-achievements.ts`, `orders.ts`, `submissions.ts`, `admin.ts`, `moderation.ts`, `forums.ts`, `feed.ts`, `reviews.ts`, `friends.ts`, `news.ts`, `charts.ts`, `game-db.ts`, `compatibility.ts`, `downloads.ts`, `cloud-saves.ts`, `install-manifests.ts`, `collections.ts`, `entitlements.ts`, `developers.ts`, `publishers.ts`, `developer-portal-migrate.ts`, `launcher-accounts.ts`, `notifications.ts`, `workshop.ts`, `storage.ts`, `user.ts`, `account.ts`, `categories.ts`, `gemini.ts`.
- All functions are async (even when the mock branch resolves synchronously) and call [src/lib/api/_delay.ts](src/lib/api/_delay.ts) to simulate latency so React Query loading states behave realistically.
- Mock seed data in [src/lib/mock/](src/lib/mock/) is the only thing the mock branch reads. Imports from `mock/` outside `api/` are a bug.

See [docs/data-layer.md](docs/data-layer.md).

### 3.8 Platform abstraction

[src/lib/platform.ts](src/lib/platform.ts) is the only file that may import `@tauri-apps/*`, always with `await import(...)` gated by `isDesktop()`. Surface area:

| Function | Web fallback |
| --- | --- |
| `isDesktop()` | returns `false` |
| `getOS()` | returns `"web"` |
| `openExternal(url)` | `window.open(url, "_blank", "noopener,noreferrer")` |
| `notify(title, body)` | Web Notifications API |
| `invokeDesktop(cmd, args)` | returns `null` |
| `listenEvent(event, cb)` | returns no-op unlistener |
| `readTextFileSafe`, `writeTextFileSafe`, `readDirSafe`, `pathExistsSafe` | return `null` / `false` / `[]` |
| `homeDirSafe()` | returns `"/"` |
| `uploadAsset(file, path, opts)` | Firebase Storage on both targets; falls back to inline data URL on storage errors |
| `dataUrlToBlob(dataUrl)` | pure utility |

See [docs/platform-layer.md](docs/platform-layer.md).

### 3.9 Desktop wrapper

- [src-tauri/](src-tauri/) holds the Rust crate. `Cargo.toml` pins Tauri 2.11.2, plugins `tauri-plugin-log`, `tauri-plugin-shell`, `tauri-plugin-notification`, `tauri-plugin-os`, `tauri-plugin-fs`, plus `sysinfo` and `tokio` for the diagnostics live monitor.
- [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json) defines a 1400×900 window (min 1024×640), bundle identifier `tech.dreams.dreamworks`, all-platform bundle targets, and a CSP that allows Firebase + YouTube + Picsum image hosts.
- [src-tauri/capabilities/](src-tauri/capabilities/) declares Tauri's capability-based permissions.

See [docs/tauri-desktop.md](docs/tauri-desktop.md).

### 3.10 Firebase backend

- [src/lib/firebase.ts](src/lib/firebase.ts) lazy-initializes the Firebase app from `import.meta.env.VITE_FIREBASE_*` and exports singleton getters (`getFirebaseApp`, `getDb`, `getFirebaseAuth`, `getFirebaseFunctions`). It also exports a `COLLECTIONS` map — every collection name uses the `dw_` prefix except the shared `users` collection.
- [firestore.rules](firestore.rules) and [firestore.indexes.json](firestore.indexes.json) cover security and composite indexes.
- [functions/](functions/) holds Firebase Cloud Functions (Gemini proxy for the AI overviews — the API key never leaves the server).
- [scripts/seed-firebase.ts](scripts/seed-firebase.ts) is idempotent: it (re)creates 22 studio accounts in Auth, seeds Firestore collections, uploads capsule images to Storage, and regenerates [MOCK_USERS.md](MOCK_USERS.md).

See [docs/firebase.md](docs/firebase.md).

## 4. Cross-cutting concerns

- **Auth.** [src/stores/auth-store.ts](src/stores/auth-store.ts) holds `authState` as a tagged union (`Unauthenticated | Loading | Authenticated`) plus a `profile` carrying the user role (`user`, `admin`, `publisher`, `developer`). The store is initialized in `main.tsx` and consumed by `AuthGuard` and `RoleGuard`.
- **Theming.** [src/styles/globals.css](src/styles/globals.css) defines two themes (`[data-theme="dark"]` default, `[data-theme="light"]`) as CSS variables, then maps them into Tailwind via `@theme inline`. `useThemeStore` flips the `data-theme` attribute. There is no `tailwind.config.js`.
- **Accent tint.** [src/stores/accent-store.ts](src/stores/accent-store.ts) extracts a per-game accent color used by `AppLayout` to tint the background gradient.
- **Errors.** A top-level [ErrorBoundary](src/components/common/ErrorBoundary.tsx) wraps the route tree; pages can throw freely.
- **Toasts.** [src/stores/toast-store.ts](src/stores/toast-store.ts) plus [Toaster](src/components/common/Toaster.tsx) for transient notifications.
- **External links.** Global click handler in `main.tsx` reroutes `http(s)` anchors through `openExternal()`. Components should still call `openExternal()` directly rather than `<a target="_blank">`.

## 5. Build and run targets

| Target | Command | Output |
| --- | --- | --- |
| Web dev | `yarn dev` | Vite dev server at `http://localhost:5173` |
| Web prod | `yarn build` | Static bundle in `dist/`, deployable to any host (Firebase Hosting wired in [firebase.json](firebase.json)) |
| Desktop dev | `yarn tauri:dev` | Native shell wrapping the Vite dev server |
| Desktop prod | `yarn tauri:build` | `.dmg` / `.app` (macOS), `.msi` / `.exe` (Windows), `.AppImage` / `.deb` (Linux) |

The web bundle never reaches Tauri code paths because every `@tauri-apps/*` call is behind `await import()` gated by `isDesktop()`. Desktop-only routes are also hidden from the web sidebar via `usePlatform()`.

See [docs/deployment.md](docs/deployment.md).

## 6. Architectural rules (do not drift)

These are lifted from [CLAUDE.md](CLAUDE.md) so they're visible alongside the architecture:

1. **No `@tauri-apps/*` imports outside [src/lib/platform.ts](src/lib/platform.ts).** Always lazy via `await import()` and gated by `isDesktop()`.
2. **No `src/lib/mock/*` imports outside [src/lib/api/](src/lib/api/).** Pages, components, hooks, stores read through the façade.
3. **All Firestore collections are prefixed `dw_`** (except `users`). See [COLLECTIONS in src/lib/firebase.ts](src/lib/firebase.ts).
4. **No hard-coded route literals.** Import from [src/lib/routes.ts](src/lib/routes.ts).
5. **No hard-coded hex colors in components.** Use the CSS variable tokens defined in [src/styles/globals.css](src/styles/globals.css).
6. **`cn()` for class merging.** Import from [src/lib/utils.ts](src/lib/utils.ts); never concatenate class strings manually when conditional classes are involved.
7. **External links go through `openExternal()`** from `@/lib/platform`. The global click handler in `main.tsx` is only a safety net.
8. **Single types source.** Extend [src/lib/types.ts](src/lib/types.ts); don't define cross-cutting types inline.
9. **Yarn only.** No `npm install`, no `npx` for installed binaries, no `package-lock.json`.

## See also

- [docs/getting-started.md](docs/getting-started.md)
- [docs/project-structure.md](docs/project-structure.md)
- [docs/conventions.md](docs/conventions.md)
- [docs/data-layer.md](docs/data-layer.md)
