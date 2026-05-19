"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import TrackingDashboard from "@/components/tracking/TrackingDashboard";
import Button from "@/components/ui/Button";
import { useOrderDetail } from "@/features/order/order.hooks";
import { useAppLanguage } from "@/hooks/useAppLanguage";

export default function TrackOrderPage() {
  const { t } = useAppLanguage();
  const params = useParams<{ id: string }>();
  const orderId = typeof params?.id === "string" ? params.id : "";
  const { error, isLoading, order, refresh } = useOrderDetail(orderId, {
    liveUpdates: true,
    pollIntervalMs: 12000,
  });

  if (error) {
    return (
      <main>
        <section className="rounded-[18px] border border-red-500/20 bg-red-500/8 px-6 py-7 text-white">
          <h1 className="text-lg font-semibold">
            {t({ en: "Unable to load this order", mn: "Энэ захиалгыг ачаалж чадсангүй" })}
          </h1>
          <p className="mt-2 text-sm text-white/68">{error}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={refresh} size="sm" variant="secondary">
              {t({ en: "Try again", mn: "Дахин оролдох" })}
            </Button>
            <Button asChild size="sm">
              <Link href="/orders">{t({ en: "Back to orders", mn: "Захиалга руу буцах" })}</Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <section className="rounded-[18px] border border-white/10 bg-white/[0.03] px-6 py-7 text-white/68">
          {t({ en: "Loading order details...", mn: "Захиалгын мэдээллийг ачаалж байна..." })}
        </section>
      </main>
    );
  }

  if (!order) {
    return (
      <main>
        <section className="rounded-[18px] border border-white/10 bg-white/[0.03] px-6 py-7 text-white">
          <h1 className="text-lg font-semibold">
            {t({ en: "Order not found", mn: "Захиалга олдсонгүй" })}
          </h1>
          <p className="mt-2 text-sm text-white/68">
            {t({
              en: "This tracking link does not match any real order on your account.",
              mn: "Энэ tracking холбоос таны бүртгэл дээрх бодит захиалгатай таарахгүй байна.",
            })}
          </p>
          <div className="mt-5">
            <Button asChild size="sm">
              <Link href="/orders">{t({ en: "Back to orders", mn: "Захиалга руу буцах" })}</Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <TrackingDashboard onRefresh={refresh} order={order} />
    </main>
  );
}
