import type { UserRole } from "@/features/auth/auth.types";
import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "food_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

const authUserSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  createdAt: true,
} as const;

type AuthUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  createdAt: Date;
};

type AuthSession = {
  id: string;
  expiresAt: Date;
  user: AuthUser;
};

type AuthSessionCacheEntry = {
  cachedAt: number;
  session: AuthSession;
};

const AUTH_SESSION_CACHE_TTL_MS = 1000 * 30;

declare global {
  var __burgerAuthSessionCache: Map<string, AuthSessionCacheEntry> | undefined;
}

const AUTH_SESSION_CACHE =
  globalThis.__burgerAuthSessionCache ??
  new Map<string, AuthSessionCacheEntry>();

if (!globalThis.__burgerAuthSessionCache) {
  globalThis.__burgerAuthSessionCache = AUTH_SESSION_CACHE;
}

function parseCookies(header: string | null) {
  const cookieMap = new Map<string, string>();

  if (!header) {
    return cookieMap;
  }

  for (const part of header.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");

    if (!rawName || rawValue.length === 0) {
      continue;
    }

    cookieMap.set(rawName, decodeURIComponent(rawValue.join("=")));
  }

  return cookieMap;
}

function getSessionTokenFromRequest(request: Request) {
  return (
    parseCookies(request.headers.get("cookie")).get(SESSION_COOKIE_NAME) ?? null
  );
}

export function hasSessionCookie(request: Request) {
  return Boolean(getSessionTokenFromRequest(request));
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function pruneExpiredAuthSessionCache(now: number) {
  if (AUTH_SESSION_CACHE.size < 5000) {
    return;
  }

  for (const [tokenHash, entry] of AUTH_SESSION_CACHE.entries()) {
    if (
      entry.session.expiresAt.getTime() <= now ||
      now - entry.cachedAt > AUTH_SESSION_CACHE_TTL_MS
    ) {
      AUTH_SESSION_CACHE.delete(tokenHash);
    }
  }
}

function getCachedAuthSession(tokenHash: string) {
  const now = Date.now();
  const entry = AUTH_SESSION_CACHE.get(tokenHash);

  if (!entry) {
    return null;
  }

  if (
    entry.session.expiresAt.getTime() <= now ||
    now - entry.cachedAt > AUTH_SESSION_CACHE_TTL_MS
  ) {
    AUTH_SESSION_CACHE.delete(tokenHash);
    return null;
  }

  return entry.session;
}

function cacheAuthSession(tokenHash: string, session: AuthSession) {
  const now = Date.now();

  pruneExpiredAuthSessionCache(now);
  AUTH_SESSION_CACHE.set(tokenHash, {
    cachedAt: now,
    session,
  });
}

function clearCachedAuthSession(tokenHash: string) {
  AUTH_SESSION_CACHE.delete(tokenHash);
}

function createSessionToken() {
  return randomBytes(32).toString("hex");
}

function getSessionExpiryDate() {
  return new Date(Date.now() + SESSION_DURATION_MS);
}

function shouldUseSecureCookie(request: Request) {
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

type SessionWriteClient = {
  session: {
    create(args: {
      data: {
        userId: string;
        tokenHash: string;
        expiresAt: Date;
      };
    }): Promise<unknown>;
  };
};

export function setSessionCookie(
  request: Request,
  response: NextResponse,
  token: string,
  expiresAt: Date
) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(request: Request, response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: "/",
    expires: new Date(0),
  });
}

export async function createUserSessionWithClient(
  client: SessionWriteClient,
  userId: string
) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = getSessionExpiryDate();

  await client.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    token,
    expiresAt,
  };
}

export async function createUserSession(userId: string) {
  return createUserSessionWithClient(prisma, userId);
}

export async function getAuthSession(request: Request) {
  const token = getSessionTokenFromRequest(request);

  if (!token) {
    return null;
  }

  try {
    const tokenHash = hashSessionToken(token);
    const cachedSession = getCachedAuthSession(tokenHash);

    if (cachedSession) {
      return cachedSession;
    }

    const session = await prisma.session.findUnique({
      where: {
        tokenHash,
      },
      select: {
        id: true,
        expiresAt: true,
        user: {
          select: authUserSelect,
        },
      },
    });

    if (!session) {
      clearCachedAuthSession(tokenHash);
      return null;
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      clearCachedAuthSession(tokenHash);
      await prisma.session.delete({
        where: {
          tokenHash,
        },
      });

      return null;
    }

    cacheAuthSession(tokenHash, session);

    return session;
  } catch {
    return null;
  }
}

export async function deleteSessionFromRequest(request: Request) {
  const token = getSessionTokenFromRequest(request);

  if (!token) {
    return;
  }

  const tokenHash = hashSessionToken(token);
  clearCachedAuthSession(tokenHash);

  await prisma.session.deleteMany({
    where: {
      tokenHash,
    },
  });
}

export async function requireAuth(request: Request): Promise<{
  user: AuthUser;
}> {
  const session = await getAuthSession(request);

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    user: session.user,
  };
}

async function requireRole(request: Request, roles: UserRole[]) {
  const { user } = await requireAuth(request);

  if (!roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }

  return { user };
}

export async function requireAdmin(request: Request): Promise<{
  user: AuthUser;
}> {
  return requireRole(request, ["ADMIN"]);
}

export async function requireManager(request: Request): Promise<{
  user: AuthUser;
}> {
  return requireRole(request, ["MANAGER"]);
}

export async function requireCourier(request: Request): Promise<{
  user: AuthUser;
}> {
  return requireRole(request, ["COURIER"]);
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "You must be logged in to access this resource." },
    { status: 401 }
  );
}

export function forbiddenResponse() {
  return NextResponse.json(
    { error: "You do not have access to this resource." },
    { status: 403 }
  );
}
