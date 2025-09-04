import * as React from "react"
import { cn } from "./utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "intense" | "subtle"
  blur?: "sm" | "md" | "lg"
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", blur = "md", ...props }, ref) => {
    const variants = {
      default: "bg-white/10 border-white/20",
      intense: "bg-white/20 border-white/30",
      subtle: "bg-white/5 border-white/10"
    }

    const blurLevels = {
      sm: "backdrop-blur-sm",
      md: "backdrop-blur-md", 
      lg: "backdrop-blur-lg"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border shadow-xl",
          "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-50",
          "relative overflow-hidden",
          variants[variant],
          blurLevels[blur],
          className
        )}
        {...props}
      />
    )
  }
)
GlassCard.displayName = "GlassCard"

export { GlassCard }