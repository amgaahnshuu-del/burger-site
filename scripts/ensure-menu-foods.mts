import "dotenv/config";

import { prisma } from "../lib/prisma";

const TARGET_TOTAL_FOODS = 99;

const RESTAURANTS = [
  {
    id: "rest-burger-house",
    name: "Stack House Grill",
    description: "Premium burgers, crispy sides, and fast delivery combos.",
    image: "/home-crops/combo-clean-v2.png",
    address: "Peace Avenue 99",
  },
  {
    id: "rest-fire-crust",
    name: "Fire Crust Pizza",
    description: "Stone-baked pizza slices with bold sauce and melty cheese.",
    image: "/home-crops/combo-clean-v2.png",
    address: "Olympic Street 14",
  },
  {
    id: "rest-green-bowl",
    name: "Green Bowl Kitchen",
    description: "Fresh salads, light bowls, and balanced everyday bites.",
    image: "/home-crops/combo-clean-v2.png",
    address: "Seoul Street 21",
  },
] as const;

type CatalogItem = {
  category: string;
  description: string;
  id: string;
  image: string;
  name: string;
  price: number;
  restaurantId: string;
};

function buildCatalog() {
  const items: CatalogItem[] = [];

  for (let index = 1; index <= 30; index += 1) {
    const label = String(index).padStart(2, "0");
    items.push({
      id: `food-menu-seed-burger-${label}`,
      name: `Signature Smash Burger ${label}`,
      description: "Juicy smashed beef, melted cheese, crisp lettuce, and house sauce.",
      price: 14500 + index * 220,
      image: index % 3 === 0
        ? "/home-crops/burger3-clean-v2.png"
        : index % 2 === 0
          ? "/home-crops/burger2-clean-v2.png"
          : "/home-crops/burger1-clean-v2.png",
      category: "Burger",
      restaurantId: "rest-burger-house",
    });
  }

  for (let index = 1; index <= 15; index += 1) {
    const label = String(index).padStart(2, "0");
    items.push({
      id: `food-menu-seed-chicken-${label}`,
      name: `Crispy Fire Chicken ${label}`,
      description: "Golden chicken with crunchy coating, pepper glaze, and cool ranch finish.",
      price: 11800 + index * 180,
      image: index % 2 === 0
        ? "/home-crops/nuggets-clean-v2.png"
        : "/home-crops/burger2-clean-v2.png",
      category: "Chicken",
      restaurantId: "rest-burger-house",
    });
  }

  for (let index = 1; index <= 15; index += 1) {
    const label = String(index).padStart(2, "0");
    items.push({
      id: `food-menu-seed-sides-${label}`,
      name: `Loaded Fries Basket ${label}`,
      description: "Crispy fries finished with seasoning, creamy dip, and burger-house crunch.",
      price: 6200 + index * 140,
      image: "/home-crops/fries-clean-v2.png",
      category: index % 4 === 0 ? "Sauce" : "Sides",
      restaurantId: "rest-burger-house",
    });
  }

  for (let index = 1; index <= 12; index += 1) {
    const label = String(index).padStart(2, "0");
    items.push({
      id: `food-menu-seed-drink-${label}`,
      name: `Craft Cola Chill ${label}`,
      description: "Refreshing sparkling drink served cold for fast-food cravings.",
      price: 2800 + index * 120,
      image: "/home-crops/cola-clean-v2.png",
      category: "Drink",
      restaurantId: "rest-burger-house",
    });
  }

  for (let index = 1; index <= 12; index += 1) {
    const label = String(index).padStart(2, "0");
    items.push({
      id: `food-menu-seed-combo-${label}`,
      name: `Midnight Combo Box ${label}`,
      description: "Burger, fries, and drink paired together for a full delivery combo.",
      price: 17900 + index * 350,
      image: "/home-crops/combo-clean-v2.png",
      category: "Combo",
      restaurantId: "rest-burger-house",
    });
  }

  for (let index = 1; index <= 8; index += 1) {
    const label = String(index).padStart(2, "0");
    items.push({
      id: `food-menu-seed-pizza-${label}`,
      name: `Stone Crust Pizza ${label}`,
      description: "Oven-baked pizza slice set with bold sauce, mozzarella, and crisp crust.",
      price: 13500 + index * 330,
      image: "/home-crops/combo-clean-v2.png",
      category: "Pizza",
      restaurantId: "rest-fire-crust",
    });
  }

  for (let index = 1; index <= 7; index += 1) {
    const label = String(index).padStart(2, "0");
    items.push({
      id: `food-menu-seed-salad-${label}`,
      name: `Garden Crunch Salad ${label}`,
      description: "Fresh greens, crunchy toppings, and a bright house dressing.",
      price: 9800 + index * 240,
      image: "/home-crops/combo-clean-v2.png",
      category: "Salad",
      restaurantId: "rest-green-bowl",
    });
  }

  return items;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL_OVERRIDE?.trim() || process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  try {
    await prisma.$connect();

    await prisma.$transaction(async (tx) => {
      await tx.tracking.deleteMany({
        where: {
          id: {
            startsWith: "tracking-seed-",
          },
        },
      });

      await tx.payment.deleteMany({
        where: {
          id: {
            startsWith: "payment-seed-",
          },
        },
      });

      await tx.orderItem.deleteMany({
        where: {
          id: {
            startsWith: "order-item-seed-",
          },
        },
      });

      await tx.order.deleteMany({
        where: {
          id: {
            startsWith: "order-seed-",
          },
        },
      });

      for (const restaurant of RESTAURANTS) {
        await tx.restaurant.upsert({
          where: {
            id: restaurant.id,
          },
          create: {
            ...restaurant,
          },
          update: {
            address: restaurant.address,
            description: restaurant.description,
            image: restaurant.image,
            name: restaurant.name,
          },
        });
      }

      const currentFoodsCount = await tx.food.count();

      if (currentFoodsCount >= TARGET_TOTAL_FOODS) {
        console.log(JSON.stringify({
          databaseUrl,
          foodsAfter: currentFoodsCount,
          foodsInserted: 0,
          ordersRemoved: true,
          targetTotal: TARGET_TOTAL_FOODS,
        }));
        return;
      }

      const catalog = buildCatalog();
      const existingSeedFoods = await tx.food.findMany({
        where: {
          id: {
            startsWith: "food-menu-seed-",
          },
        },
        select: {
          id: true,
        },
      });

      const existingIds = new Set(existingSeedFoods.map((food) => food.id));
      const foodsNeeded = TARGET_TOTAL_FOODS - currentFoodsCount;
      const foodsToCreate = catalog
        .filter((item) => !existingIds.has(item.id))
        .slice(0, foodsNeeded);

      if (foodsToCreate.length > 0) {
        await tx.food.createMany({
          data: foodsToCreate.map((food) => ({
            id: food.id,
            name: food.name,
            description: food.description,
            price: food.price,
            image: food.image,
            category: food.category,
            isAvailable: true,
            restaurantId: food.restaurantId,
          })),
        });
      }

      const finalFoodsCount = await tx.food.count();

      console.log(JSON.stringify({
        databaseUrl,
        foodsAfter: finalFoodsCount,
        foodsInserted: foodsToCreate.length,
        ordersRemoved: true,
        targetTotal: TARGET_TOTAL_FOODS,
      }));
    });
  } finally {
    await prisma.$disconnect();
  }
}

await main();
