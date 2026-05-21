import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Activity, BarChart3, Calendar, ListTodo, Tag, TrendingUp } from "lucide-react";
import { ROUTES } from "@/lib/routes";

const TILES = [
  { to: ROUTES.dbChart("top-played"), icon: TrendingUp, title: "Top Played", desc: "Most-played games right now." },
  { to: ROUTES.dbChart("top-wishlisted"), icon: TrendingUp, title: "Top Wishlisted", desc: "What everyone wants." },
  { to: ROUTES.dbChart("trending"), icon: TrendingUp, title: "Trending", desc: "Hot this week." },
  { to: ROUTES.dbChart("recently-updated"), icon: BarChart3, title: "Recently Updated", desc: "Active development." },
  { to: ROUTES.dbChart("free"), icon: Tag, title: "Free Promotions", desc: "Free-for-a-limited-time deals." },
  { to: ROUTES.dbSales, title: "Sales Tracker", icon: Tag, desc: "Biggest current discounts." },
  { to: ROUTES.dbCalendar, title: "Calendar", icon: Calendar, desc: "Upcoming releases & sales." },
  { to: ROUTES.dbAccount, title: "My Analytics", icon: Activity, desc: "Your library, by the numbers." },
  { to: ROUTES.dbRoadmap, title: "Feature Roadmap", icon: ListTodo, desc: "Missing launcher capabilities and implementation status." },
];

export function DbHomePage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-muted/50 flex items-center gap-1.5">
          <BarChart3 className="h-3 w-3" /> Dreamworks DB
        </p>
        <h1 className="text-[24px] font-semibold tracking-tight text-foreground">Database</h1>
        <p className="text-[13px] text-muted/60">
          Tracking prices, player counts, depots, and patches across the catalog.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TILES.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="group rounded-xl border border-separator bg-card hover:bg-card-hover p-5 transition-colors"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-card-active group-hover:bg-acid/10 transition-colors">
              <t.icon className="h-4 w-4 text-foreground/70 group-hover:text-acid" />
            </div>
            <p className="text-[14px] font-semibold text-foreground">{t.title}</p>
            <p className="mt-1 text-[12px] text-muted/60">{t.desc}</p>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
