const FOOD_IMAGE_OVERRIDES = {
  "/home-crops/burger1.png": "/home-crops/burger1-clean-v2.png",
  "/home-crops/burger1-clean.png": "/home-crops/burger1-clean-v2.png",
  "/home-crops/burger2.png": "/home-crops/burger2-clean-v2.png",
  "/home-crops/burger2-clean.png": "/home-crops/burger2-clean-v2.png",
  "/home-crops/burger3.png": "/home-crops/burger3-clean-v2.png",
  "/home-crops/burger3-clean.png": "/home-crops/burger3-clean-v2.png",
  "/home-crops/cola.png": "/home-crops/cola-clean-v2.png",
  "/home-crops/cola-clean.png": "/home-crops/cola-clean-v2.png",
  "/home-crops/combo.png": "/home-crops/combo-clean-v2.png",
  "/home-crops/combo-clean.png": "/home-crops/combo-clean-v2.png",
  "/home-crops/fries.png": "/home-crops/fries-clean-v2.png",
  "/home-crops/fries-clean.png": "/home-crops/fries-clean-v2.png",
  "/home-crops/nuggets.png": "/home-crops/nuggets-clean-v2.png",
  "/home-crops/nuggets-clean.png": "/home-crops/nuggets-clean-v2.png",
} as const;

type FoodImageRecord = {
  image: string | null;
};

type NestedFoodImageRecord = {
  items: Array<{
    foodCategory?: string | null;
    foodId?: string | null;
    foodImage?: string | null;
    foodName?: string | null;
    food: FoodImageRecord | null;
    id?: string;
    price?: number;
  }>;
};

export function resolveFoodImage(image: string | null | undefined) {
  if (typeof image !== "string") {
    return image ?? "";
  }

  return FOOD_IMAGE_OVERRIDES[image as keyof typeof FOOD_IMAGE_OVERRIDES] ?? image;
}

export function withResolvedFoodImage<T extends FoodImageRecord>(record: T): T {
  return {
    ...record,
    image: resolveFoodImage(record.image),
  };
}

export function withResolvedFoodImages<T extends FoodImageRecord>(records: T[]) {
  return records.map((record) => withResolvedFoodImage(record));
}

export function withResolvedNestedFoodImages<T extends NestedFoodImageRecord>(record: T): T {
  return {
    ...record,
    items: record.items.map((item) => {
      if (item.food) {
        return {
          ...item,
          food: withResolvedFoodImage(item.food),
        };
      }

      return {
        ...item,
        food: {
          category: item.foodCategory ?? "Uncategorized",
          createdAt: "",
          description: null,
          id: item.foodId ?? item.id ?? "deleted-food",
          image: resolveFoodImage(item.foodImage),
          isAvailable: false,
          name: item.foodName ?? "Deleted food",
          price: typeof item.price === "number" ? item.price : 0,
          restaurantId: null,
        },
      };
    }),
  };
}

export function withResolvedNestedFoodImagesList<T extends NestedFoodImageRecord>(records: T[]) {
  return records.map((record) => withResolvedNestedFoodImages(record));
}
