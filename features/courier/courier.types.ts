import type { AuthUser } from "@/features/auth/auth.types";
import type { Order } from "@/features/order/order.types";

export type CourierDashboardData = {
  activeOrders: Order[];
  availableOrders: Order[];
  completedToday: number;
  courier: AuthUser;
};
