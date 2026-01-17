"use client";

import { useState, useEffect, useCallback } from "react";
import { readContract, getNicknames } from "@/lib/genlayer";
import type { LeaderboardEntry } from "@/types/round";

interface UseLeaderboardResult {
  leaderboard: LeaderboardEntry[];
  nicknames: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLeaderboard(): UseLeaderboardResult {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setError(null);
      const data = await readContract<LeaderboardEntry[]>("get_leaderboard", []);
      setLeaderboard(data);

      // Fetch nicknames for all addresses
      if (data.length > 0) {
        const addresses = data.map((entry) => entry.address).filter(Boolean) as string[];
        if (addresses.length > 0) {
          try {
            const nicknameData = await getNicknames(addresses);
            setNicknames(nicknameData);
          } catch {
            // Nicknames are optional, don't fail if fetch fails
            console.warn("Failed to fetch nicknames");
          }
        }
      }
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

  return { leaderboard, nicknames, isLoading, error, refetch: fetchLeaderboard };
}
