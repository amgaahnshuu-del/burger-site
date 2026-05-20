import Link from "next/link";
import { ChatBubbleLeftEllipsisIcon, PhoneIcon } from "@heroicons/react/24/solid";

import type { Order } from "@/features/order/order.types";
import { formatCurrency, formatDateTime } from "@/lib/helpers";

type RiderInfoProps = {
  order: Order;
};

export default function RiderInfo({ order }: RiderInfoProps) {
  return (
    <div className="surface-card rounded-[2rem] p-5 sm:p-6">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-white/34">
        Order details
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="signal-tile rounded-[1.3rem] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-white/34">
            Order created
          </p>
          <p className="mt-3 text-sm font-medium text-white">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="signal-tile rounded-[1.3rem] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-white/34">
            Payment
          </p>
          <p className="mt-3 text-sm font-medium text-white">
            {order.payment?.method ?? "Pending"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-white/34">
          Delivery address
        </p>
        <p className="mt-3 text-sm leading-7 text-white/72">{order.address}</p>
      </div>

      <div className="mt-4 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.24em] text-white/34">
            Your order
          </p>
          <p className="text-sm font-semibold text-orange-300">
            {formatCurrency(order.totalPrice)}
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div
              className="flex items-center justify-between gap-3 text-sm"
              key={item.id}
            >
              <div>
                <p className="font-medium text-white">{item.food.name}</p>
                <p className="mt-1 text-xs text-white/40">Qty {item.quantity}</p>
              </div>
              <p className="text-white/72">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <Link
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[1rem] bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-[#ff812d]"
          href="/protected/order"
        >
          <PhoneIcon className="h-4 w-4" />
          Call rider
        </Link>
        <button
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white/78 transition hover:border-orange-400/24 hover:text-white"
          type="button"
        >
          <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-orange-400" />
          Support
        </button>
      </div>
    </div>
  );
}
