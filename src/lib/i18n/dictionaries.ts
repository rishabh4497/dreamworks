// UI chrome translations for the Dreamworks client.
//
// The English string IS the lookup key. To translate a new label, add the
// English source under the `en` dictionary AND add the same key under every
// other language. Missing keys fall back to English, then to the raw key.

export type LangCode = "en" | "fr" | "de" | "es" | "ja" | "ko";

type Dictionary = Record<string, string>;

export const LANG_NAME_TO_CODE: Record<string, LangCode> = {
  English: "en",
  Français: "fr",
  Deutsch: "de",
  Español: "es",
  "日本語": "ja",
  "한국어": "ko",
};

const en: Dictionary = {
  // Settings page chrome
  Settings: "Settings",
  "Preferences & account": "Preferences & account",
  "Manage your account, configure the launcher, tune in-game overlays, and control your privacy, notifications, and family sharing.":
    "Manage your account, configure the launcher, tune in-game overlays, and control your privacy, notifications, and family sharing.",

  // Tab labels
  Account: "Account",
  General: "General",
  "Downloads & Storage": "Downloads & Storage",
  Gameplay: "Gameplay",
  "Notifications & Chat": "Notifications & Chat",
  Privacy: "Privacy",

  // Section titles
  "General preferences": "General preferences",
  "Offline mode": "Offline mode",
  "Window & layout": "Window & layout",
  "Color theme": "Color theme",
  "About Dreamworks": "About Dreamworks",

  // Field labels
  "Client language": "Client language",
  "Startup location": "Startup location",
  "Store Home": "Store Home",
  Library: "Library",
  "Social Feed": "Social Feed",
  "SteamDB Analytics": "SteamDB Analytics",

  // Offline mode
  "Start and browse in offline mode": "Start and browse in offline mode",
  "Use cached library data and only launch games marked offline-ready":
    "Use cached library data and only launch games marked offline-ready",
  "Offline cache status": "Offline cache status",
  "Last refreshed: {time}": "Last refreshed: {time}",
  Never: "Never",
  Refresh: "Refresh",
  ready: "ready",
  syncing: "syncing",
  "needs attention": "needs attention",
  "Offline cache refresh queued": "Offline cache refresh queued",

  // Window & layout toggles
  "Close window to system tray": "Close window to system tray",
  "Keep launcher active in background when clicking close button":
    "Keep launcher active in background when clicking close button",
  "Enable hardware acceleration": "Enable hardware acceleration",
  "Requires launcher restart to apply changes": "Requires launcher restart to apply changes",
  "Use compact side navigation mode": "Use compact side navigation mode",
  "Minimize sidebar visual space": "Minimize sidebar visual space",
  "Restart Dreamworks for this to take effect.": "Restart Dreamworks for this to take effect.",

  // Color theme
  dark: "dark",
  light: "light",
  system: "system",

  // About
  "Dreamworks Launcher": "Dreamworks Launcher",
  "Version {version} · Running on {target}": "Version {version} · Running on {target}",
  "Desktop ({os})": "Desktop ({os})",
  Web: "Web",
  "Check for updates": "Check for updates",
  "Checking…": "Checking…",
  "Dreamworks is a dual-target, unified Steam storefront and database analytics client, powered by Tauri, React 19, and Tailwind 4.":
    "Dreamworks is a dual-target, unified Steam storefront and database analytics client, powered by Tauri, React 19, and Tailwind 4.",
  "© 2026 Dreamworks Interactive. All rights reserved. Valve, Steam, SteamDB, Epic, GOG, and their respective logos are trademarks or registered trademarks of their owners. Software is provided “as is” without warranties.":
    "© 2026 Dreamworks Interactive. All rights reserved. Valve, Steam, SteamDB, Epic, GOG, and their respective logos are trademarks or registered trademarks of their owners. Software is provided “as is” without warranties.",
  "Dreamworks Launcher is up to date (v0.1.0)": "Dreamworks Launcher is up to date (v0.1.0)",

  // QuickResumePC
  "\"Quick Resume\" for PC": "\"Quick Resume\" for PC",
  "Suspend game state to disk for instant hot-swapping.":
    "Suspend game state to disk for instant hot-swapping.",
  Enable: "Enable",
  Disable: "Disable",
  Enabled: "Enabled",
  "Quick Resume enabled": "Quick Resume enabled",
  "Quick Resume disabled": "Quick Resume disabled",

  // SeamlessRemotePlay
  "Seamless Remote Play": "Seamless Remote Play",
  "Stream desktop games to your phone or laptop.": "Stream desktop games to your phone or laptop.",
  "Pair Device": "Pair Device",
  "Unpair {device}": "Unpair {device}",
  "Name this device": "Name this device",
  "Paired to {device}": "Paired to {device}",
  "Device unpaired": "Device unpaired",

  // DynamicStoreBackgrounds
  "Dynamic Store Backgrounds": "Dynamic Store Backgrounds",
  "Launcher theme adapts to the currently viewed game.":
    "Launcher theme adapts to the currently viewed game.",
  On: "On",
  Off: "Off",

  // AiTextureUpscaler
  "AI Texture Upscaler": "AI Texture Upscaler",
  "Built-in AI upscaling injector for older titles.": "Built-in AI upscaling injector for older titles.",
  "Notify me": "Notify me",
  "You'll be notified when AI Texture Upscaler is available.":
    "You'll be notified when AI Texture Upscaler is available.",

  // CrossPlatformWishlistSync (kept short for account tab too)
  "Cross-Platform Wishlist Sync": "Cross-Platform Wishlist Sync",
  "Mirror wishlists across PlayStation, Xbox, and Steam.":
    "Mirror wishlists across PlayStation, Xbox, and Steam.",
  "Sync Now": "Sync Now",

  // Topbar
  Online: "Online",
  Offline: "Offline",
  "Offline mode is on": "Offline mode is on",
  "Turn on offline mode": "Turn on offline mode",
  "Handheld mode active": "Handheld mode active",
  Wishlist: "Wishlist",
  Friends: "Friends",
  Cart: "Cart",

  // Sidebar groups + nav (collapsed labels also live here)
  Store: "Store",
  You: "You",
  Analytics: "Analytics",
  Developer: "Developer",
  Admin: "Admin",
  Home: "Home",
  Search: "Search",
  "Dreamworks+": "Dreamworks+",
  Feed: "Feed",
  Workshop: "Workshop",
  Downloads: "Downloads",
  Profile: "Profile",
  Overview: "Overview",
  "Top Charts": "Top Charts",
  "Sales Tracker": "Sales Tracker",
  Calendar: "Calendar",
  "My Analytics": "My Analytics",
  Diagnostics: "Diagnostics",
  "Developer Portal": "Developer Portal",
  "Admin Panel": "Admin Panel",
};

