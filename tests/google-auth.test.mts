import assert from "node:assert/strict";
import test from "node:test";

import { getGoogleRedirectUri } from "../lib/google-auth.ts";

function withGoogleEnv(
  overrides: Partial<NodeJS.ProcessEnv>,
  run: () => void | Promise<void>
) {
  const originalClientId = process.env.GOOGLE_CLIENT_ID;
  const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const originalRedirectUri = process.env.GOOGLE_REDIRECT_URI;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  process.env.GOOGLE_CLIENT_ID = "test-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";

  if (overrides.GOOGLE_REDIRECT_URI === undefined) {
    delete process.env.GOOGLE_REDIRECT_URI;
  } else {
    process.env.GOOGLE_REDIRECT_URI = overrides.GOOGLE_REDIRECT_URI;
  }

  if (overrides.NEXT_PUBLIC_APP_URL === undefined) {
    delete process.env.NEXT_PUBLIC_APP_URL;
  } else {
    process.env.NEXT_PUBLIC_APP_URL = overrides.NEXT_PUBLIC_APP_URL;
  }

  return Promise.resolve(run()).finally(() => {
    if (originalClientId === undefined) {
      delete process.env.GOOGLE_CLIENT_ID;
    } else {
      process.env.GOOGLE_CLIENT_ID = originalClientId;
    }

    if (originalClientSecret === undefined) {
      delete process.env.GOOGLE_CLIENT_SECRET;
    } else {
      process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
    }

    if (originalRedirectUri === undefined) {
      delete process.env.GOOGLE_REDIRECT_URI;
    } else {
      process.env.GOOGLE_REDIRECT_URI = originalRedirectUri;
    }

    if (originalAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    }
  });
}

test("getGoogleRedirectUri prefers the configured public app URL on proxied hosts", async () => {
  await withGoogleEnv(
    {
      GOOGLE_REDIRECT_URI: "http://localhost:3000/api/auth/google/callback",
      NEXT_PUBLIC_APP_URL: "https://burger-site.onrender.com",
    },
    () => {
      const request = new Request("https://0.0.0.0:10000/api/auth/google/start", {
        headers: {
          "x-forwarded-host": "burger-site.onrender.com",
          "x-forwarded-proto": "https",
        },
      });

      assert.equal(
        getGoogleRedirectUri(request),
        "https://burger-site.onrender.com/api/auth/google/callback"
      );
    }
  );
});

test("getGoogleRedirectUri keeps the local override during localhost development", async () => {
  await withGoogleEnv(
    {
      GOOGLE_REDIRECT_URI: "http://localhost:3000/api/auth/google/callback",
      NEXT_PUBLIC_APP_URL: undefined,
    },
    () => {
      const request = new Request("http://localhost:3000/api/auth/google/start");

      assert.equal(
        getGoogleRedirectUri(request),
        "http://localhost:3000/api/auth/google/callback"
      );
    }
  );
});
