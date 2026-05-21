import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-acid text-background hover:brightness-110 active:brightness-95",
        secondary:
          "border border-separator bg-card text-foreground/80 hover:bg-card-active hover:text-foreground",
        ghost: "text-muted hover:bg-input hover:text-foreground/80",
        success: "bg-gradient-to-b from-price to-price/85 text-background shadow-sm shadow-price/30 hover:brightness-110 active:brightness-95",
        danger: "bg-red text-white hover:brightness-110",
        steam: "bg-positive text-background hover:brightness-110",
        outline:
          "border border-acid/30 text-acid hover:bg-acid/10",
      },
      size: {
        sm: "h-7 px-2.5 text-[11px]",
        md: "h-9 px-3.5 text-[13px]",
        lg: "h-11 px-5 text-[14px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
