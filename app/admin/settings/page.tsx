"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import SharedSettingsPage from "@/app/protected/settings/page";
import Loader from "@/components/ui/Loader";
import { useAuth } from "@/hooks/useAuth";

const ADMIN_SETTINGS_LOGIN_URL = "/auth/login?redirect=%2Fadmin%2Fsettings";

export default function AdminSettingsPage() {
  const router = useRouter();
  const { isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace(ADMIN_SETTINGS_LOGIN_URL);
      return;
    }

    if (user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [isLoading, router, user]);

  if (isLoading || !user || user.role !== "ADMIN") {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </main>
    );
  }

  return <SharedSettingsPage />;
}