const fr: Dictionary = {
  Settings: "Paramètres",
  "Preferences & account": "Préférences & compte",
  "Manage your account, configure the launcher, tune in-game overlays, and control your privacy, notifications, and family sharing.":
    "Gérez votre compte, configurez le lanceur, ajustez les superpositions en jeu et contrôlez votre confidentialité, vos notifications et le partage familial.",

  Account: "Compte",
  General: "Général",
  "Downloads & Storage": "Téléchargements & stockage",
  Gameplay: "Jeu",
  "Notifications & Chat": "Notifications & chat",
  Privacy: "Confidentialité",

  "General preferences": "Préférences générales",
  "Offline mode": "Mode hors ligne",
  "Window & layout": "Fenêtre & mise en page",
  "Color theme": "Thème de couleur",
  "About Dreamworks": "À propos de Dreamworks",

  "Client language": "Langue du client",
  "Startup location": "Page de démarrage",
  "Store Home": "Accueil de la boutique",
  Library: "Bibliothèque",
  "Social Feed": "Fil social",
  "SteamDB Analytics": "Analytique SteamDB",

  "Start and browse in offline mode": "Démarrer et naviguer en mode hors ligne",
  "Use cached library data and only launch games marked offline-ready":
    "Utiliser les données mises en cache et ne lancer que les jeux marqués comme jouables hors ligne",
  "Offline cache status": "État du cache hors ligne",
  "Last refreshed: {time}": "Dernière actualisation : {time}",
  Never: "Jamais",
  Refresh: "Actualiser",
  ready: "prêt",
  syncing: "synchronisation",
  "needs attention": "attention requise",
  "Offline cache refresh queued": "Actualisation du cache hors ligne en file d'attente",

  "Close window to system tray": "Réduire la fenêtre dans la barre d'état système",
  "Keep launcher active in background when clicking close button":
    "Garder le lanceur actif en arrière-plan en cliquant sur fermer",
  "Enable hardware acceleration": "Activer l'accélération matérielle",
  "Requires launcher restart to apply changes": "Nécessite un redémarrage du lanceur pour appliquer",
  "Use compact side navigation mode": "Utiliser la navigation latérale compacte",
  "Minimize sidebar visual space": "Réduire l'espace visuel de la barre latérale",
  "Restart Dreamworks for this to take effect.":
    "Redémarrez Dreamworks pour appliquer ce changement.",

  dark: "sombre",
  light: "clair",
  system: "système",

  "Dreamworks Launcher": "Lanceur Dreamworks",
  "Version {version} · Running on {target}": "Version {version} · Exécuté sur {target}",
  "Desktop ({os})": "Bureau ({os})",
  Web: "Web",
  "Check for updates": "Vérifier les mises à jour",
  "Checking…": "Vérification…",
  "Dreamworks is a dual-target, unified Steam storefront and database analytics client, powered by Tauri, React 19, and Tailwind 4.":
    "Dreamworks est un client unifié de vitrine Steam et d'analyse de base de données, propulsé par Tauri, React 19 et Tailwind 4.",
  "© 2026 Dreamworks Interactive. All rights reserved. Valve, Steam, SteamDB, Epic, GOG, and their respective logos are trademarks or registered trademarks of their owners. Software is provided “as is” without warranties.":
    "© 2026 Dreamworks Interactive. Tous droits réservés. Valve, Steam, SteamDB, Epic, GOG et leurs logos respectifs sont des marques de leurs propriétaires. Le logiciel est fourni « tel quel » sans garantie.",
  "Dreamworks Launcher is up to date (v0.1.0)": "Le lanceur Dreamworks est à jour (v0.1.0)",

  "\"Quick Resume\" for PC": "« Reprise rapide » pour PC",
  "Suspend game state to disk for instant hot-swapping.":
    "Suspendre l'état du jeu sur disque pour un changement instantané.",
  Enable: "Activer",
  Disable: "Désactiver",
  Enabled: "Activé",
  "Quick Resume enabled": "Reprise rapide activée",
  "Quick Resume disabled": "Reprise rapide désactivée",

  "Seamless Remote Play": "Jeu à distance fluide",
  "Stream desktop games to your phone or laptop.":
    "Diffusez vos jeux PC vers votre téléphone ou portable.",
  "Pair Device": "Associer un appareil",
  "Unpair {device}": "Dissocier {device}",
  "Name this device": "Nommer cet appareil",
  "Paired to {device}": "Associé à {device}",
  "Device unpaired": "Appareil dissocié",

  "Dynamic Store Backgrounds": "Arrière-plans dynamiques",
  "Launcher theme adapts to the currently viewed game.":
    "Le thème du lanceur s'adapte au jeu en cours d'affichage.",
  On: "Activé",
  Off: "Désactivé",

  "AI Texture Upscaler": "Amélioration IA des textures",
  "Built-in AI upscaling injector for older titles.":
    "Injecteur d'amélioration IA intégré pour les anciens titres.",
  "Notify me": "Me notifier",
  "You'll be notified when AI Texture Upscaler is available.":
    "Vous serez notifié dès que l'amélioration IA des textures sera disponible.",

  "Cross-Platform Wishlist Sync": "Synchro de liste de souhaits multi-plateforme",
  "Mirror wishlists across PlayStation, Xbox, and Steam.":
    "Synchronisez vos listes de souhaits entre PlayStation, Xbox et Steam.",
  "Sync Now": "Synchroniser maintenant",

  Online: "En ligne",
  Offline: "Hors ligne",
  "Offline mode is on": "Le mode hors ligne est activé",
  "Turn on offline mode": "Activer le mode hors ligne",
  "Handheld mode active": "Mode portable actif",
  Wishlist: "Liste de souhaits",
  Friends: "Amis",
  Cart: "Panier",

  Store: "Boutique",
  You: "Vous",
  Analytics: "Analytique",
  Developer: "Développeur",
  Admin: "Admin",
  Home: "Accueil",
  Search: "Recherche",
  "Dreamworks+": "Dreamworks+",
  Feed: "Fil",
  Workshop: "Atelier",
  Downloads: "Téléchargements",
  Profile: "Profil",
  Overview: "Vue d'ensemble",
  "Top Charts": "Classements",
  "Sales Tracker": "Suivi des soldes",
  Calendar: "Calendrier",
  "My Analytics": "Mes analyses",
  Diagnostics: "Diagnostics",
  "Developer Portal": "Portail développeur",
  "Admin Panel": "Panneau d'administration",
};

