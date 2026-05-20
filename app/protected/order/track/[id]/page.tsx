"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import TrackingDashboard from "@/components/tracking/TrackingDashboard";
import Button from "@/components/ui/Button";
import { useOrderDetail } from "@/features/order/order.hooks";

export default function TrackOrderPage() {
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
          <h1 className="text-lg font-semibold">Unable to load this order</h1>
          <p className="mt-2 text-sm text-white/68">{error}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={refresh} size="sm" variant="secondary">
              Try again
            </Button>
            <Button asChild size="sm">
              <Link href="/orders">Back to orders</Link>
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
          Loading order details...
        </section>
      </main>
    );
  }

  if (!order) {
    return (
      <main>
        <section className="rounded-[18px] border border-white/10 bg-white/[0.03] px-6 py-7 text-white">
          <h1 className="text-lg font-semibold">Order not found</h1>
          <p className="mt-2 text-sm text-white/68">
            This tracking link does not match any real order on your account.
          </p>
          <div className="mt-5">
            <Button asChild size="sm">
              <Link href="/orders">Back to orders</Link>
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
