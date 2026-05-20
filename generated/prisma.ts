import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  Prisma,
  PrismaClient as GeneratedPrismaClient,
} from "./prisma/client";

type PrismaClientOptions = {
  errorFormat?: Prisma.PrismaClientOptions["errorFormat"];
  log?: Prisma.PrismaClientOptions["log"];
  omit?: Prisma.PrismaClientOptions["omit"];
  transactionOptions?: Prisma.PrismaClientOptions["transactionOptions"];
};

function resolveDatabaseUrl() {
  const databaseUrl =
    process.env.DATABASE_URL_OVERRIDE?.trim() || process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return databaseUrl;
}

function normalizeDatabaseUrl(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);

    if (url.protocol === "mysql:" || url.protocol === "mariadb:") {
      // The Prisma MariaDB adapter expects the mariadb:// scheme even when
      // the app still uses legacy mysql:// environment values.
      if (url.protocol === "mysql:") {
        url.protocol = "mariadb:";
      }

      const legacyConnectionLimit = url.searchParams.get("connection_limit");
      const legacyPoolTimeout = url.searchParams.get("pool_timeout");

      if (legacyConnectionLimit && !url.searchParams.has("connectionLimit")) {
        url.searchParams.set("connectionLimit", legacyConnectionLimit);
      }

      if (legacyPoolTimeout && !url.searchParams.has("acquireTimeout")) {
        const poolTimeoutSeconds = Number(legacyPoolTimeout);
        url.searchParams.set(
          "acquireTimeout",
          Number.isFinite(poolTimeoutSeconds)
            ? String(Math.max(poolTimeoutSeconds, 1) * 1000)
            : legacyPoolTimeout
        );
      }

      url.searchParams.delete("connection_limit");
      url.searchParams.delete("pool_timeout");

      if (!url.searchParams.has("allowPublicKeyRetrieval")) {
        url.searchParams.set("allowPublicKeyRetrieval", "true");
      }

      if (!url.searchParams.has("connectionLimit")) {
        url.searchParams.set("connectionLimit", "5");
      }

      if (!url.searchParams.has("connectTimeout")) {
        url.searchParams.set("connectTimeout", "20000");
      }

      if (!url.searchParams.has("acquireTimeout")) {
        url.searchParams.set("acquireTimeout", "20000");
      }
    }

    return url.toString();
  } catch {
    return databaseUrl;
  }
}

function createDatabaseAdapter(databaseUrl: string) {
  const normalizedDatabaseUrl = normalizeDatabaseUrl(databaseUrl);

  try {
    const url = new URL(normalizedDatabaseUrl);

    if (url.protocol === "postgres:" || url.protocol === "postgresql:") {
      return new PrismaPg({
        connectionString: normalizedDatabaseUrl,
      });
    }
  } catch {
    // Fall back to the legacy MariaDB adapter for malformed or legacy URLs.
  }

  return new PrismaMariaDb(normalizedDatabaseUrl);
}

export class PrismaClient extends GeneratedPrismaClient {
  constructor(options: PrismaClientOptions = {}) {
    const adapter = createDatabaseAdapter(resolveDatabaseUrl());

    super({
      ...options,
      adapter,
    } as Prisma.PrismaClientOptions);
  }
}

export { Prisma };
export * from "./prisma/client";
