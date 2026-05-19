"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

import type { Order } from "@/features/order/order.types";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import {
  cn,
  formatCurrency,
  formatDashboardDateTime,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from "@/lib/helpers";

type OrderCardProps = {
  order: Order;
};

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("cancel")) {
    return "border-[rgba(255,40,30,.25)] bg-[rgba(255,40,30,.12)] text-white/78";
  }

  if (normalized.includes("deliver") || normalized.includes("complete")) {
    return "border-emerald-400/22 bg-emerald-500/12 text-emerald-200";
  }

  return "border-orange-400/22 bg-orange-500/12 text-orange-200";
}

function getPaymentTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("fail")) {
    return "text-[#ff4d3d]";
  }

  if (normalized.includes("paid")) {
    return "text-emerald-300";
  }

  return "text-white/58";
}

export default function OrderCard({ order }: OrderCardProps) {
  const { t } = useAppLanguage();
  const statusLabel = getOrderStatusLabel(order.status);
  const paymentLabel = getPaymentStatusLabel(order.payment?.status ?? "PENDING");
  const paymentTone = getPaymentTone(paymentLabel);
  const isStacked = order.items.length > 1;

  return (
    <article
      className={cn(
        "w-full rounded-[22px] border border-[rgba(255,106,0,.24)] bg-[linear-gradient(145deg,rgba(18,18,20,.96),rgba(8,8,10,.98))] px-[30px] py-7 shadow-[0_24px_70px_rgba(0,0,0,.45)]",
        isStacked ? "min-h-[258px]" : "min-h-[178px]"
      )}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_230px_150px_140px_150px] xl:items-start xl:gap-x-[22px]">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/[0.42]">
            {t({ en: "Order ID", mn: "Захиалгын ID" })}
          </p>
          <p className="mt-2 break-all text-[15px] font-bold text-white">#{order.id}</p>
        </div>

        <div className="flex items-center gap-2 text-[13px] text-white/[0.65]">
          <CalendarDaysIcon className="h-[18px] w-[18px] shrink-0 text-white/36" />
          <span>{formatDashboardDateTime(order.createdAt)}</span>
        </div>

        <div className="flex xl:justify-start">
          <span
            className={cn(
              "inline-flex h-[26px] items-center gap-2 rounded-full border px-[13px] text-[11px] font-medium",
              getStatusTone(statusLabel)
            )}
          >
            <span className="h-[7px] w-[7px] rounded-full bg-current opacity-90" />
            {statusLabel}
          </span>
        </div>

        <div className="xl:text-right">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/[0.42]">
            {t({ en: "Total", mn: "Нийт" })}
          </p>
          <p className="mt-1 text-[31px] font-black leading-none text-white">
            {formatCurrency(order.totalPrice)}
          </p>
        </div>

        <div className="xl:flex xl:justify-end">
          <Link
            className="inline-flex h-[44px] items-center justify-center gap-2 rounded-[12px] border border-[#ff6a00] bg-transparent px-[22px] text-[14px] font-extrabold text-white transition hover:bg-orange-500/10 hover:text-orange-100"
            href={`/protected/order/track/${order.id}`}
          >
            {t({ en: "View details", mn: "Дэлгэрэнгүй" })}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className={cn("mt-7", isStacked ? "space-y-[18px]" : "space-y-0")}>
        {order.items.map((item, index) => (
          <div
            className={cn(
              "flex items-center gap-4",
              index > 0 ? "border-t border-white/[0.06] pt-[18px]" : ""
            )}
            key={item.id}
          >
            <div className="relative h-[56px] w-[56px] shrink-0 overflow-hidden rounded-[13px] border border-white/[0.05] bg-[#120c08]">
              <Image
                alt={item.food.name}
                className="object-contain p-1.5"
                fill
                sizes="56px"
                src={item.food.image}
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-white">{item.food.name}</p>
              {index === order.items.length - 1 ? (
                <p className="mt-1 text-[13px] text-white/58">
                  {t({ en: "Payment", mn: "Төлбөр" })}: <span className={paymentTone}>{paymentLabel}</span>
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
