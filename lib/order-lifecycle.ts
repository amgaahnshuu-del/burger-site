export const SUPPORTED_PAYMENT_METHODS = ["CASH", "CARD", "QPAY"] as const;
export const SUPPORTED_PAYMENT_WEBHOOK_EVENTS = [
  "payment.succeeded",
  "payment.failed",
  "payment.refunded",
] as const;

export type SupportedPaymentMethod = (typeof SUPPORTED_PAYMENT_METHODS)[number];
export type OrderLifecycleStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COOKING"
  | "DELIVERING"
  | "DELIVERED"
  | "CANCELLED";
export type PaymentLifecycleStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentWebhookEvent = (typeof SUPPORTED_PAYMENT_WEBHOOK_EVENTS)[number];

const CURRENT_LOCATION_PATTERN = /^Current location \((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)$/;

export function isSupportedPaymentMethod(value: unknown): value is SupportedPaymentMethod {
  return SUPPORTED_PAYMENT_METHODS.includes(value as SupportedPaymentMethod);
}

export function isSupportedPaymentWebhookEvent(value: unknown): value is PaymentWebhookEvent {
  return SUPPORTED_PAYMENT_WEBHOOK_EVENTS.includes(value as PaymentWebhookEvent);
}

export function createPaymentReference(orderId: string, method: SupportedPaymentMethod) {
  return `BGR-${method}-${orderId.slice(0, 8).toUpperCase()}`;
}

export function extractCoordinatesFromAddress(address: string) {
  const match = CURRENT_LOCATION_PATTERN.exec(address.trim());

  if (!match) {
    return null;
  }

  const latitude = Number.parseFloat(match[1]);
  const longitude = Number.parseFloat(match[2]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

export function canCustomerCancelOrder(
  orderStatus: OrderLifecycleStatus,
  paymentStatus: PaymentLifecycleStatus
) {
  if (orderStatus === "DELIVERING" || orderStatus === "DELIVERED" || orderStatus === "CANCELLED") {
    return false;
  }

  if (paymentStatus === "FAILED" || paymentStatus === "REFUNDED") {
    return true;
  }

  return true;
}

export function getCustomerCancellationMessage(
  orderStatus: OrderLifecycleStatus,
  paymentStatus: PaymentLifecycleStatus
) {
  if (canCustomerCancelOrder(orderStatus, paymentStatus)) {
    return null;
  }

  if (orderStatus === "DELIVERING") {
    return "This order is already with a courier and can no longer be cancelled online.";
  }

  if (orderStatus === "DELIVERED") {
    return "Delivered orders cannot be cancelled.";
  }

  if (orderStatus === "CANCELLED") {
    return "This order has already been cancelled.";
  }

  return "This order cannot be cancelled right now.";
}

export function getPaymentStatusLabel(status: PaymentLifecycleStatus) {
  switch (status) {
    case "FAILED":
      return "Failed";
    case "PAID":
      return "Paid";
    case "REFUNDED":
      return "Refunded";
    default:
      return "Pending";
  }
}

export function resolvePaymentWebhookStatus(
  currentStatus: PaymentLifecycleStatus,
  event: PaymentWebhookEvent
) {
  if (event === "payment.succeeded") {
    if (currentStatus === "REFUNDED") {
      return null;
    }

    return {
      cancelOrder: false,
      nextStatus: "PAID" as const,
    };
  }

  if (event === "payment.failed") {
    if (currentStatus === "REFUNDED") {
      return null;
    }

    return {
      cancelOrder: true,
      nextStatus: "FAILED" as const,
    };
  }

  return {
    cancelOrder: true,
    nextStatus: "REFUNDED" as const,
  };
}
