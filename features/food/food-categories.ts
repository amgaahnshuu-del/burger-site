import type { Food } from "@/features/food/food.types";

type FoodCategorySource = Pick<Food, "category" | "description" | "name">;

function capitalize(value: string) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function normalizeFoodCategory(category: string) {
  const normalized = category.trim().toLowerCase();

  if (!normalized) {
    return "Food";
  }

  if (normalized.includes("combo") || normalized.includes("set")) {
    return "Combo";
  }

  if (normalized.includes("burger")) {
    return "Burger";
  }

  if (normalized.includes("pizza")) {
    return "Pizza";
  }

  if (normalized.includes("chicken")) {
    return "Chicken";
  }

  if (normalized.includes("salad")) {
    return "Salad";
  }

  if (
    normalized.includes("dessert") ||
    normalized.includes("cake") ||
    normalized.includes("ice cream") ||
    normalized.includes("brownie") ||
    normalized.includes("sweet")
  ) {
    return "Dessert";
  }

  if (
    normalized.includes("drink") ||
    normalized.includes("cola") ||
    normalized.includes("soda") ||
    normalized.includes("juice")
  ) {
    return "Drink";
  }

  if (normalized.includes("sauce") || normalized.includes("dip")) {
    return "Sauce";
  }

  if (normalized.includes("fries") || normalized.includes("side")) {
    return "Sides";
  }

  return capitalize(normalized);
}

export function getFoodCategoryLabel(food: FoodCategorySource) {
  const categoryLabel = normalizeFoodCategory(food.category);

  if (categoryLabel !== "Food") {
    return categoryLabel;
  }

  const fallbackLabel = normalizeFoodCategory(
    `${food.name} ${food.description ?? ""}`
  );

  return fallbackLabel || categoryLabel;
}

export function matchesFoodCategory(
  food: FoodCategorySource,
  activeCategory: string
) {
  if (activeCategory === "All" || activeCategory === "All Food") {
    return true;
  }

  return getFoodCategoryLabel(food) === normalizeFoodCategory(activeCategory);
}
