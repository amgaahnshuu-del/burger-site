"use client";

import { useEffect, useState } from "react";

import type { Order } from "@/features/order/order.types";
import { getOrder, getOrders } from "@/features/order/order.service";
import { ApiError } from "@/lib/fetcher";
import { getErrorMessage } from "@/lib/helpers";

type OrderPollingOptions = {
  liveUpdates?: boolean;
  pollIntervalMs?: number;
};

export function useOrders(enabled = true, options: OrderPollingOptions = {}) {
  const { pollIntervalMs = 0 } = options;
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function loadOrders() {
      if (!enabled) {
        setOrders([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        const nextOrders = await getOrders();

        if (cancelled) {
          return;
        }

        setOrders(nextOrders);
        setError(null);
      } catch (ordersError) {
        if (cancelled) {
          return;
        }

        if (ordersError instanceof ApiError && ordersError.status === 401) {
          setOrders([]);
          setError(null);
        } else {
          setError(getErrorMessage(ordersError));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadOrders();

    if (enabled && pollIntervalMs > 0) {
      intervalId = setInterval(() => {
        void loadOrders();
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
    error,
    isLoading,
    orders,
    refresh,
  };
}

export function useOrderDetail(orderId: string, options: OrderPollingOptions = {}) {
  const { liveUpdates = false, pollIntervalMs = 0 } = options;
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(orderId));
  const [order, setOrder] = useState<Order | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let eventSource: EventSource | undefined;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function loadOrder() {
      if (!orderId) {
        setOrder(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        const nextOrder = await getOrder(orderId);

        if (cancelled) {
          return;
        }

        setOrder(nextOrder);
        setError(null);
      } catch (orderError) {
        if (cancelled) {
          return;
        }

        if (orderError instanceof ApiError && orderError.status === 404) {
          setOrder(null);
          setError("Order not found.");
        } else {
          setError(getErrorMessage(orderError));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadOrder();

    if (orderId && liveUpdates && typeof window !== "undefined" && "EventSource" in window) {
      eventSource = new EventSource(`/api/order/${encodeURIComponent(orderId)}/stream`);

      const handleOrderEvent = (event: MessageEvent<string>) => {
        if (cancelled) {
          return;
        }

        try {
          const nextOrder = JSON.parse(event.data) as Order;
          setOrder(nextOrder);
          setError(null);
          setIsLoading(false);
        } catch {
          return;
        }
      };

      const handleStreamErrorEvent = (event: MessageEvent<string>) => {
        if (cancelled) {
          return;
        }

        try {
          const payload = JSON.parse(event.data) as { message?: string };

          if (payload.message) {
            setError(payload.message);
          }
        } catch {
          return;
        }
      };

      eventSource.addEventListener("order", handleOrderEvent as EventListener);
      eventSource.addEventListener("error", handleStreamErrorEvent as EventListener);
      eventSource.onerror = () => {
        if (cancelled) {
          return;
        }

        setIsLoading(false);
      };
    }

    if (orderId && pollIntervalMs > 0) {
      intervalId = setInterval(() => {
        void loadOrder();
      }, pollIntervalMs);
    }

    return () => {
      cancelled = true;
      if (eventSource) {
        eventSource.close();
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [liveUpdates, orderId, pollIntervalMs, reloadKey]);

  function refresh() {
    if (!orderId) {
      return;
    }

    setIsLoading(true);
    setReloadKey((current) => current + 1);
  }

  return {
    error,
    isLoading,
    order,
    refresh,
  };
}
