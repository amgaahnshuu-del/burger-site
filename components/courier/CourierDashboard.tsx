"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
} from "@heroicons/react/24/solid";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import { claimCourierOrder, updateCourierLocation } from "@/features/courier/courier.service";
import type { Order } from "@/features/order/order.types";
import { formatCurrency, formatDateTime, getErrorMessage, getOrderStatusLabel } from "@/lib/helpers";

type CourierDashboardProps = {
  activeOrders: Order[];
  availableOrders: Order[];
  completedToday: number;
  onRefresh: () => void;
};

type LiveStatus =
  | "idle"
  | "watching"
  | "sending"
  | "blocked"
  | "unsupported"
  | "error";

function getContactPhone(order: Order) {
  return order.contactPhone || order.user?.phone || null;
}

function getAvailableOrderAddressLabel(order: Order) {
  return [
    order.addressLabel,
    order.addressDistrict,
    order.addressKhoroo,
  ].filter(Boolean).join(" / ") || order.address;
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-orange-500/12 text-orange-300">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/36">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

export default function CourierDashboard({
  activeOrders,
  availableOrders,
  completedToday,
  onRefresh,
}: CourierDashboardProps) {
  const activeOrder = activeOrders[0] ?? null;
  const activeOrderId = activeOrder?.id ?? null;
  const [actionError, setActionError] = useState<string | null>(null);
  const [isClaimingId, setIsClaimingId] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("idle");
  void liveStatus;
  const lastKnownCoordsRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSentAtRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    function scheduleReset(callback: () => void) {
      queueMicrotask(() => {
        if (!cancelled) {
          callback();
        }
      });
    }

    async function pushLiveLocation(
      orderId: string,
      latitude: number,
      longitude: number
    ) {
      if (cancelled) {
        return;
      }

      const now = Date.now();

      if (now - lastSentAtRef.current < 2500) {
        return;
      }

      lastSentAtRef.current = now;
      setLiveStatus("sending");

      try {
        await updateCourierLocation(orderId, latitude, longitude);

        if (cancelled) {
          return;
        }

        setLiveStatus("watching");
      } catch {
        if (!cancelled) {
          setLiveStatus("error");
        }
      }
    }

    if (!activeOrderId) {
      if (watchIdRef.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = null;
      lastKnownCoordsRef.current = null;
      scheduleReset(() => {
        setLiveStatus("idle");
      });
      return () => {
        cancelled = true;
      };
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      scheduleReset(() => {
        setLiveStatus("unsupported");
      });
      return () => {
        cancelled = true;
      };
    }

    scheduleReset(() => {
      setLiveStatus("watching");
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        lastKnownCoordsRef.current = { latitude, longitude };
        void pushLiveLocation(activeOrderId, latitude, longitude);
      },
      () => {
        return;
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        lastKnownCoordsRef.current = { latitude, longitude };
        void pushLiveLocation(activeOrderId, latitude, longitude);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLiveStatus("blocked");
          return;
        }

        setLiveStatus("error");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    const heartbeatId = setInterval(() => {
      if (!lastKnownCoordsRef.current) {
        return;
      }

      void pushLiveLocation(
        activeOrderId,
        lastKnownCoordsRef.current.latitude,
        lastKnownCoordsRef.current.longitude
      );
    }, 4000);

    return () => {
      cancelled = true;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (heartbeatId) {
        clearInterval(heartbeatId);
      }
      lastKnownCoordsRef.current = null;
      watchIdRef.current = null;
    };
  }, [activeOrderId]);

  async function handleClaim(orderId: string) {
    setActionError(null);
    setIsClaimingId(orderId);

    try {
      await claimCourierOrder(orderId);
      onRefresh();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsClaimingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-300/70">
            Courier dashboard
          </p>
          <h1 className="mt-3 text-[2.6rem] font-black leading-[0.95] tracking-[-0.04em] text-white">
            Live deliveries
          </h1>
          <p className="mt-3 max-w-[44rem] text-sm leading-7 text-white/56">
            Claim an order, contact the customer, and keep live GPS coordinates
            flowing into the customer tracking screen.
          </p>
        </div>

        <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/62">
          {activeOrder
            ? `Active route: #${activeOrder.id.slice(0, 8)}`
            : "No active route assigned yet."}
        </div>
      </div>

      {actionError ? <Toast message={actionError} tone="error" /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryTile
          icon={TruckIcon}
          label="Active deliveries"
          value={String(activeOrders.length)}
        />
        <SummaryTile
          icon={ClockIcon}
          label="Waiting orders"
          value={String(availableOrders.length)}
        />
        <SummaryTile
          icon={CheckCircleIcon}
          label="Delivered today"
          value={String(completedToday)}
        />
      </div>

      <div className="space-y-6">
        <Card className="p-6" variant="default">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/34">
                Available orders
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Ready for pickup
              </h2>
            </div>
            <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
              {availableOrders.length} open
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {availableOrders.length ? (
              availableOrders.map((order) => {
                const contactPhone = getContactPhone(order);
                const areaLabel = getAvailableOrderAddressLabel(order);

                return (
                  <article
                    className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4"
                    key={order.id}
                  >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {order.user?.name ?? "Customer"}
                      </p>
                      <p className="mt-1 text-xs text-white/42">
                        #{order.id.slice(0, 8)} • {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/56">
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-white/72">
                    <p>
                      <span className="text-white/44">Customer contact:</span>{" "}
                      {contactPhone ? contactPhone : "Unlocks after claim"}
                    </p>
                    <p>
                      <span className="text-white/44">Delivery area:</span>{" "}
                      {areaLabel}
                    </p>
                    <p>
                      <span className="text-white/44">Items:</span>{" "}
                      {order.items.length} • {formatCurrency(order.totalPrice)}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      isLoading={isClaimingId === order.id}
                      onClick={() => handleClaim(order.id)}
                      size="sm"
                    >
                      Take delivery
                    </Button>
                    {contactPhone ? (
                      <Button asChild size="sm" variant="secondary">
                        <a href={`tel:${contactPhone}`}>
                          Call
                        </a>
                      </Button>
                    ) : null}
                  </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-white/56">
                No open orders are waiting right now. Keep this tab open and it
                will refresh automatically.
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
