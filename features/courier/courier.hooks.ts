"use client";

import { useEffect, useState } from "react";

import type { CourierDashboardData } from "@/features/courier/courier.types";
import { getCourierOrders } from "@/features/courier/courier.service";
import { ApiError } from "@/lib/fetcher";
import { getErrorMessage } from "@/lib/helpers";

type UseCourierOrdersOptions = {
  enabled?: boolean;
  pollIntervalMs?: number;
};

export function useCourierOrders({
  enabled = true,
  pollIntervalMs = 10000,
}: UseCourierOrdersOptions = {}) {
  const [data, setData] = useState<CourierDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function loadCourierOrders() {
      if (!enabled) {
        setData(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        const nextData = await getCourierOrders();

        if (cancelled) {
          return;
        }

        setData(nextData);
        setError(null);
      } catch (courierError) {
        if (cancelled) {
          return;
        }

        if (courierError instanceof ApiError && (courierError.status === 401 || courierError.status === 403)) {
          setData(null);
          setError(null);
        } else {
          setError(getErrorMessage(courierError));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCourierOrders();

    if (enabled && pollIntervalMs > 0) {
      intervalId = setInterval(() => {
        void loadCourierOrders();
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
