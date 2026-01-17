"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { setNickname, readContract } from "@/lib/genlayer";

interface NicknameEditorProps {
  walletAddress: string;
}

export default function NicknameEditor({ walletAddress }: NicknameEditorProps) {
  const [nickname, setNicknameValue] = useState("");
  const [currentNickname, setCurrentNickname] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current nickname on mount
  useEffect(() => {
    const fetchNickname = async () => {
      try {
        const result = await readContract<string>("get_nickname", [walletAddress]);
        if (result) {
          setCurrentNickname(result);
          setNicknameValue(result);
        }
      } catch {
        // No nickname set, that's fine
      }
    };
    fetchNickname();
  }, [walletAddress]);

  const handleSave = async () => {
    if (!nickname.trim()) {
      setError("Nickname cannot be empty");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await setNickname(nickname.trim());
      setCurrentNickname(nickname.trim());
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save nickname");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNicknameValue(currentNickname || "");
    setIsEditing(false);
    setError(null);
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
      >
        {currentNickname ? (
          <span className="font-medium">{currentNickname}</span>
        ) : (
          <span className="text-gray-400 italic">Set nickname</span>
        )}
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNicknameValue(e.target.value)}
        placeholder="Enter nickname"
        maxLength={20}
        className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-32"
        disabled={isSaving}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") handleCancel();
        }}
      />
      <Button size="sm" onClick={handleSave} isLoading={isSaving} disabled={isSaving}>
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSaving}>
        Cancel
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
