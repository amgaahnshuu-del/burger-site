import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  TRACKING_STATUS_LABELS,
} from "@/lib/constants";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)}\u20ae`;
}

export function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("mn-MN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDashboardDateTime(value: Date | string) {
  const date = new Date(value);
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return formatter.format(date).replace(" ", " ");
}

export function dispatchAppEvent(name: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(name));
  }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function getOrderStatusLabel(status: keyof typeof ORDER_STATUS_LABELS) {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function getTrackingStatusLabel(
  status: keyof typeof TRACKING_STATUS_LABELS
) {
  return TRACKING_STATUS_LABELS[status] ?? status;
}

export function getPaymentStatusLabel(
  status: keyof typeof PAYMENT_STATUS_LABELS
) {
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

export function getRelativeOrderTime(createdAt: string) {
  const orderDate = new Date(createdAt).getTime();
  const diffMinutes = Math.max(
    0,
    Math.round((Date.now() - orderDate) / (1000 * 60))
  );

  if (diffMinutes < 1) {
    return "just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  return `${diffHours} hr ago`;
}
