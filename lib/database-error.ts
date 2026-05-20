import { Prisma } from "@/generated/prisma";

type KnownServerErrorResponse = {
  message: string;
  status: number;
};

const DATABASE_CONNECTION_ERROR_CODES = new Set([
  "P1000",
  "P1001",
  "P1002",
  "P1003",
  "P1008",
  "P1010",
  "P1011",
  "P1017",
]);

const DATABASE_SCHEMA_ERROR_CODES = new Set(["P2021", "P2022"]);

const NETWORK_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EAI_AGAIN",
]);

const DATABASE_AUTH_ERROR_CODES = new Set(["ER_ACCESS_DENIED_ERROR"]);

function getErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "";
}

function includesAny(message: string, fragments: string[]) {
  const normalizedMessage = message.toLowerCase();
  return fragments.some((fragment) =>
    normalizedMessage.includes(fragment.toLowerCase())
  );
}

export function getKnownServerErrorResponse(
  error: unknown
): KnownServerErrorResponse | null {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);

  if (message === "DATABASE_URL is not configured.") {
    return {
      message:
        "Database connection is not configured. Set DATABASE_URL in this deployment before using the API.",
      status: 503,
    };
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    DATABASE_SCHEMA_ERROR_CODES.has(error.code)
  ) {
    return {
      message:
        "Database schema is out of date for this deployment. Run `prisma migrate deploy` before serving traffic.",
      status: 503,
    };
  }

  if (code && DATABASE_SCHEMA_ERROR_CODES.has(code)) {
    return {
      message:
        "Database schema is out of date for this deployment. Run `prisma migrate deploy` before serving traffic.",
      status: 503,
    };
  }

  if (
    (code !== null && DATABASE_CONNECTION_ERROR_CODES.has(code)) ||
    error instanceof Prisma.PrismaClientInitializationError ||
    includesAny(message, [
      "can't reach database server",
      "server has closed the connection",
      "connection terminated unexpectedly",
      "socket timeout",
      "timed out",
      "connect timeout",
    ]) ||
    (code !== null && NETWORK_ERROR_CODES.has(code))
  ) {
    return {
      message:
        "Unable to reach the database right now. Verify DATABASE_URL and make sure the database host is reachable from this deployment.",
      status: 503,
    };
  }

  if (
    (code !== null && DATABASE_AUTH_ERROR_CODES.has(code)) ||
    includesAny(message, ["denied access", "access denied"])
  ) {
    return {
      message:
        "Database credentials were rejected. Check the username and password in DATABASE_URL.",
      status: 503,
    };
  }

  if (
    includesAny(message, [
      "table",
      "column",
    ]) &&
    includesAny(message, [
      "does not exist",
      "unknown column",
      "no such table",
    ])
  ) {
    return {
      message:
        "Database schema is missing required tables or columns. Run `prisma migrate deploy` for this environment.",
      status: 503,
    };
  }

  if (
    includesAny(message, [
      "format must be 'mariadb://",
      "invalid url",
      "invalid connection string",
    ])
  ) {
    return {
      message:
        "DATABASE_URL is invalid. Use a valid MySQL or MariaDB connection string for this deployment.",
      status: 503,
    };
  }

  return null;
}
