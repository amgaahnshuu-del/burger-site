"use client";

import Image from "next/image";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useState } from "react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import { dashboardProfileRows } from "@/data/mockData";
import { useOrders } from "@/features/order/order.hooks";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/helpers";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuth();
  const { orders } = useOrders(isAuthenticated);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const displayName = user?.name || "Munkh-Erdene";
  const displayEmail = user?.email || "munkh-erdene@gmail.com";
  const displayPhone = user?.phone || "+976 9911 2233";
  const displayPoints =
    orders.length > 0
      ? `${(1200 + orders.reduce((sum, order) => sum + Math.floor(order.totalPrice / 120), 0)).toLocaleString()} P`
      : "2,350 P";

  async function handleLogout() {
    setIsLoggingOut(true);
    setError(null);

    try {
      await logout();
      router.push("/auth/login");
    } catch (logoutError) {
      setError(getErrorMessage(logoutError));
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <main className="space-y-6">
      <PageHeader title="Profile" />
      {error ? <Toast message={error} tone="error" /> : null}

      <Card className="rounded-[22px]" variant="default">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative h-[86px] w-[86px] overflow-hidden rounded-full bg-[rgba(255,90,0,0.14)] shadow-[0_0_24px_rgba(255,90,0,0.18)]">
              <Image alt={displayName} className="object-cover" fill sizes="86px" src="/aii.png" />
            </div>
            <div>
              <h2 className="text-[28px] font-semibold text-white">{displayName}</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Premium Member</p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{displayEmail}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{displayPhone}</p>
            </div>
          </div>

          <Button isLoading={isLoggingOut} onClick={handleLogout} size="sm" variant="danger">
            Logout
          </Button>
        </div>
      </Card>

      <section className="max-w-[960px] space-y-3">
        {dashboardProfileRows.map((row) => (
          <article className="card-hover dashboard-card flex h-16 items-center justify-between rounded-[14px] px-5" key={row.label}>
            <div>
              <p className="text-sm font-medium text-white">{row.label}</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-[var(--text-secondary)]">
                {row.label === "Points" ? displayPoints : row.value}
              </p>
              <ChevronRightIcon className="h-4 w-4 text-[var(--text-secondary)]" />
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
