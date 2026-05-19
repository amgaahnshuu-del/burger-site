"use client";

import Link from "next/link";
import {
  Bars3Icon,
  BriefcaseIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  HomeIcon,
  MapIcon,
  PlusCircleIcon,
  Squares2X2Icon,
  TruckIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/solid";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/layout/Sidebar";
import Loader from "@/components/ui/Loader";
import { useAuth } from "@/hooks/useAuth";
import { useInterfaceSettings } from "@/hooks/useInterfaceSettings";
import {
  ADMIN_SECTION_EVENT,
  DEFAULT_ADMIN_SECTION,
  type AdminSection,
  dispatchAdminSectionChange,
  getAdminSectionFromSearch,
} from "@/lib/admin-navigation";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/helpers";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

type MobileNavItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  match?: readonly string[];
  exactMatch?: readonly string[];
  section?: AdminSection;
};

function getCustomerMobileItems(isMn: boolean): readonly MobileNavItem[] {
  return [
    { href: "/", icon: HomeIcon, label: isMn ? "ÃÂÃ’Â¯Ã’Â¯Ã‘â‚¬" : "Home" },
    { href: "/menu", icon: Squares2X2Icon, label: isMn ? "ÃÂ¦Ã‘ÂÃ‘Â" : "Menu" },
    { href: "/orders", icon: ChartBarIcon, label: isMn ? "Ãâ€”ÃÂ°Ã‘â€¦ÃÂ¸ÃÂ°ÃÂ»ÃÂ³ÃÂ°" : "Orders" },
    { href: "/ai-assistant", icon: ChartBarIcon, label: "AI" },
  ] as const;
}

function getAdminMobileItems(isMn: boolean): readonly MobileNavItem[] {
  return [
    { href: "/admin?section=foods", icon: Squares2X2Icon, label: isMn ? "ÃÂ¥ÃÂ¾ÃÂ¾ÃÂ»ÃÂ½Ã‘Æ’Ã‘Æ’ÃÂ´" : "Foods", section: "foods" },
    { href: "/admin?section=most-sell", icon: ChartBarIcon, label: isMn ? "Ãâ€˜ÃÂ¾Ã‘â‚¬ÃÂ»Ã‘Æ’Ã‘Æ’ÃÂ»ÃÂ°ÃÂ»Ã‘â€š" : "Most Sell", section: "most-sell" },
    { href: "/admin?section=users", icon: UserGroupIcon, label: isMn ? "ÃÂ¥Ã‘ÂÃ‘â‚¬Ã‘ÂÃÂ³ÃÂ»Ã‘ÂÃÂ³Ã‘â€¡ÃÂ¸ÃÂ´" : "Users", section: "users" },
    { href: "/admin/managers", icon: BriefcaseIcon, label: "Managers", match: ["/admin/managers"] },
    { href: "/admin?section=couriers", icon: TruckIcon, label: isMn ? "ÃÂ¥Ã’Â¯Ã‘â‚¬ÃÂ³Ã‘ÂÃÂ³Ã‘â€¡ÃÂ¸ÃÂ´" : "Couriers", section: "couriers" },
    { href: "/admin?section=add-food", icon: PlusCircleIcon, label: isMn ? "ÃÂ¥ÃÂ¾ÃÂ¾ÃÂ» ÃÂ½Ã‘ÂÃÂ¼Ã‘ÂÃ‘â€¦" : "Add Food", section: "add-food" },
  ] as const;
}

function getCourierMobileItems(isMn: boolean): readonly MobileNavItem[] {
  return [
    { href: "/courier", icon: HomeIcon, label: isMn ? "ÃÂ¥Ã’Â¯Ã‘â‚¬ÃÂ³Ã‘ÂÃÂ»Ã‘â€š" : "Deliveries" },
    { href: "/courier/active-track", icon: MapIcon, label: isMn ? "ÃÂ¥Ã‘ÂÃÂ½ÃÂ°Ã‘â€¦" : "Track" },
    { href: "/settings", icon: UserGroupIcon, label: isMn ? "Ãâ€˜Ã’Â¯Ã‘â‚¬Ã‘â€šÃÂ³Ã‘ÂÃÂ»" : "Account" },
  ] as const;
}

