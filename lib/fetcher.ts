export class ApiError extends Error {
  details: unknown;
  status: number;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function getPayloadMessage(payload: unknown) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  return null;
}

function getPayloadRequestId(payload: unknown) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    payload.requestId.trim()
  ) {
    return payload.requestId;
  }

  return null;
}

export async function fetchJson<T>(
  input: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const response = await fetch(input, {
    ...init,
    credentials: "same-origin",
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const requestId = getPayloadRequestId(payload);
    const baseMessage =
      getPayloadMessage(payload) ?? `Request failed with status ${response.status}.`;
    const message =
      requestId && response.status >= 500
        ? `${baseMessage} Request ID: ${requestId}`
        : baseMessage;

    throw new ApiError(
      message,
      response.status,
      payload
    );
  }

  return payload as T;
}
