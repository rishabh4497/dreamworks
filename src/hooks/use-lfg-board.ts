import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLfgGuide,
  createLfgPost,
  listLfgGuides,
  listLfgPosts,
  type CreateLfgGuideInput,
  type CreateLfgPostInput,
} from "@/lib/api/lfg-board";

export const lfgBoardKeys = {
  posts: ["lfg-board", "posts"] as const,
  guides: ["lfg-board", "guides"] as const,
};

export function useLfgPosts() {
  return useQuery({
    queryKey: lfgBoardKeys.posts,
    queryFn: () => listLfgPosts(),
  });
}

export function useLfgGuides() {
  return useQuery({
    queryKey: lfgBoardKeys.guides,
    queryFn: listLfgGuides,
  });
}

export function useCreateLfgPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLfgPostInput) => createLfgPost(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lfgBoardKeys.posts });
    },
  });
}

export function useCreateLfgGuide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLfgGuideInput) => createLfgGuide(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lfgBoardKeys.guides });
    },
  });
}
