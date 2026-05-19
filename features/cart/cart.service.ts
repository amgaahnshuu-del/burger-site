import type { Cart, CartMutation } from "@/features/cart/cart.types";
import { fetchJson } from "@/lib/fetcher";

export function getCart() {
  return fetchJson<Cart>("/api/cart");
}

export function addToCart(foodId: string, quantity = 1) {
  return fetchJson<CartMutation>("/api/cart", {
    method: "POST",
    body: JSON.stringify({ foodId, quantity }),
  });
}

export function updateCartItem(foodId: string, quantity: number) {
  return fetchJson<CartMutation>("/api/cart", {
    method: "PUT",
    body: JSON.stringify({ foodId, quantity }),
  });
}

export function removeCartItem(foodId: string) {
  return fetchJson<CartMutation>("/api/cart", {
    method: "DELETE",
    body: JSON.stringify({ foodId }),
  });
}

export function clearCart() {
  return fetchJson<CartMutation>("/api/cart", {
    method: "DELETE",
  });
}
