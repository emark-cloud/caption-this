interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export default function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const variantStyles = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const animationClass = animate ? "skeleton-shimmer" : "bg-gray-200";

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      className={`${animationClass} ${variantStyles[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

// Pre-built skeleton variants for common use cases
export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className="h-4"
          width={i === lines - 1 && lines > 1 ? "75%" : "100%"}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeStyles = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return <Skeleton variant="circular" className={sizeStyles[size]} />;
}

export function SkeletonButton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeStyles = {
    sm: "h-8 w-20",
    md: "h-10 w-24",
    lg: "h-12 w-32",
  };

  return <Skeleton className={sizeStyles[size]} />;
}
