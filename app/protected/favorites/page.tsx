"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  BanknotesIcon,
  HeartIcon as HeartOutlineIcon,
  ShoppingBagIcon,
  SparklesIcon,
  Squares2X2Icon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon, StarIcon } from "@heroicons/react/24/solid";
import { useMemo, useState } from "react";

import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Toast from "@/components/ui/Toast";
import { useCart } from "@/features/cart/cart.hooks";
import { useFavoriteFoods } from "@/features/favorites/favorites.storage";
import { useFoodCatalog } from "@/features/food/food.hooks";
import type { Food } from "@/features/food/food.types";
import { useInterfaceSettings } from "@/hooks/useInterfaceSettings";
import { getFoodRating, getFoodReviewCount } from "@/lib/dashboard";
import { ApiError } from "@/lib/fetcher";
import { cn, formatCurrency } from "@/lib/helpers";

type FavoriteAccent = {
  badge: string;
  frame: string;
  line: string;
  wash: string;
};

const DEFAULT_ACCENT: FavoriteAccent = {
  badge: "border-white/10 bg-white/[0.05] text-white/72",
  frame:
    "bg-[radial-gradient(circle_at_18%_18%,rgba(255,188,124,0.14),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(255,105,28,0.18),transparent_24%),linear-gradient(150deg,rgba(50,31,20,0.95),rgba(13,14,17,0.98))]",
  line: "from-orange-200/24 via-orange-500/28 to-transparent",
  wash: "bg-orange-500/12",
};

const CATEGORY_ACCENTS: Record<string, FavoriteAccent> = {
  Burger: {
    badge: "border-orange-300/18 bg-orange-500/14 text-orange-50",
    frame:
      "bg-[radial-gradient(circle_at_18%_18%,rgba(255,190,120,0.2),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(255,102,0,0.24),transparent_24%),linear-gradient(150deg,rgba(52,32,18,0.96),rgba(13,14,17,0.98))]",
    line: "from-orange-200/28 via-orange-500/38 to-transparent",
    wash: "bg-orange-500/14",
  },
  Chicken: {
    badge: "border-amber-300/18 bg-amber-400/12 text-amber-50",
    frame:
      "bg-[radial-gradient(circle_at_18%_18%,rgba(255,200,116,0.2),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(255,138,39,0.18),transparent_24%),linear-gradient(150deg,rgba(51,34,20,0.96),rgba(13,14,17,0.98))]",
    line: "from-amber-100/24 via-orange-400/34 to-transparent",
    wash: "bg-amber-400/14",
  },
  Sides: {
    badge: "border-yellow-300/18 bg-yellow-400/10 text-yellow-50",
    frame:
      "bg-[radial-gradient(circle_at_18%_18%,rgba(255,214,110,0.18),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(255,158,48,0.16),transparent_24%),linear-gradient(150deg,rgba(49,37,18,0.96),rgba(13,14,17,0.98))]",
    line: "from-yellow-100/24 via-amber-400/30 to-transparent",
    wash: "bg-yellow-400/12",
  },
  Drink: {
    badge: "border-rose-300/18 bg-rose-500/10 text-rose-50",
    frame:
      "bg-[radial-gradient(circle_at_18%_18%,rgba(255,144,165,0.18),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(255,104,66,0.12),transparent_24%),linear-gradient(150deg,rgba(40,24,27,0.96),rgba(13,14,17,0.98))]",
    line: "from-rose-100/22 via-rose-400/28 to-transparent",
    wash: "bg-rose-500/12",
  },
  Combo: {
    badge: "border-orange-300/18 bg-orange-500/14 text-orange-50",
    frame:
      "bg-[radial-gradient(circle_at_18%_18%,rgba(255,178,104,0.2),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(255,196,87,0.16),transparent_24%),linear-gradient(150deg,rgba(53,31,18,0.96),rgba(13,14,17,0.98))]",
    line: "from-orange-100/22 via-orange-500/34 to-transparent",
    wash: "bg-orange-500/14",
  },
  Pizza: {
    badge: "border-red-300/18 bg-red-500/10 text-red-50",
    frame:
      "bg-[radial-gradient(circle_at_18%_18%,rgba(255,148,104,0.18),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(255,188,94,0.14),transparent_24%),linear-gradient(150deg,rgba(48,24,18,0.96),rgba(13,14,17,0.98))]",
    line: "from-red-100/22 via-red-400/30 to-transparent",
    wash: "bg-red-500/12",
  },
  Salad: {
    badge: "border-emerald-300/18 bg-emerald-500/10 text-emerald-50",
    frame:
      "bg-[radial-gradient(circle_at_18%_18%,rgba(120,224,166,0.16),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(255,176,84,0.12),transparent_24%),linear-gradient(150deg,rgba(20,34,27,0.96),rgba(13,14,17,0.98))]",
    line: "from-emerald-100/22 via-emerald-400/28 to-transparent",
    wash: "bg-emerald-500/12",
  },
  Sauce: {
    badge: "border-orange-300/18 bg-orange-500/12 text-orange-50",
    frame:
      "bg-[radial-gradient(circle_at_18%_18%,rgba(255,164,112,0.18),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(255,116,74,0.14),transparent_24%),linear-gradient(150deg,rgba(47,26,18,0.96),rgba(13,14,17,0.98))]",
    line: "from-orange-100/22 via-orange-500/28 to-transparent",
    wash: "bg-orange-500/12",
  },
};

