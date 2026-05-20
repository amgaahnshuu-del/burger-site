import type { CourierDashboardData } from "@/features/courier/courier.types";
import type { Order } from "@/features/order/order.types";
import { fetchJson } from "@/lib/fetcher";

export function getCourierOrders() {
  return fetchJson<CourierDashboardData>("/api/courier/orders");
}

export function claimCourierOrder(orderId: string) {
  return fetchJson<Order>(`/api/courier/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({
      action: "claim",
    }),
  });
}

export function completeCourierOrder(orderId: string) {
  return fetchJson<Order>(`/api/courier/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({
      action: "complete",
    }),
  });
}

export function updateCourierLocation(
  orderId: string,
  latitude: number,
  longitude: number
) {
  return fetchJson<Order>(`/api/courier/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({
      latitude,
      longitude,
    }),
  });
}
