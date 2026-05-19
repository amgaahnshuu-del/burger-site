import { generateAssistantReply } from "@/features/ai/ai.smart";
import type { AIConversationMessage } from "@/features/ai/ai.types";
import { getAuthSession } from "@/lib/auth";
import {
  checkRateLimit,
  createRateLimitResponse,
  getClientIdentifier,
} from "@/lib/rate-limit";
import { createServerErrorResponse } from "@/lib/server-error";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      history?: unknown;
      message?: unknown;
    };
    const message =
      typeof body.message === "string" ? body.message.trim() : "";
    const history = Array.isArray(body.history)
      ? body.history
          .map((item) => {
            if (
              typeof item !== "object" ||
              item === null ||
              !("content" in item) ||
              !("role" in item)
            ) {
              return null;
            }

            const content =
              typeof item.content === "string" ? item.content.trim() : "";
            const role =
              item.role === "user" || item.role === "assistant"
                ? item.role
                : null;

            if (!content || !role) {
              return null;
            }

            return {
              content,
              role,
            } satisfies AIConversationMessage;
          })
          .filter((item): item is AIConversationMessage => item !== null)
          .slice(-20)
      : [];

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const session = await getAuthSession(req);
    const rateLimit = checkRateLimit({
      identifier: session?.user.id ?? getClientIdentifier(req),
      key: "ai-chat",
      limit: 20,
      windowMs: 1000 * 60 * 10,
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(
        rateLimit,
        "AI assistant request limit reached. Please wait a few minutes and try again."
      );
    }

    const result = await generateAssistantReply({
      history,
      message,
      user: session
        ? {
            email: session.user.email,
            id: session.user.id,
            name: session.user.name,
            phone: session.user.phone,
          }
        : null,
    });

    return NextResponse.json({
      mode: result.mode,
      model: result.model,
      reply: result.reply,
    });
  } catch (error) {
    return createServerErrorResponse(
      "api/ai.POST",
      "Unable to process the AI request.",
      error
    );
  }
}
