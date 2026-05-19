"use client";

import {
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Loader from "@/components/ui/Loader";
import Toast from "@/components/ui/Toast";
import type {
  AdminDashboardData,
  AdminDashboardUser,
  AdminFood,
  AdminFoodInput,
  AdminManagedUserRole,
} from "@/features/admin/admin.types";
import {
  createAdminManagedUser,
  createAdminFood,
  getAdminDashboard,
  getAdminFoods,
  removeAdminFood,
  removeAdminManagedUser,
} from "@/features/admin/admin.service";
import { updateFeedbackStatus } from "@/features/feedback/feedback.service";
import type { FeedbackEntry } from "@/features/feedback/feedback.types";
import { useAuth } from "@/hooks/useAuth";
import {
  ADMIN_SECTION_EVENT,
  getAdminSectionFromSearch,
  normalizeAdminSection,
  type AdminSection,
} from "@/lib/admin-navigation";
import {
  FOOD_IMAGE_UPLOAD_LIMIT_LABEL,
  MAX_FOOD_IMAGE_UPLOAD_BYTES,
  isFoodImageValueTooLarge,
  getFoodImageTooLargeMessage,
} from "@/lib/food-image-input";
import { cn, formatCurrency, getErrorMessage } from "@/lib/helpers";

const ADMIN_LOGIN_URL = "/auth/login?redirect=%2Fadmin%3Fsection%3Dmost-sell";

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

type FoodFormState = AdminFoodInput & {
  priceText: string;
};

type FoodCategoryGroup = {
  foods: AdminFood[];
  key: string;
  label: string;
};

type SalesSnapshot = {
  topFoods: AdminDashboardData["topFoods"];
  totalUnitsSold: number;
};

const ALL_FOOD_CATEGORIES_KEY = "all";

const INITIAL_FOOD_FORM: FoodFormState = {
  category: "",
  description: "",
  image: "/home-crops/burger1-clean-v2.png",
  name: "",
  price: 0,
  priceText: "",
  restaurantId: null,
};

function readImageFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read the selected image."));
    };

    reader.onerror = () => {
      reject(new Error("Unable to read the selected image."));
    };

    reader.readAsDataURL(file);
  });
}


