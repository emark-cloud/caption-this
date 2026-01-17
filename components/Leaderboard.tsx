"use client";

import { useLeaderboard } from "@/hooks/useLeaderboard";
import { LeaderboardSkeleton } from "@/components/skeletons";
import EmptyState from "@/components/EmptyState";

interface LeaderboardProps {
  currentAddress?: string | null;
  limit?: number;
}

export default function Leaderboard({ currentAddress, limit = 10 }: LeaderboardProps) {
  const { leaderboard, nicknames, isLoading, error } = useLeaderboard();

  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-4">
        Failed to load leaderboard
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <EmptyState
        icon="trophy"
        title="No players yet"
        description="Be the first to earn XP by winning caption battles!"
      />
    );
  }

  const displayedLeaderboard = leaderboard.slice(0, limit);

  const getMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return "";
    }
  };

  const formatAddress = (address: string | undefined): string => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getDisplayName = (address: string | undefined): { name: string; isNickname: boolean } => {
    if (!address) return { name: "Unknown", isNickname: false };
    const nickname = nicknames[address];
    if (nickname) {
      return { name: nickname, isNickname: true };
    }
    return { name: formatAddress(address), isNickname: false };
  };

  return (
    <div role="list" aria-label="XP Leaderboard" className="space-y-2">
      {displayedLeaderboard.map((entry, index) => {
        const rank = index + 1;
        const isCurrentUser =
          currentAddress?.toLowerCase() === entry.address?.toLowerCase();
        const { name: displayName, isNickname } = getDisplayName(entry.address);

        return (
          <div
            key={entry.address || index}
            role="listitem"
            className={`flex items-center justify-between p-3 rounded-lg ${
              isCurrentUser
                ? "bg-blue-50 border border-blue-200"
                : "bg-gray-50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="w-8 text-center font-medium text-gray-600">
                {getMedalEmoji(rank) || `#${rank}`}
              </span>
              <span
                className={`text-sm ${
                  isCurrentUser ? "font-semibold text-blue-700" : "text-gray-700"
                } ${isNickname ? "" : "font-mono"}`}
              >
                {displayName}
                {isCurrentUser && (
                  <span className="ml-2 text-xs text-blue-600">(You)</span>
                )}
              </span>
            </div>
            <span className="font-semibold text-gray-900">{entry.xp} XP</span>
          </div>
        );
      })}
    </div>
  );
}
