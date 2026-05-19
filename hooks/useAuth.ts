"use client";

import { useEffect, useSyncExternalStore } from "react";

import type { AuthUser } from "@/features/auth/auth.types";
import { getCurrentSession, logoutUser } from "@/features/auth/auth.service";
import { AUTH_UPDATED_EVENT, CART_UPDATED_EVENT } from "@/lib/constants";
import { dispatchAppEvent, getErrorMessage } from "@/lib/helpers";

type AuthSnapshot = {
  error: string | null;
  hasLoaded: boolean;
  isLoading: boolean;
  user: AuthUser | null;
};

const INITIAL_AUTH_SNAPSHOT: AuthSnapshot = {
  error: null,
  hasLoaded: false,
  isLoading: true,
  user: null,
};

let authSnapshot = INITIAL_AUTH_SNAPSHOT;
let authRequest: Promise<void> | null = null;
const authListeners = new Set<() => void>();

function emitAuthChange() {
  authListeners.forEach((listener) => listener());
}

function setAuthSnapshot(snapshot: AuthSnapshot) {
  authSnapshot = snapshot;
  emitAuthChange();
}

function updateAuthSnapshot(partial: Partial<AuthSnapshot>) {
  setAuthSnapshot({
    ...authSnapshot,
    ...partial,
  });
}

function subscribe(listener: () => void) {
  authListeners.add(listener);

  return () => {
    authListeners.delete(listener);
  };
}

function getSnapshot() {
  return authSnapshot;
}

async function syncAuthSession() {
  if (authRequest) {
    return authRequest;
  }

  updateAuthSnapshot({
    error: null,
    isLoading: true,
  });

  authRequest = (async () => {
    try {
      const session = await getCurrentSession();

      setAuthSnapshot({
        error: null,
        hasLoaded: true,
        isLoading: false,
        user: session?.user ?? null,
      });
    } catch (syncError) {
      setAuthSnapshot({
        error: getErrorMessage(syncError),
        hasLoaded: true,
        isLoading: false,
        user: null,
      });
    } finally {
      authRequest = null;
    }
  })();

  return authRequest;
}

export function useAuth() {
  const { error, isLoading, user } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot
  );

  useEffect(() => {
    if (!authSnapshot.hasLoaded) {
      void syncAuthSession();
    }
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      void syncAuthSession();
    };

    window.addEventListener(AUTH_UPDATED_EVENT, handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_UPDATED_EVENT, handleAuthChange);
    };
  }, []);

  function refresh() {
    void syncAuthSession();
  }

  async function logout() {
    await logoutUser();

    setAuthSnapshot({
      error: null,
      hasLoaded: true,
      isLoading: false,
      user: null,
    });

    dispatchAppEvent(CART_UPDATED_EVENT);
  }

  return {
    error,
    isAuthenticated: Boolean(user),
    isLoading,
    logout,
    refresh,
    user,
  };
}
