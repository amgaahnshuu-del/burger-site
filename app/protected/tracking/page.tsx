"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { MapPinIcon } from "@heroicons/react/24/outline";

import TrackingDashboard from "@/components/tracking/TrackingDashboard";
import Button from "@/components/ui/Button";
import Footer from "@/components/layout/Footer";
import { useOrderDetail, useOrders } from "@/features/order/order.hooks";
import { useAuth } from "@/hooks/useAuth";
import { isOrderTrackable } from "@/lib/dashboard";

export default function TrackingPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [hasHydrated, setHasHydrated] = useState(false);
  const trackingEnabled = hasHydrated && isAuthenticated;

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const { error: ordersError, isLoading: ordersLoading, orders, refresh } = useOrders(
    trackingEnabled,
    { pollIntervalMs: 10000 }
  );
  const activeOrderSummary = useMemo(
    () => orders.find((order) => isOrderTrackable(order)) ?? null,
    [orders]
  );
  const activeOrderId = activeOrderSummary?.id ?? "";
  const {
    error: orderError,
    order: liveOrder,
    refresh: refreshActiveOrder,
  } = useOrderDetail(activeOrderId, {
    liveUpdates: trackingEnabled && Boolean(activeOrderId),
    pollIntervalMs: activeOrderId ? 12000 : 0,
  });
  const activeOrder = liveOrder ?? activeOrderSummary;
  const showLoading = !hasHydrated || isAuthLoading || (isAuthenticated && ordersLoading);

  function handleRefresh() {
    refresh();
    refreshActiveOrder();
  }

  return (
    <main className="relative isolate min-h-full overflow-x-hidden">
      <div className="fixed inset-0 -z-10 bg-[#050505]" />
      <div className="pointer-events-none fixed right-[60px] top-[20px] -z-10 h-[300px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,106,0,.32),transparent_65%)] blur-[30px]" />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <span className="absolute left-[64%] top-[72px] h-1.5 w-1.5 rounded-full bg-orange-400/60 shadow-[0_0_18px_rgba(255,106,0,0.55)]" />
        <span className="absolute left-[72%] top-[116px] h-1 w-1 rounded-full bg-orange-300/50 shadow-[0_0_16px_rgba(255,140,70,0.45)]" />
        <span className="absolute left-[78%] top-[168px] h-1.5 w-1.5 rounded-full bg-orange-500/50 shadow-[0_0_20px_rgba(255,106,0,0.48)]" />
        <span className="absolute left-[83%] top-[92px] h-1 w-1 rounded-full bg-orange-200/40 shadow-[0_0_12px_rgba(255,180,120,0.35)]" />
      </div>

      <section className="mb-[26px]">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-[15px] border border-orange-400/20 bg-[rgba(255,106,0,0.09)] text-orange-300 shadow-[0_18px_38px_rgba(255,106,0,0.16)]">
            <MapPinIcon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-[30px] font-[850] leading-none text-white">
              Захиалгын байршил
            </h1>
            <p className="mt-2 text-[13px] text-white/65">
              Идэвхтэй захиалгын хүргэлтийн явцыг эндээс хянаарай.
            </p>
          </div>
        </div>
      </section>

      {ordersError || orderError ? (
        <section className="rounded-[24px] border border-red-500/20 bg-[linear-gradient(145deg,rgba(26,12,10,0.94),rgba(10,8,8,0.98))] px-[34px] py-[32px] text-white shadow-[0_24px_70px_rgba(0,0,0,.45)]">
          <h2 className="text-[26px] font-[850] text-white">Unable to load tracking</h2>
          <p className="mt-3 max-w-[620px] text-[15px] leading-7 text-white/68">
            {orderError ?? ordersError}
          </p>
          <div className="mt-6">
            <Button
              className="min-h-11 rounded-[13px] border-orange-500/65 bg-[rgba(255,106,0,0.08)] px-[22px] text-sm font-extrabold text-white hover:bg-[linear-gradient(135deg,#ff6a00,#ff8a1f)]"
              onClick={handleRefresh}
              size="sm"
              variant="outline"
            >
              Try again
            </Button>
          </div>
        </section>
      ) : showLoading ? (
        <section className="rounded-[24px] border border-[rgba(255,106,0,.24)] bg-[linear-gradient(145deg,rgba(18,18,20,.96),rgba(8,8,10,.98))] px-[34px] py-[32px] text-white/68 shadow-[0_24px_70px_rgba(0,0,0,.45)]">
          Loading your latest order...
        </section>
      ) : !activeOrder ? (
        <section className="relative flex min-h-[260px] h-[380px] items-center justify-between overflow-hidden rounded-[24px] border border-[rgba(255,106,0,.24)] bg-[linear-gradient(145deg,rgba(18,18,20,.96),rgba(8,8,10,.98))] px-[34px] py-[34px] shadow-[0_24px_70px_rgba(0,0,0,.45)]">
          <div className="pointer-events-none absolute right-[22px] top-1/2 h-[220px] w-[220px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,106,0,0.28),transparent_68%)] blur-[26px]" />
          <div className="relative z-10 max-w-[460px]">
            <span className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-[14px] border border-orange-400/18 bg-[rgba(255,106,0,0.1)] text-orange-300 shadow-[0_16px_30px_rgba(255,106,0,0.14)]">
              <MapPinIcon className="h-6 w-6" />
            </span>
            <h2 className="mt-6 text-[28px] font-[850] leading-tight text-white">
              No active order to track
            </h2>
            <p className="mt-[10px] max-w-[430px] text-[15px] leading-7 text-white/68">
              Live location stops appearing after an order is delivered or cancelled.
            </p>
            <Button
              asChild
              className="mt-6 min-h-11 rounded-[13px] border-orange-500/70 bg-[rgba(255,106,0,0.08)] px-[22px] text-sm font-extrabold text-white hover:bg-[linear-gradient(135deg,#ff6a00,#ff8a1f)]"
              size="sm"
              variant="outline"
            >
              <Link href="/menu">Order from the menu</Link>
            </Button>
          </div>

          <div className="pointer-events-none absolute bottom-[-20px] right-[-34px] z-0 w-[480px] opacity-100">
            <Image
              alt="Burger astronaut delivery visual"
              className="h-auto w-full object-contain mb-4"
              height={320}
              priority
              src="/track.png"
              width={280}
            />
          </div>
        </section>
      ) : (
        <TrackingDashboard
          onRefresh={handleRefresh}
          order={activeOrder}
        />
      )}
      <div className="mt-48"><Footer /></div>
        
    </main>
  );
}
