"use client";

import { useState } from "react";
import CreateRound from "@/components/CreateRound";
import RoundCard from "@/components/RoundCard";
import Leaderboard from "@/components/Leaderboard";
import EmptyState from "@/components/EmptyState";
import { Button, Card } from "@/components/ui";
import { RoundCardSkeleton } from "@/components/skeletons";
import { FadeIn, StaggerList } from "@/components/animations";
import { useActiveRounds } from "@/hooks/useRound";
import { connectWallet, createRound } from "@/lib/genlayer";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { rounds, isLoading: roundsLoading, refetch } = useActiveRounds();

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const address = await connectWallet();
      setWalletAddress(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setShowCreateForm(false);
  };

  const handleCreateRound = async (roundId: string, imageUrl: string, category: string) => {
    await createRound(roundId, imageUrl, category);
    setShowCreateForm(false);
    await refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Caption This</h1>

          {walletAddress ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 font-mono">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
              <Button
                variant={showCreateForm ? "secondary" : "primary"}
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? "Cancel" : "+ New Round"}
              </Button>
              <Button variant="secondary" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleConnect}
              isLoading={isConnecting}
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>
      </header>

      {error && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        </div>
      )}

      <main id="main-content" className="max-w-6xl mx-auto px-4 py-8">
        {/* Create Round Form */}
        {showCreateForm && (
          <Card variant="elevated" className="mb-8 max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">Create New Round</h2>
            <CreateRound onSubmit={handleCreateRound} />
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Active Rounds */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Active Rounds</h2>

            {roundsLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <RoundCardSkeleton key={i} />
                ))}
              </div>
            ) : rounds.length > 0 ? (
              <StaggerList className="grid sm:grid-cols-2 gap-4">
                {rounds.map((round, index) => (
                  <RoundCard key={round.round_id || `round-${index}`} round={round} />
                ))}
              </StaggerList>
            ) : (
              <div className="bg-white rounded-xl shadow-md">
                <EmptyState
                  icon="game"
                  title="No games in progress"
                  description={
                    walletAddress
                      ? "Be the first to start a caption battle!"
                      : "Connect your wallet to create a round"
                  }
                  action={
                    walletAddress
                      ? {
                          label: "Create Round",
                          onClick: () => setShowCreateForm(true),
                        }
                      : undefined
                  }
                />
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
            <Card variant="elevated" padding="sm">
              <Leaderboard currentAddress={walletAddress} />
            </Card>

            {/* XP Info */}
            <div className="mt-4 bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">How to earn XP</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>🥇 Winner: +15 XP</li>
                <li>🥈 Runner-up: +8 XP</li>
                <li>✨ Participation: +3 XP</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
