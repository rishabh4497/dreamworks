import { useQuery } from "@tanstack/react-query";
import {
  listFriendActivity,
  listFriendOwnership,
  listFriends,
  listFriendsWhoOwn,
} from "@/lib/api/friends";
import type { GameId } from "@/lib/types";

export function useFriends() {
  return useQuery({ queryKey: ["friends"], queryFn: listFriends });
}

export function useFriendActivity() {
  return useQuery({ queryKey: ["friends", "activity"], queryFn: listFriendActivity });
}

export function useFriendsWhoOwn(gameId: GameId | undefined) {
  return useQuery({
    queryKey: gameId ? ["friends", "owns", gameId] : ["disabled"],
    queryFn: () => listFriendsWhoOwn(gameId!),
    enabled: !!gameId,
  });
}

export function useFriendOwnership() {
  return useQuery({ queryKey: ["friends", "ownership"], queryFn: listFriendOwnership });
}
