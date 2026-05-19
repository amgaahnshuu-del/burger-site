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
import { useAppLanguage } from "@/hooks/useAppLanguage";
import { useAuth } from "@/hooks/useAuth";

export default function CourierPage() {
  const { t } = useAppLanguage();
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
          description={t({
            en: "Sign in with a courier account to receive live delivery assignments.",
            mn: "Шууд хүргэлтийн даалгавар авахын тулд хүргэгчийн эрхтэй бүртгэлээр нэвтэрнэ үү.",
          })}
          eyebrow={t({ en: "Courier", mn: "Хүргэгч" })}
          title={t({ en: "Courier access", mn: "Хүргэгчийн хандалт" })}
        />
        <EmptyState
          action={(
            <Button asChild>
              <Link href="/auth/login?redirect=/courier">
                {t({ en: "Go to login", mn: "Нэвтрэх" })}
              </Link>
            </Button>
          )}
          description={t({
            en: "Courier deliveries, customer phone numbers, and live GPS updates are available after sign-in.",
            mn: "Хүргэлтүүд, хэрэглэгчийн утас, GPS шинэчлэлтүүд нэвтэрсний дараа харагдана.",
          })}
          title={t({ en: "Courier login required.", mn: "Хүргэгчийн нэвтрэлт шаардлагатай." })}
        />
      </main>
    );
  }

  if (!isCourier || !user) {
    return (
      <main className="space-y-6">
        <PageHeader
          description={t({
            en: "This route is reserved for delivery staff accounts.",
            mn: "Энэ хэсэг зөвхөн хүргэлтийн ажилтны бүртгэлд зориулагдсан.",
          })}
          eyebrow={t({ en: "Courier", mn: "Хүргэгч" })}
          title={t({ en: "Restricted courier area", mn: "Хязгаарлагдсан хүргэгчийн хэсэг" })}
        />
        <EmptyState
          action={(
            <Button asChild variant="secondary">
              <Link href="/">{t({ en: "Back to home", mn: "Нүүр рүү буцах" })}</Link>
            </Button>
          )}
          description={t({
            en: "Ask an admin to provide a courier account if you need access to live deliveries.",
            mn: "Хэрэв танд live хүргэлтэд хандах шаардлагатай бол админаас courier эрх хүснэ үү.",
          })}
          title={t({ en: "You do not have courier access.", mn: "Танд хүргэгчийн эрх алга." })}
        />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="space-y-6">
        <PageHeader
          description={t({
            en: "Courier orders will appear here as soon as the delivery feed is available.",
            mn: "Хүргэлтийн урсгал бэлэн болмогц захиалгууд энд харагдана.",
          })}
          eyebrow={t({ en: "Courier", mn: "Хүргэгч" })}
          title={t({ en: "Delivery queue", mn: "Хүргэлтийн дараалал" })}
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