function getManagerMobileItems(isMn: boolean): readonly MobileNavItem[] {
  return [
    { href: "/manager", icon: ClipboardDocumentListIcon, label: isMn ? "Incoming" : "Incoming", exactMatch: ["/manager"] },
    { href: "/manager/preparing", icon: Squares2X2Icon, label: isMn ? "Cooking" : "Cooking", exactMatch: ["/manager/preparing"] },
    { href: "/manager/ready", icon: TruckIcon, label: isMn ? "Ready" : "Ready", exactMatch: ["/manager/ready"] },
    { href: "/manager/delivering", icon: MapIcon, label: isMn ? "On Road" : "On Road", exactMatch: ["/manager/delivering"] },
    { href: "/settings", icon: UserGroupIcon, label: isMn ? "Ãâ€˜Ã’Â¯Ã‘â‚¬Ã‘â€šÃÂ³Ã‘ÂÃÂ»" : "Account", match: ["/settings", "/protected/settings", "/profile", "/protected/profile"] },
  ] as const;
}

function isCustomerActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/" || pathname === "/home" || pathname === "/public";
  }

  if (href === "/menu") {
    return pathname.startsWith("/menu") || pathname.startsWith("/public/explore");
  }

  if (href === "/orders") {
    return pathname.startsWith("/orders") || pathname.startsWith("/protected/orders");
  }

  if (href === "/ai-assistant") {
    return pathname.startsWith("/ai-assistant") || pathname.startsWith("/public/ai-agent");
  }

  return pathname.startsWith(href);
}

function isCourierActive(pathname: string, href: string) {
  if (href === "/courier") {
    return pathname === "/courier";
  }

  if (href === "/courier/active-track") {
    return pathname.startsWith("/courier/active-track");
  }

  return pathname.startsWith(href);
}

function isAdminMobileActive(
  pathname: string,
  activeSection: AdminSection,
  item: MobileNavItem
) {
  if (item.section) {
    return pathname === "/admin" && activeSection === item.section;
  }

  return (item.match ?? [item.href]).some((route) => (
    pathname === route || pathname.startsWith(`${route}/`)
  ));
}