const de: Dictionary = {
  Settings: "Einstellungen",
  "Preferences & account": "Einstellungen & Konto",
  "Manage your account, configure the launcher, tune in-game overlays, and control your privacy, notifications, and family sharing.":
    "Verwalten Sie Ihr Konto, konfigurieren Sie den Launcher, passen Sie In-Game-Overlays an und steuern Sie Datenschutz, Benachrichtigungen und Familienfreigabe.",

  Account: "Konto",
  General: "Allgemein",
  "Downloads & Storage": "Downloads & Speicher",
  Gameplay: "Gameplay",
  "Notifications & Chat": "Benachrichtigungen & Chat",
  Privacy: "Datenschutz",

  "General preferences": "Allgemeine Einstellungen",
  "Offline mode": "Offline-Modus",
  "Window & layout": "Fenster & Layout",
  "Color theme": "Farbschema",
  "About Dreamworks": "Über Dreamworks",

  "Client language": "Client-Sprache",
  "Startup location": "Startseite",
  "Store Home": "Shop-Startseite",
  Library: "Bibliothek",
  "Social Feed": "Sozialer Feed",
  "SteamDB Analytics": "SteamDB-Analyse",

  "Start and browse in offline mode": "Im Offline-Modus starten und durchsuchen",
  "Use cached library data and only launch games marked offline-ready":
    "Zwischengespeicherte Bibliotheksdaten verwenden und nur Spiele starten, die offline-bereit sind",
  "Offline cache status": "Offline-Cache-Status",
  "Last refreshed: {time}": "Zuletzt aktualisiert: {time}",
  Never: "Nie",
  Refresh: "Aktualisieren",
  ready: "bereit",
  syncing: "synchronisiert",
  "needs attention": "Aufmerksamkeit erforderlich",
  "Offline cache refresh queued": "Cache-Aktualisierung eingereiht",

  "Close window to system tray": "Fenster in Infobereich minimieren",
  "Keep launcher active in background when clicking close button":
    "Launcher beim Schließen im Hintergrund aktiv halten",
  "Enable hardware acceleration": "Hardwarebeschleunigung aktivieren",
  "Requires launcher restart to apply changes": "Erfordert Neustart, um zu übernehmen",
  "Use compact side navigation mode": "Kompakte Seitennavigation verwenden",
  "Minimize sidebar visual space": "Seitenleiste minimieren",
  "Restart Dreamworks for this to take effect.":
    "Starten Sie Dreamworks neu, damit dies wirksam wird.",

  dark: "dunkel",
  light: "hell",
  system: "system",

  "Dreamworks Launcher": "Dreamworks Launcher",
  "Version {version} · Running on {target}": "Version {version} · Ausgeführt auf {target}",
  "Desktop ({os})": "Desktop ({os})",
  Web: "Web",
  "Check for updates": "Nach Updates suchen",
  "Checking…": "Suche…",
  "Dreamworks is a dual-target, unified Steam storefront and database analytics client, powered by Tauri, React 19, and Tailwind 4.":
    "Dreamworks ist ein vereinheitlichter Steam-Shop- und Datenbankanalyse-Client, angetrieben von Tauri, React 19 und Tailwind 4.",
  "© 2026 Dreamworks Interactive. All rights reserved. Valve, Steam, SteamDB, Epic, GOG, and their respective logos are trademarks or registered trademarks of their owners. Software is provided “as is” without warranties.":
    "© 2026 Dreamworks Interactive. Alle Rechte vorbehalten. Valve, Steam, SteamDB, Epic, GOG und ihre jeweiligen Logos sind Marken ihrer Eigentümer. Software wird „wie besehen“ ohne Garantie bereitgestellt.",
  "Dreamworks Launcher is up to date (v0.1.0)": "Dreamworks Launcher ist aktuell (v0.1.0)",

  "\"Quick Resume\" for PC": "„Schnelles Fortsetzen“ für PC",
  "Suspend game state to disk for instant hot-swapping.":
    "Spielstand auf Festplatte einfrieren für sofortigen Wechsel.",
  Enable: "Aktivieren",
  Disable: "Deaktivieren",
  Enabled: "Aktiviert",
  "Quick Resume enabled": "Schnelles Fortsetzen aktiviert",
  "Quick Resume disabled": "Schnelles Fortsetzen deaktiviert",

  "Seamless Remote Play": "Nahtloses Remote Play",
  "Stream desktop games to your phone or laptop.":
    "Streamen Sie Desktop-Spiele auf Ihr Handy oder Laptop.",
  "Pair Device": "Gerät koppeln",
  "Unpair {device}": "{device} entkoppeln",
  "Name this device": "Diesem Gerät einen Namen geben",
  "Paired to {device}": "Mit {device} gekoppelt",
  "Device unpaired": "Gerät entkoppelt",

  "Dynamic Store Backgrounds": "Dynamische Shop-Hintergründe",
  "Launcher theme adapts to the currently viewed game.":
    "Das Launcher-Design passt sich dem aktuellen Spiel an.",
  On: "An",
  Off: "Aus",

  "AI Texture Upscaler": "KI-Textur-Upscaler",
  "Built-in AI upscaling injector for older titles.":
    "Eingebauter KI-Upscaling-Injektor für ältere Titel.",
  "Notify me": "Benachrichtigen",
  "You'll be notified when AI Texture Upscaler is available.":
    "Sie werden benachrichtigt, sobald der KI-Textur-Upscaler verfügbar ist.",

  "Cross-Platform Wishlist Sync": "Plattformübergreifende Wunschlisten-Sync",
  "Mirror wishlists across PlayStation, Xbox, and Steam.":
    "Wunschlisten zwischen PlayStation, Xbox und Steam synchronisieren.",
  "Sync Now": "Jetzt synchronisieren",

  Online: "Online",
  Offline: "Offline",
  "Offline mode is on": "Offline-Modus ist aktiv",
  "Turn on offline mode": "Offline-Modus aktivieren",
  "Handheld mode active": "Handheld-Modus aktiv",
  Wishlist: "Wunschliste",
  Friends: "Freunde",
  Cart: "Warenkorb",

  Store: "Shop",
  You: "Du",
  Analytics: "Analyse",
  Developer: "Entwickler",
  Admin: "Admin",
  Home: "Startseite",
  Search: "Suche",
  "Dreamworks+": "Dreamworks+",
  Feed: "Feed",
  Workshop: "Workshop",
  Downloads: "Downloads",
  Profile: "Profil",
  Overview: "Übersicht",
  "Top Charts": "Top-Charts",
  "Sales Tracker": "Sales-Tracker",
  Calendar: "Kalender",
  "My Analytics": "Meine Analysen",
  Diagnostics: "Diagnose",
  "Developer Portal": "Entwicklerportal",
  "Admin Panel": "Admin-Panel",
};

