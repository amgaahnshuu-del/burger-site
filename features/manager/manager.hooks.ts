"use client";

import { useEffect, useState } from "react";

import type { ManagerDashboardData } from "@/features/manager/manager.types";
import { getManagerOrders } from "@/features/manager/manager.service";
import { ApiError } from "@/lib/fetcher";
import { getErrorMessage } from "@/lib/helpers";

type UseManagerOrdersOptions = {
  enabled?: boolean;
  pollIntervalMs?: number;
};

export function useManagerOrders({
  enabled = true,
  pollIntervalMs = 10000,
}: UseManagerOrdersOptions = {}) {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function loadManagerOrders() {
      if (!enabled) {
        setData(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        const nextData = await getManagerOrders();

        if (cancelled) {
          return;
        }

        setData(nextData);
        setError(null);
      } catch (managerError) {
        if (cancelled) {
          return;
        }

        if (managerError instanceof ApiError && (managerError.status === 401 || managerError.status === 403)) {
          setData(null);
          setError(null);
        } else {
          setError(getErrorMessage(managerError));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadManagerOrders();

    if (enabled && pollIntervalMs > 0) {
      intervalId = setInterval(() => {
        void loadManagerOrders();
      }, pollIntervalMs);
    }

    return () => {
      cancelled = true;

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enabled, pollIntervalMs, reloadKey]);

  function refresh() {
    setIsLoading(true);
    setReloadKey((current) => current + 1);
  }

  return {
    data,
    error,
    isLoading,
    refresh,
  };
}
