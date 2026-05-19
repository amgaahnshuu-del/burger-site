"use client";

import { useEffect, useSyncExternalStore } from "react";

import { getFoods } from "@/features/food/food.service";
import type { Food } from "@/features/food/food.types";
import { getErrorMessage } from "@/lib/helpers";

type FoodCatalogSnapshot = {
  error: string | null;
  foods: Food[];
  hasLoaded: boolean;
  isLoading: boolean;
};

const INITIAL_FOOD_CATALOG_SNAPSHOT: FoodCatalogSnapshot = {
  error: null,
  foods: [],
  hasLoaded: false,
  isLoading: true,
};

let foodCatalogSnapshot = INITIAL_FOOD_CATALOG_SNAPSHOT;
let foodCatalogRequest: Promise<void> | null = null;
const foodCatalogListeners = new Set<() => void>();

function emitFoodCatalogChange() {
  foodCatalogListeners.forEach((listener) => listener());
}

function setFoodCatalogSnapshot(snapshot: FoodCatalogSnapshot) {
  foodCatalogSnapshot = snapshot;
  emitFoodCatalogChange();
}

function updateFoodCatalogSnapshot(partial: Partial<FoodCatalogSnapshot>) {
  setFoodCatalogSnapshot({
    ...foodCatalogSnapshot,
    ...partial,
  });
}

function subscribe(listener: () => void) {
  foodCatalogListeners.add(listener);

  return () => {
    foodCatalogListeners.delete(listener);
  };
}

function getSnapshot() {
  return foodCatalogSnapshot;
}

async function syncFoodCatalog(options: { force?: boolean } = {}) {
  if (foodCatalogRequest) {
    return foodCatalogRequest;
  }

  if (!options.force && foodCatalogSnapshot.hasLoaded) {
    return;
  }

  const previousFoods = foodCatalogSnapshot.foods;

  updateFoodCatalogSnapshot({
    error: null,
    isLoading: true,
  });

  foodCatalogRequest = (async () => {
    try {
      const nextFoods = await getFoods();

      setFoodCatalogSnapshot({
        error: null,
        foods: nextFoods,
        hasLoaded: true,
        isLoading: false,
      });
    } catch (catalogError) {
      setFoodCatalogSnapshot({
        error: getErrorMessage(catalogError),
        foods: previousFoods,
        hasLoaded: true,
        isLoading: false,
      });
    } finally {
      foodCatalogRequest = null;
    }
  })();

  return foodCatalogRequest;
}

export function useFoodCatalog() {
  const { error, foods, isLoading } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot
  );

  useEffect(() => {
    if (!foodCatalogSnapshot.hasLoaded) {
      void syncFoodCatalog();
    }
  }, []);

  return {
    error,
    foods,
    isLoading,
    refresh: () => syncFoodCatalog({ force: true }),
  };
}
