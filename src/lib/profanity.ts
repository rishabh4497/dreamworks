// Small, conservative list — the UI promise is "obscure offensive language",
// not a moderation system. Extend cautiously; word-boundary matching means
// false positives are unlikely.
const WORDS = [
  "ass",
  "asshole",
  "bastard",
  "bitch",
  "bollocks",
  "bullshit",
  "cock",
  "crap",
  "cunt",
  "damn",
  "dick",
  "dickhead",
  "dipshit",
  "douche",
  "dyke",
  "fag",
  "faggot",
  "fuck",
  "fucker",
  "fucking",
  "goddamn",
  "jackass",
  "motherfucker",
  "nigger",
  "piss",
  "prick",
  "pussy",
  "retard",
  "shit",
  "slut",
  "twat",
  "wanker",
  "whore",
];

const RE = new RegExp(`\\b(${WORDS.join("|")})\\b`, "gi");

/**
 * Replace each matched word with asterisks of the same length. When `enabled`
 * is false, returns the input unchanged.
 */
export function censorText(text: string, enabled: boolean): string {
  if (!enabled || !text) return text;
  return text.replace(RE, (match) => "*".repeat(match.length));
}