const es: Dictionary = {
  Settings: "Configuración",
  "Preferences & account": "Preferencias y cuenta",
  "Manage your account, configure the launcher, tune in-game overlays, and control your privacy, notifications, and family sharing.":
    "Gestiona tu cuenta, configura el launcher, ajusta los overlays en juego y controla tu privacidad, notificaciones y uso compartido familiar.",

  Account: "Cuenta",
  General: "General",
  "Downloads & Storage": "Descargas y almacenamiento",
  Gameplay: "Juego",
  "Notifications & Chat": "Notificaciones y chat",
  Privacy: "Privacidad",

  "General preferences": "Preferencias generales",
  "Offline mode": "Modo sin conexión",
  "Window & layout": "Ventana y diseño",
  "Color theme": "Tema de color",
  "About Dreamworks": "Acerca de Dreamworks",

  "Client language": "Idioma del cliente",
  "Startup location": "Ubicación de inicio",
  "Store Home": "Inicio de la tienda",
  Library: "Biblioteca",
  "Social Feed": "Feed social",
  "SteamDB Analytics": "Analítica SteamDB",

  "Start and browse in offline mode": "Iniciar y navegar en modo sin conexión",
  "Use cached library data and only launch games marked offline-ready":
    "Usa datos en caché y lanza solo los juegos marcados como disponibles sin conexión",
  "Offline cache status": "Estado de la caché sin conexión",
  "Last refreshed: {time}": "Última actualización: {time}",
  Never: "Nunca",
  Refresh: "Actualizar",
  ready: "listo",
  syncing: "sincronizando",
  "needs attention": "requiere atención",
  "Offline cache refresh queued": "Actualización de caché en cola",

  "Close window to system tray": "Cerrar la ventana a la bandeja del sistema",
  "Keep launcher active in background when clicking close button":
    "Mantener el launcher activo en segundo plano al cerrar",
  "Enable hardware acceleration": "Activar aceleración por hardware",
  "Requires launcher restart to apply changes": "Requiere reiniciar el launcher para aplicar",
  "Use compact side navigation mode": "Usar navegación lateral compacta",
  "Minimize sidebar visual space": "Minimizar el espacio de la barra lateral",
  "Restart Dreamworks for this to take effect.":
    "Reinicia Dreamworks para que esto surta efecto.",

  dark: "oscuro",
  light: "claro",
  system: "sistema",

  "Dreamworks Launcher": "Dreamworks Launcher",
  "Version {version} · Running on {target}": "Versión {version} · Ejecutándose en {target}",
  "Desktop ({os})": "Escritorio ({os})",
  Web: "Web",
  "Check for updates": "Buscar actualizaciones",
  "Checking…": "Comprobando…",
  "Dreamworks is a dual-target, unified Steam storefront and database analytics client, powered by Tauri, React 19, and Tailwind 4.":
    "Dreamworks es un cliente unificado de tienda Steam y analítica, impulsado por Tauri, React 19 y Tailwind 4.",
  "© 2026 Dreamworks Interactive. All rights reserved. Valve, Steam, SteamDB, Epic, GOG, and their respective logos are trademarks or registered trademarks of their owners. Software is provided “as is” without warranties.":
    "© 2026 Dreamworks Interactive. Todos los derechos reservados. Valve, Steam, SteamDB, Epic, GOG y sus respectivos logos son marcas de sus propietarios. El software se proporciona «tal cual» sin garantías.",
  "Dreamworks Launcher is up to date (v0.1.0)": "Dreamworks Launcher está actualizado (v0.1.0)",

  "\"Quick Resume\" for PC": "«Reanudación rápida» para PC",
  "Suspend game state to disk for instant hot-swapping.":
    "Suspende el estado del juego en disco para un cambio instantáneo.",
  Enable: "Activar",
  Disable: "Desactivar",
  Enabled: "Activado",
  "Quick Resume enabled": "Reanudación rápida activada",
  "Quick Resume disabled": "Reanudación rápida desactivada",

  "Seamless Remote Play": "Juego remoto fluido",
  "Stream desktop games to your phone or laptop.":
    "Transmite juegos de escritorio a tu móvil o portátil.",
  "Pair Device": "Vincular dispositivo",
  "Unpair {device}": "Desvincular {device}",
  "Name this device": "Nombra este dispositivo",
  "Paired to {device}": "Vinculado a {device}",
  "Device unpaired": "Dispositivo desvinculado",

  "Dynamic Store Backgrounds": "Fondos dinámicos de tienda",
  "Launcher theme adapts to the currently viewed game.":
    "El tema del launcher se adapta al juego que estás viendo.",
  On: "Activado",
  Off: "Desactivado",

  "AI Texture Upscaler": "Mejora de texturas con IA",
  "Built-in AI upscaling injector for older titles.":
    "Inyector de mejora de IA integrado para títulos antiguos.",
  "Notify me": "Avisarme",
  "You'll be notified when AI Texture Upscaler is available.":
    "Recibirás un aviso cuando la mejora de texturas con IA esté disponible.",

  "Cross-Platform Wishlist Sync": "Sincronización de listas de deseos multiplataforma",
  "Mirror wishlists across PlayStation, Xbox, and Steam.":
    "Sincroniza tus listas de deseos entre PlayStation, Xbox y Steam.",
  "Sync Now": "Sincronizar ahora",

  Online: "En línea",
  Offline: "Sin conexión",
  "Offline mode is on": "El modo sin conexión está activo",
  "Turn on offline mode": "Activar modo sin conexión",
  "Handheld mode active": "Modo portátil activo",
  Wishlist: "Lista de deseos",
  Friends: "Amigos",
  Cart: "Carrito",

  Store: "Tienda",
  You: "Tú",
  Analytics: "Analítica",
  Developer: "Desarrollador",
  Admin: "Admin",
  Home: "Inicio",
  Search: "Buscar",
  "Dreamworks+": "Dreamworks+",
  Feed: "Feed",
  Workshop: "Taller",
  Downloads: "Descargas",
  Profile: "Perfil",
  Overview: "Resumen",
  "Top Charts": "Tops",
  "Sales Tracker": "Seguimiento de ofertas",
  Calendar: "Calendario",
  "My Analytics": "Mi analítica",
  Diagnostics: "Diagnóstico",
  "Developer Portal": "Portal de desarrollador",
  "Admin Panel": "Panel de administración",
};

