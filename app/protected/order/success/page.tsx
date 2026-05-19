"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Loader from "@/components/ui/Loader";
import PageHeader from "@/components/ui/PageHeader";
import { useOrderDetail } from "@/features/order/order.hooks";
import {
  formatCurrency,
  formatDateTime,
  getPaymentStatusLabel,
} from "@/lib/helpers";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id") ?? "";
  const { isLoading, order } = useOrderDetail(orderId);

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <TopBar searchPlaceholder="Search your recent order" />
      <PageHeader
        description="Your order is now in the system. Track it live or jump back to the menu for another round."
        eyebrow="Success"
        title="Захиалга амжилттай"
      />

      <section className="overflow-hidden rounded-[2.4rem] border border-orange-500/18 bg-[linear-gradient(180deg,rgba(18,18,19,0.96)_0%,rgba(9,9,10,0.99)_100%)] shadow-[0_32px_90px_rgba(0,0,0,0.42)]">
        <div className="grid gap-6 border-b border-white/8 p-6 sm:p-8 lg:grid-cols-[1fr_0.88fr] lg:items-center">
          <div>
            <p className="eyebrow">Order details</p>
            <h1 className="font-display mt-4 text-[3rem] font-bold leading-[0.88] tracking-[-0.05em] text-white sm:text-[4.3rem]">
              Thank <span className="text-orange-400">You!</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/58">
              Your order has been placed successfully and routed into the delivery system.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Card className="rounded-[1.25rem] p-4" variant="soft">
                <p className="text-xs uppercase tracking-[0.24em] text-white/34">Order number</p>
                <p className="mt-3 text-sm font-semibold text-white">
                  #{orderId ? orderId.slice(0, 8) : "Pending"}
                </p>
              </Card>
              <Card className="rounded-[1.25rem] p-4" variant="soft">
                <p className="text-xs uppercase tracking-[0.24em] text-white/34">Delivery ETA</p>
                <p className="mt-3 text-sm font-semibold text-orange-300">30-35 min</p>
              </Card>
            </div>
          </div>

          <div className="relative min-h-[16rem]">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,106,0,0.24)_0%,rgba(255,106,0,0.04)_56%,transparent_72%)] blur-3xl" />
            <Image
              alt="Order success mascot"
              className="object-contain object-right drop-shadow-[0_30px_48px_rgba(255,106,0,0.16)]"
              fill
              sizes="(max-width: 1024px) 100vw, 360px"
              src="/ai-agenthero.png"
            />
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-4">
            <Card className="rounded-[1.55rem] p-4" variant="soft">
              <p className="text-xs uppercase tracking-[0.24em] text-white/34">Delivery address</p>
              <p className="mt-3 text-sm leading-7 text-white/72">
                {order?.address ?? "Waiting for backend confirmation"}
              </p>
            </Card>

            <Card className="rounded-[1.55rem] p-4" variant="soft">
              <p className="text-xs uppercase tracking-[0.24em] text-white/34">Payment method</p>
              <p className="mt-3 text-sm font-medium text-white">
                {order?.payment?.method ?? "Pending"}
              </p>
              <p className="mt-2 text-xs text-white/46">
                {order?.payment
                  ? `${getPaymentStatusLabel(order.payment.status)}${order.payment.providerReference ? ` • ${order.payment.providerReference}` : ""}`
                  : "Waiting for backend confirmation"}
              </p>
            </Card>

            <Card className="rounded-[1.55rem] p-4" variant="soft">
              <p className="text-xs uppercase tracking-[0.24em] text-white/34">Ordered at</p>
              <p className="mt-3 text-sm font-medium text-white">
                {order ? formatDateTime(order.createdAt) : "Just now"}
              </p>
            </Card>
          </div>

          <div className="rounded-[1.75rem] border border-white/8 bg-[#0d0d0e] p-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-white/34">
              Order summary
            </p>

            <div className="mt-5 space-y-3">
              {order?.items.length ? (
                order.items.map((item) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-3"
                    key={item.id}
                  >
                    <div>
                      <p className="font-medium text-white">{item.food.name}</p>
                      <p className="mt-1 text-xs text-white/40">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-white/78">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-white/58">
                  The order was placed successfully. Item details will appear here when the backend response is available.
                </div>
              )}
            </div>

            <div className="mt-5 space-y-3 border-t border-white/8 pt-5 text-sm">
              <div className="flex items-center justify-between text-white/60">
                <span>Subtotal</span>
                <span>{formatCurrency(order ? order.totalPrice - 3000 : 0)}</span>
              </div>
              <div className="flex items-center justify-between text-white/60">
                <span>Delivery fee</span>
                <span>{formatCurrency(order ? 3000 : 0)}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-semibold text-white">
                <span>Total</span>
                <span className="text-orange-300">{formatCurrency(order?.totalPrice ?? 0)}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {orderId ? (
                <Button asChild className="sm:flex-1">
                  <Link href={`/protected/order/track/${orderId}`}>Track order</Link>
                </Button>
              ) : null}
              <Button asChild className="sm:flex-1" variant="secondary">
                <Link href="/public/explore">Back to menu</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
