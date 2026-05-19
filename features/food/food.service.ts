import type { Food, Restaurant } from "@/features/food/food.types";
import { fetchJson } from "@/lib/fetcher";

export function getFoods() {
  return fetchJson<Food[]>("/api/food");
}

export function getRestaurants() {
  return fetchJson<Restaurant[]>("/api/restaurant");
}
