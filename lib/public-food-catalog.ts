import { withResolvedFoodImages } from "@/lib/food-images";
import { prisma } from "@/lib/prisma";

const PUBLIC_FOOD_CATALOG_CACHE_TTL_MS =
  process.env.NODE_ENV === "production" ? 60_000 : 15_000;

type PublicFoodCatalog = Awaited<ReturnType<typeof loadPublicFoodCatalogFromDatabase>>;

let cachedPublicFoodCatalog: PublicFoodCatalog | null = null;
let cachedPublicFoodCatalogExpiresAt = 0;
let publicFoodCatalogRequest: Promise<PublicFoodCatalog> | null = null;

async function loadPublicFoodCatalogFromDatabase() {
  const foods = await prisma.food.findMany({
    where: {
      isAvailable: true,
    },
    include: {
      restaurant: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return withResolvedFoodImages(foods);
}

export async function getPublicFoodCatalog() {
  const now = Date.now();

  if (cachedPublicFoodCatalog && now < cachedPublicFoodCatalogExpiresAt) {
    return cachedPublicFoodCatalog;
  }

  if (publicFoodCatalogRequest) {
    return publicFoodCatalogRequest;
  }

  publicFoodCatalogRequest = loadPublicFoodCatalogFromDatabase()
    .then((foods) => {
      cachedPublicFoodCatalog = foods;
      cachedPublicFoodCatalogExpiresAt =
        Date.now() + PUBLIC_FOOD_CATALOG_CACHE_TTL_MS;
      return foods;
    })
    .finally(() => {
      publicFoodCatalogRequest = null;
    });

  return publicFoodCatalogRequest;
}

export function invalidatePublicFoodCatalogCache() {
  cachedPublicFoodCatalog = null;
  cachedPublicFoodCatalogExpiresAt = 0;
}
