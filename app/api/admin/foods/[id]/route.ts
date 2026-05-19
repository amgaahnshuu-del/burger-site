import { NextResponse } from "next/server";

import { forbiddenResponse, requireAdmin, unauthorizedResponse } from "@/lib/auth";
import { withResolvedFoodImage } from "@/lib/food-images";
import {
  getFoodImageTooLargeMessage,
  isFoodImageValueTooLarge,
} from "@/lib/food-image-input";
import {
  getFoodImageStorageErrorMessage,
  persistFoodImageValue,
} from "@/lib/food-image-storage";
import { removeManagedFoodUploadIfUnused } from "@/lib/food-image-cleanup";
import { prisma } from "@/lib/prisma";
import { invalidatePublicFoodCatalogCache } from "@/lib/public-food-catalog";
import { createServerErrorResponse } from "@/lib/server-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getFoodId(request: Request) {
  return new URL(request.url).pathname.split("/").at(-1)?.trim() ?? "";
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const id = getFoodId(request);

    if (!id) {
      return NextResponse.json(
        { error: "Food id is required." },
        { status: 400 }
      );
    }

    const body = (await request.json()) as {
      category?: unknown;
      description?: unknown;
      image?: unknown;
      isAvailable?: unknown;
      name?: unknown;
      price?: unknown;
      restaurantId?: unknown;
    };

    const data: {
      category?: string;
      description?: string | null;
      image?: string;
      isAvailable?: boolean;
      name?: string;
      price?: number;
      restaurantId?: string | null;
    } = {};

    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim();
    }

    if (typeof body.category === "string" && body.category.trim()) {
      data.category = body.category.trim();
    }

    if (typeof body.image === "string" && body.image.trim()) {
      if (isFoodImageValueTooLarge(body.image.trim())) {
        return NextResponse.json(
          { error: getFoodImageTooLargeMessage() },
          { status: 400 }
        );
      }

      try {
        data.image = await persistFoodImageValue(body.image.trim());
      } catch (error) {
        const imageErrorMessage = getFoodImageStorageErrorMessage(error);

        if (imageErrorMessage) {
          return NextResponse.json({ error: imageErrorMessage }, { status: 400 });
        }

        throw error;
      }
    }

    if (typeof body.description === "string") {
      data.description = body.description.trim();
    }

    if (body.description === null) {
      data.description = null;
    }

    if (typeof body.price === "number" && Number.isInteger(body.price) && body.price >= 0) {
      data.price = body.price;
    }

    if (typeof body.isAvailable === "boolean") {
      data.isAvailable = body.isAvailable;
    }

    if (typeof body.restaurantId === "string") {
      const restaurantId = body.restaurantId.trim();

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

      data.restaurantId = restaurantId || null;
    }

    if (body.restaurantId === null) {
      data.restaurantId = null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Provide at least one valid field to update." },
        { status: 400 }
      );
    }

    const existingFood = await prisma.food.findUnique({
      where: { id },
      select: {
        id: true,
        image: true,
      },
    });

    if (!existingFood) {
      return NextResponse.json({ error: "Food not found." }, { status: 404 });
    }

    const updatedFood = await prisma.food.update({
      where: { id },
      data,
      include: {
        restaurant: true,
      },
    });

    if (data.image && existingFood.image !== updatedFood.image) {
      await removeManagedFoodUploadIfUnused(existingFood.image);
    }

    invalidatePublicFoodCatalogCache();
    return NextResponse.json(withResolvedFoodImage(updatedFood));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }

    return createServerErrorResponse(
      "api/admin/foods.PATCH",
      "Unable to update the food right now.",
      error
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const id = getFoodId(request);

    if (!id) {
      return NextResponse.json(
        { error: "Food id is required." },
        { status: 400 }
      );
    }

    const food = await prisma.food.findUnique({
      where: { id },
      select: {
        id: true,
        image: true,
      },
    });

    if (!food) {
      return NextResponse.json({ error: "Food not found." }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.cartItem.deleteMany({
        where: {
          foodId: id,
        },
      }),
      prisma.food.delete({
        where: { id },
      }),
    ]);

    await removeManagedFoodUploadIfUnused(food.image);

    invalidatePublicFoodCatalogCache();
    return NextResponse.json({ message: "Food deleted permanently." });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }

    return createServerErrorResponse(
      "api/admin/foods.DELETE",
      "Unable to remove the food right now.",
      error
    );
  }
}
