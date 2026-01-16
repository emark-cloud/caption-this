import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}

export default function Card({
  children,
  variant = "elevated",
  padding = "md",
  className = "",
}: CardProps) {
  const variantStyles = {
    default: "bg-white",
    elevated: "bg-white shadow-md",
    outlined: "bg-white border border-gray-200",
  };

  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`rounded-xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