const ja: Dictionary = {
  Settings: "設定",
  "Preferences & account": "環境設定 & アカウント",
  "Manage your account, configure the launcher, tune in-game overlays, and control your privacy, notifications, and family sharing.":
    "アカウントの管理、ランチャーの設定、ゲーム内オーバーレイの調整、プライバシー・通知・ファミリー共有の制御を行えます。",

  Account: "アカウント",
  General: "一般",
  "Downloads & Storage": "ダウンロード & ストレージ",
  Gameplay: "ゲームプレイ",
  "Notifications & Chat": "通知 & チャット",
  Privacy: "プライバシー",

  "General preferences": "一般設定",
  "Offline mode": "オフラインモード",
  "Window & layout": "ウィンドウ & レイアウト",
  "Color theme": "カラーテーマ",
  "About Dreamworks": "Dreamworks について",

  "Client language": "クライアント言語",
  "Startup location": "起動時の場所",
  "Store Home": "ストアホーム",
  Library: "ライブラリ",
  "Social Feed": "ソーシャルフィード",
  "SteamDB Analytics": "SteamDB アナリティクス",

  "Start and browse in offline mode": "オフラインモードで起動・閲覧する",
  "Use cached library data and only launch games marked offline-ready":
    "キャッシュされたライブラリを使用し、オフライン対応のゲームのみ起動",
  "Offline cache status": "オフラインキャッシュ状態",
  "Last refreshed: {time}": "最終更新: {time}",
  Never: "なし",
  Refresh: "更新",
  ready: "準備完了",
  syncing: "同期中",
  "needs attention": "要対応",
  "Offline cache refresh queued": "オフラインキャッシュの更新を予約しました",

  "Close window to system tray": "ウィンドウを閉じてシステムトレイに格納",
  "Keep launcher active in background when clicking close button":
    "閉じるボタンを押してもバックグラウンドで起動を維持",
  "Enable hardware acceleration": "ハードウェアアクセラレーションを有効化",
  "Requires launcher restart to apply changes": "変更を適用するには再起動が必要",
  "Use compact side navigation mode": "コンパクトサイドナビを使用",
  "Minimize sidebar visual space": "サイドバーの表示領域を最小化",
  "Restart Dreamworks for this to take effect.":
    "変更を反映するには Dreamworks を再起動してください。",

  dark: "ダーク",
  light: "ライト",
  system: "システム",

  "Dreamworks Launcher": "Dreamworks ランチャー",
  "Version {version} · Running on {target}": "バージョン {version} · {target} で動作中",
  "Desktop ({os})": "デスクトップ ({os})",
  Web: "Web",
  "Check for updates": "更新を確認",
  "Checking…": "確認中…",
  "Dreamworks is a dual-target, unified Steam storefront and database analytics client, powered by Tauri, React 19, and Tailwind 4.":
    "Dreamworks は Tauri、React 19、Tailwind 4 を採用した統合 Steam ストア & 分析クライアントです。",
  "© 2026 Dreamworks Interactive. All rights reserved. Valve, Steam, SteamDB, Epic, GOG, and their respective logos are trademarks or registered trademarks of their owners. Software is provided “as is” without warranties.":
    "© 2026 Dreamworks Interactive. 無断複製禁止。Valve、Steam、SteamDB、Epic、GOG およびそれらのロゴは各所有者の商標です。本ソフトウェアは「現状有姿」で提供され、保証はありません。",
  "Dreamworks Launcher is up to date (v0.1.0)": "Dreamworks ランチャーは最新です (v0.1.0)",

  "\"Quick Resume\" for PC": "PC 版「クイックレジューム」",
  "Suspend game state to disk for instant hot-swapping.":
    "ゲーム状態をディスクに退避し、瞬時に切り替え。",
  Enable: "有効化",
  Disable: "無効化",
  Enabled: "有効",
  "Quick Resume enabled": "クイックレジュームを有効化",
  "Quick Resume disabled": "クイックレジュームを無効化",

  "Seamless Remote Play": "シームレスなリモートプレイ",
  "Stream desktop games to your phone or laptop.":
    "デスクトップのゲームをスマホやノート PC に配信。",
  "Pair Device": "デバイスをペアリング",
  "Unpair {device}": "{device} のペアリングを解除",
  "Name this device": "このデバイスの名前",
  "Paired to {device}": "{device} とペアリング済み",
  "Device unpaired": "デバイスのペアリングを解除しました",

  "Dynamic Store Backgrounds": "ダイナミックストア背景",
  "Launcher theme adapts to the currently viewed game.":
    "閲覧中のゲームに合わせてランチャーのテーマが変化。",
  On: "オン",
  Off: "オフ",

  "AI Texture Upscaler": "AI テクスチャアップスケーラー",
  "Built-in AI upscaling injector for older titles.":
    "古いタイトル向け AI アップスケーリングを内蔵。",
  "Notify me": "通知を受け取る",
  "You'll be notified when AI Texture Upscaler is available.":
    "AI テクスチャアップスケーラーが利用可能になり次第お知らせします。",

  "Cross-Platform Wishlist Sync": "クロスプラットフォームのウィッシュリスト同期",
  "Mirror wishlists across PlayStation, Xbox, and Steam.":
    "PlayStation、Xbox、Steam 間でウィッシュリストを同期。",
  "Sync Now": "今すぐ同期",

  Online: "オンライン",
  Offline: "オフライン",
  "Offline mode is on": "オフラインモードがオン",
  "Turn on offline mode": "オフラインモードをオンにする",
  "Handheld mode active": "携帯モード有効",
  Wishlist: "ウィッシュリスト",
  Friends: "フレンド",
  Cart: "カート",

  Store: "ストア",
  You: "マイページ",
  Analytics: "分析",
  Developer: "開発者",
  Admin: "管理",
  Home: "ホーム",
  Search: "検索",
  "Dreamworks+": "Dreamworks+",
  Feed: "フィード",
  Workshop: "ワークショップ",
  Downloads: "ダウンロード",
  Profile: "プロフィール",
  Overview: "概要",
  "Top Charts": "トップチャート",
  "Sales Tracker": "セール追跡",
  Calendar: "カレンダー",
  "My Analytics": "マイ分析",
  Diagnostics: "診断",
  "Developer Portal": "開発者ポータル",
  "Admin Panel": "管理者パネル",
};

