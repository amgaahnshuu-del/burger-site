import { NextResponse } from "next/server";

export function createServerErrorResponse(
  scope: string,
  message: string,
  error: unknown
) {
  const requestId = crypto.randomUUID();

  console.error(`[${scope}]`, {
    error,
    requestId,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(
    {
      error: message,
      requestId,
      ...(process.env.NODE_ENV === "development" && error instanceof Error
        ? { details: error.message }
        : {}),
    },
    { status: 500 }
  );
}
