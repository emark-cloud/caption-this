"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export default function CountUp({
  value,
  duration = 1,
  className = "",
  prefix = "",
  suffix = "",
}: CountUpProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    if (isClient) {
      spring.set(value);
    }
  }, [spring, value, isClient]);

  if (!isClient) {
    return (
      <span className={className}>
        {prefix}0{suffix}
      </span>
    );
  }

  return (
    <span className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}
