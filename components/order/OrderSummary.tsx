import Image from "next/image";

import type { CartItem } from "@/features/cart/cart.types";
import { formatCurrency } from "@/lib/helpers";

type OrderSummaryProps = {
  deliveryFee?: number;
  items: CartItem[];
  subtotal: number;
};

export default function OrderSummary({
  deliveryFee = 3000,
  items,
  subtotal,
}: OrderSummaryProps) {
  const total = subtotal + deliveryFee;

  return (
    <aside className="overflow-hidden rounded-[2.2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(17,17,18,0.96)_0%,rgba(9,9,10,0.99)_100%)] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.34)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-white/34">
            Order summary
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">
            Current basket
          </h2>
        </div>
        <div className="relative h-[4.5rem] w-[4.5rem] shrink-0">
          <Image
            alt="Combo meal"
            className="object-contain"
            fill
            loading="eager"
            sizes="72px"
            src="/home-crops/combo-clean-v2.png"
          />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <article
            className="flex items-center gap-3 rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-3"
            key={item.id}
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[1rem] bg-[radial-gradient(circle_at_center,rgba(255,106,0,0.16),transparent_58%),linear-gradient(180deg,#171717_0%,#0c0c0d_100%)]">
              <Image
                alt={item.food.name}
                className="object-contain p-2"
                fill
                sizes="64px"
                src={item.food.image}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {item.food.name}
              </p>
              <p className="mt-1 text-xs text-white/42">Qty {item.quantity}</p>
            </div>

            <p className="text-sm font-semibold text-white/80">
              {formatCurrency(item.food.price * item.quantity)}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-[1.45rem] border border-orange-500/18 bg-[linear-gradient(180deg,rgba(255,106,0,0.1)_0%,rgba(255,106,0,0.03)_100%)] p-4">
        <div className="flex items-center justify-between text-sm text-white/65">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-white/65">
          <span>Delivery fee</span>
          <span>{formatCurrency(deliveryFee)}</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4 text-lg font-semibold text-white">
          <span>Total</span>
          <span className="text-orange-300">{formatCurrency(total)}</span>
        </div>
      </div>
    </aside>
  );
}
