import type { PaymentMethod, TrackingStatus } from "@/features/order/order.types";

export const APP_NAME = "Burger";

export const NAV_LINKS = [
  { href: "/", label: "Нүүр" },
  { href: "/public/explore", label: "Цэс" },
  { href: "/auth/register", label: "AI" },
  { href: "/protected/order", label: "Хүргэлт" },
] as const;

export const AUTH_UPDATED_EVENT = "burgernaut:auth-updated";
export const CART_UPDATED_EVENT = "burgernaut:cart-updated";

export const HERO_STATS = [
  { label: "Delivery radius", value: "8 km" },
  { label: "Average dispatch", value: "30 min" },
  { label: "Rating", value: "4.9 / 5" },
] as const;

export const FEATURE_PILLS = [
  "Editorial delivery cards",
  "Session-aware checkout",
  "Courier telemetry tracking",
  "Built-in umami assistant",
] as const;

export const HOME_SIGNAL_TILES = [
  {
    src: "/img1.png",
    title: "Fractal discovery",
    detail: "Menu signals online",
  },
  {
    src: "/img2.png",
    title: "Thermal staging",
    detail: "Heat locked service",
  },
  {
    src: "/img3.png",
    title: "Courier telemetry",
    detail: "Track every pulse",
  },
  {
    src: "/img4.png",
    title: "Secure tender",
    detail: "QPay wallet ready",
  },
] as const;

export const PAYMENT_METHOD_OPTIONS: Array<{
  value: PaymentMethod;
  label: string;
  description: string;
}> = [
  {
    value: "CARD",
    label: "Card",
    description: "Use a bank card and wait for provider confirmation.",
  },
  {
    value: "CASH",
    label: "Cash on delivery",
    description: "Pay the courier when the order arrives at your door.",
  },
  {
    value: "QPAY",
    label: "QPay",
    description: "5005413360 данс руу шилжүүлээд, гүйлгээний утган дээр утасны дугаараа бичнэ үү.",
  },
];

export const TRACKING_STEPS: TrackingStatus[] = [
  "PREPARING",
  "ON_THE_WAY",
  "DELIVERED",
];

export const TRACKING_STATUS_LABELS: Record<TrackingStatus, string> = {
  PREPARING: "Preparing",
  ON_THE_WAY: "On the way",
  DELIVERED: "Delivered",
};

export const ORDER_STATUS_LABELS = {
  PENDING: "Pending",
  CONFIRMED: "Ready for courier",
  COOKING: "Cooking",
  DELIVERING: "Delivering",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
} as const;

export const PAYMENT_STATUS_LABELS = {
  FAILED: "Failed",
  PAID: "Paid",
  PENDING: "Pending",
  REFUNDED: "Refunded",
} as const;
