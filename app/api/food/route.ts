import { requireAdmin, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";
import { withResolvedFoodImage } from "@/lib/food-images";
import {
  getFoodImageTooLargeMessage,
  isFoodImageValueTooLarge,
} from "@/lib/food-image-input";
import {
  getFoodImageStorageErrorMessage,
  persistFoodImageValue,
} from "@/lib/food-image-storage";
import { prisma } from "@/lib/prisma";
import {
  getPublicFoodCatalog,
  invalidatePublicFoodCatalogCache,
} from "@/lib/public-food-catalog";
import { createServerErrorResponse } from "@/lib/server-error";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const foods = await getPublicFoodCatalog();

    return NextResponse.json(foods, {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    return createServerErrorResponse(
      "api/food.GET",
      "Unable to fetch foods right now.",
      error
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const body = (await req.json()) as {
      name?: unknown;
      price?: unknown;
      description?: unknown;
      image?: unknown;
      category?: unknown;
      restaurantId?: unknown;
    };

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category =
      typeof body.category === "string" ? body.category.trim() : "";
    const image = typeof body.image === "string" ? body.image.trim() : "";
    const price =
      typeof body.price === "number" && Number.isInteger(body.price)
        ? body.price
        : NaN;
    const description =
      typeof body.description === "string" ? body.description.trim() : null;
    const restaurantId =
      typeof body.restaurantId === "string" ? body.restaurantId.trim() : null;

    if (!name || !category || !image || price < 0 || Number.isNaN(price)) {
      return NextResponse.json(
        { error: "name, category, image, and a valid price are required." },
        { status: 400 }
      );
    }

    if (isFoodImageValueTooLarge(image)) {
      return NextResponse.json(
        { error: getFoodImageTooLargeMessage() },
        { status: 400 }
      );
    }

    let normalizedImage: string;

    try {
      normalizedImage = await persistFoodImageValue(image);
    } catch (error) {
      const imageErrorMessage = getFoodImageStorageErrorMessage(error);

      if (imageErrorMessage) {
        return NextResponse.json({ error: imageErrorMessage }, { status: 400 });
      }

      throw error;
    }

    if (restaurantId) {
      const restaurant = await prisma.restaurant.findUnique({
        where: {
          id: restaurantId,
        },
        select: {
          id: true,
        },
      });

      if (!restaurant) {
        return NextResponse.json(
          { error: "Restaurant not found." },
          { status: 404 }
        );
      }
    }

    const food = await prisma.food.create({
      data: {
        name,
        category,
        image: normalizedImage,
        isAvailable: true,
        price,
        description,
        restaurantId,
      },
      include: {
        restaurant: true,
      },
    });

    invalidatePublicFoodCatalogCache();
    return NextResponse.json(withResolvedFoodImage(food), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }

    return createServerErrorResponse(
      "api/food.POST",
      "Unable to create the food right now.",
      error
    );
  }
}
