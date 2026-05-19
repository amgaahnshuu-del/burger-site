"use client";

import Image from "next/image";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon, PlusIcon, StarIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

import { getFoodCategoryLabel } from "@/features/food/food-categories";
import type { Food } from "@/features/food/food.types";
import { getFoodRating, getFoodReviewCount } from "@/lib/dashboard";
import { cn, formatCurrency } from "@/lib/helpers";

type ProductCardProps = {
  food: Food;
  onAddToCart?: (food: Food) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (food: Food) => void;
};

const DEFAULT_CARD_STYLE = {
  badge: "border-white/8 bg-black/36 text-white/72",
  frame:
    "bg-[radial-gradient(circle_at_20%_14%,rgba(255,255,255,0.06),transparent_32%),linear-gradient(180deg,#17181b_0%,#101114_100%)]",
  glowPrimary: "bg-orange-500/18",
  glowSecondary: "bg-white/10",
};

const CATEGORY_CARD_STYLES: Record<
  string,
  {
    badge: string;
    frame: string;
    glowPrimary: string;
    glowSecondary: string;
  }
> = {
  Burger: {
    badge: "border-orange-300/24 bg-orange-500/16 text-orange-100",
    frame:
      "bg-[radial-gradient(circle_at_20%_12%,rgba(255,165,92,0.2),transparent_34%),radial-gradient(circle_at_82%_24%,rgba(255,95,31,0.22),transparent_28%),linear-gradient(180deg,#20140f_0%,#110f12_100%)]",
    glowPrimary: "bg-orange-500/26",
    glowSecondary: "bg-amber-300/12",
  },
  Chicken: {
    badge: "border-orange-300/24 bg-orange-500/16 text-orange-100",
    frame:
      "bg-[radial-gradient(circle_at_18%_14%,rgba(255,129,64,0.2),transparent_34%),radial-gradient(circle_at_82%_24%,rgba(255,196,89,0.18),transparent_28%),linear-gradient(180deg,#22150f_0%,#111012_100%)]",
    glowPrimary: "bg-orange-400/22",
    glowSecondary: "bg-yellow-300/12",
  },
  Sides: {
    badge: "border-amber-300/20 bg-amber-400/12 text-amber-100",
    frame:
      "bg-[radial-gradient(circle_at_24%_18%,rgba(255,193,59,0.18),transparent_30%),radial-gradient(circle_at_78%_20%,rgba(255,117,24,0.14),transparent_26%),linear-gradient(180deg,#20160d_0%,#101114_100%)]",
    glowPrimary: "bg-amber-400/22",
    glowSecondary: "bg-yellow-200/12",
  },
  Drink: {
    badge: "border-red-300/18 bg-red-500/12 text-red-100",
    frame:
      "bg-[radial-gradient(circle_at_24%_16%,rgba(255,102,102,0.16),transparent_30%),radial-gradient(circle_at_80%_24%,rgba(129,20,32,0.24),transparent_30%),linear-gradient(180deg,#1b1215_0%,#0f1115_100%)]",
    glowPrimary: "bg-red-500/20",
    glowSecondary: "bg-white/10",
  },
  Combo: {
    badge: "border-orange-300/24 bg-orange-500/16 text-orange-100",
    frame:
      "bg-[radial-gradient(circle_at_24%_16%,rgba(255,112,39,0.2),transparent_30%),radial-gradient(circle_at_78%_20%,rgba(255,220,132,0.14),transparent_28%),linear-gradient(180deg,#22140d_0%,#0f1216_100%)]",
    glowPrimary: "bg-orange-500/24",
    glowSecondary: "bg-yellow-200/10",
  },
  Pizza: {
    badge: "border-rose-300/20 bg-rose-500/12 text-rose-100",
    frame:
      "bg-[radial-gradient(circle_at_20%_12%,rgba(255,116,89,0.18),transparent_34%),radial-gradient(circle_at_82%_24%,rgba(255,214,107,0.16),transparent_28%),linear-gradient(180deg,#20110f_0%,#111114_100%)]",
    glowPrimary: "bg-rose-400/20",
    glowSecondary: "bg-amber-200/10",
  },
  Salad: {
    badge: "border-emerald-300/18 bg-emerald-500/12 text-emerald-100",
    frame:
      "bg-[radial-gradient(circle_at_22%_14%,rgba(78,214,147,0.18),transparent_34%),radial-gradient(circle_at_84%_24%,rgba(255,196,89,0.12),transparent_28%),linear-gradient(180deg,#131c17_0%,#101114_100%)]",
    glowPrimary: "bg-emerald-400/18",
    glowSecondary: "bg-lime-200/10",
  },
  Sauce: {
    badge: "border-orange-300/24 bg-orange-500/16 text-orange-100",
    frame:
      "bg-[radial-gradient(circle_at_22%_12%,rgba(255,142,67,0.18),transparent_34%),radial-gradient(circle_at_82%_20%,rgba(255,99,71,0.12),transparent_28%),linear-gradient(180deg,#1d1310_0%,#101114_100%)]",
    glowPrimary: "bg-orange-500/18",
    glowSecondary: "bg-rose-200/10",
  },
  Dessert: {
    badge: "border-pink-300/20 bg-pink-500/12 text-pink-100",
    frame:
      "bg-[radial-gradient(circle_at_22%_14%,rgba(255,132,171,0.18),transparent_34%),radial-gradient(circle_at_84%_24%,rgba(255,206,112,0.12),transparent_28%),linear-gradient(180deg,#1c1217_0%,#101114_100%)]",
    glowPrimary: "bg-pink-400/18",
    glowSecondary: "bg-amber-200/10",
  },
};

