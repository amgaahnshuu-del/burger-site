import type {
  AdminDashboardData,
  AdminFood,
  AdminFoodInput,
  AdminManagedUserInput,
  AdminFoodUpdateInput,
} from "@/features/admin/admin.types";
import { fetchJson } from "@/lib/fetcher";

export type AdminDashboardScope =
  | "full"
  | "sales"
  | "users"
  | "couriers"
  | "managers";

export function getAdminDashboard(scope: AdminDashboardScope = "full") {
  const searchParams = new URLSearchParams();

  if (scope !== "full") {
    searchParams.set("scope", scope);
  }

  const query = searchParams.toString();
  return fetchJson<AdminDashboardData>(
    query ? `/api/admin/dashboard?${query}` : "/api/admin/dashboard"
  );
}

export function getAdminFoods() {
  return fetchJson<AdminFood[]>("/api/admin/foods");
}

export function createAdminFood(payload: AdminFoodInput) {
  return fetchJson<AdminFood>("/api/admin/foods", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminFood(foodId: string, payload: AdminFoodUpdateInput) {
  return fetchJson<AdminFood>(`/api/admin/foods/${foodId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function removeAdminFood(foodId: string) {
  return fetchJson<{ message: string }>(`/api/admin/foods/${foodId}`, {
    method: "DELETE",
  });
}

export function createAdminManagedUser(payload: AdminManagedUserInput) {
  return fetchJson<{ id: string; message?: string }>(`/api/admin/users`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function removeAdminManagedUser(userId: string) {
  return fetchJson<{ message: string }>(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });
}
