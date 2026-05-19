import { NextResponse } from "next/server";

import { forbiddenResponse, requireAdmin, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerErrorResponse } from "@/lib/server-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getFeedbackId(request: Request) {
  return new URL(request.url).pathname.split("/").at(-1)?.trim() ?? "";
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const id = getFeedbackId(request);

    if (!id) {
      return NextResponse.json(
        { error: "Feedback id is required." },
        { status: 400 }
      );
    }

    const body = (await request.json()) as {
      status?: unknown;
    };

    const status =
      body.status === "OPEN" || body.status === "RESOLVED"
        ? body.status
        : null;

    if (!status) {
      return NextResponse.json(
        { error: "A valid feedback status is required." },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.update({
      where: { id },
      data: {
        resolvedAt: status === "RESOLVED" ? new Date() : null,
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }

    return createServerErrorResponse(
      "api/admin/feedback.PATCH",
      "Unable to update feedback right now.",
      error
    );
  }
}
