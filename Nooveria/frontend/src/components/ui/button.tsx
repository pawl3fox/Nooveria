import * as React from "react";
import { Slot } from "@radix-ui/react-slot@1.1.2";
import { cva, type VariantProps } from "class-variance-authority@0.7.1";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-accent via-accent-secondary to-accent text-primary-foreground hover:from-accent-secondary hover:via-accent-tertiary hover:to-accent shadow-lg hover:shadow-xl hover:shadow-accent/25 border border-accent/50",
        destructive:
          "bg-gradient-to-r from-destructive to-red-600 text-white hover:from-red-600 hover:to-destructive shadow-lg hover:shadow-xl hover:shadow-destructive/25 border border-destructive/50 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-accent bg-transparent text-accent hover:bg-accent/10 hover:text-accent-foreground hover:border-accent-secondary shadow-md hover:shadow-lg hover:shadow-accent/20 backdrop-blur-sm",
        secondary:
          "bg-gradient-to-r from-secondary to-muted text-secondary-foreground hover:from-muted hover:to-secondary/80 border border-accent/30",
        ghost:
          "hover:bg-accent/10 hover:text-accent-foreground hover:shadow-md hover:shadow-accent/10 border border-transparent hover:border-accent/30",
        link: "text-accent underline-offset-4 hover:underline hover:text-accent-secondary",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size }),
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500",
        className
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
