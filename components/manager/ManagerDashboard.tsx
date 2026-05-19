"use client";

import Link from "next/link";
import {
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  PhoneIcon,
  TruckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import { useState } from "react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Toast from "@/components/ui/Toast";
import {
  sendManagerOrderToCourier,
  startManagerOrder,
} from "@/features/manager/manager.service";
import type { Order } from "@/features/order/order.types";
import {
  cn,
  formatCurrency,
  formatDateTime,
  getErrorMessage,
  getOrderStatusLabel,
  getRelativeOrderTime,
} from "@/lib/helpers";

export type ManagerDashboardMode =
  | "incoming"
  | "preparing"
  | "ready"
  | "delivering";

type ManagerDashboardProps = {
  deliveredToday: number;
  deliveringOrders: Order[];
  incomingOrders: Order[];
  mode: ManagerDashboardMode;
  onRefresh: () => void;
  preparingOrders: Order[];
  readyOrders: Order[];
};

type QueueLink = {
  href: string;
  label: string;
  mode: ManagerDashboardMode;
};

const MANAGER_QUEUE_LINKS: readonly QueueLink[] = [
  { href: "/manager", label: "Incoming", mode: "incoming" },
  { href: "/manager/preparing", label: "Cooking", mode: "preparing" },
  { href: "/manager/ready", label: "Ready", mode: "ready" },
  { href: "/manager/delivering", label: "On Road", mode: "delivering" },
] as const;

const MANAGER_VIEW_COPY: Record<ManagerDashboardMode, {
  description: string;
  eyebrow: string;
  note: string;
  title: string;
}> = {
  delivering: {
    description: "Keep an eye on orders that couriers already claimed and are carrying to customers.",
    eyebrow: "Courier handoff",
    note: "Claimed deliveries stay here until they reach the customer.",
    title: "Orders on the road",
  },
  incoming: {
    description: "Fresh customer checkouts land here first. Review them quickly and move accepted tickets into cooking.",
    eyebrow: "Incoming queue",
    note: "Start cooking as soon as the kitchen accepts a new order.",
    title: "New orders waiting",
  },
  preparing: {
    description: "These tickets are already in the kitchen. Track what is cooking and release packed meals to couriers.",
    eyebrow: "Kitchen line",
    note: "Send an order to courier only after it is packed and ready to leave.",
    title: "Orders in preparation",
  },
  ready: {
    description: "Packed meals wait here until a courier account claims them from the live delivery dashboard.",
    eyebrow: "Pickup queue",
    note: "Ready orders are visible to couriers immediately after handoff.",
    title: "Courier pickup waiting",
  },
};

function getContactPhone(order: Order) {
  return order.contactPhone || order.user?.phone || null;
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

function OrderItemsPreview({ order }: { order: Order }) {
  return (
    <div className="space-y-2">
      {order.items.map((item) => (
        <div
          className="flex items-center justify-between gap-3 rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3"
          key={item.id}
        >
          <div>
            <p className="text-sm font-semibold text-white">{item.food.name}</p>
            <p className="mt-1 text-xs text-white/42">Qty {item.quantity}</p>
          </div>
          <p className="text-sm text-white/72">
            {formatCurrency(item.price * item.quantity)}
          </p>
        </div>
      ))}
    </div>
  );
}

function QueueCard({
  action,
  actionLabel,
  accent,
  description,
  emptyDescription,
  emptyTitle,
  orders,
  title,
}: {
  action?: {
    isLoadingId: string | null;
    onClick: (orderId: string) => void;
  };
  actionLabel?: string;
  accent: string;
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  orders: Order[];
  title: string;
}) {
  return (
    <Card className="p-6" variant="default">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${accent}`}>
            {title}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            {orders.length} orders
          </h2>
          <p className="mt-2 text-sm text-white/54">{description}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {orders.length ? (
          orders.map((order) => (
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
                    #{order.id.slice(0, 8)} | {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/56">
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <div className="flex items-start gap-3 rounded-[1.15rem] border border-white/8 bg-black/20 px-4 py-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/12 text-orange-300">
                      <UserCircleIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {order.user?.name ?? "Customer"}
                      </p>
                      <p className="mt-1 truncate text-xs text-white/46">
                        {order.user?.email ?? "No email"}
                      </p>
                      <p className="mt-2 text-sm text-orange-300">
                        {getContactPhone(order) ?? "No phone captured"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-[1.15rem] border border-white/8 bg-black/20 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/34">
                      Delivery address
                    </p>
                    <p className="mt-2 text-sm leading-7 text-white/72">
                      {order.address}
                    </p>
                    <p className="mt-2 text-xs text-white/42">
                      Ordered {getRelativeOrderTime(order.createdAt)} on {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.15rem] border border-white/8 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/34">
                        Basket total
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {formatCurrency(order.totalPrice)}
                      </p>
                    </div>
                    {getContactPhone(order) ? (
                      <Button asChild size="sm" variant="secondary">
                        <a href={`tel:${getContactPhone(order)}`}>
                          <PhoneIcon className="mr-2 h-4 w-4" />
                          Call
                        </a>
                      </Button>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <OrderItemsPreview order={order} />
                  </div>

                  {action && actionLabel ? (
                    <div className="mt-4">
                      <Button
                        isLoading={action.isLoadingId === order.id}
                        onClick={() => action.onClick(order.id)}
                        size="sm"
                      >
                        {actionLabel}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            description={emptyDescription}
            title={emptyTitle}
          />
        )}
      </div>
    </Card>
  );
}

function DeliveringQueueCard({ orders }: { orders: Order[] }) {
  return (
    <Card className="p-6" variant="default">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-300/70">
            Live courier handoff
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            On the road
          </h2>
          <p className="mt-2 text-sm text-white/54">
            Orders that a courier has already claimed.
          </p>
        </div>
        <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
          {orders.length} active
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {orders.length ? (
          orders.map((order) => (
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
                    #{order.id.slice(0, 8)} | {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/56">
                  {order.courier?.name ?? "Courier claimed"}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-white/72">
                <p>
                  <span className="text-white/44">Address:</span>{" "}
                  {order.address}
                </p>
                <p>
                  <span className="text-white/44">Items:</span>{" "}
                  {order.items.length} | {formatCurrency(order.totalPrice)}
                </p>
                <p>
                  <span className="text-white/44">Courier:</span>{" "}
                  {order.courier?.name ?? "Assigned"}
                </p>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-white/56">
            Courier claims will appear here after a ready order is picked up.
          </div>
        )}
      </div>
    </Card>
  );
}

export default function ManagerDashboard({
  deliveredToday,
  deliveringOrders,
  incomingOrders,
  mode,
  onRefresh,
  preparingOrders,
  readyOrders,
}: ManagerDashboardProps) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [isStartingId, setIsStartingId] = useState<string | null>(null);
  const [isSendingId, setIsSendingId] = useState<string | null>(null);

  const viewCopy = MANAGER_VIEW_COPY[mode];
  const queueCounts: Record<ManagerDashboardMode, number> = {
    delivering: deliveringOrders.length,
    incoming: incomingOrders.length,
    preparing: preparingOrders.length,
    ready: readyOrders.length,
  };

  async function handleStartCooking(orderId: string) {
    setActionError(null);
    setIsStartingId(orderId);

    try {
      await startManagerOrder(orderId);
      onRefresh();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsStartingId(null);
    }
  }

  async function handleSendToCourier(orderId: string) {
    setActionError(null);
    setIsSendingId(orderId);

    try {
      await sendManagerOrderToCourier(orderId);
      onRefresh();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsSendingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-300/70">
            {viewCopy.eyebrow}
          </p>
          <h1 className="mt-3 text-[2.6rem] font-black leading-[0.95] tracking-[-0.04em] text-white">
            {viewCopy.title}
          </h1>
          <p className="mt-3 max-w-[44rem] text-sm leading-7 text-white/56">
            {viewCopy.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {MANAGER_QUEUE_LINKS.map((item) => {
            const active = item.mode === mode;

            return (
              <Link
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                  active
                    ? "border-orange-300/35 bg-[linear-gradient(135deg,#ff6a00,#ff8a1f)] text-white shadow-[0_10px_24px_rgba(255,106,0,0.24)]"
                    : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/18 hover:bg-white/[0.06] hover:text-white"
                )}
                href={item.href}
                key={item.href}
              >
                <span>{item.label}</span>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-bold",
                  active ? "bg-black/18 text-white" : "bg-white/[0.06] text-white/70"
                )}>
                  {queueCounts[item.mode]}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {actionError ? <Toast message={actionError} tone="error" /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryTile
          icon={ClockIcon}
          label="Incoming"
          value={String(incomingOrders.length)}
        />
        <SummaryTile
          icon={FireIcon}
          label="Preparing"
          value={String(preparingOrders.length)}
        />
        <SummaryTile
          icon={TruckIcon}
          label="Ready for courier"
          value={String(readyOrders.length)}
        />
        <SummaryTile
          icon={CheckCircleIcon}
          label="Delivered today"
          value={String(deliveredToday)}
        />
      </div>

      <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/62">
        {viewCopy.note}
      </div>

      {mode === "incoming" ? (
        <QueueCard
          accent="text-orange-300/70"
          action={{
            isLoadingId: isStartingId,
            onClick: handleStartCooking,
          }}
          actionLabel="Start cooking"
          description="New orders appear here until the kitchen accepts them."
          emptyDescription="Fresh orders will appear here as soon as customers check out."
          emptyTitle="No incoming orders right now."
          orders={incomingOrders}
          title="Incoming queue"
        />
      ) : null}

      {mode === "preparing" ? (
        <QueueCard
          accent="text-orange-300/70"
          action={{
            isLoadingId: isSendingId,
            onClick: handleSendToCourier,
          }}
          actionLabel="Send to courier"
          description="Orders stay here while the kitchen is preparing them."
          emptyDescription="Once a manager starts an order, it will move into this queue."
          emptyTitle="Nothing is cooking right now."
          orders={preparingOrders}
          title="Kitchen line"
        />
      ) : null}

      {mode === "ready" ? (
        <QueueCard
          accent="text-orange-300/70"
          description="These orders are ready and visible to courier accounts for claiming."
          emptyDescription="Send a cooking order here when it is packed and ready to leave."
          emptyTitle="No orders are waiting for courier pickup."
          orders={readyOrders}
          title="Courier pickup queue"
        />
      ) : null}

      {mode === "delivering" ? (
        <DeliveringQueueCard orders={deliveringOrders} />
      ) : null}
    </section>
  );
}
