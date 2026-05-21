import { useQuery } from "@tanstack/react-query";
import {
  getNewsArticle,
  listNews,
  listNewsByDeveloper,
  listNewsByPublisher,
} from "@/lib/api/news";

export function useNews() {
  return useQuery({ queryKey: ["news"], queryFn: () => listNews() });
}

export function useNewsArticle(slug: string | undefined) {
  return useQuery({
    queryKey: ["news", slug],
    queryFn: () => getNewsArticle(slug!),
    enabled: !!slug,
  });
}

export function useNewsByDeveloper(developer: string) {
  return useQuery({
    queryKey: ["news", "developer", developer],
    queryFn: () => listNewsByDeveloper(developer),
    enabled: !!developer,
  });
}

export function useNewsByPublisher(publisher: string) {
  return useQuery({
    queryKey: ["news", "publisher", publisher],
    queryFn: () => listNewsByPublisher(publisher),
    enabled: !!publisher,
  });
}
