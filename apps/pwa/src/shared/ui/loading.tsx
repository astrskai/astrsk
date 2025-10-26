import { Logo } from "@/shared/assets/icons";
import { cn } from "@/shared/lib/cn";

export interface LoadingProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Loading component with rotating astrsk logo
 * Centered within its container
 */
export function Loading({ size = "md", className }: LoadingProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className={cn("flex h-full w-full items-center justify-center", className)}>
      <div className={cn("animate-spin [animation-duration:2s]", sizeClasses[size])}>
        <Logo className="h-full w-full" />
      </div>
    </div>
  );
}
