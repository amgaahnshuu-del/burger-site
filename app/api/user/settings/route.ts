import { NextResponse } from "next/server";

import { clearSessionCookie, hasSessionCookie, requireAuth } from "@/lib/auth";
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
import {
  DEFAULT_USER_SETTINGS,
  normalizeUserSettings,
  type UserSettingsPreferences,
} from "@/lib/settings-preferences";
import { createServerErrorResponse } from "@/lib/server-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toSettingsResponse(settings: {
  notificationsEnabled: boolean;
  preferredPaymentMethod: "CASH" | "CARD" | "QPAY";
  savedAddresses: Array<{
    apartmentUnit: string | null;
    details: string;
    district: string | null;
    id: string;
    isDefault: boolean;
    khoroo: string | null;
    label: string;
    latitude: number | null;
    longitude: number | null;
  }>;
} | null): UserSettingsPreferences {
  if (!settings) {
    return DEFAULT_USER_SETTINGS;
  }

  return normalizeUserSettings(settings);
}

export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    const settings = await prisma.userSettings.findUnique({
      where: {
        userId: user.id,
      },
      include: {
        savedAddresses: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json(toSettingsResponse(settings));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      const response = NextResponse.json(
        { error: "You must be logged in to access this resource." },
        { status: 401 }
      );

      if (hasSessionCookie(request)) {
        clearSessionCookie(request, response);
      }

      return response;
    }

    return createServerErrorResponse(
      "api/user/settings.GET",
      "Unable to load your settings right now.",
      error
    );
  }
}

export async function PATCH(request: Request) {
  try {
    assertTrustedOrigin(request);
    const { user } = await requireAuth(request);
    const rateLimit = checkRateLimit({
      identifier: `${user.id}:${getClientIdentifier(request)}`,
      key: "settings-update",
      limit: 40,
      windowMs: 1000 * 60 * 60,
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(
        rateLimit,
        "Too many settings updates. Please wait a little and try again."
      );
    }

    const nextSettings = normalizeUserSettings(await request.json());

    const updatedSettings = await prisma.$transaction(async (tx) => {
      const existingSettings = await tx.userSettings.findUnique({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
        },
      });

      const settingsId = existingSettings?.id ?? crypto.randomUUID();

      await tx.userSettings.upsert({
        where: {
          userId: user.id,
        },
        create: {
          id: settingsId,
          notificationsEnabled: nextSettings.notificationsEnabled,
          preferredPaymentMethod: nextSettings.preferredPaymentMethod,
          userId: user.id,
        },
        update: {
          notificationsEnabled: nextSettings.notificationsEnabled,
          preferredPaymentMethod: nextSettings.preferredPaymentMethod,
        },
      });

      await tx.savedAddress.deleteMany({
        where: {
          userSettingsId: settingsId,
        },
      });

      if (nextSettings.savedAddresses.length > 0) {
        await tx.savedAddress.createMany({
          data: nextSettings.savedAddresses.map((address) => ({
            apartmentUnit: address.apartmentUnit,
            details: address.details,
            district: address.district,
            id: address.id,
            isDefault: address.isDefault,
            khoroo: address.khoroo,
            label: address.label,
            latitude: address.latitude,
            longitude: address.longitude,
            userSettingsId: settingsId,
          })),
        });
      }

      return tx.userSettings.findUnique({
        where: {
          userId: user.id,
        },
        include: {
          savedAddresses: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });
    });

    return NextResponse.json(toSettingsResponse(updatedSettings));
  } catch (error) {
    if (isTrustedOriginError(error)) {
      return untrustedOriginResponse();
    }

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      const response = NextResponse.json(
        { error: "You must be logged in to access this resource." },
        { status: 401 }
      );

      if (hasSessionCookie(request)) {
        clearSessionCookie(request, response);
      }

      return response;
    }

    return createServerErrorResponse(
      "api/user/settings.PATCH",
      "Unable to update your settings right now.",
      error
    );
  }
}
