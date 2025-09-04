import * as React from "react"
import { cn } from "./utils"

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
  variant?: "fade" | "slide" | "scale" | "blur"
  duration?: number
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
  variant = "fade",
  duration = 300
}) => {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    setIsVisible(true)
  }, [])

  const variants = {
    fade: {
      initial: "opacity-0",
      animate: "opacity-100",
      transition: `transition-opacity duration-${duration}`
    },
    slide: {
      initial: "opacity-0 translate-y-4",
      animate: "opacity-100 translate-y-0",
      transition: `transition-all duration-${duration} ease-out`
    },
    scale: {
      initial: "opacity-0 scale-95",
      animate: "opacity-100 scale-100",
      transition: `transition-all duration-${duration} ease-out`
    },
    blur: {
      initial: "opacity-0 blur-sm",
      animate: "opacity-100 blur-none",
      transition: `transition-all duration-${duration} ease-out`
    }
  }

  const currentVariant = variants[variant]

  return (
    <div
      className={cn(
        currentVariant.initial,
        isVisible && currentVariant.animate,
        currentVariant.transition,
        className
      )}
    >
      {children}
    </div>
  )
}

export { PageTransition }