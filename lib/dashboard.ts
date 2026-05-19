import type { Food } from "@/features/food/food.types";
import type { Order, OrderStatus, TrackingStatus } from "@/features/order/order.types";

const PRODUCT_METRICS: Record<string, { rating: string; reviews: number }> = {
  "Classic Cheese Burger": { rating: "4.9", reviews: 120 },
  "Spicy Chicken Burger": { rating: "4.8", reviews: 98 },
  "Bacon Deluxe Burger": { rating: "4.9", reviews: 87 },
  "Double Beef Burger": { rating: "4.9", reviews: 150 },
  "French Fries": { rating: "4.9", reviews: 85 },
  "Coca Cola": { rating: "4.9", reviews: 210 },
};

export function getFoodRating(food: Pick<Food, "name" | "price">) {
  if (PRODUCT_METRICS[food.name]) {
    return PRODUCT_METRICS[food.name].rating;
  }

  const seed = food.name.length + food.price;
  return (4.5 + ((seed % 5) * 0.1)).toFixed(1);
}

export function getFoodReviewCount(food: Pick<Food, "name" | "price">) {
  if (PRODUCT_METRICS[food.name]) {
    return PRODUCT_METRICS[food.name].reviews;
  }

  return 72 + ((food.name.length * 11 + food.price) % 160);
}

export function getOrderBucket(status: OrderStatus) {
  if (status === "DELIVERED") {
    return "completed";
  }

  if (status === "CANCELLED") {
    return "cancelled";
  }

  return "ongoing";
}

export function isOrderTrackable(order: Order | null) {
  if (!order) {
    return false;
  }

  if (order.status === "DELIVERED" || order.status === "CANCELLED") {
    return false;
  }

  if (order.tracking?.status === "DELIVERED") {
    return false;
  }

  return true;
}

export function resolveTrackingStep(order: Order | null) {
  if (!order) {
    return 0;
  }

  const status = order.status;
  const tracking = order.tracking?.status;

  if (status === "DELIVERED" || tracking === "DELIVERED") {
    return 3;
  }

  if (status === "DELIVERING" || tracking === "ON_THE_WAY") {
    return 2;
  }

  if (status === "COOKING" || status === "CONFIRMED" || tracking === "PREPARING") {
    return 1;
  }

  return 0;
}

export function getTrackingStatusLabel(step: TrackingStatus | "PLACED") {
  const map: Record<TrackingStatus | "PLACED", string> = {
    PLACED: "Order Placed",
    PREPARING: "Preparing",
    ON_THE_WAY: "On the Way",
    DELIVERED: "Delivered",
  };

  return map[step];
}
