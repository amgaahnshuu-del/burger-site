"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BriefcaseIcon,
  ChartBarIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  HeartIcon,
  HomeIcon,
  MapIcon,
  MapPinIcon,
  PlusCircleIcon,
  Squares2X2Icon,
  TruckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { ClipboardDocumentListIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import Button from "@/components/ui/Button";
import LanguageToggle from "@/components/ui/LanguageToggle";
import { useCourierOrders } from "@/features/courier/courier.hooks";
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

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

type NavItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  match: readonly string[];
  exactMatch?: readonly string[];
  section?: AdminSection;
};

function getCustomerNavItems(isMn: boolean): readonly NavItem[] {
  return [
    {
      href: "/",
      icon: HomeIcon,
      label: isMn ? "Нүүр" : "Home",
      match: ["/", "/home", "/public"],
      exactMatch: ["/", "/home", "/public"],
    },
    {
      href: "/menu",
      icon: Squares2X2Icon,
      label: isMn ? "Цэс" : "Menu",
      match: ["/menu", "/public/explore"],
    },
    {
      href: "/orders",
      icon: ClipboardDocumentListIcon,
      label: isMn ? "Захиалгууд" : "Orders",
      match: ["/orders", "/protected/orders", "/protected/order"],
    },
    {
      href: "/track-order",
      icon: MapIcon,
      label: isMn ? "Захиалгын байршил" : "Track Order",
      match: ["/track-order", "/protected/tracking", "/protected/order/track"],
    },
    {
      href: "/favorites",
      icon: HeartIcon,
      label: isMn ? "Дуртай" : "Favorites",
      match: ["/favorites", "/protected/favorites"],
    },
    {
      href: "/ai-assistant",
      icon: SparklesIcon,
      label: isMn ? "AI Туслах" : "AI Assistant",
      match: ["/ai-assistant", "/public/ai-agent"],
    },
  ] as const;
}

function getAdminNavItems(isMn: boolean): readonly NavItem[] {
  return [
    {
      href: "/admin?section=foods",
      icon: Squares2X2Icon,
      label: isMn ? "Хоолнууд" : "Foods",
      match: ["/admin"],
      section: "foods",
    },
    {
      href: "/admin?section=most-sell",
      icon: ChartBarIcon,
      label: isMn ? "Борлуулалт" : "Most Sell",
      match: ["/admin"],
      section: "most-sell",
    },
    {
      href: "/admin?section=users",
      icon: UserGroupIcon,
      label: isMn ? "Хэрэглэгчид" : "Users",
      match: ["/admin"],
      section: "users",
    },
    {
      href: "/admin/managers",
      icon: BriefcaseIcon,
      label: isMn ? "Менежерүүд" : "Managers",
      match: ["/admin/managers"],
    },
    {
      href: "/admin?section=couriers",
      icon: TruckIcon,
      label: isMn ? "Хүргэгчид" : "Couriers",
      match: ["/admin"],
      section: "couriers",
    },
    {
      href: "/admin?section=add-food",
      icon: PlusCircleIcon,
      label: isMn ? "Хоол нэмэх" : "Add Food",
      match: ["/admin"],
      section: "add-food",
    },
  ] as const;
}

function getCourierNavItems(isMn: boolean): readonly NavItem[] {
  return [
    {
      href: "/courier",
      icon: HomeIcon,
      label: isMn ? "Хүргэлтүүд" : "Deliveries",
      match: ["/courier"],
      exactMatch: ["/courier"],
    },
    {
      href: "/courier/active-track",
      icon: MapIcon,
      label: isMn ? "Идэвхтэй хяналт" : "Active Track",
      match: ["/courier/active-track"],
      exactMatch: ["/courier/active-track"],
    },
    {
      href: "/settings",
      icon: UserGroupIcon,
      label: isMn ? "Бүртгэл" : "Account",
      match: ["/settings", "/protected/settings", "/profile", "/protected/profile"],
    },
  ] as const;
}

