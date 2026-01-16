"use client";

import { useState, useEffect } from "react";

interface CountdownResult {
  timeLeft: number;
  isExpired: boolean;
  formatted: string;
}

export function useCountdown(deadline: number): CountdownResult {
  const [timeLeft, setTimeLeft] = useState(() => {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, deadline - now);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, deadline - now);
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    timeLeft,
    isExpired: timeLeft === 0,
    formatted: formatTime(timeLeft),
  };
}
