"use client";

import Image from "next/image";
import Link from "next/link";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ProductCard from "@/components/home/ProductCard";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import { useCart } from "@/features/cart/cart.hooks";
import { useFavoriteFoods } from "@/features/favorites/favorites.storage";
import {
  getFoodCategoryLabel,
  matchesFoodCategory,
} from "@/features/food/food-categories";
import { useFoodCatalog } from "@/features/food/food.hooks";
import type { Food } from "@/features/food/food.types";
import { ApiError } from "@/lib/fetcher";
import { cn } from "@/lib/helpers";

const PREFERRED_CATEGORY_ORDER = [
  "Burger",
  "Chicken",
  "Sides",
  "Drink",
  "Combo",
  "Pizza",
  "Salad",
  "Dessert",
  "Sauce",
];

type ExploreTab = {
  count: number;
  label: string;
};

function getFoodSearchText(food: Food) {
  return `${food.category} ${food.name} ${food.description ?? ""}`.toLowerCase();
}

function isComboFood(food: Food) {
  const haystack = getFoodSearchText(food);
  return haystack.includes("combo") || haystack.includes("set");
}

export default function ExplorePage() {
  const router = useRouter();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavoriteFoods();
  const { error, foods, isLoading } = useFoodCatalog();
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const categoryTabs = useMemo<Record<string, ExploreTab>>(() => {
    const tabs: Record<string, ExploreTab> = {
      All: {
        count: foods.length,
        label: "All",
      },
    };

    for (const food of foods) {
      const category = getFoodCategoryLabel(food);

      if (!tabs[category]) {
        tabs[category] = {
          count: 0,
          label: category,
        };
      }

      tabs[category].count += 1;
    }

    return tabs;
  }, [foods]);

  const orderedTabs = useMemo(() => {
    const categoryEntries = Object.entries(categoryTabs).filter(
      ([category]) => category !== "All"
    );

    categoryEntries.sort(([leftCategory, left], [rightCategory, right]) => {
      const leftIndex = PREFERRED_CATEGORY_ORDER.indexOf(leftCategory);
      const rightIndex = PREFERRED_CATEGORY_ORDER.indexOf(rightCategory);

      if (leftIndex !== -1 || rightIndex !== -1) {
        if (leftIndex === -1) {
          return 1;
        }

        if (rightIndex === -1) {
          return -1;
        }

        return leftIndex - rightIndex;
      }

      return right.count - left.count || left.label.localeCompare(right.label);
    });

    return [["All", categoryTabs.All], ...categoryEntries] as Array<
      [string, ExploreTab]
    >;
  }, [categoryTabs]);

  const activeCategory = categoryTabs[activeTab] ? activeTab : "All";

  const visibleFoods = foods.filter((food) => {
    if (!matchesFoodCategory(food, activeCategory)) {
      return false;
    }

    const query = deferredSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return `${food.name} ${food.description ?? ""}`.toLowerCase().includes(query);
  });

  const combos = useMemo(() => foods.filter(isComboFood).slice(0, 3), [foods]);

  async function handleAddToCart(food: Food) {
    try {
      await addItem(food.id, 1);
      setFeedback(`${food.name} added to cart.`);
    } catch (cartError) {
      if (cartError instanceof ApiError && cartError.status === 401) {
        router.push("/auth/login?redirect=/menu");
        return;
      }

      setFeedback(cartError instanceof Error ? cartError.message : "Cart update failed.");
    }
  }

  function handleToggleFavorite(food: Food) {
    const nextFavoriteState = !isFavorite(food.id);
    toggleFavorite(food.id);
    setFeedback(
      nextFavoriteState
        ? `${food.name} added to favorites.`
        : `${food.name} removed from favorites.`
    );
  }

  return (
    <main className="space-y-6 lg:space-y-7">
      <div className="fixed left-[calc(1rem+var(--safe-area-left))] right-[calc(1rem+var(--safe-area-right))] top-[calc(4.75rem+var(--safe-area-top))] z-40 space-y-3 overflow-hidden border-b border-white/[0.04] bg-[#050505] py-3 shadow-[0_18px_40px_rgba(0,0,0,0.42)] backdrop-blur-xl before:pointer-events-none before:absolute before:-top-4 before:inset-x-0 before:h-4 before:bg-[#050505] before:content-[''] lg:left-[268px] lg:right-7 lg:top-0 lg:space-y-4 lg:pb-3 lg:pt-5 lg:before:hidden sm:inset-x-6 sm:space-y-4">
        <div className="flex min-w-0 items-center justify-between gap-4">
          <PageHeader title="Menu" />
        </div>
        <TopBar onSearchChange={setSearch} searchValue={search} />
      </div>

      <div className="h-[calc(252px+var(--safe-area-top))] sm:h-[188px] lg:h-[124px]" />

      {feedback ? <Toast message={feedback} tone="info" /> : null}
      {error ? <Toast message={error} tone="error" /> : null}

      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 premium-scrollbar sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {orderedTabs.map(([tabKey, tab]) => (
          <button
            className={cn(
              "inline-flex min-w-fit max-w-full items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition",
              tabKey === activeCategory
                ? "border-orange-300/35 bg-orange-500 text-white shadow-[0_12px_30px_rgba(255,106,0,0.2)]"
                : "border-transparent bg-[#18181B] text-white/80 hover:border-white/8 hover:bg-white/[0.08] hover:text-white"
            )}
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            type="button"
          >
            <span className="truncate">{tab.label}</span>
            <span
              className={cn(
                "inline-flex min-w-[1.7rem] shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none",
                tabKey === activeCategory
                  ? "bg-white/18 text-white"
                  : "border border-white/8 bg-white/[0.05] text-white/56"
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <section className="pb-2">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title text-white">Popular</h2>
          <div className="flex items-center gap-3">
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[var(--border-soft)] bg-[#141416] text-[var(--text-secondary)] hover:text-white"
              type="button"
            >
              <FunnelIcon className="h-4 w-4" />
            </button>
            <Link className="shrink-0 text-sm text-[var(--orange)] hover:text-[var(--orange-3)]" href="/public/explore">
              View all
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-[16px] border border-[var(--border-soft)] bg-[var(--bg-card)] px-5 py-6 text-sm text-[var(--text-secondary)]">
            Loading menu items from the database...
          </div>
        ) : visibleFoods.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {visibleFoods.map((food) => (
              <ProductCard
                food={food}
                isFavorite={isFavorite(food.id)}
                key={food.id}
                onAddToCart={handleAddToCart}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            action={
              <Button onClick={() => setActiveTab("All")} variant="secondary">
                Reset Filters
              </Button>
            }
            description="Try a different category or search term."
            title="No products found."
          />
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title text-white">Combos</h2>
          <Link className="shrink-0 text-sm text-[var(--orange)] hover:text-[var(--orange-3)]" href="/public/explore">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-[16px] border border-[var(--border-soft)] bg-[var(--bg-card)] px-5 py-6 text-sm text-[var(--text-secondary)]">
            Loading combo items from the database...
          </div>
        ) : combos.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {combos.map((combo) => (
              <article className="card-hover dashboard-card overflow-hidden rounded-[16px] p-0" key={combo.id}>
                <div className="relative h-[148px] bg-[radial-gradient(circle,rgba(255,90,0,0.18),transparent_58%),linear-gradient(180deg,#151518_0%,#111113_100%)]">
                  <Image alt={combo.name} className="object-contain p-4" fill sizes="320px" src={combo.image} />
                </div>
                <div className="px-4 py-3">
                  <p className="break-words text-sm font-medium text-white">{combo.name}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[16px] border border-[var(--border-soft)] bg-[var(--bg-card)] px-5 py-6 text-sm text-[var(--text-secondary)]">
            No combo items were found in the current database.
          </div>
        )}
      </section>
    </main>
  );
}
