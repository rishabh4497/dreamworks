import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useNews } from "@/hooks/use-news";
import { ROUTES } from "@/lib/routes";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

export function NewsPage() {
  const { data, isLoading } = useNews();
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">News</h1>
        <p className="text-[13px] text-muted/60">Updates from across the catalog.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)
          : (data ?? []).map((article) => (
              <Link
                key={article.slug}
                to={ROUTES.newsArticle(article.slug)}
                className="group overflow-hidden rounded-xl border border-separator bg-card hover:bg-card-hover transition-colors"
              >
                <img
                  src={article.heroUrl}
                  alt=""
                  className="aspect-[1200/520] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="p-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted/50">
                    {article.tags.join(" · ")}
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-foreground line-clamp-2">
                    {article.title}
                  </p>
                  <p className="mt-1 text-[12px] text-muted/60 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <p className="mt-2 text-[10px] text-muted/40">
                    {article.authorName} · {formatDate(article.publishedAt)}
                  </p>
                </div>
              </Link>
            ))}
      </div>
    </motion.div>
  );
}
