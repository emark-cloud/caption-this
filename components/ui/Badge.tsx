import { type ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "active" | "voting" | "resolved" | "pending" | "info" | "success" | "warning" | "error";
  size?: "sm" | "md";
  className?: string;
}

export default function Badge({
  children,
  variant = "info",
  size = "sm",
  className = "",
}: BadgeProps) {
  const variantStyles = {
    active: "bg-green-100 text-green-800",
    voting: "bg-yellow-100 text-yellow-800",
    resolved: "bg-blue-100 text-blue-800",
    pending: "bg-gray-100 text-gray-800",
    info: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}
