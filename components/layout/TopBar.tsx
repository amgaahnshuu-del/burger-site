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
  const { isAuthenticated } = useAuth();
  const { cart } = useCart(isAuthenticated);
  const cartCount = cart?.totalItems ?? 0;

  return (
    <div className={cn("flex flex-col gap-3 lg:flex-row lg:items-center", className)}>
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="flex h-[52px] items-center gap-3 rounded-[14px] border border-[var(--border-soft)] bg-[#111113] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:w-[290px]">
          <MapPinIcon className="h-5 w-5 text-[var(--accent)]" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
            {locationLabel}
          </span>
        </div>

        <label className="flex h-[52px] flex-1 items-center gap-3 rounded-[14px] border border-[var(--border-soft)] bg-[#111113] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <MagnifyingGlassIcon className="h-5 w-5 text-[var(--text-secondary)]" />
          <input
            className="h-full w-full bg-transparent text-sm text-white outline-none"
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder={searchPlaceholder}
            value={searchValue}
          />
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 sm:self-end lg:self-auto">
        {rightSlot}
        <button
          className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border border-[var(--border-soft)] bg-[#111113] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] hover:border-[var(--border-medium)]"
          type="button"
        >
          <BellIcon className="h-5 w-5" />
        </button>
        <Link
          className="relative flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border border-[var(--border-soft)] bg-[#111113] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] hover:border-[var(--border-medium)]"
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
    </div>
  );
}
