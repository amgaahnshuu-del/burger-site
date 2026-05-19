import { NextResponse } from "next/server";

import { forbiddenResponse, requireAdmin, unauthorizedResponse } from "@/lib/auth";
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getUserId(request: Request) {
  return new URL(request.url).pathname.split("/").at(-1)?.trim() ?? "";
}

export async function DELETE(request: Request) {
  try {
    assertTrustedOrigin(request);
    const { user: admin } = await requireAdmin(request);
    const id = getUserId(request);

    if (!id) {
      return NextResponse.json(
        { error: "User id is required." },
        { status: 400 }
      );
    }

    const rateLimit = checkRateLimit({
      identifier: `${admin.id}:${getClientIdentifier(request)}`,
      key: "admin-users-delete",
      limit: 20,
      windowMs: 1000 * 60 * 60,
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(
        rateLimit,
        "Too many admin account deletions. Please wait a bit and try again."
      );
    }

    if (id === admin.id) {
      return NextResponse.json(
        { error: "You cannot delete the admin account you are signed in with." },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        email: true,
        id: true,
        role: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (targetUser.role === "ADMIN") {
      return NextResponse.json(
        { error: "Admin accounts cannot be deleted from this screen." },
        { status: 403 }
      );
    }

    const [orders, carts] = await Promise.all([
      prisma.order.findMany({
        where: {
          userId: id,
        },
        select: {
          id: true,
        },
      }),
      prisma.cart.findMany({
        where: {
          userId: id,
        },
        select: {
          id: true,
        },
      }),
    ]);

    const orderIds = orders.map((order) => order.id);
    const cartIds = carts.map((cart) => cart.id);

    await prisma.$transaction(async (tx) => {
      await tx.order.updateMany({
        where: {
          courierId: id,
        },
        data: {
          courierId: null,
        },
      });

      if (orderIds.length > 0) {
        await tx.payment.deleteMany({
          where: {
            orderId: {
              in: orderIds,
            },
          },
        });

        await tx.tracking.deleteMany({
          where: {
            orderId: {
              in: orderIds,
            },
          },
        });

        await tx.orderItem.deleteMany({
          where: {
            orderId: {
              in: orderIds,
            },
          },
        });

        await tx.order.deleteMany({
          where: {
            id: {
              in: orderIds,
            },
          },
        });
      }

      if (cartIds.length > 0) {
        await tx.cartItem.deleteMany({
          where: {
            cartId: {
              in: cartIds,
            },
          },
        });

        await tx.cart.deleteMany({
          where: {
            id: {
              in: cartIds,
            },
          },
        });
      }

      await tx.session.deleteMany({
        where: {
          userId: id,
        },
      });

      await tx.user.delete({
        where: {
          id,
        },
      });
    });

    return NextResponse.json({
      message: `${targetUser.email} has been deleted.`,
    });
  } catch (error) {
    if (isTrustedOriginError(error)) {
      return untrustedOriginResponse();
    }

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }

    return createServerErrorResponse(
      "api/admin/users.DELETE",
      "Unable to delete the account right now.",
      error
    );
  }
}
