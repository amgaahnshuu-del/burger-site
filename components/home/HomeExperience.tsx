"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, FireIcon } from "@heroicons/react/24/solid";
import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ProductCard from "@/components/home/ProductCard";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import { useCart } from "@/features/cart/cart.hooks";
import {
  getFoodCategoryLabel,
  matchesFoodCategory,
} from "@/features/food/food-categories";
import { useFoodCatalog } from "@/features/food/food.hooks";
import type { Food } from "@/features/food/food.types";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import { ApiError } from "@/lib/fetcher";
import { cn, formatCurrency } from "@/lib/helpers";

type CategoryTab = {
  category: string;
  count: number;
  label: string;
};

function getCategoryTabLabel(category: string, isMn: boolean) {
  if (!isMn) {
    return category;
  }

  const labels: Record<string, string> = {
    All: "Бүгд",
    Burger: "Бургер",
    Chicken: "Тахиа",
    Combo: "Комбо",
    Dessert: "Амттан",
    Drink: "Ундаа",
    Fries: "Шарсан төмс",
    Pizza: "Пицца",
    Salad: "Салат",
    Sauce: "Соус",
    Sides: "Хачир",
  };

  return labels[category] ?? category;
}

export default function HomeExperience() {
  const router = useRouter();
  const { addItem } = useCart();
  const { error, foods, isLoading } = useFoodCatalog();
  const { isMn, t } = useAppLanguage();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [feedback, setFeedback] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const categoryTabs = useMemo<CategoryTab[]>(() => {
    if (!foods.length) {
      return [];
    }

    const preferredOrder = [
      "Burger",
      "Combo",
      "Chicken",
      "Sides",
      "Drink",
      "Pizza",
      "Salad",
      "Dessert",
    ];

    const categoryMap = new Map<string, { count: number; label: string }>();

    foods.forEach((food) => {
      const category = getFoodCategoryLabel(food);
      const existing = categoryMap.get(category);

      if (existing) {
        existing.count += 1;
        return;
      }

      categoryMap.set(category, {
        count: 1,
        label: getCategoryTabLabel(category, isMn),
      });
    });

    const orderedTabs = Array.from(categoryMap.entries())
      .filter(([category]) => category !== "Sauce")
      .sort(([leftCategory, left], [rightCategory, right]) => {
        const leftIndex = preferredOrder.indexOf(leftCategory);
        const rightIndex = preferredOrder.indexOf(rightCategory);

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
      })
      .map(([category, data]) => ({
        category,
        count: data.count,
        label: data.label,
      }));

    return [
      {
        category: "All",
        count: foods.length,
        label: getCategoryTabLabel("All", isMn),
      },
      ...orderedTabs,
    ];
  }, [foods, isMn]);

  const activeCategory = categoryTabs.some(
    (category) => category.category === selectedCategory
  )
    ? selectedCategory
    : (categoryTabs[0]?.category ?? "All");

  const activeCategoryLabel =
    categoryTabs.find((category) => category.category === activeCategory)?.label
    ?? activeCategory;

  const filteredFoods = foods
    .filter((food) => matchesFoodCategory(food, activeCategory))
    .filter((food) => {
      const query = deferredSearch.trim().toLowerCase();
      if (!query) {
        return true;
      }

      return `${food.name} ${food.description ?? ""}`.toLowerCase().includes(query);
    });

  const heroPick = filteredFoods[0] ?? foods[0] ?? null;
  const heroMetrics = [
    {
      label: t({ en: "Menu", mn: "Цэс" }),
      value: t({
        en: `${foods.length} items`,
        mn: `${foods.length} төрөл`,
      }),
    },
    {
      label: t({ en: "Categories", mn: "Ангилал" }),
      value: t({
        en: `${Math.max(categoryTabs.length - 1, 0)} choices`,
        mn: `${Math.max(categoryTabs.length - 1, 0)} сонголт`,
      }),
    },
    {
      label: t({ en: "Price", mn: "Үнэ" }),
      value: heroPick
        ? formatCurrency(heroPick.price)
        : t({
          en: "Fresh today",
          mn: "Өнөөдрийн шинэ",
        }),
    },
  ];

  async function handleAddToCart(food: Food) {
    try {
      await addItem(food.id, 1);
      setFeedback(
        t({
          en: `${food.name} added to cart.`,
          mn: `${food.name} сагсанд нэмэгдлээ.`,
        })
      );
    } catch (cartError) {
      if (cartError instanceof ApiError && cartError.status === 401) {
        router.push("/auth/login?redirect=/protected/cart");
        return;
      }

      setFeedback(
        cartError instanceof Error
          ? cartError.message
          : t({
            en: "Cart update failed.",
            mn: "Сагсны шинэчлэлт амжилтгүй боллоо.",
          })
      );
    }
  }

  return (
    <main className="space-y-6">
      <TopBar onSearchChange={setSearch} searchValue={search} />

      {feedback ? <Toast message={feedback} tone="info" /> : null}
      {error ? <Toast message={error} tone="error" /> : null}

      <section className="space-y-7">
        <Card
          className="relative overflow-hidden rounded-[30px] border border-orange-500/12 p-0"
          style={{ boxShadow: "none" }}
          variant="glow"
        >
          <div className="relative min-h-[400px] overflow-hidden rounded-[30px] px-7 py-8 sm:px-10 sm:py-10">
            <Image
              alt="Burger astronaut hero background"
              className="absolute inset-0 z-0 object-cover object-[68%_50%]"
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1200px"
              src="/hero-ref/custom-home-hero.jpg"
            />

            <div className="absolute inset-0 z-20 bg-[linear-gradient(90deg,rgba(0,0,0,0.94)_0%,rgba(0,0,0,0.8)_34%,rgba(0,0,0,0.42)_62%,rgba(0,0,0,0.3)_100%)]" />
            <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_74%_36%,rgba(255,106,0,0.2),transparent_24%),radial-gradient(circle_at_14%_14%,rgba(255,255,255,0.06),transparent_16%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.6))]" />

            <div className="relative z-30 flex min-h-[320px] flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-[500px]">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-500/14 bg-[rgba(255,106,0,0.12)] px-4 py-2 text-sm font-medium text-[var(--accent-3)]">
                  <FireIcon className="h-4 w-4" />
                  {t({
                    en: "Hot & Fresh",
                    mn: "Халуун, шинэхэн",
                  })}
                </span>

                <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/44">
                  {t({
                    en: "You choose it. We deliver it.",
                    mn: "Та сонгоно. Бид хүргэнэ.",
                  })}
                </p>

                <h1 className="mt-4 text-[40px] font-extrabold leading-[1.02] text-white sm:text-[48px]">
                  {t({
                    en: "Bold flavor.",
                    mn: "Өвөрмөц амт.",
                  })}
                  <br />
                  {t({
                    en: "Fresh cravings.",
                    mn: "Шинэ мэдрэмж.",
                  })}
                </h1>

                <p className="mt-4 max-w-[400px] text-base leading-7 text-[var(--text-secondary)]">
                  {t({
                    en: "Not sure what to eat today? Browse our premium menu and let your next favorite meal find you.",
                    mn: "Өнөөдөр юу идэхээ шийдээгүй байна уу? Манай premium цэсийг үзээд дараагийн дуртай хоолоо олоорой.",
                  })}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    className="inline-flex h-[54px] items-center gap-3 rounded-[14px] bg-orange-500 px-6 text-sm font-semibold text-white hover:brightness-110"
                    href="/public/explore"
                  >
                    {t({
                      en: "Browse menu",
                      mn: "Цэс үзэх",
                    })}
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                  <Link
                    className="inline-flex h-[54px] items-center rounded-[14px] border border-white/10 bg-black/20 px-6 text-sm font-semibold text-white/76 backdrop-blur hover:border-orange-400/24 hover:text-white"
                    href="/public/ai-agent"
                  >
                    {t({
                      en: "Ask AI assistant",
                      mn: "AI туслах асуух",
                    })}
                  </Link>
                </div>
              </div>

              <div className="flex w-full max-w-[340px] flex-col gap-4">
                <div className="grid grid-cols-3 gap-3">
                  {heroMetrics.map((metric) => (
                    <div
                      className="rounded-[18px] border border-white/8 bg-black/24 px-4 py-3 text-center backdrop-blur-sm"
                      key={metric.label}
                    >
                      <p className="text-[11px] uppercase tracking-[0.14em] text-white/36">
                        {metric.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/34">
                {t({
                  en: "Menu",
                  mn: "Цэс",
                })}
              </p>
              <h2 className="section-title mt-2 text-white">
                {t({
                  en: "Food categories",
                  mn: "Хоолны төрлүүд",
                })}
              </h2>
            </div>
          </div>

          {isLoading ? (
            <Card
              className="rounded-[18px] border border-[var(--border-soft)] px-5 py-6 text-sm text-[var(--text-secondary)]"
              variant="default"
            >
              {t({
                en: "Loading menu categories from the database...",
                mn: "Цэсний ангиллуудыг уншиж байна...",
              })}
            </Card>
          ) : categoryTabs.length ? (
            <div className="dashboard-pill flex flex-wrap items-center gap-3 rounded-[22px] p-3">
              {categoryTabs.map((category) => {
                const active = category.category === activeCategory;

                return (
                  <button
                    className={cn(
                      "flex items-center gap-2 rounded-[14px] border px-4 py-2.5 text-sm font-medium transition",
                      active
                        ? "border-orange-300/30 bg-orange-500 text-white"
                        : "border-transparent bg-[#151517] text-white/82 hover:border-white/8 hover:bg-white/[0.05] hover:text-white"
                    )}
                    key={category.category}
                    onClick={() => setSelectedCategory(category.category)}
                    type="button"
                  >
                    {category.label}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px]",
                        active
                          ? "bg-white/18 text-white"
                          : "bg-white/[0.05] text-white/48"
                      )}
                    >
                      {category.count}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <Card
              className="rounded-[18px] border border-[var(--border-soft)] px-5 py-6 text-sm text-[var(--text-secondary)]"
              variant="default"
            >
              {t({
                en: "The menu is still empty. Please check back again soon.",
                mn: "Цэс одоогоор хоосон байна. Дараа дахин шалгаарай.",
              })}
            </Card>
          )}
        </section>

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/34">
                {t({
                  en: "Your selection",
                  mn: "Таны сонголт",
                })}
              </p>
              <h2 className="section-title mt-2 text-white">
                {activeCategoryLabel}
              </h2>
            </div>
            <Link
              className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-3)]"
              href="/public/explore"
            >
              {t({
                en: "See everything",
                mn: "Бүгдийг үзэх",
              })}
            </Link>
          </div>

          {isLoading ? (
            <Card
              className="rounded-[18px] border border-[var(--border-soft)] px-5 py-6 text-sm text-[var(--text-secondary)]"
              variant="default"
            >
              {t({
                en: "Loading menu items...",
                mn: "Хоолнуудыг ачаалж байна...",
              })}
            </Card>
          ) : filteredFoods.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredFoods.slice(0, 5).map((food) => (
                <ProductCard
                  food={food}
                  key={food.id}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <Card
              className="rounded-[18px] border border-[var(--border-soft)] px-5 py-6 text-sm text-[var(--text-secondary)]"
              variant="default"
            >
              {t({
                en: "No matching food found. Try a different category or search term.",
                mn: "Тохирох хоол олдсонгүй. Өөр ангилал эсвэл хайлтаар үзээрэй.",
              })}
            </Card>
          )}
        </section>
      </section>
    </main>
  );
}
