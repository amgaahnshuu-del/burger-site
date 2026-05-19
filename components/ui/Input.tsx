import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import type { InputHTMLAttributes } from "react";
import { useState } from "react";

import { cn } from "@/lib/helpers";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
};

export default function Input({
  className,
  error,
  hint,
  id,
  label,
  leftIcon,
  rightIcon,
  showPasswordToggle,
  type,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPasswordToggle
    ? (showPassword ? "text" : "password")
    : type;

  return (
    <label className="block">
      {label ? (
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-white/58">
          {label}
        </span>
      ) : null}
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
            {leftIcon}
          </div>
        )}
        <input
          className={cn(
            "min-h-12 w-full rounded-[1.2rem] border border-white/10 bg-[#101011] px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-white/32",
            "focus:border-orange-400/60 focus:bg-[#151517] focus:shadow-[0_0_0_3px_rgba(255,106,0,0.1)]",
            "hover:border-white/18 hover:bg-[#121213]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#101011] disabled:hover:border-white/10",
            Boolean(leftIcon) && "pl-12",
            Boolean(rightIcon || (isPassword && showPasswordToggle)) && "pr-12",
            Boolean(error) && "border-orange-400/60 focus:border-orange-400/60 focus:shadow-[0_0_0_3px_rgba(255,106,0,0.1)] hover:border-orange-400/40",
            className
          )}
          id={id}
          type={inputType}
          {...props}
        />
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white/70"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        )}
        {rightIcon && !isPassword && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <span className="mt-2 block text-sm text-orange-300">{error}</span>
      ) : hint ? (
        <span className="mt-2 block text-sm text-white/45">{hint}</span>
      ) : null}
    </label>
  );
}
