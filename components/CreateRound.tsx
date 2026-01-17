"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import ImageUpload from "./ImageUpload";

const CATEGORIES = [
  "Funniest",
  "Most Accurate",
  "Most Creative",
  "Best Meme",
] as const;

type Category = (typeof CATEGORIES)[number];

type CreationStatus =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "pending"; roundId: string }
  | { state: "error"; message: string };

interface CreateRoundProps {
  onSubmit: (roundId: string, imageUrl: string, category: Category) => Promise<void>;
}

export default function CreateRound({ onSubmit }: CreateRoundProps) {
  const [roundId, setRoundId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState<Category>("Funniest");
  const [status, setStatus] = useState<CreationStatus>({ state: "idle" });

  const isSubmitting = status.state === "submitting";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roundId.trim()) {
      setStatus({ state: "error", message: "Please enter a round ID" });
      return;
    }

    if (!imageUrl) {
      setStatus({ state: "error", message: "Please upload an image" });
      return;
    }

    const submittedRoundId = roundId.trim();
    setStatus({ state: "submitting" });
    try {
      await onSubmit(submittedRoundId, imageUrl, category);
      setStatus({ state: "pending", roundId: submittedRoundId });
      setRoundId("");
      setImageUrl("");
      setCategory("Funniest");
    } catch (err) {
      setStatus({ state: "error", message: err instanceof Error ? err.message : "Failed to create round" });
    }
  };

  const dismissStatus = () => {
    setStatus({ state: "idle" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative">
      {isSubmitting && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg z-10 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full"></div>
          <div className="text-center">
            <p className="text-blue-800 font-medium">Creating Round...</p>
            <p className="text-blue-600 text-sm">Submitting to GenLayer</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Round ID
        </label>
        <input
          type="text"
          value={roundId}
          onChange={(e) => setRoundId(e.target.value)}
          placeholder="e.g., my-round-1"
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 text-gray-900 placeholder:text-gray-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Round Image
        </label>
        <ImageUpload
          value={imageUrl}
          onChange={setImageUrl}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 text-gray-900"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {status.state === "error" && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {status.message}
        </div>
      )}

      {status.state === "pending" && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <div>
                <p className="text-blue-800 font-medium">Round Creation Pending</p>
                <p className="text-blue-600 text-sm">
                  Round &quot;{status.roundId}&quot; is being processed by validators (1-2 min)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissStatus}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <Button
        type="submit"
        disabled={!imageUrl || !roundId.trim()}
        isLoading={isSubmitting}
        fullWidth
        size="lg"
      >
        {isSubmitting ? "Creating Round..." : "Create Round"}
      </Button>
    </form>
  );
}
