"use client";
import {
  BriefcaseIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Loader from "@/components/ui/Loader";
import Toast from "@/components/ui/Toast";
import type { AdminDashboardUser } from "@/features/admin/admin.types";
import {
  createAdminManagedUser,
  getAdminDashboard,
  removeAdminManagedUser,
} from "@/features/admin/admin.service";
import { useAuth } from "@/hooks/useAuth";
import { formatDateTime, getErrorMessage } from "@/lib/helpers";

const ADMIN_LOGIN_URL = "/auth/login?redirect=%2Fadmin%2Fmanagers";

type Notice = {
  message: string;
  tone: "success" | "error" | "info";
};

type ManagedAccountFormState = {
  email: string;
  name: string;
  password: string;
  phone: string;
};

function createInitialAccountForm(): ManagedAccountFormState {
  return {
    email: "",
    name: "",
    password: "",
    phone: "",
  };
}

export default function AdminManagersPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading, user } = useAuth();
  const [form, setForm] = useState<ManagedAccountFormState>(createInitialAccountForm());
  const [managers, setManagers] = useState<AdminDashboardUser[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  const loadManagers = useCallback(async () => {
    const dashboard = await getAdminDashboard("managers");
    setManagers(dashboard.users.filter((entry) => entry.role === "MANAGER"));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateManagers() {
      if (isAuthLoading) {
        return;
      }

      if (!user) {
        router.replace(ADMIN_LOGIN_URL);
        return;
      }

      if (user.role !== "ADMIN") {
        router.replace("/");
        return;
      }

      try {
        const dashboard = await getAdminDashboard("managers");

        if (cancelled) {
          return;
        }

        setManagers(dashboard.users.filter((entry) => entry.role === "MANAGER"));
      } catch (error) {
        if (!cancelled) {
          setNotice({
            message: getErrorMessage(error),
            tone: "error",
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void hydrateManagers();

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, router, user]);

  function handleFormChange(field: keyof ManagedAccountFormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreateManager() {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password.trim();
    const phone = form.phone.trim();

    if (!name || !email || !password) {
      setNotice({
        message: "Name, email, and password are required.",
        tone: "error",
      });
      return;
    }

    setIsCreating(true);
    setNotice(null);

    try {
      await createAdminManagedUser({
        email,
        name,
        password,
        phone: phone || null,
        role: "MANAGER",
      });
      setForm(createInitialAccountForm());
      setNotice({
        message: "Manager account created.",
        tone: "success",
      });
      await loadManagers();
    } catch (error) {
      setNotice({
        message: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteManager(entry: AdminDashboardUser) {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`Delete manager account for ${entry.name}?`);

      if (!confirmed) {
        return;
      }
    }

    setActionId(entry.id);
    setNotice(null);

    try {
      await removeAdminManagedUser(entry.id);
      setNotice({
        message: "Manager account removed.",
        tone: "success",
      });
      await loadManagers();
    } catch (error) {
      setNotice({
        message: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setActionId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {notice ? <Toast message={notice.message} tone={notice.tone} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Card className="h-fit" variant="default">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-orange-400/18 bg-orange-500/10 text-orange-200">
              <BriefcaseIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/34">
                Create manager
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">Add new manager</h2>
              <p className="mt-2 text-sm leading-6 text-white/54">
                This account will be able to handle incoming orders and release prepared meals to couriers.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <Input
              label="Name"
              onChange={(event) => handleFormChange("name", event.target.value)}
              placeholder="Kitchen Lead"
              value={form.name}
            />
            <Input
              label="Email"
              onChange={(event) => handleFormChange("email", event.target.value)}
              placeholder="manager@burger.mn"
              type="email"
              value={form.email}
            />
            <Input
              label="Password"
              onChange={(event) => handleFormChange("password", event.target.value)}
              placeholder="Manager password"
              showPasswordToggle
              type="password"
              value={form.password}
            />
            <Input
              label="Phone"
              onChange={(event) => handleFormChange("phone", event.target.value)}
              placeholder="+976 9911 2233"
              value={form.phone}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button isLoading={isCreating} onClick={handleCreateManager} size="sm">
              Add manager
            </Button>
            <Button
              disabled={isCreating}
              onClick={() => setForm(createInitialAccountForm())}
              size="sm"
              variant="secondary"
            >
              Clear form
            </Button>
          </div>
        </Card>

        <Card variant="default">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/34">
                Current team
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">Manager accounts</h2>
              <p className="mt-2 text-sm leading-6 text-white/54">
                Review who currently has access to the kitchen dispatch workflow.
              </p>
            </div>

            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-left sm:text-right">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/34">Live accounts</p>
              <p className="mt-2 text-2xl font-black text-white">{managers.length}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {managers.length ? (
              managers.map((entry) => (
                <div
                  className="flex flex-col gap-4 rounded-[20px] border border-white/8 bg-white/[0.02] p-4 lg:flex-row lg:items-center lg:justify-between"
                  key={entry.id}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold text-white">{entry.name}</p>
                      <span className="rounded-full bg-orange-500/14 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-300">
                        MANAGER
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-white/54">{entry.email}</p>
                    <p className="mt-2 text-xs text-white/46">
                      {entry.phone ?? "No phone"} | Joined {formatDateTime(entry.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-[16px] border border-white/8 bg-black/20 px-4 py-3 text-center">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-white/34">Orders</p>
                      <p className="mt-2 text-lg font-black text-white">{entry.orderCount}</p>
                    </div>
                    <div className="rounded-[16px] border border-white/8 bg-black/20 px-4 py-3 text-center">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-white/34">Feedback</p>
                      <p className="mt-2 text-lg font-black text-white">{entry.feedbackCount}</p>
                    </div>
                    <Button
                      isLoading={actionId === entry.id}
                      leftIcon={<TrashIcon className="h-4 w-4" />}
                      onClick={() => handleDeleteManager(entry)}
                      size="sm"
                      variant="danger"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60">
                  <UserGroupIcon className="h-7 w-7" />
                </div>
                <p className="mt-4 text-base font-semibold text-white">No managers yet</p>
                <p className="mt-2 text-sm leading-6 text-white/54">
                  Create the first manager account from the form on the left and it will show up here immediately.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
