"use client";

import { useEffect, useState } from "react";

const FAVORITES_STORAGE_KEY = "burgernaut:favorite-food-ids";
const FAVORITES_UPDATED_EVENT = "burgernaut:favorites-updated";

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeFavoriteIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    )
  );
}

export function loadFavoriteFoodIds() {
  if (!canUseBrowserStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    return normalizeFavoriteIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

function saveFavoriteFoodIds(value: string[]) {
  if (!canUseBrowserStorage()) {
    return;
  }

  const normalized = normalizeFavoriteIds(value);

  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(
      new CustomEvent<string[]>(FAVORITES_UPDATED_EVENT, {
        detail: normalized,
      })
    );
  } catch {
    // Ignore storage write failures so the app remains usable.
  }
}

export function useFavoriteFoods() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    if (!canUseBrowserStorage()) {
      return;
    }

    const syncFavorites = () => {
      setFavoriteIds(loadFavoriteFoodIds());
    };

    const handleFavoritesUpdated = (event: Event) => {
      const detail = (event as CustomEvent<string[]>).detail;
      setFavoriteIds(normalizeFavoriteIds(detail));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === FAVORITES_STORAGE_KEY) {
        syncFavorites();
      }
    };

    syncFavorites();
    window.addEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesUpdated as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesUpdated as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function toggleFavorite(foodId: string) {
    setFavoriteIds((current) => {
      const next = current.includes(foodId)
        ? current.filter((id) => id !== foodId)
        : [...current, foodId];

      saveFavoriteFoodIds(next);

      return next;
    });
  }

  return {
    favoriteIds,
    isFavorite: (foodId: string) => favoriteIds.includes(foodId),
    toggleFavorite,
  };
}
