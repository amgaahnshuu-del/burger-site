import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { createUserSession, setSessionCookie } from "@/lib/auth";
import {
  clearGoogleOAuthCookies,
  createGoogleAuthErrorUrl,
  getGoogleRedirectUri,
  getGoogleOAuthConfig,
  readGoogleOAuthCookies,
} from "@/lib/google-auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GoogleTokenResponse = {
  access_token?: string;
};

type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean;
  name?: string;
};

function createFailureRedirect(
  request: Request,
  options: {
    message: string;
    redirectPath: string;
    view: "login" | "register";
  }
) {
  const response = NextResponse.redirect(
    createGoogleAuthErrorUrl(request, options)
  );

  clearGoogleOAuthCookies(request, response);

  return response;
}

async function exchangeCodeForToken(request: Request, code: string) {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: getGoogleRedirectUri(request),
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("GOOGLE_TOKEN_EXCHANGE_FAILED");
  }

  const tokenPayload = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokenPayload.access_token) {
    throw new Error("GOOGLE_ACCESS_TOKEN_MISSING");
  }

  return tokenPayload.access_token;
}

async function fetchGoogleProfile(accessToken: string) {
  const profileResponse = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!profileResponse.ok) {
    throw new Error("GOOGLE_PROFILE_FETCH_FAILED");
  }

  return (await profileResponse.json()) as GoogleUserInfo;
}

function getDisplayName(profile: GoogleUserInfo, email: string) {
  const profileName = profile.name?.trim();

  if (profileName) {
    return profileName;
  }

  return email.split("@")[0] || "Google User";
}

function getGoogleCallbackErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Google login боловсруулах үед алдаа гарлаа. Дахин оролдоно уу.";
  }

  switch (error.message) {
    case "GOOGLE_OAUTH_NOT_CONFIGURED":
      return "Google login тохируулагдаагүй байна.";
    case "GOOGLE_EMAIL_NOT_VERIFIED":
      return "Google account-ийн email баталгаажаагүй байна.";
    case "GOOGLE_EMAIL_ALREADY_EXISTS":
      return "Энэ Gmail хаяг аль хэдийн бүртгэлтэй байна. Нэвтэрч орно уу.";
    case "GOOGLE_ACCOUNT_NOT_FOUND":
      return "Энэ Gmail хаяг бүртгэлгүй байна. Эхлээд бүртгүүлнэ үү.";
    default:
      return "Google login боловсруулах үед алдаа гарлаа. Дахин оролдоно уу.";
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const googleError = requestUrl.searchParams.get("error");
  const code = requestUrl.searchParams.get("code");
  const returnedState = requestUrl.searchParams.get("state");
  const { redirectPath, state, view } = readGoogleOAuthCookies(request);

  if (googleError) {
    return createFailureRedirect(request, {
      message: "Google login цуцлагдсан эсвэл зөвшөөрөл олгогдоогүй байна.",
      redirectPath,
      view,
    });
  }

  if (!code || !returnedState || !state || returnedState !== state) {
    return createFailureRedirect(request, {
      message: "Google login session хүчингүй болсон байна. Дахин оролдоно уу.",
      redirectPath,
      view,
    });
  }

  try {
    const accessToken = await exchangeCodeForToken(request, code);
    const profile = await fetchGoogleProfile(accessToken);
    const email = profile.email?.trim().toLowerCase() ?? "";

    if (!email || profile.email_verified === false) {
      throw new Error("GOOGLE_EMAIL_NOT_VERIFIED");
    }

    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
      },
    });

    if (user && view === "register") {
      throw new Error("GOOGLE_EMAIL_ALREADY_EXISTS");
    }

    if (!user && view === "login") {
      throw new Error("GOOGLE_ACCOUNT_NOT_FOUND");
    }

    if (!user) {
      const hashedPassword = await hashPassword(randomBytes(32).toString("hex"));
      user = await prisma.user.create({
        data: {
          email,
          name: getDisplayName(profile, email),
          password: hashedPassword,
          cart: {
            create: {},
          },
        },
        select: {
          id: true,
          role: true,
        },
      });
    } else if (user.role === "CUSTOMER") {
      await prisma.cart.upsert({
        where: {
          userId: user.id,
        },
        create: {
          userId: user.id,
        },
        update: {},
      });
    }

    const session = await createUserSession(user.id);
    const response = NextResponse.redirect(new URL(redirectPath, request.url));

    clearGoogleOAuthCookies(request, response);
    setSessionCookie(request, response, session.token, session.expiresAt);

    return response;
  } catch (error) {
    console.error("[api/auth/google/callback]", error);

    return createFailureRedirect(request, {
      message: getGoogleCallbackErrorMessage(error),
      redirectPath,
      view,
    });
  }
}