function getManagerNavItems(isMn: boolean): readonly NavItem[] {
  return [
    {
      href: "/manager",
      icon: ClipboardDocumentListIcon,
      label: isMn ? "Ирсэн" : "Incoming",
      match: ["/manager"],
      exactMatch: ["/manager"],
    },
    {
      href: "/manager/preparing",
      icon: Squares2X2Icon,
      label: isMn ? "Бэлтгэж буй" : "Preparing",
      match: ["/manager/preparing"],
      exactMatch: ["/manager/preparing"],
    },
    {
      href: "/manager/ready",
      icon: TruckIcon,
      label: isMn ? "Бэлэн" : "Ready",
      match: ["/manager/ready"],
      exactMatch: ["/manager/ready"],
    },
    {
      href: "/manager/delivering",
      icon: MapIcon,
      label: isMn ? "Замд" : "On Road",
      match: ["/manager/delivering"],
      exactMatch: ["/manager/delivering"],
    },
    {
      href: "/settings",
      icon: UserGroupIcon,
      label: isMn ? "Бүртгэл" : "Account",
      match: ["/settings", "/protected/settings", "/profile", "/protected/profile"],
    },
  ] as const;
}

function matchesCustomerPath(
  pathname: string,
  routes: readonly string[],
  exactRoutes: readonly string[] = []
) {
  return routes.some((route) => (
    exactRoutes.includes(route)
      ? pathname === route
      : pathname === route || pathname.startsWith(`${route}/`)
  ));
}

