"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import ManagerDashboard, {
  type ManagerDashboardMode,
} from "@/components/manager/ManagerDashboard";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import { useManagerOrders } from "@/features/manager/manager.hooks";
import { useAuth } from "@/hooks/useAuth";

const MANAGER_ROUTE_COPY: Record<ManagerDashboardMode, {
  description: string;
  title: string;
}> = {
  delivering: {
    description: "Track deliveries that couriers already claimed from the ready queue.",
    title: "Orders on the road",
  },
  incoming: {
    description: "Review fresh checkouts and move accepted orders into cooking.",
    title: "Incoming orders",
  },
  preparing: {
    description: "Watch the kitchen line and release packed meals to courier pickup.",
    title: "Orders in preparation",
  },
  ready: {
    description: "See meals that are packed and waiting for courier pickup.",
    title: "Ready for courier",
  },
};

type ManagerWorkspaceProps = {
  mode: ManagerDashboardMode;
};

export default function ManagerWorkspace({ mode }: ManagerWorkspaceProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const isManager = user?.role === "MANAGER";
  const { data, error, isLoading, refresh } = useManagerOrders({
    enabled: isAuthenticated && isManager,
    pollIntervalMs: 10000,
  });

  const viewCopy = MANAGER_ROUTE_COPY[mode];
  const loginHref = `/auth/login?redirect=${encodeURIComponent(pathname || "/manager")}`;

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === "ADMIN") {
      router.replace("/admin?section=most-sell");
      return;
    }

    if (!authLoading && isAuthenticated && user?.role === "COURIER") {
      router.replace("/courier");
    }
  }, [authLoading, isAuthenticated, router, user?.role]);

  if (authLoading || (isLoading && isManager)) {
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
          description="Sign in with a manager account to review orders and move them through each kitchen queue."
          eyebrow="Manager"
          title="Manager Access"
        />
        <EmptyState
          action={(
            <Button asChild>
              <Link href={loginHref}>Go to login</Link>
            </Button>
          )}
          description="Kitchen dispatch, queue handoff, and courier release tools become available after sign-in."
          title="Manager login required."
        />
      </main>
    );
  }

  if (!isManager || !user) {
    return (
      <main className="space-y-6">
        <PageHeader
          description="This route is reserved for kitchen manager accounts."
          eyebrow="Manager"
          title="Restricted manager area"
        />
        <EmptyState
          action={(
            <Button asChild variant="secondary">
              <Link href="/">Back to home</Link>
            </Button>
          )}
          description="Ask an admin to create a manager account if you need access to order dispatch."
          title="You do not have manager access."
        />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="space-y-6">
        <PageHeader
          description={viewCopy.description}
          eyebrow="Manager"
          title={viewCopy.title}
        />
        {error ? <Toast message={error} tone="error" /> : null}
      </main>
    );
  }

  return (
    <main className="space-y-6">
      {error ? <Toast message={error} tone="error" /> : null}
      <ManagerDashboard
        deliveredToday={data.deliveredToday}
        deliveringOrders={data.deliveringOrders}
        incomingOrders={data.incomingOrders}
        mode={mode}
        onRefresh={refresh}
        preparingOrders={data.preparingOrders}
        readyOrders={data.readyOrders}
      />
    </main>
  );
}
