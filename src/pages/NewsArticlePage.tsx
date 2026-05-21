import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { useNewsArticle } from "@/hooks/use-news";
import { useGames } from "@/hooks/use-games";
import { GameCard } from "@/components/store/GameCard";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ROUTES } from "@/lib/routes";
import { formatDate } from "@/lib/utils";

export function NewsArticlePage() {
  const { slug = "" } = useParams();
  const { data, isLoading } = useNewsArticle(slug);
  const games = useGames();

  if (isLoading) return <LoadingSpinner />;
  if (!data) {
    return (
      <div className="py-12 text-center text-muted">
        Article not found.{" "}
        <Link to={ROUTES.news} className="text-acid underline">
          Back to news
        </Link>
      </div>
    );
  }

  const related = (games.data ?? []).filter((g) => data.relatedGameIds.includes(g.id));

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <Link to={ROUTES.news} className="inline-flex items-center gap-1.5 text-[12px] text-muted/60 hover:text-foreground/80 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> All news
      </Link>
      <img
        src={data.heroUrl}
        alt=""
        className="mb-5 aspect-[1200/520] w-full rounded-2xl object-cover"
      />
      <p className="text-[11px] uppercase tracking-widest text-muted/50 mb-1">
        {data.tags.join(" · ")}
      </p>
      <h1 className="text-[26px] font-semibold tracking-tight text-foreground">{data.title}</h1>
      <p className="mt-2 text-[12px] text-muted/60">
        {data.authorName} · {formatDate(data.publishedAt)}
      </p>
      <div className="mt-6 whitespace-pre-line text-[14px] leading-relaxed text-foreground/85">
        {data.body}
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-[16px] font-semibold text-foreground mb-3">Mentioned in this article</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {related.map((g) => (
              <GameCard key={g.id} game={g} width={340} />
            ))}
          </div>
        </section>
      )}
    </motion.article>
  );
}
