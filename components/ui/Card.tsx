import type { HTMLAttributes } from "react";

import { cn } from "@/lib/helpers";

type CardVariant = "default" | "soft" | "glow" | "outline";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

const variantClasses: Record<CardVariant, string> = {
  default: "dashboard-card",
  soft: "dashboard-card-soft",
  glow: "dashboard-card-glow",
  outline: "border border-[var(--border-soft)] bg-transparent",
};

export default function Card({
  children,
  className,
  variant = "default",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[22px] p-[18px] shadow-[var(--shadow-card)] sm:p-6",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