const ko: Dictionary = {
  Settings: "설정",
  "Preferences & account": "환경설정 및 계정",
  "Manage your account, configure the launcher, tune in-game overlays, and control your privacy, notifications, and family sharing.":
    "계정 관리, 런처 구성, 인게임 오버레이 조정, 개인정보·알림·가족 공유를 제어합니다.",

  Account: "계정",
  General: "일반",
  "Downloads & Storage": "다운로드 및 저장소",
  Gameplay: "게임플레이",
  "Notifications & Chat": "알림 및 채팅",
  Privacy: "개인정보 보호",

  "General preferences": "일반 환경설정",
  "Offline mode": "오프라인 모드",
  "Window & layout": "창 및 레이아웃",
  "Color theme": "색상 테마",
  "About Dreamworks": "Dreamworks 정보",

  "Client language": "클라이언트 언어",
  "Startup location": "시작 위치",
  "Store Home": "스토어 홈",
  Library: "라이브러리",
  "Social Feed": "소셜 피드",
  "SteamDB Analytics": "SteamDB 분석",

  "Start and browse in offline mode": "오프라인 모드로 시작 및 탐색",
  "Use cached library data and only launch games marked offline-ready":
    "캐시된 라이브러리 데이터 사용 및 오프라인 가능한 게임만 실행",
  "Offline cache status": "오프라인 캐시 상태",
  "Last refreshed: {time}": "마지막 새로고침: {time}",
  Never: "없음",
  Refresh: "새로고침",
  ready: "준비됨",
  syncing: "동기화 중",
  "needs attention": "조치 필요",
  "Offline cache refresh queued": "오프라인 캐시 새로고침 대기 중",

  "Close window to system tray": "닫을 때 시스템 트레이로 최소화",
  "Keep launcher active in background when clicking close button":
    "닫기 클릭 시 런처를 백그라운드로 유지",
  "Enable hardware acceleration": "하드웨어 가속 활성화",
  "Requires launcher restart to apply changes": "변경 적용을 위해 재시작 필요",
  "Use compact side navigation mode": "컴팩트 사이드 내비게이션 사용",
  "Minimize sidebar visual space": "사이드바 공간 최소화",
  "Restart Dreamworks for this to take effect.":
    "변경 사항을 적용하려면 Dreamworks를 다시 시작하세요.",

  dark: "다크",
  light: "라이트",
  system: "시스템",

  "Dreamworks Launcher": "Dreamworks 런처",
  "Version {version} · Running on {target}": "버전 {version} · {target} 에서 실행 중",
  "Desktop ({os})": "데스크톱 ({os})",
  Web: "웹",
  "Check for updates": "업데이트 확인",
  "Checking…": "확인 중…",
  "Dreamworks is a dual-target, unified Steam storefront and database analytics client, powered by Tauri, React 19, and Tailwind 4.":
    "Dreamworks는 Tauri, React 19, Tailwind 4 기반의 통합 Steam 스토어 & 데이터 분석 클라이언트입니다.",
  "© 2026 Dreamworks Interactive. All rights reserved. Valve, Steam, SteamDB, Epic, GOG, and their respective logos are trademarks or registered trademarks of their owners. Software is provided “as is” without warranties.":
    "© 2026 Dreamworks Interactive. 모든 권리 보유. Valve, Steam, SteamDB, Epic, GOG 및 해당 로고는 각 소유자의 상표입니다. 소프트웨어는 보증 없이 「있는 그대로」 제공됩니다.",
  "Dreamworks Launcher is up to date (v0.1.0)": "Dreamworks 런처가 최신 상태입니다 (v0.1.0)",

  "\"Quick Resume\" for PC": "PC용 「빠른 재개」",
  "Suspend game state to disk for instant hot-swapping.":
    "게임 상태를 디스크에 저장하여 즉시 전환.",
  Enable: "활성화",
  Disable: "비활성화",
  Enabled: "활성됨",
  "Quick Resume enabled": "빠른 재개 활성화됨",
  "Quick Resume disabled": "빠른 재개 비활성화됨",

  "Seamless Remote Play": "끊김 없는 원격 플레이",
  "Stream desktop games to your phone or laptop.":
    "데스크톱 게임을 휴대폰이나 노트북으로 스트리밍.",
  "Pair Device": "기기 페어링",
  "Unpair {device}": "{device} 페어링 해제",
  "Name this device": "이 기기의 이름",
  "Paired to {device}": "{device}에 페어링됨",
  "Device unpaired": "기기 페어링 해제됨",

  "Dynamic Store Backgrounds": "다이내믹 스토어 배경",
  "Launcher theme adapts to the currently viewed game.":
    "현재 보고 있는 게임에 따라 런처 테마가 변경됩니다.",
  On: "켜짐",
  Off: "꺼짐",

  "AI Texture Upscaler": "AI 텍스처 업스케일러",
  "Built-in AI upscaling injector for older titles.":
    "구형 타이틀용 AI 업스케일링 인젝터 내장.",
  "Notify me": "알림 받기",
  "You'll be notified when AI Texture Upscaler is available.":
    "AI 텍스처 업스케일러가 출시되면 알려드리겠습니다.",

  "Cross-Platform Wishlist Sync": "크로스플랫폼 위시리스트 동기화",
  "Mirror wishlists across PlayStation, Xbox, and Steam.":
    "PlayStation, Xbox, Steam 간 위시리스트 동기화.",
  "Sync Now": "지금 동기화",

  Online: "온라인",
  Offline: "오프라인",
  "Offline mode is on": "오프라인 모드 켜짐",
  "Turn on offline mode": "오프라인 모드 켜기",
  "Handheld mode active": "휴대 모드 활성화됨",
  Wishlist: "위시리스트",
  Friends: "친구",
  Cart: "장바구니",

  Store: "스토어",
  You: "내 정보",
  Analytics: "분석",
  Developer: "개발자",
  Admin: "관리자",
  Home: "홈",
  Search: "검색",
  "Dreamworks+": "Dreamworks+",
  Feed: "피드",
  Workshop: "워크숍",
  Downloads: "다운로드",
  Profile: "프로필",
  Overview: "개요",
  "Top Charts": "탑 차트",
  "Sales Tracker": "세일 추적",
  Calendar: "캘린더",
  "My Analytics": "내 분석",
  Diagnostics: "진단",
  "Developer Portal": "개발자 포털",
  "Admin Panel": "관리자 패널",
};

export const dictionaries: Record<LangCode, Dictionary> = { en, fr, de, es, ja, ko };
