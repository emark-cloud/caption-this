"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useRound } from "@/hooks/useRound";
import { useCountdown } from "@/hooks/useCountdown";
import CaptionInput from "@/components/CaptionInput";
import { Button, Badge, Card } from "@/components/ui";
import { RoundPageSkeleton } from "@/components/skeletons";
import { FadeIn, Confetti } from "@/components/animations";
import { connectWallet, submitCaption, resolveRound, cancelRound } from "@/lib/genlayer";
import { getRoundStatus } from "@/types/round";

export default function RoundPage() {
  const params = useParams();
  const router = useRouter();
  // Handle both undefined and literal "undefined" string
  const rawId = typeof params.id === "string" ? params.id : undefined;
  const roundId = rawId && rawId !== "undefined" ? rawId : undefined;
  const { round, roundState, isLoading, refetch } = useRound(roundId);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionPending, setResolutionPending] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const deadline = round?.submission_deadline ?? 0;
  const { formatted, isExpired, timeLeft } = useCountdown(deadline);
  const isUrgent = timeLeft > 0 && timeLeft <= 30;

  // Show confetti when results first appear and clear pending state
  useEffect(() => {
    if (roundState.status === "resolved" || (round && getRoundStatus(round) === "resolved")) {
      setShowConfetti(true);
      setResolutionPending(false);
    }
  }, [roundState.status, round]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const address = await connectWallet();
      setWalletAddress(address);
    } catch (err) {
      console.error("Failed to connect:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return <RoundPageSkeleton />;
  }

  // Handle pending state (round not yet confirmed on-chain)
  if (roundState.status === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-blue-800 mb-2">Round Pending</h2>
            <p className="text-blue-600 mb-4">
              Round &quot;{roundState.roundId}&quot; is being processed by validators.
            </p>
            <p className="text-blue-500 text-sm">
              This typically takes 1-2 minutes. The page will refresh automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle resolved state (round was resolved and cleaned up)
  if (roundState.status === "resolved") {
    const result = roundState.result;
    const isSolo = result.is_solo_round;

    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Round Results</h2>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Resolved
              </span>
            </div>

            {isSolo ? (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">🎯</span>
                    <span className="font-semibold text-purple-800">AI Score</span>
                  </div>
                  <span className="text-3xl font-bold text-purple-600">
                    {result.solo_score}/10
                  </span>
                </div>
                <p className="text-gray-800 text-lg">&ldquo;{result.winner_caption}&rdquo;</p>
                <p className="text-gray-500 text-sm mt-1 font-mono">
                  {result.winner ? `${result.winner.slice(0, 6)}...${result.winner.slice(-4)}` : "Unknown"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">🥇</span>
                    <span className="font-semibold text-yellow-800">Winner (+15 XP)</span>
                  </div>
                  <p className="text-gray-800 text-lg">&ldquo;{result.winner_caption}&rdquo;</p>
                  <p className="text-gray-500 text-sm mt-1 font-mono">
                    {result.winner ? `${result.winner.slice(0, 6)}...${result.winner.slice(-4)}` : "Unknown"}
                  </p>
                </div>

                {result.runner_up && result.runner_up_caption && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">🥈</span>
                      <span className="font-semibold text-gray-700">Runner-up (+8 XP)</span>
                    </div>
                    <p className="text-gray-800 text-lg">&ldquo;{result.runner_up_caption}&rdquo;</p>
                    <p className="text-gray-500 text-sm mt-1 font-mono">
                      {result.runner_up ? `${result.runner_up.slice(0, 6)}...${result.runner_up.slice(-4)}` : "Unknown"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (roundState.status === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{roundState.message}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Active round - should have round data
  if (!round) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Round not found</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const status = getRoundStatus(round);
  const hasSubmitted = round.captions.some(
    (c) => c.author.toLowerCase() === walletAddress?.toLowerCase()
  );

  const handleSubmitCaption = async (caption: string) => {
    if (!roundId) return;
    await submitCaption(roundId, caption);
    await refetch();
  };

  const handleResolve = async () => {
    if (!roundId) return;
    setIsResolving(true);
    setResolveError(null);
    try {
      await resolveRound(roundId);
      // Transaction sent - now waiting for validators
      setResolutionPending(true);
      await refetch();
    } catch (err) {
      setResolveError(err instanceof Error ? err.message : "Failed to resolve");
    } finally {
      setIsResolving(false);
    }
  };

  const handleCancel = async () => {
    if (!roundId) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      await cancelRound(roundId);
      // Redirect to home after successful cancellation
      router.push("/");
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Failed to cancel round");
      setIsCancelling(false);
    }
  };

  // Check if current user is the creator
  const isCreator = round?.creator && walletAddress
    ? round.creator.toLowerCase() === walletAddress.toLowerCase()
    : false;

  // Get shareable link
  const shareLink = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <Confetti isActive={showConfetti} />
      <FadeIn className="max-w-2xl mx-auto">
        {/* Header with back button and cancel option */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            aria-label="Back to home"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </Link>

          {/* Cancel button - only for creator, before resolution */}
          {isCreator && status !== "resolved" && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancel}
              isLoading={isCancelling}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Cancel Round"}
            </Button>
          )}
        </div>

        {/* Cancel error message */}
        {cancelError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {cancelError}
          </div>
        )}

        {/* Round Image */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="relative h-64 sm:h-80 w-full">
            <Image
              src={round.image_url}
              alt="Round image"
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-contain bg-gray-100"
              priority
            />
          </div>

          <div className="p-4 border-t">
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {round.category}
              </span>

              {status === "active" && !isExpired && (
                <div
                  role="timer"
                  aria-live="polite"
                  aria-label={`${formatted} remaining to submit caption`}
                  className={`flex items-center font-medium ${
                    isUrgent ? "text-red-600 animate-pulse" : "text-orange-600"
                  }`}
                >
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {formatted}
                </div>
              )}

              {status === "voting" && (
                <span className="text-yellow-600 font-medium">
                  Awaiting Resolution
                </span>
              )}

              {status === "resolved" && (
                <span className="text-green-600 font-medium">Resolved</span>
              )}
            </div>
          </div>
        </div>

        {/* Share Link (during active phase) */}
        {status === "active" && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-blue-900 mb-1">Invite others to caption!</h3>
                <p className="text-xs text-blue-600 truncate">{shareLink}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {linkCopied ? (
                  <>
                    <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Caption Input (only during active phase) */}
        {status === "active" && walletAddress && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Submit Your Caption</h2>
            <CaptionInput
              onSubmit={handleSubmitCaption}
              disabled={isExpired}
              hasSubmitted={hasSubmitted}
            />
          </div>
        )}

        {status === "active" && !walletAddress && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6 text-center">
            <p className="text-yellow-800 mb-4">
              Connect your wallet to submit a caption
            </p>
            <Button onClick={handleConnect} isLoading={isConnecting}>
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          </div>
        )}

        {/* Resolve Button (when voting phase) */}
        {status === "voting" && round.participant_count >= 1 && (
          <Card variant="elevated" className="mb-6">
            {resolutionPending ? (
              /* Pending resolution indicator */
              <div className="text-center py-4">
                <div className="animate-spin h-10 w-10 border-3 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h2 className="text-lg font-semibold text-purple-800 mb-2">Resolution in Progress</h2>
                <p className="text-purple-600 text-sm mb-2">
                  Validators are processing the AI evaluation...
                </p>
                <p className="text-gray-500 text-xs">
                  This typically takes 1-2 minutes. Results will appear automatically.
                </p>
              </div>
            ) : (
              /* Ready to resolve */
              <>
                <h2 className="text-lg font-semibold mb-2 text-gray-900">Ready to Resolve</h2>
                <p className="text-gray-600 text-sm mb-4">
                  {round.participant_count === 1
                    ? "One caption submitted. AI will score it from 1-10."
                    : "The submission deadline has passed. Trigger AI resolution to determine the winners."}
                </p>
                {resolveError && (
                  <p className="text-red-600 text-sm mb-4">{resolveError}</p>
                )}
                {walletAddress ? (
                  <Button
                    onClick={handleResolve}
                    isLoading={isResolving}
                    fullWidth
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isResolving ? "Submitting..." : "Resolve Round"}
                  </Button>
                ) : (
                  <Button onClick={handleConnect} isLoading={isConnecting} fullWidth>
                    {isConnecting ? "Connecting..." : "Connect Wallet to Resolve"}
                  </Button>
                )}
              </>
            )}
          </Card>
        )}

        {status === "voting" && round.participant_count < 1 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-red-800">
              No captions submitted. Cannot resolve an empty round.
            </p>
          </div>
        )}

        {/* Results (when resolved) */}
        {status === "resolved" && round.result && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Results</h2>

            {round.result.is_solo_round ? (
              /* Solo round - show score */
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">🎯</span>
                    <span className="font-semibold text-purple-800">AI Score</span>
                  </div>
                  <span className="text-3xl font-bold text-purple-600">
                    {round.result.solo_score}/10
                  </span>
                </div>
                <p className="text-gray-800 text-lg">&ldquo;{round.result.winner_caption}&rdquo;</p>
                <p className="text-gray-500 text-sm mt-1 font-mono">
                  {round.result.winner.slice(0, 6)}...{round.result.winner.slice(-4)}
                </p>
                <p className="text-purple-600 text-sm mt-2">
                  +{3 + Math.floor((round.result.solo_score || 0) * 15 / 10)} XP earned
                </p>
              </div>
            ) : (
              /* Multi-player round - show winner/runner-up */
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">🥇</span>
                    <span className="font-semibold text-yellow-800">Winner (+15 XP)</span>
                  </div>
                  <p className="text-gray-800 text-lg">&ldquo;{round.result.winner_caption}&rdquo;</p>
                  <p className="text-gray-500 text-sm mt-1 font-mono">
                    {round.result.winner.slice(0, 6)}...{round.result.winner.slice(-4)}
                  </p>
                </div>

                {round.result.runner_up && round.result.runner_up_caption && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">🥈</span>
                      <span className="font-semibold text-gray-700">Runner-up (+8 XP)</span>
                    </div>
                    <p className="text-gray-800 text-lg">&ldquo;{round.result.runner_up_caption}&rdquo;</p>
                    <p className="text-gray-500 text-sm mt-1 font-mono">
                      {round.result.runner_up.slice(0, 6)}...{round.result.runner_up.slice(-4)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* All Captions (visible after deadline) */}
        {(status === "voting" || status === "resolved") && round.captions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              All Captions ({round.captions.length})
            </h2>
            <div className="space-y-3">
              {round.captions.map((caption, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg"
                >
                  <p className="text-gray-800">&ldquo;{caption.text}&rdquo;</p>
                  <p className="text-gray-500 text-xs mt-1 font-mono">
                    {caption.author.slice(0, 6)}...{caption.author.slice(-4)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hidden captions notice during active phase */}
        {status === "active" && round.participant_count > 0 && (
          <div className="bg-gray-100 rounded-xl p-4 text-center">
            <p className="text-gray-600">
              {round.participant_count} caption{round.participant_count !== 1 ? "s" : ""} submitted.
              Captions are hidden until the deadline.
            </p>
          </div>
        )}
      </FadeIn>
    </div>
  );
}
