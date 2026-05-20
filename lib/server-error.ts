import { getKnownServerErrorResponse } from "@/lib/database-error";
import { NextResponse } from "next/server";

export function createServerErrorResponse(
  scope: string,
  message: string,
  error: unknown
) {
  const requestId = crypto.randomUUID();
  const knownError = getKnownServerErrorResponse(error);

  console.error(`[${scope}]`, {
    error,
    knownError,
    requestId,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(
    {
      error: knownError?.message ?? message,
      requestId,
      ...(process.env.NODE_ENV === "development" && error instanceof Error
        ? { details: error.message }
        : {}),
    },
    { status: knownError?.status ?? 500 }
  );
}
