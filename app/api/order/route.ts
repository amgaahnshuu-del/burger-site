import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import {
  withResolvedNestedFoodImages,
  withResolvedNestedFoodImagesList,
} from "@/lib/food-images";
import {
  createPaymentReference,
  extractCoordinatesFromAddress,
  isSupportedPaymentMethod,
} from "@/lib/order-lifecycle";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  createRateLimitResponse,
  getClientIdentifier,
} from "@/lib/rate-limit";
import {
  assertTrustedOrigin,
  isTrustedOriginError,
  untrustedOriginResponse,
} from "@/lib/request-security";
import { createServerErrorResponse } from "@/lib/server-error";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const orderPartySelect = {
  createdAt: true,
  email: true,
  id: true,
  name: true,
  phone: true,
  role: true,
} as const;

const orderFoodSelect = {
  category: true,
  createdAt: true,
  description: true,
  id: true,
  image: true,
  isAvailable: true,
  name: true,
  price: true,
  restaurantId: true,
} as const;

const orderInclude = {
  items: {
    include: {
      food: {
        select: orderFoodSelect,
      },
    },
  },
  payment: true,
  tracking: true,
  user: {
    select: orderPartySelect,
  },
  courier: {
    select: orderPartySelect,
  },
} as const;

export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
      },
      include: orderInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(withResolvedNestedFoodImagesList(orders));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return createServerErrorResponse(
      "api/order.GET",
      "Unable to fetch orders right now.",
      error
    );
  }
}

export async function POST(req: Request) {
  try {
    assertTrustedOrigin(req);
    const { user } = await requireAuth(req);
    const rateLimit = checkRateLimit({
      identifier: `${user.id}:${getClientIdentifier(req)}`,
      key: "order-create",
      limit: 10,
      windowMs: 1000 * 60 * 10,
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(
        rateLimit,
        "Too many order attempts. Please wait a little and try again."
      );
    }

    const body = (await req.json()) as {
      address?: unknown;
      addressDistrict?: unknown;
      addressKhoroo?: unknown;
      addressLabel?: unknown;
      addressLatitude?: unknown;
      addressLongitude?: unknown;
      addressNotes?: unknown;
      addressUnit?: unknown;
      contactPhone?: unknown;
      paymentMethod?: unknown;
      items?: Array<{
        foodId?: unknown;
        quantity?: unknown;
      }>;
    };

    const address =
      typeof body.address === "string" ? body.address.trim() : "";
    const contactPhone =
      typeof body.contactPhone === "string" ? body.contactPhone.trim() : "";
    const paymentMethod = isSupportedPaymentMethod(body.paymentMethod)
      ? body.paymentMethod
      : null;
    const addressLabel =
      typeof body.addressLabel === "string" && body.addressLabel.trim()
        ? body.addressLabel.trim()
        : null;
    const addressDistrict =
      typeof body.addressDistrict === "string" && body.addressDistrict.trim()
        ? body.addressDistrict.trim()
        : null;
    const addressKhoroo =
      typeof body.addressKhoroo === "string" && body.addressKhoroo.trim()
        ? body.addressKhoroo.trim()
        : null;
    const addressUnit =
      typeof body.addressUnit === "string" && body.addressUnit.trim()
        ? body.addressUnit.trim()
        : null;
    const addressNotes =
      typeof body.addressNotes === "string" && body.addressNotes.trim()
        ? body.addressNotes.trim()
        : null;
    const suppliedLatitude =
      typeof body.addressLatitude === "number" && Number.isFinite(body.addressLatitude)
        ? body.addressLatitude
        : null;
    const suppliedLongitude =
      typeof body.addressLongitude === "number" && Number.isFinite(body.addressLongitude)
        ? body.addressLongitude
        : null;

    const items = Array.isArray(body.items)
      ? body.items
          .map((item) => {
            const foodId =
              typeof item.foodId === "string" ? item.foodId.trim() : "";
            const quantity =
              typeof item.quantity === "number" && Number.isInteger(item.quantity)
                ? item.quantity
                : NaN;

            if (!foodId || quantity <= 0) {
              return null;
            }

            return {
              foodId,
              quantity,
            };
          })
          .filter(
            (
              item
            ): item is {
              foodId: string;
              quantity: number;
            } => item !== null
          )
      : [];

    if (!address || !contactPhone || !paymentMethod || items.length === 0) {
      return NextResponse.json(
        {
          error:
            "address, contactPhone, paymentMethod, and at least one valid order item are required.",
        },
        { status: 400 }
      );
    }

    const phonePattern = /^[0-9+\-\s()]{6,20}$/;

    if (!phonePattern.test(contactPhone)) {
      return NextResponse.json(
        { error: "Enter a valid contact phone for the courier." },
        { status: 400 }
      );
    }

    const foods = await prisma.food.findMany({
      where: {
        id: {
          in: items.map((item) => item.foodId),
        },
      },
      select: {
        category: true,
        id: true,
        image: true,
        name: true,
        price: true,
      },
    });

    if (foods.length !== items.length) {
      return NextResponse.json(
        { error: "One or more foods do not exist." },
        { status: 404 }
      );
    }

    const foodById = new Map(foods.map((food) => [food.id, food]));
    const itemsToCreate = items.map((item) => ({
      foodId: item.foodId,
      foodCategory: foodById.get(item.foodId)?.category ?? "Uncategorized",
      foodImage: foodById.get(item.foodId)?.image ?? "",
      foodName: foodById.get(item.foodId)?.name ?? "Deleted food",
      quantity: item.quantity,
      price: foodById.get(item.foodId)?.price ?? 0,
    }));
    const inferredCoordinates = extractCoordinatesFromAddress(address);
    const orderLatitude = suppliedLatitude ?? inferredCoordinates?.latitude ?? null;
    const orderLongitude = suppliedLongitude ?? inferredCoordinates?.longitude ?? null;

    const totalPrice = itemsToCreate.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const orderId = crypto.randomUUID();
    const paymentReference = createPaymentReference(orderId, paymentMethod);

    const order = await prisma.$transaction(async (tx) => {
      if (user.phone !== contactPhone) {
        await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            phone: contactPhone,
          },
        });
      }

      const createdOrder = await tx.order.create({
        data: {
          id: orderId,
          userId: user.id,
          address,
          addressDistrict,
          addressKhoroo,
          addressLabel,
          addressLatitude: orderLatitude,
          addressLongitude: orderLongitude,
          addressNotes,
          addressUnit,
          contactPhone,
          totalPrice,
          status: "PENDING",
          items: {
            create: itemsToCreate,
          },
          payment: {
            create: {
              method: paymentMethod,
              providerPayload: {
                instructions:
                  paymentMethod === "CASH"
                    ? "Collect cash from the customer at delivery."
                    : "Await external payment confirmation before settlement.",
                provider: paymentMethod,
              },
              providerReference: paymentReference,
            },
          },
          tracking: {
            create: {
              status: "PREPARING",
              latitude: orderLatitude,
              longitude: orderLongitude,
            },
          },
        },
        include: orderInclude,
      });

      const cart = await tx.cart.findUnique({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
        },
      });

      if (cart) {
        await tx.cartItem.deleteMany({
          where: {
            cartId: cart.id,
          },
        });
      }

      return createdOrder;
    });

    return NextResponse.json(withResolvedNestedFoodImages(order), { status: 201 });
  } catch (error) {
    if (isTrustedOriginError(error)) {
      return untrustedOriginResponse();
    }

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return createServerErrorResponse(
      "api/order.POST",
      "Unable to create the order right now.",
      error
    );
  }
}
