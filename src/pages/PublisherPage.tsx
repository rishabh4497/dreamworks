import { useParams } from "react-router-dom";
import { useGamesByPublisher } from "@/hooks/use-games";
import { EntityStorefront } from "@/components/store/EntityStorefront";

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((part) => (part.length === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join(" ");
}

export function PublisherPage() {
  const { slug = "" } = useParams();
  const { data: games, isLoading } = useGamesByPublisher(slug);
  const list = games ?? [];
  const name = list[0]?.publisher ?? titleCase(slug);

  return (
    <EntityStorefront
      kind="Publisher"
      name={name}
      games={list}
      isLoading={isLoading}
    />
  );
}
