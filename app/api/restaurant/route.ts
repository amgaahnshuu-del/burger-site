import { forbiddenResponse, requireAdmin, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidatePublicFoodCatalogCache } from "@/lib/public-food-catalog";
import { createServerErrorResponse } from "@/lib/server-error";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const restaurants = await prisma.restaurant.findMany({
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(restaurants);
  } catch (error) {
    return createServerErrorResponse(
      "api/restaurant.GET",
      "Unable to fetch restaurants right now.",
      error
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = (await request.json()) as {
      name?: unknown;
      description?: unknown;
      image?: unknown;
      address?: unknown;
    };

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : null;
    const image = typeof body.image === "string" ? body.image.trim() : null;
    const address =
      typeof body.address === "string" ? body.address.trim() : null;

    if (!name) {
      return NextResponse.json(
        { error: "Restaurant name is required." },
        { status: 400 }
      );
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        description,
        image,
        address,
      },
    });

    invalidatePublicFoodCatalogCache();
    return NextResponse.json(restaurant, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }

    return createServerErrorResponse(
      "api/restaurant.POST",
      "Unable to create the restaurant right now.",
      error
    );
  }
}
