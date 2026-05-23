# Dreamworks

A Steam-style storefront with built-in SteamDB-style analytics, shipped as both a web app and a Tauri desktop app from a single Vite + React 19 codebase. The same bundle powers browser users (store, community, analytics) and desktop users (library, downloads, cloud saves, diagnostics), with desktop-only routes gated automatically.

```
┌───────────────────────────┐   ┌────────────────────────────────────┐
│ Browser (Vite preview /   │   │ Tauri 2 shell (1400×900 native)    │
│ static host)              │   │ Rust core + WebView                │
└───────────┬───────────────┘   └───────────────┬────────────────────┘
            │                                   │
            ▼                                   ▼
           ┌──────────────────────────────────────┐
           │ React 19 app (one Vite bundle)       │
           │  Router → AuthGuard → AppLayout      │
           │  Zustand stores + React Query hooks  │
           │  src/lib/api/ façade (mock or Firebase) │
           └──────────────────────────────────────┘
                              │
                ┌─────────────┴──────────────┐
                ▼                            ▼
        Mock seed data              Firebase (Auth, Firestore,
        (src/lib/mock/*)            Storage, Functions)
```

## Features

**Store** — featured shelves, search & filters, game detail (reviews, price history, compatibility, friends-own, pre-order), cart and checkout, wishlist, Dreamworks+ subscription.
**Library (desktop)** — owned games with playtime, custom collections, install/uninstall, downloads queue, cloud-save conflict resolution, mods/workshop.
**Community** — feed, news, per-game forums + threads, friends, profiles with playtime heatmap and Dreamworks Wrapped, faceted reviews.
**Dreamworks DB** — SteamDB-style analytics: top-played / top-wishlisted / trending / recently-updated / free charts, sales tracker, release calendar, per-game price history, player count, depots, regional pricing, achievement rarity, account analytics.
**Developer Portal** — apps list, store-page editor, builds manager, achievements, regional pricing, publisher and studio profile editors, marketing / analytics / live-ops panels.
**Admin** — submission queue, app review, user management with custom claims and roles, content moderation, publisher / studio review, audit log.

## Stack

React 19.1 · TypeScript 5.8 (strict) · Vite 6.3 · Tailwind 4.1 (CSS-first via `@theme inline`) · Tauri 2.11 · Zustand 5 · TanStack React Query 5 · React Router 7 · Motion 12 · Lucide React · Recharts · Firebase 12 · Geist Sans / Geist Mono. Package manager: **yarn**.

## Quickstart

```bash
# 1. Install deps (yarn only — never npm)
yarn install

# 2. Firebase env vars
cp .env.development .env.development.local
# Edit values if you want your own Firebase project; the bundled keys
# point at the shared dev project and work out-of-the-box.

# 3. Seed Firestore + create mock studio accounts
yarn seed:firebase
# Writes 22 studio accounts + games to Firestore and regenerates
# MOCK_USERS.md with test credentials (shared password: Dreamworks2026!).

# 4a. Run the web app
yarn dev
# → http://localhost:5173

# 4b. Or run the desktop app (needs Rust toolchain)
yarn tauri:dev
```

Sign in with any account from [MOCK_USERS.md](MOCK_USERS.md) (e.g. `valve@dreamworks.test` / `Dreamworks2026!`).

## Repository map

| Path | What lives here |
| --- | --- |
| [src/](src/) | The React + TypeScript app (pages, components, hooks, stores, lib) |
| [src-tauri/](src-tauri/) | Rust Tauri 2 desktop wrapper, capabilities, icons |
| [scripts/](scripts/) | One-off Node scripts (currently just Firebase seeding) |
| [functions/](functions/) | Firebase Cloud Functions (server-side Gemini proxy, etc.) |
| [public/](public/) | Static assets served at the root |
| [docs/](docs/) | Developer and user documentation |
| [firestore.rules](firestore.rules) | Firestore security rules |
| [firestore.indexes.json](firestore.indexes.json) | Composite index definitions |
| [firebase.json](firebase.json) | Firebase Hosting + emulator config |
| [CLAUDE.md](CLAUDE.md) | Project rules — read this before contributing |

## Scripts

| Command | What it does |
| --- | --- |
| `yarn dev` | Vite dev server (web only) on port 5173 |
| `yarn build` | Type-check (`tsc -b`) then produce a production bundle in `dist/` |
| `yarn preview` | Serve the built `dist/` locally |
| `yarn typecheck` | `tsc -b --noEmit` |
| `yarn seed:firebase` | Idempotently seed Firestore + Auth with mock studios and games |
| `yarn tauri:dev` | Launch the desktop app with HMR |
| `yarn tauri:build` | Build per-platform installers (`.dmg` / `.msi` / `.AppImage`) |

## Where to next

- [ARCHITECTURE.md](ARCHITECTURE.md) — the layered architecture, end-to-end
- [docs/](docs/) — full developer and user docs
- [docs/getting-started.md](docs/getting-started.md) — fuller setup, troubleshooting, prerequisites
- [docs/user-guide/](docs/user-guide/) — how to use the Store, Library, DB, Developer Portal, and Admin features
- [CLAUDE.md](CLAUDE.md) — non-negotiable project rules (stack pins, dual-target hygiene, `dw_` Firestore prefix, no hard-coded routes / hex colors)