function isAdminNavActive(
  pathname: string,
  activeSection: AdminSection,
  item: NavItem
) {
  if (item.section) {
    return pathname === "/admin" && activeSection === item.section;
  }

  return matchesCustomerPath(pathname, item.match, item.exactMatch);
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { settings: interfaceSettings } = useInterfaceSettings();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState(DEFAULT_ADMIN_SECTION);

  const isMn = interfaceSettings.language === "mn";
  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "MANAGER";
  const isCourier = user?.role === "COURIER";
  const isAIAgentPage = false;
  const isOrdersDashboardPage = false;
  const isTrackingDashboardPage = pathname.startsWith("/protected/tracking");

  const displayName = user?.name || (isMn ? "Зочин хэрэглэгч" : "Guest User");
  const displayMeta = isManager
    ? (isMn ? "Гал тогооны менежер" : "Kitchen manager account")
    : isCourier
      ? (isMn ? "Хүргэлтийн ажилтны бүртгэл" : "Live courier account")
      : user?.email || (isMn ? "Бүртгэлээ удирдах" : "Manage your account");

  const brandHref = isAdmin ? "/admin?section=most-sell" : isManager ? "/manager" : isCourier ? "/courier" : "/";
  const adminNavItems: readonly NavItem[] = [
    ...getAdminNavItems(isMn),
    { href: "/admin/settings", icon: Cog6ToothIcon, label: isMn ? "Тохиргоо" : "Settings", match: ["/admin/settings"] },
  ];
  const navItems = isAdmin
    ? adminNavItems
    : isManager
      ? getManagerNavItems(isMn)
      : isCourier
        ? getCourierNavItems(isMn)
        : getCustomerNavItems(isMn);
  const { data: courierData } = useCourierOrders({
    enabled: isCourier,
    pollIntervalMs: 12000,
  });
  const activeCourierOrder = courierData?.activeOrders[0] ?? null;
  const activeCourierLocation = activeCourierOrder?.addressLabel?.trim()
    ? `${activeCourierOrder.addressLabel.trim()}${activeCourierOrder.address ? ` • ${activeCourierOrder.address}` : ""}`
    : activeCourierOrder?.address ?? null;
  const activeCourierLocationLabel = activeCourierLocation?.replace("â€¢", " - ");
  const activeCourierCustomerName = activeCourierOrder?.user?.name ?? (isMn ? "Хэрэглэгч" : "Customer");
  void activeCourierLocationLabel;
  void activeCourierCustomerName;

  const accountHref = isAdmin ? "/admin/settings" : "/settings";
  const accountRouteActive = isAdmin
    ? matchesCustomerPath(pathname, ["/admin/settings"])
    : matchesCustomerPath(pathname, [
        "/profile",
        "/protected/profile",
        "/settings",
        "/protected/settings",
      ]);

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

  return (
    <>
      <div
        aria-hidden={!mobileOpen}
        className={cn(
          "fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r px-5 py-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition duration-300 lg:z-30",
          isOrdersDashboardPage
            ? "w-[214px] border-white/6 bg-[#050505] px-4 py-[22px]"
            : isAIAgentPage
            ? "w-[220px] border-white/5 bg-[#050505] px-3 py-3"
            : "w-[240px] border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01)),#09090B]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <Link
          className={cn(
            "flex items-center gap-3",
            isAIAgentPage ? "px-1.5 pt-0.5" : "",
            isOrdersDashboardPage ? "pt-0" : ""
          )}
          href={brandHref}
          onClick={() => {
            if (isAdmin) {
              setActiveSection("most-sell");
              dispatchAdminSectionChange("most-sell");
            }
            onClose();
          }}
        >
          <span className={cn(
            "relative inline-flex items-center justify-center overflow-hidden rounded-[12px] bg-white/6 ring-1 ring-white/10",
            isOrdersDashboardPage ? "h-8 w-8" : isAIAgentPage ? "h-7 w-7" : "h-8 w-8"
          )}>
            <Image
              alt={`${APP_NAME} logo`}
              className="object-contain "
              fill
              sizes={isAIAgentPage ? "38px" : "42px"}
              src="/logo.png"
            />
          </span>
          <span className={cn("font-extrabold text-white", isOrdersDashboardPage ? "text-[21px]" : isAIAgentPage ? "text-[18px]" : "text-[22px]")}>
            {APP_NAME}
          </span>
        </Link>

        <nav className={cn("premium-scrollbar flex-1 overflow-y-auto pr-1", isOrdersDashboardPage ? "mt-[22px]" : isAIAgentPage ? "mt-5" : "mt-8")}>
          <div className={cn(isOrdersDashboardPage ? "space-y-[10px]" : isAIAgentPage ? "space-y-1" : "space-y-2")}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isAdmin
                ? isAdminNavActive(pathname, activeSection, item)
                : matchesCustomerPath(pathname, item.match, item.exactMatch);

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 border text-sm transition-all duration-200",
                    isOrdersDashboardPage
                      ? "h-[42px] w-[158px] rounded-[13px] px-[12px] text-[11px] font-medium"
                      : isAIAgentPage
                        ? "h-[36px] rounded-[12px] px-[10px] text-[12px] font-medium"
                        : "h-[44px] rounded-[12px] px-[14px]",
                    active
                      ? (
                        isOrdersDashboardPage
                          ? "border-orange-300/35 bg-[linear-gradient(135deg,#ff6a00,#ff8a1f)] text-white"
                          : isAIAgentPage
                          ? "border-orange-300/35 bg-[linear-gradient(135deg,#ff6a00,#ff8a1f)] text-white"
                          : isTrackingDashboardPage
                            ? "border-orange-300/35 bg-[linear-gradient(135deg,#ff6a00,#ff8a1f)] text-white"
                          : "border-orange-300/35 bg-orange-500 text-white"
                      )
                      : (
                        isOrdersDashboardPage
                          ? "border-transparent bg-transparent text-[#d4d4d8] hover:bg-white/[0.045] hover:text-white"
                          : isAIAgentPage
                          ? "border-transparent bg-transparent text-white/70 hover:bg-white/[0.03] hover:text-white"
                          : "border-transparent text-[#d4d4d8] hover:bg-white/[0.045] hover:text-white"
                      )
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={() => {
                    if (isAdmin && item.section) {
                      setActiveSection(item.section);
                      dispatchAdminSectionChange(item.section);
                    }
                    onClose();
                  }}
                  style={active
                    ? {
                        boxShadow: isOrdersDashboardPage
                          ? "0 12px 30px rgba(255,106,0,.35), inset 0 1px 0 rgba(255,255,255,.08)"
                          : isTrackingDashboardPage
                            ? "0 12px 30px rgba(255,106,0,.32), inset 0 1px 0 rgba(255,255,255,.08)"
                          : "0 10px 24px rgba(255, 106, 0, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                      }
                    : undefined}
                >
                  <Icon
                    className={cn(
                      isOrdersDashboardPage ? "h-4 w-4" : "h-[15px] w-[15px]",
                      active ? "text-white" : "text-[#a1a1aa]",
                      isAIAgentPage && !active && "text-white/54",
                      !isAIAgentPage && !isOrdersDashboardPage && "h-[18px] w-[18px]"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {isAdmin ? (
            <div className="mt-8 rounded-[18px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01)),#101012] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.26)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-300/70">
                {isMn ? "Админ горим" : "Admin Mode"}
              </p>
              <h3 className="mt-3 text-lg font-bold text-white">
                {isMn ? "Хяналтын самбар" : "Control dashboard"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/56">
                {isMn
                  ? "Хоолнууд, шилдэг борлуулалт, хэрэглэгч болон хүргэгчийн бүртгэлийг нэг дороос удирдаарай."
                  : "Manage foods, watch best sellers, and handle customer or courier accounts from one place."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/72">
                  {isMn ? "Хоол" : "Foods"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/72">
                  {isMn ? "Борлуулалт" : "Sales"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/72">
                  {isMn ? "Хэрэглэгч" : "Users"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/72">
                  {isMn ? "Хүргэгч" : "Couriers"}
                </span>
              </div>
            </div>
          ) : isManager ? (
            <div className="mt-8 rounded-[18px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01)),#101012] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.26)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-300/70">
                {isMn ? "Менежер горим" : "Manager Mode"}
              </p>
              <h3 className="mt-3 text-lg font-bold text-white">
                {isMn ? "Гал тогооны хуваарилалт" : "Kitchen dispatch"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/56">
                {isMn
                  ? "Шинэ захиалгуудыг хоол бэлтгэл рүү шилжүүлээд, савласан захиалгыг хүргэгчийн дараалалд гаргана."
                  : "Move incoming orders into cooking, then release packed meals to the courier pickup queue."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/72">
                  {isMn ? "Ирсэн" : "Incoming"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/72">
                  {isMn ? "Бэлтгэл" : "Cooking"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/72">
                  {isMn ? "Хүргэгчийн дараалал" : "Courier Queue"}
                </span>
              </div>
            </div>
          ) : isCourier ? (
            <div className="mt-8 rounded-[18px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01)),#101012] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.26)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-300/70">
                {isMn ? "Хүргэгч горим" : "Courier Mode"}
              </p>
              <h3 className="mt-3 text-lg font-bold text-white">
                {isMn ? "Байршлын шууд холбоос" : "Live route sync"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/56">
                {isMn
                  ? "Browser-ийн GPS-ээ асаалттай байлгавал хэрэглэгчид таны байршлыг бодит цаг дээр харна."
                  : "Keep browser GPS enabled so customers can watch your delivery location update in real time."}
              </p>
              <div className="mt-4 hidden rounded-[14px] border border-orange-400/14 bg-orange-500/[0.06] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200/72">
                    {isMn ? "Идэвхтэй хяналт" : "Active Track"}
                  </p>
                  {activeCourierOrder ? (
                    <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/62">
                      #{activeCourierOrder.id.slice(0, 8)}
                    </span>
                  ) : null}
                </div>
                {activeCourierOrder ? (
                  <>
                    <p className="mt-3 text-sm font-semibold text-white">
                      {activeCourierOrder.user?.name ?? (isMn ? "Ð¥ÑÑ€ÑÐ³Ð»ÑÐ³Ñ‡" : "Customer")}
                    </p>
                    <div className="mt-3 flex items-start gap-2 text-sm leading-6 text-white/62">
                      <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
                      <p>{activeCourierLocation ?? (isMn ? "Ð¥Ð°ÑÐ³ Ð¾Ñ€ÑƒÑƒÐ»Ð°Ð°Ð³Ò¯Ð¹" : "No location provided")}</p>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-white/56">
                    {isMn
                      ? "Ð¥Ò¯Ð»ÑÑÐ¶ Ð°Ð²ÑÐ°Ð½ Ñ…Ò¯Ñ€Ð³ÑÐ»Ñ‚ Ð±Ð°Ð¹Ñ…Ð³Ò¯Ð¹ Ð±Ð°Ð¹Ð½Ð°. Ð—Ð°Ñ…Ð¸Ð°Ð»Ð³Ð° Ñ…Ò¯Ð»ÑÑÐ¶ Ð°Ð²Ð¼Ð°Ð³Ñ† ÑÐ½Ð´ Ñ…Ð°Ñ€Ð°Ð³Ð´Ð°Ð½Ð°."
                      : "No accepted delivery yet. Claimed order details will appear here automatically."}
                  </p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/72">
                  GPS
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/72">
                  {isMn ? "Захиалга" : "Orders"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/72">
                  {isMn ? "Хүлээлцэх" : "Handoff"}
                </span>
              </div>
            </div>
          ) : isOrdersDashboardPage ? (
            <div className="mt-5 overflow-hidden rounded-[18px] border border-white/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.008)),#0c0c0d] p-2">
              <div className="relative h-[168px] overflow-hidden rounded-[16px] border border-[#2b1409] bg-[radial-gradient(circle_at_78%_18%,rgba(255,106,0,0.28),transparent_30%),linear-gradient(180deg,#151515_0%,#090909_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="absolute left-3 top-3 z-10 max-w-[88px]">
                  <p className="text-[10px] font-semibold leading-none text-white/88">Midnight</p>
                  <p className="mt-1 text-[10px] font-semibold leading-none text-white/88">Umami</p>
                  <p className="mt-2 text-[9px] leading-4 text-white/46">
                    {isMn ? "Мэдрэмжит амт." : "Limited special."}
                  </p>
                </div>
                <Image
                  alt="Burger astronaut mascot"
                  className="object-contain object-bottom"
                  fill
                  loading="eager"
                  sizes="160px"
                  src="/hero-ref/hero-character.png"
                />
                <div className="absolute inset-x-2.5 bottom-2.5">
                  <Button asChild className="min-h-8 rounded-[10px] text-[11px]" fullWidth size="sm">
                    <Link href="/menu" onClick={onClose}>
                      {isMn ? "Захиалах ->" : "Order now ->"}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : isAIAgentPage ? (
            <div className="mt-4 overflow-hidden rounded-[18px] border border-white/6 bg-[#0a0a0b] p-2">
              <div className="relative h-[202px] overflow-hidden rounded-[16px] border border-[#2b1409] bg-[radial-gradient(circle_at_70%_18%,rgba(255,106,0,0.22),transparent_34%),linear-gradient(180deg,#121212_0%,#080808_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="absolute left-3 top-3 z-10 max-w-[96px]">
                  <p className="text-[10px] font-semibold leading-none text-white/86">Midnight</p>
                  <p className="mt-1 text-[10px] font-semibold leading-none text-white/86">Umami</p>
                  <p className="mt-2 text-[9px] leading-4 text-white/44">
                    {isMn ? "Хязгаарлагдмал хугацаанд." : "Limited time only."}
                  </p>
                </div>
                <Image
                  alt="Burger astronaut mascot"
                  className="object-contain object-bottom opacity-[0.96]"
                  fill
                  loading="eager"
                  sizes="180px"
                  src="/hero-ref/hero-character.png"
                />
                <div className="absolute inset-x-2.5 bottom-2.5">
                  <Button asChild className="min-h-9 rounded-[12px] text-[12px]" fullWidth size="sm">
                    <Link href="/menu" onClick={onClose}>
                      {isMn ? "Захиалах ->" : "Order now ->"}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.008)),#0f0f10] p-3">
              <div className="relative h-[220px] overflow-hidden rounded-[16px] bg-[radial-gradient(circle_at_78%_20%,rgba(255,106,0,0.32),transparent_32%),linear-gradient(180deg,#141414_0%,#090909_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="absolute left-4 top-4 z-10">
                  <p className="text-[12px] font-semibold leading-none text-white/90">Midnight</p>
                  <p className="text-[12px] font-semibold leading-none text-white/90">Umami</p>
                  <p className="mt-3 text-[10px] text-white/50">
                    {isMn ? "Хязгаарлагдмал хугацаанд!" : "Limited Time Only!"}
                  </p>
                </div>
                <Image
                  alt="Burger astronaut mascot"
                  className="object-contain object-bottom"
                  fill
                  loading="eager"
                  sizes="200px"
                  src="/hero-ref/hero-character.png"
                />
                <div className="absolute inset-x-3 bottom-3">
                  <Button asChild fullWidth size="sm">
                    <Link href="/menu" onClick={onClose}>
                      {isMn ? "Захиалах" : "Order Now"}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </nav>

        <div
          className={cn(
            "border-t pt-3",
            isOrdersDashboardPage
              ? "mt-4 border-white/6"
              : isAIAgentPage
                ? "mt-2 border-white/5"
                : "mt-3 border-white/6"
          )}
        >
          <div className="mb-3 flex justify-start">
            <LanguageToggle compact />
          </div>
          <div className={cn(
            "border p-3 shadow-[0_16px_40px_rgba(0,0,0,0.26)]",
            isOrdersDashboardPage
              ? "rounded-[16px] border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012)),#0f0f11] p-2"
              : isAIAgentPage
              ? "rounded-[16px] border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01)),#0d0d0f] px-2.5 py-2"
              : "rounded-[18px] border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015)),#101012]"
          )}>
            <Link
              className={cn(
                "flex w-full items-center gap-3 rounded-[14px] border px-3 text-left transition-all duration-200",
                isOrdersDashboardPage ? "py-2.5" : isAIAgentPage ? "py-2" : "py-3",
                accountRouteActive
                  ? "border-orange-300/20 bg-white/[0.05]"
                  : "border-white/6 bg-white/[0.03] hover:bg-white/[0.05]"
              )}
              href={accountHref}
              onClick={() => {
                onClose();
              }}
            >
              <div className={cn(
                "relative overflow-hidden rounded-full bg-[rgba(255,106,0,0.18)] ring-1 ring-orange-300/15",
                isOrdersDashboardPage ? "h-9 w-9" : isAIAgentPage ? "h-9 w-9" : "h-11 w-11"
              )}>
                <Image alt={displayName} className="object-cover" fill sizes="44px" src="/aii.png" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate font-semibold text-white", isOrdersDashboardPage ? "text-[12px]" : isAIAgentPage ? "text-[12px]" : "text-[13px]")}>{displayName}</p>
                <p className={cn("truncate text-[var(--text-secondary)]", isOrdersDashboardPage ? "text-[10px]" : isAIAgentPage ? "text-[9px]" : "text-[11px]")}>{displayMeta}</p>
              </div>
              <ChevronRightIcon
                className={cn(
                  "h-4 w-4 shrink-0 text-[var(--text-secondary)] transition-transform duration-200",
                  accountRouteActive ? "text-white" : ""
                )}
              />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
