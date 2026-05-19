import type { Food } from "@/features/food/food.types";

export type CartItem = {
  id: string;
  cartId: string;
  foodId: string;
  quantity: number;
  food: Food;
};

export type Cart = {
  id: string;
  userId: string;
  createdAt: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
};

export type CartMeta = Pick<Cart, "id" | "userId" | "createdAt">;

export type CartMutation =
  | {
      kind: "upsert-item";
      cart: CartMeta;
      item: CartItem;
    }
  | {
      kind: "remove-item";
      cartId: string;
      foodId: string;
    }
  | {
      kind: "clear-cart";
      cartId: string;
    };
