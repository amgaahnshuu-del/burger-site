import type { ManagerDashboardData } from "@/features/manager/manager.types";
import type { Order } from "@/features/order/order.types";
import { fetchJson } from "@/lib/fetcher";

export function getManagerOrders() {
  return fetchJson<ManagerDashboardData>("/api/manager/orders");
}

export function startManagerOrder(orderId: string) {
  return fetchJson<Order>(`/api/manager/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({
      action: "start-cooking",
    }),
  });
}

export function sendManagerOrderToCourier(orderId: string) {
  return fetchJson<Order>(`/api/manager/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({
      action: "send-to-courier",
    }),
  });
}
