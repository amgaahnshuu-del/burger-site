import { NextResponse } from "next/server";

import { forbiddenResponse, requireAdmin, unauthorizedResponse } from "@/lib/auth";
import { withResolvedFoodImage, withResolvedFoodImages } from "@/lib/food-images";
import {
  getFoodImageTooLargeMessage,
  isFoodImageValueTooLarge,
} from "@/lib/food-image-input";
import {
  getFoodImageStorageErrorMessage,
  persistFoodImageValue,
} from "@/lib/food-image-storage";
import { prisma } from "@/lib/prisma";
import { invalidatePublicFoodCatalogCache } from "@/lib/public-food-catalog";
import { createServerErrorResponse } from "@/lib/server-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const foods = await prisma.food.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        category: true,
        createdAt: true,
        description: true,
        id: true,
        image: true,
        isAvailable: true,
        name: true,
        price: true,
        restaurantId: true,
      },
    });

    return NextResponse.json(withResolvedFoodImages(foods));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }

    return createServerErrorResponse(
      "api/admin/foods.GET",
      "Unable to fetch menu items right now.",
      error
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = (await request.json()) as {
      category?: unknown;
      description?: unknown;
      image?: unknown;
      name?: unknown;
      price?: unknown;
      restaurantId?: unknown;
    };

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const image = typeof body.image === "string" ? body.image.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : null;
    const restaurantId =
      typeof body.restaurantId === "string" ? body.restaurantId.trim() : "";
    const price =
      typeof body.price === "number" && Number.isInteger(body.price)
        ? body.price
        : NaN;

    if (!name || !category || !image || Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: "Name, category, image, and a valid price are required." },
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
        category,
        description,
        image: normalizedImage,
        isAvailable: true,
        name,
        price,
        restaurantId: restaurantId || null,
      },
      select: {
        category: true,
        createdAt: true,
        description: true,
        id: true,
        image: true,
        isAvailable: true,
        name: true,
        price: true,
        restaurantId: true,
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
      "api/admin/foods.POST",
      "Unable to add the food right now.",
      error
    );
  }
}
