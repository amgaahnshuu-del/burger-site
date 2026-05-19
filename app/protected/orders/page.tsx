"use client";

import Link from "next/link";
import {
  ArchiveBoxXMarkIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";

import Footer from "@/components/layout/Footer";
import OrderCard from "@/components/order/OrderCard";
import Button from "@/components/ui/Button";
import { useOrders } from "@/features/order/order.hooks";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { useAuth } from "@/hooks/useAuth";
import { getOrderBucket } from "@/lib/dashboard";
import { cn } from "@/lib/helpers";

export default function OrdersPage() {
  const { t } = useAppLanguage();
  const orderTabs = [
    { key: "all", label: t({ en: "All", mn: "Бүгд" }) },
    { key: "ongoing", label: t({ en: "Ongoing", mn: "Явж буй" }) },
    { key: "completed", label: t({ en: "Completed", mn: "Дууссан" }) },
    { key: "cancelled", label: t({ en: "Cancelled", mn: "Цуцлагдсан" }) },
  ] as const;
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const hasHydrated = useHasHydrated();
  const { error, isLoading, orders, refresh } = useOrders(hasHydrated && isAuthenticated);
  const [activeTab, setActiveTab] = useState<(typeof orderTabs)[number]["key"]>("all");

  const visibleOrders = useMemo(() => {
    if (activeTab === "all") {
      return orders;
    }

    return orders.filter((order) => getOrderBucket(order.status) === activeTab);
  }, [activeTab, orders]);

  const emptyTitle = orders.length === 0
    ? t({
      en: "No orders yet",
      mn: "Одоогоор захиалга алга",
    })
    : t({
      en: `No ${activeTab} orders`,
      mn: "Энэ төлөвтэй захиалга алга",
    });
  const emptyDescription = orders.length === 0
    ? t({
      en: "Your order history is empty right now.",
      mn: "Таны захиалгын түүх одоогоор хоосон байна.",
    })
    : t({
      en: "Choose another tab to see orders with a different status.",
      mn: "Өөр төлөвтэй захиалгуудыг харахын тулд өөр tab сонгоно уу.",
    });
  const showLoading = !hasHydrated || isAuthLoading || (isAuthenticated && isLoading);

  return (
    <main className="relative isolate min-h-full overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050505]" />
        <div className="absolute right-[78px] top-[26px] hidden h-[220px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(255,106,0,.35),transparent_65%)] blur-[24px] lg:block" />
        <span className="absolute left-[52%] top-[48px] hidden h-[3px] w-[3px] rounded-full bg-orange-400/70 shadow-[0_0_14px_rgba(255,106,0,.65)] lg:block" />
        <span className="absolute left-[64%] top-[92px] hidden h-[2px] w-[2px] rounded-full bg-orange-300/70 shadow-[0_0_12px_rgba(255,106,0,.55)] lg:block" />
        <span className="absolute left-[73%] top-[42px] hidden h-[2px] w-[2px] rounded-full bg-orange-400/60 shadow-[0_0_10px_rgba(255,106,0,.45)] lg:block" />
      </div>

      <section>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-orange-400/24 bg-orange-500/10 text-orange-300 shadow-[0_0_18px_rgba(255,106,0,.14)]">
            <ClipboardDocumentListIcon className="h-[18px] w-[18px]" />
          </span>
          <h1 className="text-[30px] font-[850] tracking-[-0.04em] text-white">
            {t({ en: "Orders", mn: "Захиалгууд" })}
          </h1>
        </div>

        <p className="mt-2 text-[13px] text-white/[0.65]">
          {t({
            en: "Track your order history, current status, and full order details from here.",
            mn: "Захиалгын түүх, төлөв болон дэлгэрэнгүй мэдээллээ эндээс хянаарай.",
          })}
        </p>
      </section>

      <div className="mt-[26px] flex flex-wrap gap-[14px]">
        {orderTabs.map((tab) => {
          const active = tab.key === activeTab;

          return (
            <button
              className={cn(
                "h-[42px] rounded-[14px] px-[26px] text-[13px] font-semibold transition-all duration-200",
                active
                  ? "border border-orange-300/28 bg-[linear-gradient(135deg,#ff6a00,#ff8a1f)] text-white shadow-[0_12px_30px_rgba(255,106,0,.35)]"
                  : "border border-white/0 bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white"
              )}
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <section className="mt-6 space-y-6">
        {error ? (
          <section className="rounded-[22px] border border-red-500/20 bg-[linear-gradient(145deg,rgba(36,16,16,.96),rgba(12,8,8,.98))] px-[30px] py-7 text-white shadow-[0_24px_70px_rgba(0,0,0,.45)]">
            <h2 className="text-lg font-semibold">
              {t({ en: "Unable to load your orders", mn: "Захиалгуудыг ачаалж чадсангүй" })}
            </h2>
            <p className="mt-2 text-sm text-white/68">{error}</p>
            <div className="mt-5">
              <Button onClick={refresh} size="sm" variant="secondary">
                {t({ en: "Try again", mn: "Дахин оролдох" })}
              </Button>
            </div>
          </section>
        ) : null}

        {!error && showLoading ? (
          <section className="rounded-[22px] border border-[rgba(255,106,0,.24)] bg-[linear-gradient(145deg,rgba(18,18,20,.96),rgba(8,8,10,.98))] px-[30px] py-7 text-[13px] text-white/68 shadow-[0_24px_70px_rgba(0,0,0,.45)]">
            {t({ en: "Loading your orders...", mn: "Захиалгуудыг ачаалж байна..." })}
          </section>
        ) : null}

        {!error && !showLoading && visibleOrders.length > 0
          ? visibleOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          : null}

        {!error && !showLoading && visibleOrders.length === 0 ? (
          <section className="flex h-[150px] flex-col items-center justify-center rounded-[22px] border border-[rgba(255,106,0,.24)] bg-[linear-gradient(145deg,rgba(28,18,12,.9),rgba(8,8,10,.98))] px-6 text-center shadow-[0_24px_70px_rgba(0,0,0,.45)]">
            <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-orange-500/12 text-orange-300 shadow-[0_0_16px_rgba(255,106,0,.28)]">
              <ArchiveBoxXMarkIcon className="h-5 w-5" />
            </span>
            <h2 className="mt-3 text-[18px] font-bold text-white">{emptyTitle}</h2>
            <p className="mt-1 text-[13px] text-white/58">{emptyDescription}</p>
            <div className="mt-3">
              <Button asChild className="h-[38px] rounded-full px-7 text-[12px] font-semibold" size="sm">
                <Link href="/menu">
                  {orders.length === 0
                    ? t({ en: "Browse menu", mn: "Цэс үзэх" })
                    : t({ en: "All orders", mn: "Бүх захиалга" })}
                </Link>
              </Button>
            </div>
          </section>
        ) : null}
      </section>
      <div className="mt-10">
        <Footer />
      </div>
    </main>
  );
}
