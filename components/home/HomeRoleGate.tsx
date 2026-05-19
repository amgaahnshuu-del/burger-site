"use client";

import Button from "@/components/ui/Button";
import CourierDashboard from "@/components/courier/CourierDashboard";
import EmptyState from "@/components/ui/EmptyState";
import HomeExperience from "@/components/home/HomeExperience";
import Loader from "@/components/ui/Loader";
import ManagerDashboard from "@/components/manager/ManagerDashboard";
import Toast from "@/components/ui/Toast";
import { useCourierOrders } from "@/features/courier/courier.hooks";
import { useManagerOrders } from "@/features/manager/manager.hooks";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import { useAuth } from "@/hooks/useAuth";

export default function HomeRoleGate() {
  const { t } = useAppLanguage();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const isCourier = user?.role === "COURIER";
  const isManager = user?.role === "MANAGER";
  const {
    data,
    error,
    isLoading: courierLoading,
    refresh,
  } = useCourierOrders({
    enabled: isAuthenticated && isCourier,
    pollIntervalMs: 10000,
  });
  const {
    data: managerData,
    error: managerError,
    isLoading: managerLoading,
    refresh: refreshManagerOrders,
  } = useManagerOrders({
    enabled: isAuthenticated && isManager,
    pollIntervalMs: 10000,
  });

  if (authLoading || (isCourier && courierLoading) || (isManager && managerLoading)) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </main>
    );
  }

  if (isCourier) {
    return (
      <main className="space-y-6">
        {error ? <Toast message={error} tone="error" /> : null}
        {data ? (
          <CourierDashboard
            activeOrders={data.activeOrders}
            availableOrders={data.availableOrders}
            completedToday={data.completedToday}
            onRefresh={refresh}
          />
        ) : (
          <EmptyState
            action={(
              <Button onClick={refresh} size="sm">
                {t({
                  en: "Reload dashboard",
                  mn: "Самбарыг дахин ачаалах",
                })}
              </Button>
            )}
            description={t({
              en: "Courier orders and live route data will appear here as soon as the delivery feed responds.",
              mn: "Хүргэлтийн урсгал хариу өгмөгц захиалга болон бодит цагийн маршрут энд харагдана.",
            })}
            title={t({
              en: "Courier dashboard is getting ready.",
              mn: "Хүргэлтийн самбар бэлдэж байна.",
            })}
          />
        )}
      </main>
    );
  }

  if (isManager) {
    return (
      <main className="space-y-6">
        {managerError ? <Toast message={managerError} tone="error" /> : null}
        {managerData ? (
          <ManagerDashboard
            deliveredToday={managerData.deliveredToday}
            deliveringOrders={managerData.deliveringOrders}
            incomingOrders={managerData.incomingOrders}
            mode="incoming"
            onRefresh={refreshManagerOrders}
            preparingOrders={managerData.preparingOrders}
            readyOrders={managerData.readyOrders}
          />
        ) : (
          <EmptyState
            action={(
              <Button onClick={refreshManagerOrders} size="sm">
                {t({
                  en: "Reload dashboard",
                  mn: "Самбарыг дахин ачаалах",
                })}
              </Button>
            )}
            description={t({
              en: "Incoming orders and kitchen handoff data will appear here as soon as the manager feed responds.",
              mn: "Менежерийн урсгал хариу өгмөгц орж ирсэн захиалга болон гал тогооны шилжилтийн мэдээлэл энд харагдана.",
            })}
            title={t({
              en: "Manager dashboard is getting ready.",
              mn: "Менежерийн самбар бэлдэж байна.",
            })}
          />
        )}
      </main>
    );
  }

  return <HomeExperience />;
}
