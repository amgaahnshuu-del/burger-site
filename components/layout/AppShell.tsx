"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Footer from "@/components/layout/Footer";
import {
  applyInterfaceSettings,
  loadInterfaceSettings,
} from "@/lib/settings-preferences";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const authLayout = pathname.startsWith("/auth");
  const authFooterHidden =
    pathname === "/auth/login" ||
    pathname === "/auth/register";
  const plainLayout =
    authLayout ||
    pathname.startsWith("/api") ||
    pathname === "/_not-found";

  useEffect(() => {
    applyInterfaceSettings(loadInterfaceSettings());
  }, []);

  if (plainLayout) {
    if (authLayout) {
      if (authFooterHidden) {
        return (
          <div className="dashboard-shell relative min-h-screen overflow-x-hidden">
            {children}
          </div>
        );
      }

      return (
        <div className="dashboard-shell relative flex min-h-screen flex-col overflow-x-hidden">
          <div className="flex-1">
            {children}
          </div>
          <div className="px-4 pb-4 sm:px-6 lg:px-7">
            <div className="mx-auto w-full max-w-[1120px]">
              <Footer className="gap-4 pt-4 text-xs" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-shell relative min-h-screen overflow-x-hidden">
        {children}
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