function isManagerMobileActive(pathname: string, item: MobileNavItem) {
  if (item.exactMatch?.some((route) => pathname === route)) {
    return true;
  }

  return (item.match ?? [item.href]).some((route) => (
    pathname === route || pathname.startsWith(`${route}/`)
  ));
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { settings: interfaceSettings } = useInterfaceSettings();
  const { isLoading, user } = useAuth();

  const [activeSection, setActiveSection] = useState(DEFAULT_ADMIN_SECTION);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isMn = interfaceSettings.language === "mn";
  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "MANAGER";
  const isCourier = user?.role === "COURIER";
  const isMenuPage = pathname.startsWith("/menu") || pathname.startsWith("/public/explore");
  const isAIAgentPage = pathname.startsWith("/public/ai-agent");
  const isOrdersDashboardPage = pathname.startsWith("/protected/orders");
  const isTrackingDashboardPage =
    pathname.startsWith("/protected/tracking") ||
    pathname.startsWith("/track-order");

  const brandHref = isAdmin ? "/admin?section=most-sell" : isManager ? "/manager" : isCourier ? "/courier" : "/";
  const adminMobileItems: readonly MobileNavItem[] = [
    ...getAdminMobileItems(isMn),
    { href: "/admin/settings", icon: Cog6ToothIcon, label: "Settings", match: ["/admin/settings"] },
  ];
  const mobileItems = isAdmin
    ? adminMobileItems
    : isManager
      ? getManagerMobileItems(isMn)
      : isCourier
        ? getCourierMobileItems(isMn)
        : getCustomerMobileItems(isMn);

  useEffect(() => {
    if (!isLoading && isAdmin && !pathname.startsWith("/admin")) {
      router.replace("/admin?section=most-sell");
    }
  }, [isAdmin, isLoading, pathname, router]);

  useEffect(() => {
    if (!isLoading && isAdmin && pathname === "/admin" && typeof window !== "undefined" && !new URLSearchParams(window.location.search).get("section")) {
      router.replace("/admin?section=most-sell");
    }
  }, [isAdmin, isLoading, pathname, router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncSection = () => {
      setActiveSection(getAdminSectionFromSearch(window.location.search));
    };

    const handleSectionChange = (event: Event) => {
      setActiveSection((event as CustomEvent<AdminSection>).detail || DEFAULT_ADMIN_SECTION);
    };

    syncSection();
    window.addEventListener("popstate", syncSection);
    window.addEventListener(ADMIN_SECTION_EVENT, handleSectionChange as EventListener);

    return () => {
      window.removeEventListener("popstate", syncSection);
      window.removeEventListener(ADMIN_SECTION_EVENT, handleSectionChange as EventListener);
    };
  }, []);

  if (!isLoading && isAdmin && !pathname.startsWith("/admin")) {
    return (
      <div className="dashboard-shell flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "dashboard-shell relative min-h-screen overflow-x-hidden",
        isMenuPage && "dashboard-shell-neutral"
      )}
    >
      <div className="fixed inset-x-0 top-0 z-40 border-b border-[var(--border-soft)] bg-[rgba(7,7,7,0.92)] px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link
            className="flex items-center gap-3"
            href={brandHref}
            onClick={() => {
              if (isAdmin) {
                dispatchAdminSectionChange("most-sell");
              }
            }}
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gradient-accent)] text-sm font-black text-white shadow-[var(--shadow-button)]">
              B
            </span>
            <span className="text-lg font-extrabold text-white">{APP_NAME}</span>
          </Link>

          <button
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-[var(--border-soft)] bg-[var(--bg-card)] text-white"
            onClick={() => setMobileOpen((current) => !current)}
            type="button"
          >
            {mobileOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="relative z-10 lg:pl-[240px]">
        <main
          className={cn(
            "px-4 pb-24 pt-20 sm:px-6",
            isAIAgentPage
              ? "min-h-screen lg:px-5 lg:pb-3 lg:pt-3"
              : isTrackingDashboardPage
                ? "min-h-0 lg:pb-[20px] lg:pl-[30px] lg:pr-[36px] lg:pt-[36px]"
                : isOrdersDashboardPage
                  ? "min-h-screen lg:pb-[20px] lg:pl-[30px] lg:pr-[36px] lg:pt-[36px]"
                  : "min-h-screen lg:px-7 lg:pb-8 lg:pt-7"
          )}
        >
          <div
            className={cn(
              "mx-auto w-full",
              isAIAgentPage
                ? "max-w-[1220px]"
                : isOrdersDashboardPage || isTrackingDashboardPage
                  ? "max-w-[1130px]"
                  : "max-w-[1560px]"
            )}
          >
            {children}

            <Footer
              isMn={isMn}
              className={cn(
                isAIAgentPage
                  ? "mt-3 gap-3 pt-3 text-[10px]"
                  : isOrdersDashboardPage
                    ? "mt-7 gap-6 pt-3 text-xs"
                    : isTrackingDashboardPage
                      ? "mt-7 gap-6 pt-3 text-xs"
                      : "mt-10 gap-4 pt-6 text-xs"
              )}
            />
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-[18px] border border-[var(--border-soft)] bg-[rgba(17,17,19,0.92)] p-2 shadow-[var(--shadow-card)] backdrop-blur-xl lg:hidden">
        <div
          className={cn(
            "grid gap-2",
            mobileItems.length === 2
              ? "grid-cols-2"
              : mobileItems.length === 3 || mobileItems.length === 6
                ? "grid-cols-3"
                : mobileItems.length === 5
                  ? "grid-cols-5"
                  : "grid-cols-4"
          )}
        >
          {mobileItems.map((item) => {
            const Icon = item.icon;
            const active = isAdmin
              ? isAdminMobileActive(pathname, activeSection, item)
              : isManager
                ? isManagerMobileActive(pathname, item)
                : isCourier
                  ? isCourierActive(pathname, item.href)
                  : isCustomerActive(pathname, item.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center rounded-[14px] border px-2 text-[11px] font-medium transition-all duration-200",
                  active
                    ? "border-orange-300/35 bg-orange-500 text-white"
                    : "border-transparent text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-white"
                )}
                href={item.href}
                key={item.href}
                onClick={() => {
                  if (isAdmin && item.section) {
                    setActiveSection(item.section);
                    dispatchAdminSectionChange(item.section);
                  }
                  setMobileOpen(false);
                }}
                style={active
                  ? {
                      boxShadow: "0 10px 24px rgba(255, 106, 0, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                    }
                  : undefined}
              >
                <Icon className="mb-1 h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
