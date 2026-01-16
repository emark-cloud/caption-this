"use client";

import { useState, useEffect, useCallback } from "react";
import { readContract } from "@/lib/genlayer";
import type { LeaderboardEntry } from "@/types/round";

interface UseLeaderboardResult {
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLeaderboard(): UseLeaderboardResult {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setError(null);
      const data = await readContract<LeaderboardEntry[]>("get_leaderboard", []);
      setLeaderboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch leaderboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    // Poll every 10 seconds (leaderboard changes less frequently)
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  return { leaderboard, isLoading, error, refetch: fetchLeaderboard };
}
