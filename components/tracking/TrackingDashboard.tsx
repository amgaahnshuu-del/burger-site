"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  TruckIcon,
} from "@heroicons/react/24/solid";

import Map from "@/components/tracking/Map";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import { cancelOrder } from "@/features/order/order.service";
import type { Order } from "@/features/order/order.types";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import { isOrderTrackable, resolveTrackingStep } from "@/lib/dashboard";
import {
  cn,
  formatCurrency,
  formatDateTime,
  getErrorMessage,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getTrackingStatusLabel,
} from "@/lib/helpers";
import { canCustomerCancelOrder } from "@/lib/order-lifecycle";

type TrackingDashboardProps = {
  onRefresh?: () => void;
  order: Order;
};

export default function TrackingDashboard({
  onRefresh,
  order,
}: TrackingDashboardProps) {
  const { t } = useAppLanguage();
  const trackingSteps = [
    {
      hint: t({ en: "Order accepted", mn: "Захиалга баталгаажсан" }),
      icon: CheckCircleIcon,
      key: "placed",
      label: t({ en: "Placed", mn: "Баталгаажсан" }),
    },
    {
      hint: t({ en: "Kitchen in progress", mn: "Гал тогоонд бэлтгэж байна" }),
      icon: ClockIcon,
      key: "preparing",
      label: t({ en: "Preparing", mn: "Бэлтгэж байна" }),
    },
    {
      hint: t({ en: "Courier en route", mn: "Хүргэгч замдаа" }),
      icon: TruckIcon,
      key: "ontheway",
      label: t({ en: "On the way", mn: "Хүргэлтэд гарсан" }),
    },
    {
      hint: t({ en: "Final handoff", mn: "Эцсийн хүлээлгэн өгөлт" }),
      icon: MapPinIcon,
      key: "delivered",
      label: t({ en: "Delivered", mn: "Хүргэгдсэн" }),
    },
  ] as const;

  const currentStep = resolveTrackingStep(order);
  const isDelivered =
    order.status === "DELIVERED" || order.tracking?.status === "DELIVERED";
  const courierPhone = order.courier?.phone ?? null;
  const courierName = order.courier?.name
    ?? t({ en: "Courier pending", mn: "Хүргэгч хүлээгдэж байна" });
  const showLiveLocation = isOrderTrackable(order);
  const canCancelOrder = canCustomerCancelOrder(
    order.status,
    order.payment?.status ?? "PENDING"
  );
  const trackingStatus = showLiveLocation && order.tracking
    ? getTrackingStatusLabel(order.tracking.status)
    : isDelivered
      ? t({ en: "Delivered", mn: "Хүргэгдсэн" })
      : t({ en: "Tracking unavailable", mn: "Хяналт боломжгүй" });
  const etaText = isDelivered
    ? t({ en: "Delivered", mn: "Хүргэгдсэн" })
    : order.tracking?.status === "ON_THE_WAY" || order.status === "DELIVERING"
      ? t({ en: "8-12 min", mn: "8-12 мин" })
      : t({ en: "18-25 min", mn: "18-25 мин" });

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  async function handleCancelOrder() {
    setActionError(null);
    setActionSuccess(null);
    setIsCancelling(true);

    try {
      await cancelOrder(
        order.id,
        "Cancelled by customer from the tracking dashboard."
      );
      setActionSuccess(
        t({
          en: "Your order has been cancelled.",
          mn: "Таны захиалга цуцлагдлаа.",
        })
      );
      onRefresh?.();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <section className="space-y-4">
      {actionError ? <Toast message={actionError} tone="error" /> : null}
      {actionSuccess ? <Toast message={actionSuccess} tone="success" /> : null}

      <section className="rounded-[24px] border border-[rgba(255,106,0,.24)] bg-[linear-gradient(145deg,rgba(18,18,20,.96),rgba(8,8,10,.98))] px-[30px] py-[28px] shadow-[0_24px_70px_rgba(0,0,0,.45)]">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_220px_190px]">
          <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
              {t({ en: "Order ID", mn: "Захиалгын ID" })}
            </p>
            <p className="mt-2 text-[15px] font-bold text-white">
              #{order.id}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/65">
              <span className="inline-flex items-center gap-2">
                <ClockIcon className="h-[18px] w-[18px] text-white/42" />
                {formatDateTime(order.createdAt)}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPinIcon className="h-[18px] w-[18px] text-white/42" />
                {order.addressLabel ?? t({ en: "Delivery address", mn: "Хүргэлтийн хаяг" })}
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/74">
              {order.address}
            </p>
          </div>

          <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
              {t({ en: "Status", mn: "Төлөв" })}
            </p>
            <span className="mt-4 inline-flex h-[28px] items-center gap-2 rounded-full border border-orange-400/22 bg-orange-500/12 px-3 text-[12px] font-semibold text-orange-200">
              <span className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(255,106,0,0.55)]" />
              {getOrderStatusLabel(order.status)}
            </span>
            <p className="mt-4 text-[13px] leading-6 text-white/68">
              {trackingStatus}
            </p>
            <p className="mt-2 text-[13px] text-white/46">
              {order.tracking?.updatedAt
                ? t({
                  en: `Updated ${formatDateTime(order.tracking.updatedAt)}`,
                  mn: `${formatDateTime(order.tracking.updatedAt)} шинэчлэгдсэн`,
                })
                : t({
                  en: "Courier update pending",
                  mn: "Хүргэгчийн шинэчлэлт хүлээгдэж байна",
                })}
            </p>
          </div>

          <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
              {t({ en: "Total", mn: "Нийт" })}
            </p>
            <p className="mt-3 text-[31px] font-black leading-none text-white">
              {formatCurrency(order.totalPrice)}
            </p>
            <p className="mt-4 text-[13px] text-white/62">
              {t({
                en: `${order.items.length} item${order.items.length > 1 ? "s" : ""}`,
                mn: `${order.items.length} бүтээгдэхүүн`,
              })}
            </p>
            <p className="mt-2 text-[13px] text-white/46">
              {t({ en: "ETA", mn: "Хүрэх хугацаа" })} {etaText}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[22px] border border-white/8 bg-[linear-gradient(145deg,rgba(20,20,23,0.92),rgba(11,11,13,0.98))] px-5 py-6">
          <div className="grid gap-5 lg:grid-cols-4">
            {trackingSteps.map((step, index) => {
              const Icon = step.icon;
              const completed = isDelivered
                ? index <= currentStep
                : index < currentStep;
              const current = !isDelivered && index === currentStep;

              return (
                <div className="relative" key={step.key}>
                  {index < trackingSteps.length - 1 ? (
                    <span className="absolute left-[calc(50%+28px)] right-[-18px] top-[18px] hidden h-[2px] bg-white/10 lg:block">
                      <span
                        className={cn(
                          "block h-full",
                          completed
                            ? "bg-emerald-400"
                            : current
                              ? "bg-[linear-gradient(90deg,#ff6a00,#ff8a1f)]"
                              : "bg-transparent"
                        )}
                        style={{ width: completed || current ? "100%" : "0%" }}
                      />
                    </span>
                  ) : null}

                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                        completed
                          ? "border-emerald-400/30 bg-emerald-500/14 text-emerald-300"
                          : current
                            ? "border-orange-400/25 bg-orange-500/15 text-orange-300 shadow-[0_0_26px_rgba(255,106,0,0.18)]"
                            : "border-white/8 bg-white/[0.05] text-white/38"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          completed
                            ? "text-emerald-200"
                            : current
                              ? "text-orange-200"
                              : "text-white/72"
                        )}
                      >
                        {step.label}
                      </p>
                      <p className="mt-1 text-[12px] text-white/42">
                        {step.hint}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            {showLiveLocation ? (
              <Map address={order.address} tracking={order.tracking} />
            ) : (
              <div className="flex h-[360px] flex-col items-center justify-center rounded-[22px] border border-white/8 bg-[linear-gradient(145deg,rgba(17,17,20,0.96),rgba(9,9,11,0.98))] px-8 text-center">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] border border-orange-400/18 bg-orange-500/10 text-orange-300 shadow-[0_18px_30px_rgba(255,106,0,0.14)]">
                  <MapPinIcon className="h-7 w-7" />
                </span>
                <h3 className="mt-5 text-[22px] font-bold text-white">
                  {t({ en: "Live location unavailable", mn: "Шууд байршил боломжгүй" })}
                </h3>
                <p className="mt-3 max-w-[460px] text-sm leading-7 text-white/66">
                  {isDelivered
                    ? t({
                      en: "This order has already been delivered, so courier location is no longer shown.",
                      mn: "Энэ захиалга хүргэгдсэн тул хүргэгчийн байршил цааш харагдахгүй.",
                    })
                    : t({
                      en: "Location tracking only appears while an order is actively being prepared or delivered.",
                      mn: "Байршлын хяналт нь захиалга бэлтгэгдэж эсвэл хүргэгдэж байх үед л харагдана.",
                    })}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                {t({ en: "Delivery partner", mn: "Хүргэлтийн ажилтан" })}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full bg-[rgba(255,90,0,0.14)] ring-1 ring-orange-300/14">
                  <Image
                    alt="Courier avatar"
                    className="object-cover"
                    fill
                    sizes="48px"
                    src="/aii.png"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{courierName}</p>
                  <p className="mt-1 text-[13px] text-white/48">
                    {courierPhone ?? t({ en: "Phone appears when a courier is assigned.", mn: "Хүргэгч оноогдсоны дараа утас харагдана." })}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {courierPhone ? (
                  <a
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[13px] border border-orange-400/22 bg-orange-500/10 text-sm font-semibold text-orange-200 transition hover:bg-orange-500/18"
                    href={`tel:${courierPhone}`}
                  >
                    <PhoneIcon className="h-4 w-4" />
                    {t({ en: "Call", mn: "Залгах" })}
                  </a>
                ) : (
                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[13px] border border-white/8 bg-white/[0.03] text-sm font-semibold text-white/34"
                    disabled
                    type="button"
                  >
                    <PhoneIcon className="h-4 w-4" />
                    {t({ en: "Call", mn: "Залгах" })}
                  </button>
                )}

                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[13px] border border-white/8 bg-white/[0.03] text-sm font-semibold text-white transition hover:border-orange-400/18 hover:text-orange-200"
                  type="button"
                >
                  <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
                  {t({ en: "Support", mn: "Тусламж" })}
                </button>
              </div>
            </div>

            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                {t({ en: "Delivery address", mn: "Хүргэлтийн хаяг" })}
              </p>
              <p className="mt-4 text-sm leading-7 text-white/74">
                {order.address}
              </p>
              {order.contactPhone ? (
                <p className="mt-4 text-[13px] text-white/48">
                  {t({ en: "Contact", mn: "Утас" })} {order.contactPhone}
                </p>
              ) : null}
            </div>

            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                {t({ en: "Quick actions", mn: "Шуурхай үйлдэл" })}
              </p>
              <div className="mt-4 space-y-3">
                <Button
                  asChild
                  className="min-h-11 w-full rounded-[13px] border-orange-500/70 bg-[rgba(255,106,0,0.08)] text-sm font-extrabold text-white hover:bg-[linear-gradient(135deg,#ff6a00,#ff8a1f)]"
                  size="sm"
                  variant="outline"
                >
                  <Link href="/orders">{t({ en: "All orders", mn: "Бүх захиалга" })}</Link>
                </Button>
                <Button
                  asChild
                  className="min-h-11 w-full rounded-[13px] text-sm font-semibold"
                  size="sm"
                  variant="secondary"
                >
                  <Link href="/messages">{t({ en: "Support", mn: "Тусламж" })}</Link>
                </Button>
                {canCancelOrder ? (
                  <Button
                    className="min-h-11 w-full rounded-[13px] text-sm font-semibold"
                    isLoading={isCancelling}
                    onClick={handleCancelOrder}
                    size="sm"
                    variant="danger"
                  >
                    {t({ en: "Cancel order", mn: "Захиалга цуцлах" })}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                  {t({ en: "Order items", mn: "Захиалсан бүтээгдэхүүн" })}
                </p>
                <h2 className="mt-3 text-[22px] font-bold text-white">
                  {t({ en: "Your active delivery", mn: "Таны идэвхтэй хүргэлт" })}
                </h2>
              </div>
              <p className="text-sm text-white/54">
                {t({
                  en: `${order.items.length} item${order.items.length > 1 ? "s" : ""}`,
                  mn: `${order.items.length} бүтээгдэхүүн`,
                })}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {order.items.map((item) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-[16px] border border-white/6 bg-black/18 px-4 py-3"
                  key={item.id}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-[13px] bg-[#121214]">
                      <Image
                        alt={item.food.name}
                        className="object-contain p-1.5"
                        fill
                        sizes="48px"
                        src={item.food.image}
                      />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-white">
                        {item.food.name}
                      </p>
                      <p className="mt-1 text-[13px] text-white/48">
                        {t({ en: "Qty", mn: "Тоо" })} {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                {t({ en: "Payment", mn: "Төлбөр" })}
              </p>
              <p className="mt-3 text-[17px] font-semibold text-white">
                {getPaymentStatusLabel(order.payment?.status ?? "PENDING")}
              </p>
              <p className="mt-3 text-[13px] leading-6 text-white/56">
                {order.payment?.providerReference
                  ? t({
                    en: `Reference ${order.payment.providerReference}`,
                    mn: `Лавлах ${order.payment.providerReference}`,
                  })
                  : order.payment?.method
                    ? t({
                      en: `${order.payment.method} selected`,
                      mn: `${order.payment.method} сонгосон`,
                    })
                    : t({
                      en: "Payment has not been attached yet.",
                      mn: "Төлбөрийн мэдээлэл хараахан холбогдоогүй байна.",
                    })}
              </p>
              {order.payment?.failureReason ? (
                <p className="mt-3 text-[13px] text-orange-300">
                  {order.payment.failureReason}
                </p>
              ) : null}
            </div>

            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                {t({ en: "Live route status", mn: "Шууд маршрут" })}
              </p>
              <p className="mt-3 text-[17px] font-semibold text-white">
                {trackingStatus}
              </p>
              <p className="mt-3 text-[13px] leading-6 text-white/56">
                {!showLiveLocation
                  ? t({
                    en: "Live courier location is hidden after delivery is completed.",
                    mn: "Захиалга хүргэгдсэний дараа хүргэгчийн байршил харагдахгүй.",
                  })
                  : order.courier
                    ? t({
                      en: `Assigned to ${order.courier.name}`,
                      mn: `${order.courier.name}-д оноогдсон`,
                    })
                    : t({
                      en: "A courier will appear here once the order is claimed.",
                      mn: "Захиалгыг хүлээн авмагц хүргэгч энд харагдана.",
                    })}
              </p>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