function getFavoritesText(isMn: boolean) {
  return {
    page: {
      eyebrow: isMn ? "Хувийн цуглуулга" : "Private collection",
      title: isMn ? "Дуртай хоолнууд" : "Favorite dishes",
      description: isMn
        ? "Хамгийн их давтан захиалах сонголтуудаа илүү тайван, premium shortlist байдлаар эндээс удирдаарай."
        : "A premium shortlist for the meals you come back to most often.",
    },
    actions: {
      browse: isMn ? "Цэс үзэх" : "Browse menu",
      addFeatured: isMn ? "Онцлохийг сагслах" : "Add featured",
      addToCart: isMn ? "Сагсанд нэмэх" : "Add to cart",
      remove: isMn ? "Хасах" : "Remove",
    },
    panel: {
      kicker: isMn ? "ТАНЫ ЦУГЛУУЛГА" : "YOUR COLLECTION",
      description: isMn
        ? "Өөрийн дуртай хоолнуудаа нэг дороос харж, хамгийн хурдан дахин захиалга хийхэд зориулсан цуглуулга."
        : "A personal collection built for faster reorders and cleaner food browsing.",
      categories: isMn ? "Ангиллууд" : "Categories",
      featured: isMn ? "ОНЦЛОХ" : "FEATURED",
      fallbackTitle: isMn ? "Таны дуртай сонголт" : "Your favorite pick",
      ready: isMn ? "Захиалахад бэлэн" : "Ready to order",
    },
    stats: {
      items: isMn ? "Нийт хадгалсан" : "Saved items",
      categories: isMn ? "Ангилал" : "Categories",
      average: isMn ? "Дундаж үнэ" : "Average price",
    },
    list: {
      eyebrow: "SHORTLIST",
      title: isMn ? "Хадгалсан сонголтууд" : "Saved selections",
      description: isMn
        ? "Хадгалсан бүтээгдэхүүн бүрээ тайван уншиж, шууд сагсанд оруулах premium харагдац."
        : "A cleaner premium view for checking each saved item before it goes back into the cart.",
      available: isMn ? "Захиалах боломжтой" : "Available now",
      unavailable: isMn ? "Түр дууссан" : "Sold out",
      reviews: isMn ? "үнэлгээ" : "reviews",
      noDescription: isMn
        ? "Дахин захиалахад яг тохирох, амттай бөгөөд хурдан хүрэх сонголт."
        : "A repeat-worthy favorite with comforting flavor and quick-order appeal.",
      price: isMn ? "ҮНЭ" : "PRICE",
    },
    loading: isMn ? "Дуртай цуглуулгыг ачаалж байна..." : "Loading your saved collection...",
    feedback: {
      added: (foodName: string) =>
        isMn ? `${foodName} сагсанд нэмэгдлээ.` : `${foodName} added to cart.`,
      removed: (foodName: string) =>
        isMn ? `${foodName} жагсаалтаас хасагдлаа.` : `${foodName} removed from favorites.`,
      cartFailed: isMn ? "Сагсны шинэчлэлт амжилтгүй боллоо." : "Cart update failed.",
    },
    empty: {
      title: isMn ? "Одоохондоо хадгалсан хоол алга." : "No favorites yet.",
      description: isMn
        ? "Цэснээс таалагдсан хоолнуудаа зүрхлээд хадгал. Дараагийн удаа эндээс илүү хурдан захиална."
        : "Save the menu items you love so they are always one tap away when you want to reorder.",
      action: isMn ? "Цэс рүү очих" : "Browse menu",
    },
  };
}

