"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import CourierDashboard from "@/components/courier/CourierDashboard";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import { useCourierOrders } from "@/features/courier/courier.hooks";
import { useAuth } from "@/hooks/useAuth";

export default function CourierPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const isCourier = user?.role === "COURIER";
  const { data, error, isLoading, refresh } = useCourierOrders({
    enabled: isAuthenticated && isCourier,
    pollIntervalMs: 10000,
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === "ADMIN") {
      router.replace("/admin?section=most-sell");
      return;
    }

    if (!authLoading && isAuthenticated && user?.role === "MANAGER") {
      router.replace("/manager");
    }
  }, [authLoading, isAuthenticated, router, user?.role]);

  if (authLoading || (isLoading && isCourier)) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="space-y-6">
        <PageHeader
          description="Sign in with a courier account to receive live delivery assignments."
          eyebrow="Courier"
          title="Courier Access"
        />
        <EmptyState
          action={
            <Button asChild>
              <Link href="/auth/login?redirect=/courier">Go to login</Link>
            </Button>
          }
          description="Courier deliveries, customer phone numbers, and live GPS updates are available after sign-in."
          title="Courier login required."
        />
      </main>
    );
  }

  if (!isCourier || !user) {
    return (
      <main className="space-y-6">
        <PageHeader
          description="This route is reserved for delivery staff accounts."
          eyebrow="Courier"
          title="Restricted courier area"
        />
        <EmptyState
          action={
            <Button asChild variant="secondary">
              <Link href="/">Back to home</Link>
            </Button>
          }
          description="Ask an admin to provide a courier account if you need access to live deliveries."
          title="You do not have courier access."
        />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="space-y-6">
        <PageHeader
          description="Courier orders will appear here as soon as the delivery feed is available."
          eyebrow="Courier"
          title="Delivery queue"
        />
        {error ? <Toast message={error} tone="error" /> : null}
      </main>
    );
  }

  return (
    <main className="space-y-6">
      {error ? <Toast message={error} tone="error" /> : null}
      <CourierDashboard
        activeOrders={data.activeOrders}
        availableOrders={data.availableOrders}
        completedToday={data.completedToday}
        onRefresh={refresh}
      />
    </main>
  );
}
