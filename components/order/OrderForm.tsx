"use client";

import Button from "@/components/ui/Button";
import DeliveryAddress from "@/components/order/DeliveryAddress";
import PaymentMethod from "@/components/order/PaymentMethod";
import Input from "@/components/ui/Input";
import Toast from "@/components/ui/Toast";
import type { CartItem } from "@/features/cart/cart.types";
import type {
  DeliveryLocationInput,
  PaymentMethod as PaymentMethodValue,
} from "@/features/order/order.types";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import { formatCurrency } from "@/lib/helpers";

type OrderFormProps = {
  contactPhone: string;
  contactPhoneError?: string;
  deliveryLocation: DeliveryLocationInput;
  deliveryLocationError?: string;
  error?: string | null;
  isSubmitting: boolean;
  items: CartItem[];
  onContactPhoneChange: (value: string) => void;
  onDeliveryLocationChange: (value: DeliveryLocationInput) => void;
  onPaymentMethodChange: (value: PaymentMethodValue) => void;
  onSubmit: () => void;
  paymentMethod: PaymentMethodValue;
  subtotal: number;
};

export default function OrderForm({
  contactPhone,
  contactPhoneError,
  deliveryLocation,
  deliveryLocationError,
  error,
  isSubmitting,
  items,
  onContactPhoneChange,
  onDeliveryLocationChange,
  onPaymentMethodChange,
  onSubmit,
  paymentMethod,
  subtotal,
}: OrderFormProps) {
  const { t } = useAppLanguage();
  const deliveryFee = 3000;
  const total = subtotal + deliveryFee;
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <section className="mx-auto w-full max-w-[1180px]">
      <div className="overflow-hidden rounded-[2.25rem] border border-orange-500/18 bg-[linear-gradient(180deg,rgba(18,18,19,0.96)_0%,rgba(9,9,10,0.99)_100%)] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.38)] sm:p-7">
        <div className="relative overflow-hidden rounded-[1.9rem] border border-white/8 bg-[linear-gradient(135deg,rgba(255,106,0,0.1)_0%,rgba(255,106,0,0.03)_28%,rgba(255,255,255,0.02)_100%)] px-5 py-5 sm:px-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,106,0,0.22)_0%,rgba(255,106,0,0.04)_60%,transparent_74%)] blur-2xl" />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-orange-400/90">
                {t({ en: "Live checkout", mn: "Шууд захиалга" })}
              </p>
              <h2 className="mt-3 text-[2rem] font-black tracking-[-0.04em] text-white sm:text-[2.45rem]">
                {t({
                  en: "Review delivery details and place your order",
                  mn: "Хүргэлтийн мэдээллээ шалгаад захиалгаа илгээнэ үү",
                })}
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/58">
                {t({
                  en: "Pick the drop-off point, confirm your phone number, and send the order into the delivery flow without leaving this page.",
                  mn: "Хүргүүлэх хаягаа сонгож, утасны дугаараа баталгаажаад энэ хуудаснаас шууд захиалгаа явуулна уу.",
                })}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[24rem]">
              <div className="rounded-[1.25rem] border border-white/8 bg-black/20 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
                  {t({ en: "Basket", mn: "Сагс" })}
                </p>
                <p className="mt-3 text-2xl font-black text-white">{itemCount}</p>
                <p className="mt-1 text-sm text-white/48">
                  {itemCount === 1
                    ? t({ en: "item ready", mn: "1 бүтээгдэхүүн" })
                    : t({ en: "items ready", mn: `${itemCount} бүтээгдэхүүн` })}
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-white/8 bg-black/20 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
                  {t({ en: "Subtotal", mn: "Дүн" })}
                </p>
                <p className="mt-3 text-2xl font-black text-white">
                  {formatCurrency(subtotal)}
                </p>
                <p className="mt-1 text-sm text-white/48">
                  {t({ en: "Food total", mn: "Хоолны дүн" })}
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-orange-400/18 bg-orange-500/10 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-200/70">
                  {t({ en: "Total", mn: "Нийт" })}
                </p>
                <p className="mt-3 text-2xl font-black text-white">
                  {formatCurrency(total)}
                </p>
                <p className="mt-1 text-sm text-white/56">
                  {t({ en: "Includes delivery", mn: "Хүргэлт багтсан" })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <Input
            autoComplete="tel"
            error={contactPhoneError}
            hint={t({
              en: "Courier will use this number for handoff or route questions.",
              mn: "Хүргэгч энэ дугаараар холбогдож хүлээлгэн өгөх эсвэл маршрут асуух болно.",
            })}
            label={t({ en: "Contact phone", mn: "Холбоо барих утас" })}
            onChange={(event) => onContactPhoneChange(event.target.value)}
            placeholder="+976 9911 2233"
            type="tel"
            value={contactPhone}
          />
          <DeliveryAddress
            error={deliveryLocationError}
            onChange={onDeliveryLocationChange}
            value={deliveryLocation}
          />
          <PaymentMethod
            onChange={onPaymentMethodChange}
            value={paymentMethod}
          />
          <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
                  {t({ en: "Basket summary", mn: "Сагсны тойм" })}
                </p>
                <h3 className="mt-2 text-xl font-bold text-white">
                  {t({ en: "Your current items", mn: "Таны одоогийн бүтээгдэхүүнүүд" })}
                </h3>
              </div>
              <p className="text-sm text-white/50">
                {t({
                  en: "Review the basket here before placing the order.",
                  mn: "Захиалга илгээхээсээ өмнө сагсаа эндээс шалгана уу.",
                })}
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-[1.15rem] border border-white/8 bg-black/20 px-4 py-3"
                  key={item.id}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {item.food.name}
                    </p>
                    <p className="mt-1 text-xs text-white/45">
                      {t({ en: "Qty", mn: "Тоо" })} {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-white/82">
                    {formatCurrency(item.food.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-orange-500/16 bg-[linear-gradient(180deg,rgba(255,106,0,0.08)_0%,rgba(255,106,0,0.03)_100%)] p-4">
              <div className="flex items-center justify-between text-sm text-white/62">
                <span>{t({ en: "Subtotal", mn: "Дүн" })}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-white/62">
                <span>{t({ en: "Delivery fee", mn: "Хүргэлтийн төлбөр" })}</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4 text-base font-semibold text-white">
                <span>{t({ en: "Total", mn: "Нийт" })}</span>
                <span className="text-orange-300">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
          {error ? <Toast message={error} tone="error" /> : null}
          <Button
            className="w-full"
            fullWidth
            isLoading={isSubmitting}
            onClick={onSubmit}
            size="lg"
          >
            {t({ en: "Place order", mn: "Захиалга илгээх" })} · {formatCurrency(total)}
          </Button>
        </div>
      </div>
    </section>
  );
}