export default function ProductCard({
  food,
  onAddToCart,
  isFavorite = false,
  onToggleFavorite,
}: ProductCardProps) {
  const [imageSrc, setImageSrc] = useState(food.image);
  const rating = getFoodRating(food);
  const reviews = getFoodReviewCount(food);
  const categoryLabel = getFoodCategoryLabel(food);
  const categoryStyle = CATEGORY_CARD_STYLES[categoryLabel] ?? DEFAULT_CARD_STYLE;

  return (
    <article className="card-hover card-hover-neutral dashboard-card group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] p-[16px]">
      {onToggleFavorite ? (
        <button
          aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
          className={cn(
            "absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border",
            isFavorite
              ? "border-orange-500/20 bg-orange-500/12 text-[var(--accent-3)]"
              : "border-white/8 bg-black/30 text-white/60 hover:border-orange-500/20 hover:text-[var(--accent-3)]"
          )}
          onClick={() => onToggleFavorite(food)}
          type="button"
        >
          {isFavorite ? <HeartSolidIcon className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
        </button>
      ) : null}

      <div
        className={cn(
          "relative h-[162px] overflow-hidden rounded-[18px] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
          categoryStyle.frame
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl transition duration-300 group-hover:scale-110",
            categoryStyle.glowPrimary
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute bottom-3 left-4 h-12 w-24 rounded-full blur-2xl",
            categoryStyle.glowSecondary
          )}
        />
        <span
          className={cn(
            "absolute left-3 top-3 z-10 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
            categoryStyle.badge
          )}
        >
          {categoryLabel}
        </span>
        <Image
          alt={food.name}
          className="object-contain p-3 drop-shadow-[0_20px_30px_rgba(0,0,0,0.45)] transition duration-300 group-hover:scale-[1.08]"
          fill
          onError={() => setImageSrc("/home-crops/burger1-clean-v2.png")}
          sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1279px) calc((100vw - 5rem) / 2), 240px"
          src={imageSrc}
        />
      </div>

      <div className="mt-5 flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-[48px] min-w-0 items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 break-words pr-2 text-[16px] font-semibold leading-6 text-white">
            {food.name}
          </h3>
          <span className="max-w-[7.5rem] shrink-0 truncate rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/60">
            {reviews} reviews
          </span>
        </div>
        <p className="mt-2 min-h-[56px] break-words text-sm leading-5 text-[var(--text-secondary)]">
          {food.description ?? "Freshly prepared and made for quick cravings."}
        </p>
        <div className="mt-3 flex items-center gap-1 text-[13px] text-[var(--text-secondary)]">
          <StarIcon className="h-4 w-4 text-[var(--accent-3)]" />
          <span>{rating}</span>
          <span className="text-white/28">|</span>
          <span>Top rated</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/36">Price</p>
            <p className="mt-1 text-[18px] font-semibold text-white">{formatCurrency(food.price)}</p>
          </div>
          <button
            aria-label={`Add ${food.name}`}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-orange-500 text-white hover:brightness-110"
            onClick={() => onAddToCart?.(food)}
            type="button"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
