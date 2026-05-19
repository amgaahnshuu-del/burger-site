import type { AuthUser } from "@/features/auth/auth.types";
import type { Order } from "@/features/order/order.types";

export type ManagerDashboardData = {
  deliveredToday: number;
  deliveringOrders: Order[];
  incomingOrders: Order[];
  manager: AuthUser;
  preparingOrders: Order[];
  readyOrders: Order[];
};
