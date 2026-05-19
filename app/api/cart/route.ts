import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { Prisma } from "@/generated/prisma";
import {
  withResolvedFoodImage,
  withResolvedNestedFoodImages,
} from "@/lib/food-images";
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

const cartFoodSelect = {
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

const cartInclude = {
  items: {
    include: {
      food: {
        select: cartFoodSelect,
      },
    },
    orderBy: {
      id: "asc",
    },
  },
} as const;

type CartRecord = Prisma.CartGetPayload<{
  include: typeof cartInclude;
}> | null;
type CartMutationItemRecord = Prisma.CartItemGetPayload<{
  include: {
    food: {
      select: typeof cartFoodSelect;
    };
  };
}>;

function serializeCart(cart: NonNullable<CartRecord>) {
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.quantity * item.food.price,
    0
  );

  return withResolvedNestedFoodImages({
    ...cart,
    totalItems,
    subtotal,
  });
}

function serializeCartMutationItem(item: CartMutationItemRecord) {
  return {
    ...item,
    food: withResolvedFoodImage(item.food),
  };
}

async function getCartForUser(userId: string) {
  const existingCart = await prisma.cart.findUnique({
    where: {
      userId,
    },
    include: cartInclude,
  });

  if (existingCart) {
    return serializeCart(existingCart);
  }

  const createdCart = await prisma.cart.create({
    data: {
      userId,
    },
    include: cartInclude,
  });

  return serializeCart(createdCart);
}

export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    return NextResponse.json(await getCartForUser(user.id));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return createServerErrorResponse(
      "api/cart.GET",
      "Unable to fetch the cart right now.",
      error
    );
  }
}

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const [{ user }, body] = await Promise.all([
      requireAuth(request),
      request.json() as Promise<{
        foodId?: unknown;
        quantity?: unknown;
      }>,
    ]);
    const rateLimit = checkRateLimit({
      identifier: `${user.id}:${getClientIdentifier(request)}`,
      key: "cart-write",
      limit: 180,
      windowMs: 1000 * 60 * 10,
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(
        rateLimit,
        "Too many cart updates. Please slow down for a moment."
      );
    }

    const foodId = typeof body.foodId === "string" ? body.foodId.trim() : "";
    const quantity =
      typeof body.quantity === "number" && Number.isInteger(body.quantity)
        ? body.quantity
        : 1;

    if (!foodId || quantity <= 0) {
      return NextResponse.json(
        { error: "foodId and a positive quantity are required." },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.upsert({
      where: {
        userId: user.id,
      },
      update: {},
      create: {
        userId: user.id,
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
      },
    });

    try {
      const item = await prisma.cartItem.upsert({
        where: {
          cartId_foodId: {
            cartId: cart.id,
            foodId,
          },
        },
        update: {
          quantity: {
            increment: quantity,
          },
        },
        create: {
          cartId: cart.id,
          foodId,
          quantity,
        },
        include: {
          food: {
            select: cartFoodSelect,
          },
        },
      });

      return NextResponse.json(
        {
          kind: "upsert-item",
          cart,
          item: serializeCartMutationItem(item),
        },
        { status: 201 }
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        return NextResponse.json({ error: "Food not found." }, { status: 404 });
      }

      throw error;
    }
  } catch (error) {
    if (isTrustedOriginError(error)) {
      return untrustedOriginResponse();
    }

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return createServerErrorResponse(
      "api/cart.POST",
      "Unable to update the cart right now.",
      error
    );
  }
}

export async function PUT(request: Request) {
  try {
    assertTrustedOrigin(request);
    const [{ user }, body] = await Promise.all([
      requireAuth(request),
      request.json() as Promise<{
        foodId?: unknown;
        quantity?: unknown;
      }>,
    ]);
    const rateLimit = checkRateLimit({
      identifier: `${user.id}:${getClientIdentifier(request)}`,
      key: "cart-write",
      limit: 180,
      windowMs: 1000 * 60 * 10,
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(
        rateLimit,
        "Too many cart updates. Please slow down for a moment."
      );
    }

    const foodId = typeof body.foodId === "string" ? body.foodId.trim() : "";
    const quantity =
      typeof body.quantity === "number" && Number.isInteger(body.quantity)
        ? body.quantity
        : NaN;

    if (!foodId || Number.isNaN(quantity) || quantity < 0) {
      return NextResponse.json(
        { error: "foodId and a valid quantity are required." },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
      },
    });

    if (!cart) {
      return NextResponse.json({ error: "Cart not found." }, { status: 404 });
    }

    try {
      if (quantity === 0) {
        await prisma.cartItem.delete({
          where: {
            cartId_foodId: {
              cartId: cart.id,
              foodId,
            },
          },
        });

        return NextResponse.json({
          kind: "remove-item",
          cartId: cart.id,
          foodId,
        });
      }

      const item = await prisma.cartItem.update({
        where: {
          cartId_foodId: {
            cartId: cart.id,
            foodId,
          },
        },
        data: {
          quantity,
        },
        include: {
          food: {
            select: cartFoodSelect,
          },
        },
      });

      return NextResponse.json({
        kind: "upsert-item",
        cart,
        item: serializeCartMutationItem(item),
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return NextResponse.json(
          { error: "Cart item not found." },
          { status: 404 }
        );
      }

      throw error;
    }
  } catch (error) {
    if (isTrustedOriginError(error)) {
      return untrustedOriginResponse();
    }

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return createServerErrorResponse(
      "api/cart.PUT",
      "Unable to update the cart item right now.",
      error
    );
  }
}

export async function DELETE(request: Request) {
  try {
    assertTrustedOrigin(request);
    const [{ user }, rawBody] = await Promise.all([
      requireAuth(request),
      request.text(),
    ]);
    const rateLimit = checkRateLimit({
      identifier: `${user.id}:${getClientIdentifier(request)}`,
      key: "cart-write",
      limit: 180,
      windowMs: 1000 * 60 * 10,
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(
        rateLimit,
        "Too many cart updates. Please slow down for a moment."
      );
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    const body = rawBody ? (JSON.parse(rawBody) as { foodId?: unknown }) : {};
    const foodId = typeof body.foodId === "string" ? body.foodId.trim() : "";

    if (!cart) {
      return NextResponse.json(
        foodId
          ? {
              kind: "remove-item",
              cartId: "",
              foodId,
            }
          : {
              kind: "clear-cart",
              cartId: "",
            }
      );
    }

    if (foodId) {
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          foodId,
        },
      });

      return NextResponse.json({
        kind: "remove-item",
        cartId: cart.id,
        foodId,
      });
    }

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return NextResponse.json({
      kind: "clear-cart",
      cartId: cart.id,
    });
  } catch (error) {
    if (isTrustedOriginError(error)) {
      return untrustedOriginResponse();
    }

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return createServerErrorResponse(
      "api/cart.DELETE",
      "Unable to remove cart items right now.",
      error
    );
  }
}
