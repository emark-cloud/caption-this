"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

const MAX_CAPTION_LENGTH = 280;

interface CaptionInputProps {
  onSubmit: (caption: string) => Promise<void>;
  disabled?: boolean;
  hasSubmitted?: boolean;
}

export default function CaptionInput({
  onSubmit,
  disabled,
  hasSubmitted,
}: CaptionInputProps) {
  const [caption, setCaption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charactersLeft = MAX_CAPTION_LENGTH - caption.length;
  const isOverLimit = charactersLeft < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() || isOverLimit || disabled || hasSubmitted) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(caption.trim());
      setCaption("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit caption");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <svg
          className="w-8 h-8 mx-auto text-green-500 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <p className="text-green-700 font-medium">Caption submitted!</p>
        <p className="text-green-600 text-sm">
          Wait for the deadline to see all captions
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write your caption..."
          disabled={disabled || isSubmitting}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 text-gray-900 placeholder:text-gray-400 ${
            isOverLimit ? "border-red-500" : "border-gray-300"
          }`}
        />
        <div className="flex justify-end mt-1">
          <span
            className={`text-xs ${
              isOverLimit
                ? "text-red-500"
                : charactersLeft < 50
                ? "text-yellow-600"
                : "text-gray-500"
            }`}
          >
            {charactersLeft} characters left
          </span>
        </div>
      </div>

      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={disabled || !caption.trim() || isOverLimit}
        isLoading={isSubmitting}
        fullWidth
      >
        {isSubmitting ? "Submitting..." : "Submit Caption"}
      </Button>
    </form>
  );
}
