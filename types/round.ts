export interface Caption {
  author: string;
  text: string;
  submitted_at: number;
}

export interface RoundResult {
  winner: string;
  runner_up: string | null;
  winner_caption: string;
  runner_up_caption: string | null;
  resolved_at: number;
  solo_score: number | null;
  is_solo_round: boolean;
}

export interface Round {
  round_id: string;
  image_url: string;
  category: Category;
  creator: string;
  created_at: number;
  submission_deadline: number;
  resolved: boolean;
  captions: Caption[];
  participant_count: number;
  result: RoundResult | null;
}

export interface LeaderboardEntry {
  address: string;
  xp: number;
}

export type Category =
  | "Funniest"
  | "Most Accurate"
  | "Most Creative"
  | "Best Meme";

export type RoundStatus = "active" | "voting" | "resolved";

export function getRoundStatus(round: Round): RoundStatus {
  if (round.resolved) return "resolved";
  const now = Math.floor(Date.now() / 1000);
  if (now <= round.submission_deadline) return "active";
  return "voting";
}
