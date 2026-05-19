import { forbiddenResponse, requireAdmin, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidatePublicFoodCatalogCache } from "@/lib/public-food-catalog";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRestaurantId(request: Request) {
  return new URL(request.url).pathname.split("/").at(-1)?.trim() ?? "";
}

export async function GET(request: Request) {
  try {
    const id = getRestaurantId(request);

    if (!id) {
      return NextResponse.json(
        { error: "Restaurant id is required." },
        { status: 400 }
      );
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id,
      },
      include: {
        foods: {
          where: {
            isAvailable: true,
          },
          include: {
            restaurant: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(restaurant);
  } catch {
    return NextResponse.json(
      { error: "Unable to fetch the restaurant right now." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
    const id = getRestaurantId(request);

    if (!id) {
      return NextResponse.json(
        { error: "Restaurant id is required." },
        { status: 400 }
      );
    }

    const body = (await request.json()) as {
      name?: unknown;
      description?: unknown;
      image?: unknown;
      address?: unknown;
    };

    const data: {
      name?: string;
      description?: string | null;
      image?: string | null;
      address?: string | null;
    } = {};

    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim();
    }

    if (typeof body.description === "string") {
      data.description = body.description.trim();
    } else if (body.description === null) {
      data.description = null;
    }

    if (typeof body.image === "string") {
      data.image = body.image.trim();
    } else if (body.image === null) {
      data.image = null;
    }

    if (typeof body.address === "string") {
      data.address = body.address.trim();
    } else if (body.address === null) {
      data.address = null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Provide at least one valid field to update." },
        { status: 400 }
      );
    }

    const existingRestaurant = await prisma.restaurant.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existingRestaurant) {
      return NextResponse.json(
        { error: "Restaurant not found." },
        { status: 404 }
      );
    }

    const updatedRestaurant = await prisma.restaurant.update({
      where: {
        id,
      },
      data,
    });

    invalidatePublicFoodCatalogCache();
    return NextResponse.json(updatedRestaurant);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }

    return NextResponse.json(
      { error: "Unable to update the restaurant right now." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const id = getRestaurantId(request);

    if (!id) {
      return NextResponse.json(
        { error: "Restaurant id is required." },
        { status: 400 }
      );
    }

    const existingRestaurant = await prisma.restaurant.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existingRestaurant) {
      return NextResponse.json(
        { error: "Restaurant not found." },
        { status: 404 }
      );
    }

    await prisma.restaurant.delete({
      where: {
        id,
      },
    });

    invalidatePublicFoodCatalogCache();
    return NextResponse.json({ message: "Restaurant deleted successfully." });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }

    return NextResponse.json(
      { error: "Unable to delete the restaurant right now." },
      { status: 500 }
    );
  }
}
