"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/features/cart/cart.service";
import type { Cart, CartItem, CartMeta, CartMutation } from "@/features/cart/cart.types";
import { CART_UPDATED_EVENT } from "@/lib/constants";
import { ApiError } from "@/lib/fetcher";
import { getErrorMessage } from "@/lib/helpers";

type CartSnapshot = {
  cart: Cart | null;
  error: string | null;
  hasLoaded: boolean;
  isLoading: boolean;
  isMutating: boolean;
};

const INITIAL_CART_SNAPSHOT: CartSnapshot = {
  cart: null,
  error: null,
  hasLoaded: false,
  isLoading: true,
  isMutating: false,
};
const DISABLED_CART_SNAPSHOT: CartSnapshot = {
  ...INITIAL_CART_SNAPSHOT,
  isLoading: false,
};

let cartSnapshot = INITIAL_CART_SNAPSHOT;
let cartRequest: Promise<void> | null = null;
const cartListeners = new Set<() => void>();

function emitCartChange() {
  cartListeners.forEach((listener) => listener());
}

function setCartSnapshot(snapshot: CartSnapshot) {
  cartSnapshot = snapshot;
  emitCartChange();
}

function updateCartSnapshot(partial: Partial<CartSnapshot>) {
  setCartSnapshot({
    ...cartSnapshot,
    ...partial,
  });
}

function subscribe(listener: () => void) {
  cartListeners.add(listener);

  return () => {
    cartListeners.delete(listener);
  };
}

function getSnapshot() {
  return cartSnapshot;
}

function buildCart(cart: CartMeta, items: CartItem[]): Cart {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.food.price,
    0
  );

  return {
    ...cart,
    items,
    totalItems,
    subtotal,
  };
}

function applyCartMutation(cart: Cart | null, mutation: CartMutation) {
  if (!cart) {
    return null;
  }

  if (mutation.kind === "upsert-item") {
    if (cart.id !== mutation.cart.id) {
      return null;
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.foodId === mutation.item.foodId
    );
    const nextItems =
      existingItemIndex === -1
        ? [...cart.items, mutation.item]
        : cart.items.map((item, index) =>
            index === existingItemIndex ? mutation.item : item
          );

    return buildCart(mutation.cart, nextItems);
  }

  if (cart.id !== mutation.cartId) {
    return null;
  }

  if (mutation.kind === "remove-item") {
    return buildCart(
      {
        createdAt: cart.createdAt,
        id: cart.id,
        userId: cart.userId,
      },
      cart.items.filter((item) => item.foodId !== mutation.foodId)
    );
  }

  return buildCart(
    {
      createdAt: cart.createdAt,
      id: cart.id,
      userId: cart.userId,
    },
    []
  );
}

async function syncCart(options: { force?: boolean } = {}) {
  if (cartRequest) {
    return cartRequest;
  }

  if (!options.force && cartSnapshot.hasLoaded) {
    return;
  }

  const previousCart = cartSnapshot.cart;

  updateCartSnapshot({
    error: null,
    isLoading: true,
  });

  cartRequest = (async () => {
    try {
      const nextCart = await getCart();

      updateCartSnapshot({
        cart: nextCart,
        error: null,
        hasLoaded: true,
        isLoading: false,
      });
    } catch (cartError) {
      if (cartError instanceof ApiError && cartError.status === 401) {
        updateCartSnapshot({
          cart: null,
          error: null,
          hasLoaded: true,
          isLoading: false,
        });
      } else {
        updateCartSnapshot({
          cart: previousCart,
          error: getErrorMessage(cartError),
          hasLoaded: true,
          isLoading: false,
        });
      }
    } finally {
      cartRequest = null;
    }
  })();

  return cartRequest;
}

async function runCartMutation(action: () => Promise<CartMutation>) {
  updateCartSnapshot({
    error: null,
    isMutating: true,
  });

  try {
    const mutation = await action();
    const nextCart =
      cartSnapshot.hasLoaded && cartSnapshot.cart
        ? applyCartMutation(cartSnapshot.cart, mutation)
        : null;

    if (nextCart) {
      updateCartSnapshot({
        cart: nextCart,
        error: null,
        hasLoaded: true,
        isLoading: false,
        isMutating: false,
      });

      return nextCart;
    }

    const freshCart = await getCart();

    updateCartSnapshot({
      cart: freshCart,
      error: null,
      hasLoaded: true,
      isLoading: false,
      isMutating: false,
    });

    return freshCart;
  } catch (cartError) {
    if (cartError instanceof ApiError && cartError.status === 401) {
      updateCartSnapshot({
        cart: null,
        error: null,
        hasLoaded: true,
        isLoading: false,
        isMutating: false,
      });
    } else {
      updateCartSnapshot({
        error: getErrorMessage(cartError),
        isMutating: false,
      });
    }

    throw cartError;
  }
}

export function useCart(enabled = true) {
  const { cart, error, isLoading, isMutating } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot
  );

  useEffect(() => {
    if (!enabled) {
      if (
        cartSnapshot.cart !== null
        || cartSnapshot.error !== null
        || cartSnapshot.hasLoaded
        || cartSnapshot.isLoading
        || cartSnapshot.isMutating
      ) {
        setCartSnapshot(DISABLED_CART_SNAPSHOT);
      }
      return;
    }

    if (!cartSnapshot.hasLoaded) {
      void syncCart();
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleCartChange = () => {
      void syncCart({ force: true });
    };

    window.addEventListener(CART_UPDATED_EVENT, handleCartChange);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, handleCartChange);
    };
  }, [enabled]);

  const effectiveIsLoading = enabled
    ? !cartSnapshot.hasLoaded || isLoading
    : false;

  return {
    addItem: (foodId: string, quantity = 1) =>
      runCartMutation(() => addToCart(foodId, quantity)),
    cart: enabled ? cart : null,
    clear: () => runCartMutation(() => clearCart()),
    error: enabled ? error : null,
    isLoading: effectiveIsLoading,
    isMutating: enabled ? isMutating : false,
    refresh: () => (enabled ? syncCart({ force: true }) : Promise.resolve()),
    removeItem: (foodId: string) =>
      runCartMutation(() => removeCartItem(foodId)),
    updateItem: (foodId: string, quantity: number) =>
      runCartMutation(() => updateCartItem(foodId, quantity)),
  };
}
