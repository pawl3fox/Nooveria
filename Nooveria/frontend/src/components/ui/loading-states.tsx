import * as React from "react"
import { cn } from "./utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  variant?: "default" | "dots" | "pulse" | "bars" | "orbit"
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  variant = "default",
  className
}) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex space-x-1", className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "bg-primary rounded-full animate-pulse",
              size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4"
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: "1s"
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === "pulse") {
    return (
      <div className={cn("relative", sizes[size], className)}>
        <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75" />
        <div className="relative bg-primary rounded-full h-full w-full" />
      </div>
    )
  }

  if (variant === "bars") {
    return (
      <div className={cn("flex space-x-1", className)}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "bg-primary animate-pulse",
              size === "sm" ? "w-1 h-4" : size === "md" ? "w-1.5 h-6" : "w-2 h-8"
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: "1.2s"
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === "orbit") {
    return (
      <div className={cn("relative", sizes[size], className)}>
        <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin" />
        <div className="absolute inset-2 border-2 border-transparent border-t-primary/60 rounded-full animate-spin" 
             style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
      </div>
    )
  }

  // Default spinner
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-primary/20 border-t-primary",
        sizes[size],
        className
      )}
    />
  )
}

interface SkeletonProps {
  className?: string
  variant?: "text" | "circular" | "rectangular" | "card"
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  variant = "rectangular" 
}) => {
  const variants = {
    text: "h-4 w-full rounded",
    circular: "rounded-full aspect-square",
    rectangular: "h-4 w-full rounded",
    card: "h-32 w-full rounded-lg"
  }

  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        variants[variant],
        className
      )}
    />
  )
}

export { LoadingSpinner, Skeleton }