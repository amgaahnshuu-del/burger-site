import type { CreateOrderInput, Order } from "@/features/order/order.types";
import { fetchJson } from "@/lib/fetcher";

export function getOrders() {
  return fetchJson<Order[]>("/api/order");
}

export function getOrder(orderId: string) {
  return fetchJson<Order>(`/api/order/${orderId}`);
}

export function createOrder(payload: CreateOrderInput) {
  return fetchJson<Order>("/api/order", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function cancelOrder(orderId: string, reason?: string) {
  return fetchJson<Order>(`/api/order/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({
      action: "cancel",
      reason,
    }),
  });
}
