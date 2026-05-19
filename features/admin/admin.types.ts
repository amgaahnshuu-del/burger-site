import type { AuthUser } from "@/features/auth/auth.types";
import type { Food } from "@/features/food/food.types";
import type { FeedbackEntry } from "@/features/feedback/feedback.types";

export type AdminDashboardStats = {
  activeFoods: number;
  openFeedback: number;
  totalFeedback: number;
  totalFoods: number;
  totalOrders: number;
  totalUnitsSold: number;
};

export type TopSellingFood = {
  category: string;
  foodId: string;
  image: string;
  isAvailable: boolean;
  name: string;
  totalRevenue: number;
  totalUnits: number;
};

export type AdminDashboardUser = {
  createdAt: string;
  deliveryCount: number;
  email: string;
  feedbackCount: number;
  id: string;
  name: string;
  orderCount: number;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN" | "MANAGER" | "COURIER";
};

export type AdminDashboardData = {
  feedbacks: FeedbackEntry[];
  stats: AdminDashboardStats;
  topFoods: TopSellingFood[];
  users: AdminDashboardUser[];
};

export type AdminManagedUserRole = "CUSTOMER" | "MANAGER" | "COURIER";

export type AdminManagedUserInput = {
  email: string;
  name: string;
  password: string;
  phone: string | null;
  role: AdminManagedUserRole;
};

export type AdminFoodInput = {
  category: string;
  description: string;
  image: string;
  name: string;
  price: number;
  restaurantId: string | null;
};

export type AdminFoodUpdateInput = Partial<AdminFoodInput> & {
  isAvailable?: boolean;
};

export type AdminUser = AuthUser;
export type AdminFood = Food;