function createInitialAccountForm(): ManagedAccountFormState {
  return {
    email: "",
    name: "",
    password: "",
    phone: "",
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function getFoodCategoryLabel(category: string) {
  const trimmedCategory = category.trim();

  return trimmedCategory || "Uncategorized";
}

function groupFoodsByCategory(foods: AdminFood[]) {
  const sortedFoods = [...foods].sort((left, right) => {
    const leftCategory = getFoodCategoryLabel(left.category);
    const rightCategory = getFoodCategoryLabel(right.category);
    const categoryComparison = leftCategory.localeCompare(rightCategory, undefined, {
      sensitivity: "base",
    });

    if (categoryComparison !== 0) {
      return categoryComparison;
    }

    if (left.isAvailable !== right.isAvailable) {
      return Number(right.isAvailable) - Number(left.isAvailable);
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

  const groupedFoods = new Map<string, FoodCategoryGroup>();

  for (const food of sortedFoods) {
    const label = getFoodCategoryLabel(food.category);
    const key = label.toLowerCase();
    const existingGroup = groupedFoods.get(key);

    if (existingGroup) {
      existingGroup.foods.push(food);
      continue;
    }

    groupedFoods.set(key, {
      foods: [food],
      key,
      label,
    });
  }

  return Array.from(groupedFoods.values());
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading, user } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection | null>(null);
  const [accountActionId, setAccountActionId] = useState<string | null>(null);
  const [accountForms, setAccountForms] = useState<Record<AdminManagedUserRole, ManagedAccountFormState>>({
    COURIER: createInitialAccountForm(),
    MANAGER: createInitialAccountForm(),
    CUSTOMER: createInitialAccountForm(),
  });
  const [customerUsers, setCustomerUsers] = useState<AdminDashboardUser[]>([]);
  const [creatingAccountRole, setCreatingAccountRole] = useState<AdminManagedUserRole | null>(null);
  const [courierUsers, setCourierUsers] = useState<AdminDashboardUser[]>([]);
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [feedbackActionId, setFeedbackActionId] = useState<string | null>(null);
  const [foodActionId, setFoodActionId] = useState<string | null>(null);
  const [foodForm, setFoodForm] = useState(INITIAL_FOOD_FORM);
  const [foodImageError, setFoodImageError] = useState<string | null>(null);
  const [foodImageUploadName, setFoodImageUploadName] = useState<string | null>(null);
  const [foodImageUrl, setFoodImageUrl] = useState(INITIAL_FOOD_FORM.image);
  const [foods, setFoods] = useState<AdminFood[]>([]);
  const [hasLoadedCouriers, setHasLoadedCouriers] = useState(false);
  const [hasLoadedFoods, setHasLoadedFoods] = useState(false);
  const [hasLoadedSales, setHasLoadedSales] = useState(false);
  const [hasLoadedUsers, setHasLoadedUsers] = useState(false);
  const [selectedFoodCategory, setSelectedFoodCategory] = useState(
    ALL_FOOD_CATEGORIES_KEY
  );
  const [isCreatingFood, setIsCreatingFood] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [salesSnapshot, setSalesSnapshot] = useState<SalesSnapshot | null>(null);
  const foodImageInputRef = useRef<HTMLInputElement | null>(null);
  const groupedFoods = useMemo(() => groupFoodsByCategory(foods), [foods]);
  const sortedFoods = useMemo(
    () => groupedFoods.flatMap((group) => group.foods),
    [groupedFoods]
  );
  const effectiveFoodCategory = useMemo(
    () =>
      selectedFoodCategory === ALL_FOOD_CATEGORIES_KEY ||
      groupedFoods.some((group) => group.key === selectedFoodCategory)
        ? selectedFoodCategory
        : ALL_FOOD_CATEGORIES_KEY,
    [groupedFoods, selectedFoodCategory]
  );
  const activeFoodGroup = useMemo(
    () =>
      effectiveFoodCategory === ALL_FOOD_CATEGORIES_KEY
        ? null
        : groupedFoods.find((group) => group.key === effectiveFoodCategory) ?? null,
    [effectiveFoodCategory, groupedFoods]
  );
  const visibleFoods = activeFoodGroup?.foods ?? sortedFoods;
  const dashboard = useMemo<AdminDashboardData>(() => ({
    feedbacks: feedbackEntries,
    stats: {
      activeFoods: foods.filter((food) => food.isAvailable).length,
      openFeedback: feedbackEntries.filter((entry) => entry.status === "OPEN").length,
      totalFeedback: feedbackEntries.length,
      totalFoods: foods.length,
      totalOrders: 0,
      totalUnitsSold: salesSnapshot?.totalUnitsSold ?? 0,
    },
    topFoods: salesSnapshot?.topFoods ?? [],
    users: [...customerUsers, ...courierUsers],
  }), [courierUsers, customerUsers, feedbackEntries, foods, salesSnapshot]);
  const managerUsers = useMemo<AdminDashboardUser[]>(() => [], []);

  const loadSalesData = useCallback(async (force = false) => {
    if (!force && hasLoadedSales) {
      return;
    }

    const dashboardData = await getAdminDashboard("sales");
    setSalesSnapshot({
      topFoods: dashboardData.topFoods,
      totalUnitsSold: dashboardData.stats.totalUnitsSold,
    });
    setHasLoadedSales(true);
  }, [hasLoadedSales]);

  const loadUsersData = useCallback(async (force = false) => {
    if (!force && hasLoadedUsers) {
      return;
    }

    const dashboardData = await getAdminDashboard("users");
    setCustomerUsers(
      dashboardData.users.filter((entry) => entry.role === "CUSTOMER")
    );
    setFeedbackEntries(dashboardData.feedbacks);
    setHasLoadedUsers(true);
  }, [hasLoadedUsers]);

  const loadCouriersData = useCallback(async (force = false) => {
    if (!force && hasLoadedCouriers) {
      return;
    }

    const dashboardData = await getAdminDashboard("couriers");
    setCourierUsers(
      dashboardData.users.filter((entry) => entry.role === "COURIER")
    );
    setHasLoadedCouriers(true);
  }, [hasLoadedCouriers]);

  const loadFoodsData = useCallback(async (force = false) => {
    if (!force && hasLoadedFoods) {
      return;
    }

    const foodsData = await getAdminFoods();
    setFoods(foodsData);
    setHasLoadedFoods(true);
  }, [hasLoadedFoods]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncSection = () => {
      setActiveSection(getAdminSectionFromSearch(window.location.search));
    };

    const handleSectionChange = (event: Event) => {
      setActiveSection(normalizeAdminSection((event as CustomEvent<AdminSection>).detail));
    };

    syncSection();
    window.addEventListener("popstate", syncSection);
    window.addEventListener(ADMIN_SECTION_EVENT, handleSectionChange as EventListener);

    return () => {
      window.removeEventListener("popstate", syncSection);
      window.removeEventListener(ADMIN_SECTION_EVENT, handleSectionChange as EventListener);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateAdminSection() {
      if (!activeSection || isAuthLoading) {
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

      const needsLoad = (
        (activeSection === "most-sell" && !hasLoadedSales)
        || (activeSection === "users" && !hasLoadedUsers)
        || (activeSection === "couriers" && !hasLoadedCouriers)
        || (activeSection === "foods" && !hasLoadedFoods)
      );

      if (!needsLoad) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        if (activeSection === "most-sell") {
          await loadSalesData();
        } else if (activeSection === "users") {
          await loadUsersData();
        } else if (activeSection === "couriers") {
          await loadCouriersData();
        } else if (activeSection === "foods") {
          await loadFoodsData();
        }
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

    void hydrateAdminSection();

    return () => {
      cancelled = true;
    };
  }, [
    activeSection,
    hasLoadedCouriers,
    hasLoadedFoods,
    hasLoadedSales,
    hasLoadedUsers,
    isAuthLoading,
    loadCouriersData,
    loadFoodsData,
    loadSalesData,
    loadUsersData,
    router,
    user,
  ]);

  function clearFoodImagePicker() {
    if (foodImageInputRef.current) {
      foodImageInputRef.current.value = "";
    }
  }

  function resetFoodForm() {
    setFoodForm(INITIAL_FOOD_FORM);
    setFoodImageError(null);
    setFoodImageUploadName(null);
    setFoodImageUrl(INITIAL_FOOD_FORM.image);
    clearFoodImagePicker();
  }

  function handleFoodImageUrlChange(event: ChangeEvent<HTMLInputElement>) {
    const nextImage = event.target.value;

    clearFoodImagePicker();
    setFoodImageError(null);
    setFoodImageUploadName(null);
    setFoodImageUrl(nextImage);
    setFoodForm((current) => ({
      ...current,
      image: nextImage,
    }));
  }

  async function handleFoodImageUploadChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFoodImageError("Please select a valid image file.");
      clearFoodImagePicker();
      return;
    }

    if (file.size > MAX_FOOD_IMAGE_UPLOAD_BYTES) {
      setFoodImageError(getFoodImageTooLargeMessage());
      clearFoodImagePicker();
      return;
    }

    try {
      const imageDataUrl = await readImageFileAsDataUrl(file);

      if (isFoodImageValueTooLarge(imageDataUrl)) {
        setFoodImageError(getFoodImageTooLargeMessage());
        clearFoodImagePicker();
        return;
      }

      setFoodImageError(null);
      setFoodImageUploadName(file.name);
      setFoodForm((current) => ({
        ...current,
        image: imageDataUrl,
      }));
    } catch (error) {
      setFoodImageError(getErrorMessage(error));
      clearFoodImagePicker();
    }
  }

  function handleUseImageUrlInstead() {
    clearFoodImagePicker();
    setFoodImageError(null);
    setFoodImageUploadName(null);
    setFoodForm((current) => ({
      ...current,
      image: foodImageUrl.trim() || INITIAL_FOOD_FORM.image,
    }));
  }

  async function handleCreateFood() {
    const price = Number.parseInt(foodForm.priceText, 10);
    const image = foodForm.image.trim();

    if (foodImageError) {
      setNotice({
        message: foodImageError,
        tone: "error",
      });
      return;
    }

    if (!foodForm.name.trim() || !foodForm.category.trim() || !image || Number.isNaN(price)) {
      setNotice({
        message: "Name, category, image, and a valid price are required.",
        tone: "error",
      });
      return;
    }

    setIsCreatingFood(true);
    setNotice(null);

    try {
      await createAdminFood({
        category: foodForm.category.trim(),
        description: foodForm.description.trim(),
        image,
        name: foodForm.name.trim(),
        price,
        restaurantId: null,
      });
      resetFoodForm();
      setNotice({
        message: "Food added to the menu.",
        tone: "success",
      });

      if (hasLoadedFoods) {
        await loadFoodsData(true);
      }
    } catch (error) {
      setNotice({
        message: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setIsCreatingFood(false);
    }
  }

  function handleAccountFormChange(
    role: AdminManagedUserRole,
    field: keyof ManagedAccountFormState,
    value: string
  ) {
    setAccountForms((current) => ({
      ...current,
      [role]: {
        ...current[role],
        [field]: value,
      },
    }));
  }

  async function handleCreateManagedUser(role: AdminManagedUserRole) {
    const form = accountForms[role];
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

    setCreatingAccountRole(role);
    setNotice(null);

    try {
      const result = await createAdminManagedUser({
        email,
        name,
        password,
        phone: phone || null,
        role,
      });

      setAccountForms((current) => ({
        ...current,
        [role]: createInitialAccountForm(),
      }));
      setNotice({
        message: result.message ?? (
          role === "COURIER"
            ? "Courier created successfully."
            : role === "MANAGER"
              ? "Manager created successfully."
              : "User created successfully."
        ),
        tone: "success",
      });

      if (role === "CUSTOMER") {
        await loadUsersData(true);
      } else if (role === "COURIER") {
        await loadCouriersData(true);
      }
    } catch (error) {
      setNotice({
        message: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setCreatingAccountRole(null);
    }
  }

  async function handleDeleteManagedUser(entry: AdminDashboardData["users"][number]) {
    if (typeof window !== "undefined") {
      const shouldDelete = window.confirm(`Delete ${entry.name} (${entry.email})?`);

      if (!shouldDelete) {
        return;
      }
    }

    setAccountActionId(entry.id);
    setNotice(null);

    try {
      const result = await removeAdminManagedUser(entry.id);
      setNotice({
        message: result.message,
        tone: "success",
      });

      if (entry.role === "CUSTOMER") {
        await loadUsersData(true);
      } else if (entry.role === "COURIER") {
        await loadCouriersData(true);
      }
    } catch (error) {
      setNotice({
        message: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setAccountActionId(null);
    }
  }

  async function handleDeleteFood(food: AdminFood) {
    if (typeof window !== "undefined") {
      const shouldDelete = window.confirm(
        `Permanently delete ${food.name}? This cannot be undone.`
      );

      if (!shouldDelete) {
        return;
      }
    }

    setFoodActionId(food.id);
    setNotice(null);

    try {
      const result = await removeAdminFood(food.id);
      setNotice({
        message: result.message ?? `${food.name} deleted permanently.`,
        tone: "success",
      });
      await loadFoodsData(true);
    } catch (error) {
      setNotice({
        message: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setFoodActionId(null);
    }
  }

  async function handleFeedbackAction(entry: FeedbackEntry) {
    setFeedbackActionId(entry.id);
    setNotice(null);

    try {
      await updateFeedbackStatus(
        entry.id,
        entry.status === "OPEN" ? "RESOLVED" : "OPEN"
      );
      setNotice({
        message:
          entry.status === "OPEN"
            ? "Feedback marked as resolved."
            : "Feedback reopened.",
        tone: "success",
      });
      await loadUsersData(true);
    } catch (error) {
      setNotice({
        message: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setFeedbackActionId(null);
    }
  }

  if (isLoading) {
    return (
      <main className="dashboard-shell flex min-h-screen items-center justify-center">
        <Loader />
      </main>
    );
  }

  const overviewStats = [
    {
      helper: "Checkouts completed across the platform",
      icon: ClipboardDocumentListIcon,
      label: "Orders",
      value: dashboard?.stats.totalOrders ?? 0,
    },
    {
      helper: "Foods currently visible to customers",
      icon: Squares2X2Icon,
      label: "Active foods",
      value: dashboard?.stats.activeFoods ?? foods.filter((food) => food.isAvailable).length,
    },
    {
      helper: (dashboard?.stats.openFeedback ?? 0) > 0 ? "Needs follow-up from your team" : "Inbox is currently under control",
      icon: ExclamationTriangleIcon,
      label: "Open feedback",
      value: dashboard?.stats.openFeedback ?? 0,
    },
    {
      helper: `${managerUsers.length} managers • ${courierUsers.length} couriers`,
      icon: BriefcaseIcon,
      label: "Ops team",
      value: managerUsers.length + courierUsers.length,
    },
  ] as const;
  void overviewStats;

  return (
    <main className="dashboard-shell min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px] space-y-6">
        {notice ? <Toast message={notice.message} tone={notice.tone} /> : null}

        {activeSection === "most-sell" ? (
          <Card className="scroll-mt-24 p-6" id="most-sell" variant="default">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/34">
                  Sales analytics
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">Top selling foods</h2>
                <p className="mt-2 text-sm text-white/54">
                  Admin home now opens straight into the highest-selling items.
                </p>
              </div>
              {dashboard ? (
                <div className="hidden rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 sm:block">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/36">Units sold</p>
                  <p className="mt-2 text-2xl font-black text-white">{dashboard.stats.totalUnitsSold}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 space-y-3">
              {dashboard?.topFoods.length ? (
                dashboard.topFoods.map((food, index) => (
                  <div
                    className="flex items-center gap-4 rounded-[20px] border border-white/8 bg-white/[0.02] p-4"
                    key={food.foodId}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/12 text-sm font-black text-orange-300">
                      {index + 1}
                    </div>
                    <div className="relative h-16 w-16 overflow-hidden rounded-[16px] border border-white/8 bg-black/20">
                      <Image
                        alt={food.name}
                        className="object-cover"
                        fill
                        sizes="64px"
                        src={food.image}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-white">{food.name}</p>
                      <p className="mt-1 text-sm text-white/54">{food.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{food.totalUnits} sold</p>
                      <p className="mt-1 text-xs text-white/50">{formatCurrency(food.totalRevenue)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/54">
                  No sales yet. Top foods will appear after orders are placed.
                </p>
              )}
            </div>
          </Card>
        ) : null}

        {activeSection === "add-food" ? (
          <Card className="scroll-mt-24 p-6" id="add-food" variant="glow">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-300/70">
                  Menu management
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">Add a new food</h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input
                label="Food name"
                onChange={(event) => setFoodForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Midnight Smash"
                value={foodForm.name}
              />
              <Input
                label="Category"
                onChange={(event) => setFoodForm((current) => ({ ...current, category: event.target.value }))}
                placeholder="Burger, Combo, Drink"
                value={foodForm.category}
              />
              <Input
                label="Price"
                onChange={(event) => setFoodForm((current) => ({ ...current, priceText: event.target.value }))}
                placeholder="18900"
                type="number"
                value={foodForm.priceText}
              />
            </div>

            <div className="mt-4">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_280px]">
                <div className="space-y-4">
                  <Input
                    hint="Paste an app image path or remote image URL. Editing this field switches back to URL mode."
                    label="Image URL or path"
                    onChange={handleFoodImageUrlChange}
                    placeholder="/home-crops/burger1-clean-v2.png or https://..."
                    value={foodImageUrl}
                  />

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-white/58">
                      Upload image
                    </span>
                    <input
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className={cn(
                        "min-h-12 w-full rounded-[1.2rem] border border-dashed bg-[#101011] px-4 py-3 text-sm text-white outline-none transition-all duration-300 file:mr-4 file:rounded-[10px] file:border-0 file:bg-orange-500/12 file:px-4 file:py-2 file:font-semibold file:text-orange-200 hover:border-white/18 hover:bg-[#121213] focus:border-orange-400/60 focus:bg-[#151517] focus:shadow-[0_0_0_3px_rgba(255,106,0,0.1)]",
                        foodImageError
                          ? "border-orange-400/60 focus:border-orange-400/60 focus:shadow-[0_0_0_3px_rgba(255,106,0,0.1)]"
                          : "border-white/10"
                      )}
                      onChange={(event) => {
                        void handleFoodImageUploadChange(event);
                      }}
                      ref={foodImageInputRef}
                      type="file"
                    />
                    {foodImageError ? (
                      <span className="mt-2 block text-sm text-orange-300">
                        {foodImageError}
                      </span>
                    ) : (
                      <span className="mt-2 block text-sm text-white/45">
                        Upload JPG, PNG, WEBP, or GIF up to {FOOD_IMAGE_UPLOAD_LIMIT_LABEL}. Uploaded images are stored with the food item.
                      </span>
                    )}
                  </label>

                  {foodImageUploadName ? (
                    <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-orange-400/18 bg-orange-500/[0.06] px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200/72">
                          Active upload
                        </p>
                        <p className="mt-1 text-sm text-white">
                          {foodImageUploadName}
                        </p>
                      </div>
                      <Button
                        className="ml-auto"
                        onClick={handleUseImageUrlInstead}
                        size="sm"
                        variant="secondary"
                      >
                        Use URL instead
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]">
                  <div className="relative aspect-[4/3] border-b border-white/8 bg-black/20">
                    <Image
                      alt={foodForm.name.trim() || "Food preview"}
                      className="object-cover"
                      fill
                      sizes="280px"
                      src={foodForm.image.trim() || INITIAL_FOOD_FORM.image}
                    />
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
                      Preview
                    </p>
                    <p className="mt-1 text-sm text-white/72">
                      {foodImageUploadName
                        ? "The uploaded image will be saved with this food."
                        : "Current URL or app path preview."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-white/58">
                Description
              </span>
              <textarea
                className="min-h-28 w-full rounded-[1.2rem] border border-white/10 bg-[#101011] px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-white/32 focus:border-orange-400/60 focus:bg-[#151517] focus:shadow-[0_0_0_3px_rgba(255,106,0,0.1)]"
                onChange={(event) => setFoodForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Describe the dish, flavor, and what makes it special."
                value={foodForm.description}
              />
            </label>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button isLoading={isCreatingFood} onClick={handleCreateFood} size="sm">
                Add food
              </Button>
              <Button onClick={resetFoodForm} size="sm" variant="secondary">
                Clear form
              </Button>
            </div>
          </Card>
        ) : null}

        {activeSection === "foods" ? (
          <Card className="scroll-mt-24 p-6" id="foods" variant="default">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/34">
                  Catalog
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">Foods in system</h2>
              </div>
              <p className="text-sm text-white/46">{foods.length} total items</p>
            </div>

            <div className="mt-6 overflow-x-auto pb-2">
              <div className="flex min-w-max gap-3">
                <button
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    effectiveFoodCategory === ALL_FOOD_CATEGORIES_KEY
                      ? "border-orange-300/28 bg-[linear-gradient(135deg,#ff6a00,#ff8a1f)] text-white shadow-[0_12px_30px_rgba(255,106,0,.25)]"
                      : "border-white/10 bg-white/[0.04] text-white/68 hover:border-white/18 hover:bg-white/[0.08] hover:text-white"
                  )}
                  onClick={() => setSelectedFoodCategory(ALL_FOOD_CATEGORIES_KEY)}
                  type="button"
                >
                  All
                </button>

                {groupedFoods.map((group) => (
                  <button
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-semibold transition",
                      effectiveFoodCategory === group.key
                        ? "border-orange-300/28 bg-[linear-gradient(135deg,#ff6a00,#ff8a1f)] text-white shadow-[0_12px_30px_rgba(255,106,0,.25)]"
                        : "border-white/10 bg-white/[0.04] text-white/68 hover:border-white/18 hover:bg-white/[0.08] hover:text-white"
                    )}
                    key={group.key}
                    onClick={() => setSelectedFoodCategory(group.key)}
                    type="button"
                  >
                    {group.label}
                    <span className="ml-2 text-white/55">{group.foods.length}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 space-y-3">
              {foods.length === 0 ? (
                <p className="text-sm text-white/54">No foods found yet.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4 px-1">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {activeFoodGroup?.label ?? "All categories"}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/34">
                        {visibleFoods.length} item{visibleFoods.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <p className="text-sm text-white/42">
                      {visibleFoods.filter((food) => food.isAvailable).length} visible
                    </p>
                  </div>

                  {visibleFoods.map((food) => (
                    <div
                      className="flex flex-col gap-4 rounded-[20px] border border-white/8 bg-white/[0.02] p-4 lg:flex-row lg:items-center lg:justify-between"
                      key={food.id}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-[16px] border border-white/8 bg-black/20">
                          <Image
                            alt={food.name}
                            className="object-cover"
                            fill
                            sizes="64px"
                            src={food.image}
                          />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-white">{food.name}</p>
                            <span className={food.isAvailable
                              ? "rounded-full bg-emerald-500/12 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300"
                              : "rounded-full bg-white/8 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/52"}>
                              {food.isAvailable ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <div>
                            <p className="mt-1 text-sm text-white/54">{food.category}</p>
                            <p className="mt-2 text-sm text-white/72">
                              {formatCurrency(food.price)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button
                          isLoading={foodActionId === food.id}
                          onClick={() => handleDeleteFood(food)}
                          size="sm"
                          variant="danger"
                        >
                          Delete permanently
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>
        ) : null}

        {activeSection === "users" ? (
          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="scroll-mt-24 p-6" id="users" variant="default">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/34">
                    Customer accounts
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Users</h2>
                </div>
                <p className="text-sm text-white/46">
                  {customerUsers.length} total customers
                </p>
              </div>

              <div className="mt-6 rounded-[22px] border border-white/8 bg-white/[0.02] p-4">
                <p className="text-sm font-semibold text-white">Add new user</p>
                <p className="mt-2 text-sm leading-6 text-white/54">
                  Create a customer account directly from the admin panel.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Input
                    label="Name"
                    onChange={(event) => handleAccountFormChange("CUSTOMER", "name", event.target.value)}
                    placeholder="Batzorig"
                    value={accountForms.CUSTOMER.name}
                  />
                  <Input
                    label="Email"
                    onChange={(event) => handleAccountFormChange("CUSTOMER", "email", event.target.value)}
                    placeholder="user@burger.mn"
                    type="email"
                    value={accountForms.CUSTOMER.email}
                  />
                  <Input
                    label="Password"
                    onChange={(event) => handleAccountFormChange("CUSTOMER", "password", event.target.value)}
                    placeholder="At least one secure password"
                    showPasswordToggle
                    type="password"
                    value={accountForms.CUSTOMER.password}
                  />
                  <Input
                    label="Phone"
                    onChange={(event) => handleAccountFormChange("CUSTOMER", "phone", event.target.value)}
                    placeholder="+976 9911 2233"
                    value={accountForms.CUSTOMER.phone}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    isLoading={creatingAccountRole === "CUSTOMER"}
                    onClick={() => handleCreateManagedUser("CUSTOMER")}
                    size="sm"
                  >
                    Add user
                  </Button>
                  <Button
                    disabled={creatingAccountRole === "CUSTOMER"}
                    onClick={() => setAccountForms((current) => ({
                      ...current,
                      CUSTOMER: createInitialAccountForm(),
                    }))}
                    size="sm"
                    variant="secondary"
                  >
                    Clear form
                  </Button>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {customerUsers.length ? (
                  customerUsers.map((entry) => (
                    <div
                      className="flex flex-col gap-4 rounded-[20px] border border-white/8 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
                      key={entry.id}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-semibold text-white">{entry.name}</p>
                          <span className="rounded-full bg-white/8 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/58">
                            CUSTOMER
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm text-white/54">{entry.email}</p>
                        <p className="mt-2 text-xs text-white/46">
                          {entry.phone ?? "No phone"} - Joined {formatDate(entry.createdAt)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:min-w-[180px]">
                        <div className="rounded-[16px] border border-white/8 bg-black/20 px-3 py-2 text-center">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-white/34">Orders</p>
                          <p className="mt-2 text-lg font-black text-white">{entry.orderCount}</p>
                        </div>
                        <div className="rounded-[16px] border border-white/8 bg-black/20 px-3 py-2 text-center">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-white/34">Feedback</p>
                          <p className="mt-2 text-lg font-black text-white">{entry.feedbackCount}</p>
                        </div>
                      </div>

                      <Button
                        isLoading={accountActionId === entry.id}
                        onClick={() => handleDeleteManagedUser(entry)}
                        size="sm"
                        variant="danger"
                      >
                        Delete user
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/54">
                    No customer users found yet.
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-6" variant="default">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/34">
                    Inbox
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Complaints & suggestions</h2>
                </div>
                <p className="text-sm text-white/46">
                  {dashboard?.feedbacks.length ?? 0} latest items
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {dashboard?.feedbacks.length ? (
                  dashboard.feedbacks.map((entry) => (
                    <div
                      className="rounded-[20px] border border-white/8 bg-white/[0.02] p-4"
                      key={entry.id}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={entry.type === "COMPLAINT"
                              ? "rounded-full bg-orange-500/14 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-300"
                              : "rounded-full bg-blue-500/14 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200"}>
                              {entry.type === "COMPLAINT" ? "Complaint" : "Suggestion"}
                            </span>
                            <span className={entry.status === "OPEN"
                              ? "rounded-full bg-white/8 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/58"
                              : "rounded-full bg-emerald-500/12 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300"}>
                              {entry.status}
                            </span>
                          </div>
                          <p className="mt-3 text-sm font-semibold text-white">
                            {entry.name}
                          </p>
                          <p className="mt-1 text-xs text-white/46">
                            {entry.email} - {formatDate(entry.createdAt)}
                          </p>
                        </div>

                        <Button
                          isLoading={feedbackActionId === entry.id}
                          onClick={() => handleFeedbackAction(entry)}
                          size="sm"
                          variant={entry.status === "OPEN" ? "secondary" : "outline"}
                        >
                          {entry.status === "OPEN" ? "Mark resolved" : "Reopen"}
                        </Button>
                      </div>

                      <p className="mt-4 text-sm leading-7 text-white/72">{entry.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/54">
                    No complaints or suggestions have been submitted yet.
                  </p>
                )}
              </div>
            </Card>
          </section>
        ) : null}

        {activeSection === "couriers" ? (
          <section>
            <Card className="scroll-mt-24 p-6" id="couriers" variant="default">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/34">
                    Delivery team
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Couriers</h2>
                  <p className="mt-2 text-sm text-white/54">
                    Add or remove courier accounts that can claim live deliveries.
                  </p>
                </div>
                <p className="text-sm text-white/46">{courierUsers.length} active courier accounts</p>
              </div>

              <div className="mt-6 rounded-[22px] border border-white/8 bg-white/[0.02] p-4">
                <p className="text-sm font-semibold text-white">Add new courier</p>
                <p className="mt-2 text-sm leading-6 text-white/54">
                  Courier accounts can sign in to the delivery dashboard and share live route updates.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Input
                    label="Name"
                    onChange={(event) => handleAccountFormChange("COURIER", "name", event.target.value)}
                    placeholder="Night Courier"
                    value={accountForms.COURIER.name}
                  />
                  <Input
                    label="Email"
                    onChange={(event) => handleAccountFormChange("COURIER", "email", event.target.value)}
                    placeholder="courier@burger.mn"
                    type="email"
                    value={accountForms.COURIER.email}
                  />
                  <Input
                    label="Password"
                    onChange={(event) => handleAccountFormChange("COURIER", "password", event.target.value)}
                    placeholder="Courier password"
                    showPasswordToggle
                    type="password"
                    value={accountForms.COURIER.password}
                  />
                  <Input
                    label="Phone"
                    onChange={(event) => handleAccountFormChange("COURIER", "phone", event.target.value)}
                    placeholder="+976 9911 2233"
                    value={accountForms.COURIER.phone}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    isLoading={creatingAccountRole === "COURIER"}
                    onClick={() => handleCreateManagedUser("COURIER")}
                    size="sm"
                  >
                    Add courier
                  </Button>
                  <Button
                    disabled={creatingAccountRole === "COURIER"}
                    onClick={() => setAccountForms((current) => ({
                      ...current,
                      COURIER: createInitialAccountForm(),
                    }))}
                    size="sm"
                    variant="secondary"
                  >
                    Clear form
                  </Button>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {courierUsers.length ? (
                  courierUsers.map((entry) => (
                    <div
                      className="flex flex-col gap-4 rounded-[20px] border border-white/8 bg-white/[0.02] p-4 lg:flex-row lg:items-center lg:justify-between"
                      key={entry.id}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-semibold text-white">{entry.name}</p>
                          <span className="rounded-full bg-orange-500/14 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-300">
                            COURIER
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm text-white/54">{entry.email}</p>
                        <p className="mt-2 text-xs text-white/46">
                          {entry.phone ?? "No phone"} - Joined {formatDate(entry.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-[16px] border border-white/8 bg-black/20 px-4 py-3 text-center">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-white/34">Deliveries</p>
                          <p className="mt-2 text-lg font-black text-white">{entry.deliveryCount}</p>
                        </div>
                        <Button
                          isLoading={accountActionId === entry.id}
                          onClick={() => handleDeleteManagedUser(entry)}
                          size="sm"
                          variant="danger"
                        >
                          Delete courier
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/54">
                    No courier accounts found yet.
                  </p>
                )}
              </div>
            </Card>
          </section>
        ) : null}
      </div>
    </main>
  );
}
