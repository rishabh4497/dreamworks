import { useParams } from "react-router-dom";
import { useGamesByDeveloper } from "@/hooks/use-games";
import { EntityStorefront } from "@/components/store/EntityStorefront";

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((part) => (part.length === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join(" ");
}

export function DeveloperPage() {
  const { slug = "" } = useParams();
  const { data: games, isLoading } = useGamesByDeveloper(slug);
  const list = games ?? [];
  const name = list[0]?.developer ?? titleCase(slug);

  return (
    <EntityStorefront
      kind="Developer"
      name={name}
      games={list}
      isLoading={isLoading}
    />
  );
}
