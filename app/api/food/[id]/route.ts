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
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getFoodId(request: Request) {
  return new URL(request.url).pathname.split("/").at(-1)?.trim() ?? "";
}

export async function GET(request: Request) {
  try {
    const id = getFoodId(request);

    if (!id) {
      return NextResponse.json(
        { error: "Food id is required." },
        { status: 400 }
      );
    }

    const food = await prisma.food.findUnique({
      where: { id },
      include: {
        restaurant: true,
      },
    });

    if (!food) {
      return NextResponse.json({ error: "Food not found." }, { status: 404 });
    }

    return NextResponse.json(withResolvedFoodImage(food));
  } catch {
    return NextResponse.json(
      { error: "Unable to fetch the food right now." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin(req);
    const id = getFoodId(req);

    if (!id) {
      return NextResponse.json(
        { error: "Food id is required." },
        { status: 400 }
      );
    }

    const body = (await req.json()) as {
      name?: unknown;
      price?: unknown;
      description?: unknown;
      image?: unknown;
      category?: unknown;
      isAvailable?: unknown;
      restaurantId?: unknown;
    };

    const data: {
      name?: string;
      price?: number;
      description?: string | null;
      image?: string;
      category?: string;
      restaurantId?: string | null;
      isAvailable?: boolean;
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
    } else if (body.description === null) {
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
    } else if (body.restaurantId === null) {
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

    const updated = await prisma.food.update({
      where: { id },
      data,
      include: {
        restaurant: true,
      },
    });

    if (data.image && existingFood.image !== updated.image) {
      await removeManagedFoodUploadIfUnused(existingFood.image);
    }

    invalidatePublicFoodCatalogCache();
    return NextResponse.json(withResolvedFoodImage(updated));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }

    return NextResponse.json(
      { error: "Unable to update the food right now." },
      { status: 500 }
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

    const existingFood = await prisma.food.findUnique({
      where: { id },
      select: { id: true, image: true },
    });

    if (!existingFood) {
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

    await removeManagedFoodUploadIfUnused(existingFood.image);

    invalidatePublicFoodCatalogCache();
    return NextResponse.json({
      message: "Food deleted permanently.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }

    return NextResponse.json(
      { error: "Unable to delete the food right now." },
      { status: 500 }
    );
  }
}
