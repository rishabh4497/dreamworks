import type { FollowSuggestion } from "../types";
import { FOLLOW_SUGGESTIONS } from "../mock/follow-suggestions";
import { wait } from "./_delay";

export async function listFollowSuggestions(): Promise<FollowSuggestion[]> {
  await wait();
  return FOLLOW_SUGGESTIONS;
}
