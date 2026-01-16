"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui";
import { useCountdown } from "@/hooks/useCountdown";
import type { Round } from "@/types/round";
import { getRoundStatus } from "@/types/round";

interface RoundCardProps {
  round: Round;
}

const statusLabels = {
  active: "Accepting Captions",
  voting: "Awaiting Resolution",
  resolved: "Resolved",
} as const;

export default function RoundCard({ round }: RoundCardProps) {
  const { formatted, isExpired } = useCountdown(round.submission_deadline);
  const status = getRoundStatus(round);

  // Don't render if round_id is missing
  if (!round.round_id) {
    return null;
  }

  return (
    <Link href={`/round/${round.round_id}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg cursor-pointer"
      >
        <div className="relative h-40 w-full bg-gray-200">
          {round.image_url ? (
            <Image
              src={round.image_url}
              alt="Round image"
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No image
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge variant={status}>{statusLabels[status]}</Badge>
          </div>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-blue-600">
              {round.category}
            </span>
            <span className="text-xs text-gray-500">
              {round.participant_count} caption{round.participant_count !== 1 ? "s" : ""}
            </span>
          </div>

          {status === "active" && !isExpired && (
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatted} left
              </div>
              <div className="text-sm text-blue-600 font-medium">
                Click to submit your caption →
              </div>
            </div>
          )}

          {status === "resolved" && round.result && (
            <p className="text-sm text-gray-600 truncate">
              Winner: {round.result.winner_caption}
            </p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
