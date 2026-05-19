import {
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
} from "react";

import Loader from "@/components/ui/Loader";
import { cn } from "@/lib/helpers";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    "border border-orange-400/10 bg-[var(--gradient-accent)] text-white hover:brightness-110 hover:-translate-y-px",
  secondary:
    "border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] text-white hover:bg-white/[0.06] hover:border-white/16",
  ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-white",
  danger:
    "border border-orange-500/20 bg-orange-500/10 text-orange-300 hover:bg-orange-500/16 hover:text-white",
  outline:
    "border border-orange-500/45 bg-transparent text-[var(--accent-3)] hover:bg-orange-500/10 hover:text-white",
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: "min-h-10 rounded-[10px] px-4 text-sm gap-2",
  md: "min-h-[52px] rounded-[12px] px-5 text-sm gap-2",
  lg: "min-h-[52px] rounded-[12px] px-6 text-base gap-2.5",
};

export default function Button({
  asChild = false,
  children,
  className,
  disabled,
  fullWidth = false,
  isLoading = false,
  size = "md",
  type = "button",
  variant = "primary",
  leftIcon,
  rightIcon,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0",
    variantClassMap[variant],
    sizeClassMap[size],
    fullWidth && "w-full",
    className
  );

  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement<{ className?: string }>, {
      className: cn(classes, (children.props as { className?: string }).className),
    });
  }

  return (
    <button className={classes} disabled={disabled || isLoading} type={type} {...props}>
      {isLoading ? (
        <Loader size="sm" />
      ) : (
        <>
          {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
          <span>{children}</span>
          {rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
        </>
      )}
    </button>
  );
}
