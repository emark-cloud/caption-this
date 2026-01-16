"use client";

import { motion } from "framer-motion";
import { type ReactNode, Children, cloneElement, isValidElement } from "react";

interface StaggerListProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { ease: "easeOut" } },
};

export default function StaggerList({
  children,
  staggerDelay = 0.08,
  className = "",
}: StaggerListProps) {
  const containerVariants = {
    ...container,
    show: {
      ...container.show,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {Children.map(children, (child) => {
        if (isValidElement(child)) {
          return (
            <motion.div variants={item}>
              {cloneElement(child)}
            </motion.div>
          );
        }
        return child;
      })}
    </motion.div>
  );
}