function getCategoryBreakdown(favorites: Food[]) {
  return Array.from(
    favorites.reduce((map, food) => {
      const key = food.category.trim() || "Menu";
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map<string, number>())
  ).sort((left, right) => right[1] - left[1]);
}

function getFavoriteAccent(category: string) {
  return CATEGORY_ACCENTS[category] ?? DEFAULT_ACCENT;
}

export default function FavoritesPage() {
  const router = useRouter();
  const { settings: interfaceSettings } = useInterfaceSettings();
  const { addItem } = useCart();
  const { favoriteIds, toggleFavorite } = useFavoriteFoods();
  const { error, foods, isLoading } = useFoodCatalog();
  const [feedback, setFeedback] = useState<string | null>(null);

  const isMn = interfaceSettings.language === "mn";
  const text = getFavoritesText(isMn);

  const favorites = useMemo(
    () => foods.filter((food) => favoriteIds.includes(food.id)),
    [favoriteIds, foods]
  );

  const favoriteSummary = useMemo(() => {
    const categoryBreakdown = getCategoryBreakdown(favorites);
    const averagePrice = favorites.length > 0
      ? Math.round(favorites.reduce((sum, food) => sum + food.price, 0) / favorites.length)
      : 0;
    const featuredFavorite = favorites.reduce<Food | null>((current, food) => {
      const currentScore = current ? Number.parseFloat(getFoodRating(current)) : -1;
      const nextScore = Number.parseFloat(getFoodRating(food));
      return nextScore > currentScore ? food : current;
    }, null);

    return {
      averagePrice,
      categoryBreakdown,
      featuredFavorite,
    };
  }, [favorites]);

  const featuredFavorite = favoriteSummary.featuredFavorite;
  const heroImage =
    featuredFavorite?.image ?? favorites[0]?.image ?? "/home-crops/burger1-clean-v2.png";

  async function handleAdd(foodId: string, foodName: string) {
    try {
      await addItem(foodId, 1);
      setFeedback(text.feedback.added(foodName));
      router.push("/protected/cart");
    } catch (cartError) {
      if (cartError instanceof ApiError && cartError.status === 401) {
        router.push("/auth/login?redirect=/protected/cart");
        return;
      }

      setFeedback(cartError instanceof Error ? cartError.message : text.feedback.cartFailed);
    }
  }

  function handleRemove(food: Food) {
    toggleFavorite(food.id);
    setFeedback(text.feedback.removed(food.name));
  }

  const stats = [
    {
      icon: HeartOutlineIcon,
      label: text.stats.items,
      value: String(favorites.length),
    },
    {
      icon: Squares2X2Icon,
      label: text.stats.categories,
      value: String(favoriteSummary.categoryBreakdown.length),
    },
    {
      icon: BanknotesIcon,
      label: text.stats.average,
      value: formatCurrency(favoriteSummary.averagePrice || 0),
    },
  ];

  return (
    <main className="relative isolate overflow-hidden pb-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#050505_0%,#070707_48%,#050505_100%)]" />
        <div className="absolute right-[-180px] top-[-140px] h-[520px] w-[520px] rounded-full bg-[rgba(255,118,24,0.16)] blur-[140px]" />
        <div className="absolute left-[8%] top-[22%] h-[180px] w-[180px] rounded-full bg-[rgba(255,148,69,0.06)] blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,148,69,0.42) 1px, transparent 1.6px)",
            backgroundSize: "140px 140px",
          }}
        />
      </div>

      <div className="pointer-events-none absolute right-[-32px] top-[-56px] -z-10 hidden h-[500px] w-[500px] lg:block">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,129,31,0.24),transparent_64%)] blur-3xl" />
        <Image
          alt=""
          aria-hidden
          className="absolute inset-0 object-contain object-top opacity-28 blur-[1px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.95),transparent_100%)]"
          fill
          sizes="500px"
          src={heroImage}
        />
      </div>

      <div className="mx-auto max-w-[1280px]">
        <section className="relative rounded-[32px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.008))] px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:px-7 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[760px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-orange-200">
                <SparklesIcon className="h-4 w-4" />
                <span>{text.page.eyebrow}</span>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <HeartOutlineIcon className="h-9 w-9 text-orange-300 sm:h-10 sm:w-10" />
                <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-semibold tracking-[-0.04em] text-white">
                  {text.page.title}
                </h1>
              </div>

              <p className="mt-4 max-w-[640px] text-sm leading-7 text-white/64 sm:text-base">
                {text.page.description}
              </p>
            </div>

            <Link
              className={cn(
                "inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] border border-orange-400/42 bg-[rgba(13,13,16,0.5)] px-5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:-translate-y-px hover:bg-orange-500/12"
              )}
              href="/menu"
            >
              <Squares2X2Icon className="h-4 w-4 text-orange-300" />
              <span>{text.actions.browse}</span>
            </Link>
          </div>
        </section>

        {feedback ? <Toast message={feedback} tone="info" /> : null}
        {error ? <Toast message={error} tone="error" /> : null}

        {isLoading ? (
          <section className="mt-6 grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
            <div className="h-[620px] rounded-[28px] border border-orange-500/12 bg-[rgba(18,18,21,0.82)] animate-pulse" />
            <div className="space-y-6">
              <div className="h-[170px] rounded-[26px] border border-orange-500/12 bg-[rgba(18,18,21,0.82)] animate-pulse" />
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  className="h-[390px] rounded-[28px] border border-white/8 bg-[rgba(18,18,21,0.82)] animate-pulse"
                  key={`favorite-loading-${index}`}
                />
              ))}
            </div>
          </section>
        ) : favorites.length > 0 ? (
          <section className="mt-6 grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
            <aside className="xl:sticky xl:top-8 xl:self-start">
              <div className="relative overflow-hidden rounded-[28px] border border-[rgba(255,132,31,0.25)] bg-[linear-gradient(145deg,rgba(38,24,16,0.85),rgba(13,14,17,0.92))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(255,122,26,0.22),transparent_72%)]" />

                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-100">
                    <HeartOutlineIcon className="h-4 w-4" />
                    <span>{text.panel.kicker}</span>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <h2 className="text-[2rem] font-semibold leading-none tracking-[-0.04em] text-white">
                      {featuredFavorite?.name || text.panel.fallbackTitle}
                    </h2>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-orange-400/20 bg-orange-500/12 text-orange-200 shadow-[0_0_26px_rgba(255,106,0,0.18)]">
                      <HeartIcon className="h-5 w-5" />
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-white/60">
                    {text.panel.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {favoriteSummary.categoryBreakdown.map(([category, count]) => (
                      <span
                        className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white/74"
                        key={category}
                      >
                        <span>{category}</span>
                        <span className="rounded-full bg-orange-500/14 px-2 py-0.5 text-[10px] font-semibold text-orange-200">
                          {count}
                        </span>
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 space-y-3">
                    {stats.map((stat) => {
                      const Icon = stat.icon;

                      return (
                        <div
                          className="flex items-center justify-between rounded-[16px] border border-white/8 bg-[rgba(255,255,255,0.035)] px-4 py-3 backdrop-blur-xl"
                          key={stat.label}
                        >
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-orange-400/14 bg-orange-500/10 text-orange-200">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="text-sm text-white/58">{stat.label}</span>
                          </div>
                          <span className="text-base font-semibold text-white">{stat.value}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 overflow-hidden rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-4 backdrop-blur-xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-orange-200">
                      {text.panel.featured}
                    </p>

                    <div className="mt-4 flex items-start gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,160,91,0.12),rgba(255,255,255,0.02))]">
                        <Image
                          alt={featuredFavorite?.name || text.panel.ready}
                          className="object-contain p-2"
                          fill
                          sizes="80px"
                          src={featuredFavorite?.image || heroImage}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-semibold text-white">
                          {featuredFavorite?.name || text.panel.ready}
                        </p>
                        {featuredFavorite ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/64">
                            <span className="inline-flex items-center gap-1">
                              <StarIcon className="h-4 w-4 text-orange-300" />
                              <span>{getFoodRating(featuredFavorite)}</span>
                            </span>
                            <span className="text-white/26">|</span>
                            <span>
                              {getFoodReviewCount(featuredFavorite)} {text.list.reviews}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {featuredFavorite ? (
                      <Button
                        className="mt-5 w-full rounded-[18px] shadow-[0_18px_32px_rgba(255,106,0,0.28)]"
                        leftIcon={<ShoppingBagIcon className="h-4 w-4" />}
                        onClick={() => {
                          void handleAdd(featuredFavorite.id, featuredFavorite.name);
                        }}
                        size="sm"
                      >
                        {text.actions.addFeatured}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </aside>

            <div className="space-y-6">
              <div className="rounded-[26px] border border-[rgba(255,120,20,0.3)] bg-[rgba(18,18,21,0.78)] px-6 py-5 shadow-[0_22px_55px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-orange-400/20 bg-orange-500/10 text-orange-200 shadow-[0_0_28px_rgba(255,106,0,0.18)]">
                      <TagIcon className="h-5 w-5" />
                    </span>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-200">
                        {text.list.eyebrow}
                      </p>
                      <h2 className="mt-3 text-[1.65rem] font-semibold tracking-[-0.03em] text-white">
                        {text.list.title}
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-white/58">
                        {text.list.description}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-white/70">
                    <TagIcon className="h-4 w-4 text-orange-300" />
                    <span>{favorites.length}</span>
                    <span className="text-white/28">/</span>
                    <span>{Math.max(favoriteSummary.categoryBreakdown.length, 1)}</span>
                  </div>
                </div>
              </div>

              {favorites.map((food, index) => {
                const accent = getFavoriteAccent(food.category);

                return (
                  <article
                    className="group overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(26,17,12,0.92),rgba(15,15,18,0.95))] shadow-[0_28px_70px_rgba(0,0,0,0.42)] transition duration-300 hover:-translate-y-1 hover:border-orange-400/24"
                    key={food.id}
                  >
                    <div className="grid min-h-[390px] lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
                      <div className={cn("relative min-h-[280px] overflow-hidden", accent.frame)}>
                        <div
                          className={cn(
                            "absolute inset-y-8 right-0 hidden w-px bg-gradient-to-b lg:block",
                            accent.line
                          )}
                        />
                        <div className="absolute left-5 top-5 z-10 flex items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-black/28 px-3 py-1 text-[11px] font-semibold text-white/82 backdrop-blur">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={cn(
                              "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
                              accent.badge
                            )}
                          >
                            {food.category}
                          </span>
                        </div>

                        <div
                          className={cn(
                            "pointer-events-none absolute -right-10 top-8 h-36 w-36 rounded-full blur-3xl",
                            accent.wash
                          )}
                        />

                        <Image
                          alt={food.name}
                          className="object-contain p-8 transition duration-500 group-hover:scale-[1.06] sm:p-10"
                          fill
                          sizes="(max-width: 1024px) 100vw, 40vw"
                          src={food.image}
                        />

                        <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/32 px-3 py-1.5 text-xs text-white/74 backdrop-blur">
                          <span
                            className={cn(
                              "h-2.5 w-2.5 rounded-full",
                              food.isAvailable ? "bg-emerald-400" : "bg-orange-300/70"
                            )}
                          />
                          <span>
                            {food.isAvailable ? text.list.available : text.list.unavailable}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col p-6 sm:p-7 lg:p-8">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="text-[1.95rem] font-semibold tracking-[-0.04em] text-white">
                              {food.name}
                            </h3>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/64">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5">
                                <StarIcon className="h-4 w-4 text-orange-300" />
                                <span>{getFoodRating(food)}</span>
                              </span>
                              <span className="inline-flex items-center rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5">
                                {getFoodReviewCount(food)} {text.list.reviews}
                              </span>
                            </div>
                          </div>

                          <button
                            aria-label={text.actions.remove}
                            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-orange-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur hover:border-orange-400/24 hover:bg-orange-500/12 hover:text-white"
                            onClick={() => handleRemove(food)}
                            type="button"
                          >
                            <HeartIcon className="h-5 w-5" />
                          </button>
                        </div>

                        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/58">
                          {food.description?.trim() || text.list.noDescription}
                        </p>

                        <div className="mt-6 border-t border-dashed border-white/10 pt-6" />

                        <div className="mt-auto flex flex-col gap-5 pt-1 xl:flex-row xl:items-end xl:justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/36">
                              {text.list.price}
                            </p>
                            <p className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-white">
                              {formatCurrency(food.price)}
                            </p>
                          </div>

                          <div className="flex flex-col gap-3 sm:flex-row">
                            <Button
                              className="rounded-[18px] border border-white/8 bg-white/[0.04] px-5 text-white/72 hover:bg-white/[0.07] hover:text-white"
                              leftIcon={<HeartOutlineIcon className="h-4 w-4" />}
                              onClick={() => handleRemove(food)}
                              size="sm"
                              variant="ghost"
                            >
                              {text.actions.remove}
                            </Button>
                            <Button
                              className="rounded-[18px] px-5 shadow-[0_20px_36px_rgba(255,106,0,0.3)]"
                              disabled={!food.isAvailable}
                              leftIcon={<ShoppingBagIcon className="h-4 w-4" />}
                              onClick={() => {
                                void handleAdd(food.id, food.name);
                              }}
                              rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                              size="sm"
                            >
                              {text.actions.addToCart}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="mt-6">
            <EmptyState
              action={(
                <Button asChild className="rounded-[18px] shadow-[0_18px_34px_rgba(255,106,0,0.26)]">
                  <Link href="/menu">{text.empty.action}</Link>
                </Button>
              )}
              className="rounded-[30px] border border-orange-500/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] py-16 shadow-[0_30px_70px_rgba(0,0,0,0.38)]"
              description={text.empty.description}
              icon={<HeartIcon className="h-7 w-7" />}
              title={text.empty.title}
            />
          </div>
        )}
      </div>
    </main>
  );
}
