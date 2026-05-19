"use client";

import Link from "next/link";
import {
  BellIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";

import { useCart } from "@/features/cart/cart.hooks";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/helpers";

type TopBarProps = {
  locationLabel?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
  rightSlot?: React.ReactNode;
};

export default function TopBar({
  locationLabel = "Улаанбаатар, Монгол",
  searchPlaceholder = "Хоол хайх...",
  searchValue = "",
  onSearchChange,
  className,
  rightSlot,
}: TopBarProps) {
  const { cart } = useCart();
  const { isAuthenticated } = useAuth();
  const cartCount = cart?.totalItems ?? 0;

  function renderActions(containerClassName: string) {
    return (
      <div className={containerClassName}>
        {rightSlot}
        <button
          className="flex h-[48px] w-[48px] items-center justify-center rounded-[14px] border border-[var(--border-soft)] bg-[#111113] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] hover:border-[var(--border-medium)] sm:h-[52px] sm:w-[52px]"
          type="button"
        >
          <BellIcon className="h-5 w-5" />
        </button>
        <Link
          className="relative flex h-[48px] w-[48px] items-center justify-center rounded-[14px] border border-[var(--border-soft)] bg-[#111113] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] hover:border-[var(--border-medium)] sm:h-[52px] sm:w-[52px]"
          href={isAuthenticated ? "/protected/cart" : "/auth/login?redirect=/protected/cart"}
        >
          <ShoppingCartIcon className="h-5 w-5" />
          {cartCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--gradient-accent)] px-1 text-[10px] font-bold text-white shadow-[var(--shadow-button)]">
              {cartCount}
            </span>
          ) : null}
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center", className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
        <div className="flex min-w-0 h-[52px] items-center gap-3 rounded-[14px] border border-[var(--border-soft)] bg-[#111113] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:w-[290px]">
          <MapPinIcon className="h-5 w-5 text-[var(--accent)]" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
            {locationLabel}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-3 sm:flex-1">
          <label className="flex min-w-0 h-[48px] flex-1 items-center gap-3 rounded-[14px] border border-[var(--border-soft)] bg-[#111113] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:h-[52px]">
            <MagnifyingGlassIcon className="h-5 w-5 text-[var(--text-secondary)]" />
            <input
              className="min-w-0 h-full w-full bg-transparent text-sm text-white outline-none"
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={searchPlaceholder}
              value={searchValue}
            />
          </label>

          {renderActions("flex items-center gap-3 lg:hidden")}
        </div>
      </div>

      {renderActions("hidden min-w-0 items-center justify-end gap-3 sm:self-end lg:flex lg:self-auto")}
    </div>
  );
}
