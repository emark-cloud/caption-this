"use client";

import { useState, useEffect, useCallback } from "react";
import { readContract, getResult } from "@/lib/genlayer";
import type { Round, RoundResult } from "@/types/round";

type RoundState =
  | { status: "loading" }
  | { status: "active"; round: Round }
  | { status: "resolved"; result: RoundResult; roundId: string }
  | { status: "pending"; roundId: string }
  | { status: "error"; message: string };

interface UseRoundResult {
  round: Round | null;
  roundState: RoundState;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRound(roundId: string | undefined): UseRoundResult {
  const [roundState, setRoundState] = useState<RoundState>({ status: "loading" });

  const fetchRound = useCallback(async () => {
    if (!roundId || roundId === "undefined") {
      setRoundState({ status: "error", message: "Invalid round ID" });
      return;
    }

    try {
      const data = await readContract<Round>("get_round", [roundId]);
      setRoundState({ status: "active", round: data });
    } catch {
      // Round not found - try to get result (maybe it was resolved)
      try {
        const result = await getResult<RoundResult>(roundId);
        setRoundState({ status: "resolved", result, roundId });
      } catch {
        // Neither round nor result found - likely still pending
        setRoundState({ status: "pending", roundId });
      }
    }
  }, [roundId]);

  useEffect(() => {
    fetchRound();

    // Poll every 5 seconds for updates
    const interval = setInterval(fetchRound, 5000);
    return () => clearInterval(interval);
  }, [fetchRound]);

  // Derive legacy return values from roundState for backwards compatibility
  const round = roundState.status === "active" ? roundState.round : null;
  const isLoading = roundState.status === "loading";
  const error = roundState.status === "error" ? roundState.message : null;

  return { round, roundState, isLoading, error, refetch: fetchRound };
}

interface UseActiveRoundsResult {
  rounds: Round[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useActiveRounds(): UseActiveRoundsResult {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRounds = useCallback(async () => {
    try {
      setError(null);
      // Get list of active round IDs
      const activeIds = await readContract<string[]>("get_active_rounds", []);
      console.log("[useActiveRounds] Active round IDs:", activeIds);

      if (!activeIds || activeIds.length === 0) {
        setRounds([]);
        return;
      }

      // Fetch each round's details, filtering out any that fail
      const roundPromises = activeIds.map(async (id) => {
        try {
          const round = await readContract<Round>("get_round", [id]);
          console.log("[useActiveRounds] Fetched round:", id, round);
          return round;
        } catch (err) {
          console.error("[useActiveRounds] Failed to fetch round:", id, err);
          return null;
        }
      });
      const roundsData = await Promise.all(roundPromises);
      // Filter out nulls and rounds without valid round_id
      const validRounds = roundsData.filter((r): r is Round => r !== null && !!r.round_id);
      console.log("[useActiveRounds] Valid rounds:", validRounds);
      setRounds(validRounds);
    } catch (err) {
      console.error("[useActiveRounds] Error fetching rounds:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch rounds");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRounds();

    // Poll every 5 seconds
    const interval = setInterval(fetchRounds, 5000);
    return () => clearInterval(interval);
  }, [fetchRounds]);

  return { rounds, isLoading, error, refetch: fetchRounds };
}
