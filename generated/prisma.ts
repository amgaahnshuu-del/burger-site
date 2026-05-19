import { PrismaPg } from "@prisma/adapter-pg";

import { Prisma, PrismaClient as GeneratedPrismaClient } from "./prisma/client";

type PrismaClientOptions = {
  comments?: Prisma.PrismaClientOptions["comments"];
  errorFormat?: Prisma.PrismaClientOptions["errorFormat"];
  log?: Prisma.PrismaClientOptions["log"];
  omit?: Prisma.PrismaClientOptions["omit"];
  queryPlanCacheMaxSize?: Prisma.PrismaClientOptions["queryPlanCacheMaxSize"];
  transactionOptions?: Prisma.PrismaClientOptions["transactionOptions"];
};

const databaseUrlOverride = process.env.DATABASE_URL_OVERRIDE?.trim();

if (databaseUrlOverride) {
  process.env.DATABASE_URL = databaseUrlOverride;
}

function resolveDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return databaseUrl;
}

function resolveSchema(connectionString: string) {
  try {
    const schema = new URL(connectionString).searchParams.get("schema");
    return schema?.trim() || "public";
  } catch {
    return "public";
  }
}

export class PrismaClient extends GeneratedPrismaClient {
  constructor(options: PrismaClientOptions = {}) {
    const connectionString = resolveDatabaseUrl();
    const adapter = new PrismaPg(connectionString, {
      schema: resolveSchema(connectionString),
    });

    super({
      ...options,
      adapter,
    } as Prisma.PrismaClientOptions);
  }
}

export { Prisma };
export * from "./prisma/client";
