"use client";

import Link from "next/link";
import {
  ArrowLeftStartOnRectangleIcon,
  BellIcon,
  ChevronRightIcon,
  CreditCardIcon,
  GlobeAltIcon,
  LifebuoyIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Loader from "@/components/ui/Loader";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import type { AuthUser } from "@/features/auth/auth.types";
import { updateCurrentUser } from "@/features/auth/auth.service";
import { createFeedback } from "@/features/feedback/feedback.service";
import type { FeedbackType } from "@/features/feedback/feedback.types";
import type { PaymentMethod } from "@/features/order/order.types";
import { useUserSettings } from "@/features/settings/settings.hooks";
import { useAuth } from "@/hooks/useAuth";
import { useInterfaceSettings } from "@/hooks/useInterfaceSettings";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/constants";
import { cn, getErrorMessage } from "@/lib/helpers";
import {
  createAddressId,
  ensureSingleDefaultSavedAddresses,
  type SavedAddress,
  type SettingsLanguage,
  type UserSettingsPreferences,
} from "@/lib/settings-preferences";

type PanelKey =
  | "account"
  | "addressBook"
  | "payment"
  | "language"
  | "support";

type FeedbackState = {
  message: string;
  tone: "success" | "error" | "info";
};

type SettingsViewProps = {
  logout: () => Promise<void>;
  refresh: () => void;
  user: AuthUser;
};

function getLanguageDisplayLabel(value: SettingsLanguage, isMn: boolean) {
  if (value === "mn") {
    return isMn ? "Монгол" : "Mongolian";
  }

  return "English";
}

function getLanguageOptions(isMn: boolean) {
  return [
    {
      description: isMn
        ? "Интерфэйс англи хэлээр харагдана."
        : "Keep labels and browser language in English.",
      label: "English",
      value: "en" as const,
    },
    {
      description: isMn
        ? "Интерфэйсийг монгол хэл рүү шилжүүлнэ."
        : "Switch the interface preference to Mongolian.",
      label: isMn ? "Монгол" : "Mongolian",
      value: "mn" as const,
    },
  ];
}

function getPaymentMethodOptions(isMn: boolean) {
  if (!isMn) {
    return PAYMENT_METHOD_OPTIONS;
  }

  return [
    {
      value: "CARD" as const,
      label: "Карт",
      description: "Банкны картаар төлөөд баталгаажуулалт хүлээнэ.",
    },
    {
      value: "CASH" as const,
      label: "Бэлэн мөнгө",
      description: "Захиалга очиход хүргэгчид бэлнээр төлнө.",
    },
    {
      value: "QPAY" as const,
      label: "QPay",
      description: "Гар утасны хэтэвчээр төлж, төлбөрийн лавлагааг хянаарай.",
    },
  ];
}

function getPaymentMethodLabel(value: PaymentMethod, isMn: boolean) {
  return (
    getPaymentMethodOptions(isMn).find((option) => option.value === value)?.label
    ?? value
  );
}

function getSettingsText(isMn: boolean) {
  return {
    account: {
      description: isMn ? "Хувийн мэдээллээ шинэчлэх" : "Update your personal information",
      email: isMn ? "Имэйл" : "Email",
      name: isMn ? "Нэр" : "Name",
      phone: isMn ? "Утас" : "Phone",
      reset: isMn ? "Сэргээх" : "Reset",
      save: isMn ? "Хадгалах" : "Save changes",
      title: isMn ? "Бүртгэлийн мэдээлэл" : "Account Information",
    },
    addressBook: {
      clear: isMn ? "Цэвэрлэх" : "Clear",
      defaultBadge: isMn ? "Үндсэн" : "Default",
      deliveryDetails: isMn ? "Хүргэлтийн дэлгэрэнгүй" : "Delivery details",
      deliveryPlaceholder: isMn
        ? "Байр, орц, дүүрэг, ойр тэмдэг, хүргэгчид өгөх тайлбар"
        : "Apartment, building, district, landmark, and rider notes",
      description: isMn ? "Хадгалсан хаягуудаа удирдах" : "Manage your saved addresses",
      edit: isMn ? "Засах" : "Edit",
      empty: isMn
        ? "Энд үндсэн хүргэлтийн хаягаа хадгалбал checkout дээр автоматаар бөглөгдөнө."
        : "Save a default delivery address here and checkout will prefill it for you.",
      label: isMn ? "Шошго" : "Label",
      labelPlaceholder: isMn ? "Гэр, Оффис, Гэр бүл" : "Home, Office, Family",
      makeDefault: isMn ? "Үндсэн болгох" : "Make Default",
      remove: isMn ? "Устгах" : "Delete",
      selected: isMn ? "Сонгосон" : "Selected",
      summary: (count: number) =>
        count === 0
          ? (isMn ? "Хадгалсан хаяг алга" : "No saved address")
          : (isMn ? `${count} хаяг хадгалсан` : `${count} saved`),
      title: isMn ? "Хаягийн дэвтэр" : "Address Book",
      update: isMn ? "Хаяг шинэчлэх" : "Update Address",
      save: isMn ? "Хаяг хадгалах" : "Save Address",
    },
    adminBanner: {
      description: isMn
        ? "Хоолнууд, шилдэг борлуулалт, хэрэглэгчийн санал хүсэлтийг удирдах"
        : "Manage foods, best sellers, and customer feedback",
      title: isMn ? "Админ самбар" : "Admin Dashboard",
    },
    feedback: {
      clear: isMn ? "Цэвэрлэх" : "Clear",
      complaint: isMn ? "Гомдол" : "Complaint",
      label: isMn ? "Саналын төрөл" : "Feedback type",
      message: isMn ? "Мессеж" : "Message",
      placeholder: isMn
        ? "Юу болсон, танд юу хэрэгтэй байгаа, эсвэл юуг сайжруулахыг хүсэж байгаагаа бичнэ үү."
        : "Tell us what happened, what you need, or what you want improved.",
      send: isMn ? "Санал илгээх" : "Send feedback",
      sectionDescription: isMn
        ? "Таны мессеж шууд админы feedback inbox руу очно."
        : "Your message goes directly into the admin feedback inbox.",
      sectionTitle: isMn ? "Гомдол эсвэл санал илгээх" : "Send complaint or suggestion",
      suggestion: isMn ? "Санал" : "Suggestion",
    },
    guest: {
      action: isMn ? "Нэвтрэх хуудас руу очих" : "Go to login",
      description: isMn
        ? "Тохиргоо нь таны сесстэй холбоотой тул эхлээд нэвтэрч орно уу."
        : "Your settings are tied to your session, so log in first to manage them.",
      headerDescription: isMn
        ? "Бүртгэлийн мэдээлэл, checkout тохиргоо, интерфэйсийн сонголтоо удирдахын тулд нэвтэрнэ үү."
        : "Sign in to manage account information, checkout defaults, and interface preferences.",
      title: isMn ? "Тохиргоо нэвтрэлт шаардлагатай." : "Settings require login.",
    },
    language: {
      title: isMn ? "Хэл" : "Language",
    },
    logout: {
      loading: isMn ? "Гарч байна..." : "Signing you out...",
      subtitle: isMn ? "Бүртгэлээс гарах" : "Sign out from your account",
      title: isMn ? "Гарах" : "Logout",
    },
    managerBanner: {
      description: isMn
        ? "Ирж буй захиалгыг шалгаад хүргэгч рүү шилжүүлэх"
        : "Review incoming orders and hand them off to couriers",
      title: isMn ? "Менежер самбар" : "Manager Dashboard",
    },
    notifications: {
      description: isMn
        ? "Мэдэгдлийн тохиргоогоо удирдах"
        : "Manage your notification preferences",
      title: isMn ? "Мэдэгдэл" : "Notifications",
    },
    page: {
      description: isMn
        ? "Бүртгэл, checkout-ийн үндсэн сонголт, интерфэйсийн тохиргоогоо нэг дороос шинэчилнэ үү."
        : "Update your account, checkout defaults, and interface preferences from one place.",
      title: isMn ? "Тохиргоо" : "Settings",
    },
    payment: {
      description: isMn ? "Төлбөрийн аргаа удирдах" : "Manage your payment methods",
      intro: isMn
        ? "Checkout руу орох бүрт урьдчилан сонгогдох төлбөрийн аргаа сонгоно уу."
        : "Choose the payment method that should be preselected every time you enter checkout.",
      title: isMn ? "Төлбөрийн аргууд" : "Payment Methods",
    },
    status: {
      saving: isMn ? "Checkout тохиргоог хадгалж байна..." : "Saving checkout defaults...",
      syncing: isMn ? "Тохиргоог синк хийж байна..." : "Syncing settings...",
    },
    support: {
      call: isMn ? "Залгах +976 7711 2233" : "Call +976 7711 2233",
      description: isMn ? "Тусламж болон дэмжлэг авах" : "Get help and support",
      email: isMn ? "Имэйл дэмжлэг" : "Email support",
      intro: isMn
        ? "Захиалга, бүртгэл эсвэл checkout дээр тусламж хэрэгтэй бол доорх сувгуудаар холбогдоорой."
        : "Need help with an order, your account, or checkout? Reach the team through the support channels below.",
      messages: isMn ? "Дэмжлэгийн чат нээх" : "Open support messages",
      title: isMn ? "Тусламж ба дэмжлэг" : "Help & Support",
      tracking: isMn ? "Идэвхтэй захиалга хянах" : "Track an active order",
    },
    toast: {
      accountUpdated: isMn ? "Бүртгэлийн мэдээлэл шинэчлэгдлээ." : "Account information updated.",
      addressError: isMn ? "Шошго болон дэлгэрэнгүй хаягаа хоёуланг нь бөглөнө үү." : "Add both a label and full delivery details.",
      addressRemoved: isMn ? "Хаяг устгагдлаа." : "Address removed.",
      addressSaved: isMn ? "Хаяг хадгалагдлаа." : "Address saved.",
      addressUpdated: isMn ? "Хаяг шинэчлэгдлээ." : "Address updated.",
      defaultAddressUpdated: isMn ? "Үндсэн хаяг шинэчлэгдлээ." : "Default address updated.",
      feedbackEmpty: isMn ? "Эхлээд гомдол эсвэл саналаа бичнэ үү." : "Write your complaint or suggestion first.",
      feedbackSent: isMn ? "Таны санал админы самбар руу илгээгдлээ." : "Your feedback has been sent to the admin dashboard.",
      invalidEmail: isMn ? "Зөв имэйл хаяг оруулна уу." : "Enter a valid email address.",
      languageSelected: (value: SettingsLanguage) =>
        isMn
          ? `${getLanguageDisplayLabel(value, true)} хэл сонгогдлоо.`
          : `${getLanguageDisplayLabel(value, false)} selected.`,
      nameEmailRequired: isMn ? "Нэр болон имэйл заавал шаардлагатай." : "Name and email are required.",
      notificationsOff: isMn ? "Мэдэгдлийг унтраалаа." : "Notifications turned off.",
      notificationsOn: isMn ? "Мэдэгдлийг асаалаа." : "Notifications turned on.",
      paymentDefault: (value: PaymentMethod) =>
        isMn
          ? `${getPaymentMethodLabel(value, true)}-ийг checkout-ийн үндсэн сонголтоор хадгаллаа.`
          : `${getPaymentMethodLabel(value, false)} set as your checkout default.`,
    },
  };
}

type SettingsRowProps = {
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  rightSlot?: ReactNode;
  subtitle?: string;
  title: string;
  value?: ReactNode;
};

function SettingsPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[22px] border border-white/8 bg-[linear-gradient(145deg,rgba(18,18,20,0.97),rgba(8,8,10,0.99))] p-5 shadow-[0_24px_58px_rgba(0,0,0,0.35)] sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

function SettingsRow({
  active = false,
  danger = false,
  disabled = false,
  href,
  icon: Icon,
  onClick,
  rightSlot,
  subtitle,
  title,
  value,
}: SettingsRowProps) {
  const classes = cn(
    "group flex h-[72px] w-full items-center justify-between gap-4 overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(145deg,rgba(24,24,27,0.95),rgba(12,12,14,0.98))] px-[22px] text-left transition-[transform,border-color,box-shadow,background-color] duration-300",
    "hover:-translate-y-[2px] hover:border-[rgba(255,106,0,0.35)] hover:shadow-[0_18px_45px_rgba(255,106,0,0.12)]",
    active && "border-[rgba(255,106,0,0.28)] shadow-[0_14px_35px_rgba(255,106,0,0.1)]",
    danger &&
      "hover:border-[rgba(255,118,88,0.3)] hover:shadow-[0_18px_45px_rgba(255,96,32,0.1)]",
    disabled && "cursor-not-allowed opacity-60 hover:translate-y-0 hover:shadow-none"
  );

  const content = (
    <>
      <div className="flex min-w-0 items-center gap-4">
        <span
          className={cn(
            "inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] border border-orange-400/16 bg-[linear-gradient(145deg,rgba(255,106,0,0.16),rgba(255,255,255,0.04))] text-orange-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(255,106,0,0.14)]",
            danger && "border-orange-400/20 text-orange-300"
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-white">{title}</p>
          {subtitle ? (
            <p className="mt-1 truncate text-[13px] text-white/45">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-3">
        {value ? (
          <span className="hidden max-w-[240px] truncate text-right text-[13px] text-white/40 sm:block">
            {value}
          </span>
        ) : null}
        {rightSlot ?? (
          <ChevronRightIcon
            className={cn(
              "h-4 w-4 shrink-0 text-white/34 transition duration-300 group-hover:text-white/65",
              active && "rotate-90 text-white/55"
            )}
          />
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link className={classes} href={href}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {content}
    </button>
  );
}

function SettingsView({ logout, refresh, user }: SettingsViewProps) {
  const router = useRouter();
  const { settings: interfaceSettings, updateSettings: updateInterfaceSettings } = useInterfaceSettings();
  const isMn = interfaceSettings.language === "mn";
  const text = getSettingsText(isMn);
  const languageOptions = getLanguageOptions(isMn);
  const paymentMethodOptions = getPaymentMethodOptions(isMn);

  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);
  const [addressDraft, setAddressDraft] = useState({
    details: "",
    id: "",
    label: "",
  });
  const [addressError, setAddressError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [accountForm, setAccountForm] = useState({
    email: user.email,
    name: user.name,
    phone: user.phone ?? "",
  });
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("SUGGESTION");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const {
    error: settingsError,
    isLoading: isLoadingSettings,
    isSaving: isSavingSettings,
    saveSettings,
    settings: userSettings,
  } = useUserSettings(user.id);

  async function persistUserSettings(
    nextSettings: UserSettingsPreferences,
    message?: string
  ) {
    try {
      await saveSettings(nextSettings);

      if (message) {
        setFeedback({ message, tone: "success" });
      }

      return true;
    } catch {
      return false;
    }
  }

  function persistInterfaceSettings(message: string, nextLanguage: SettingsLanguage) {
    updateInterfaceSettings({
      ...interfaceSettings,
      language: nextLanguage,
    });
    setFeedback({ message, tone: "success" });
  }

  function togglePanel(panel: PanelKey) {
    setActivePanel((current) => (current === panel ? null : panel));
    setAddressError(null);
  }

  function resetAddressDraft() {
    setAddressDraft({
      details: "",
      id: "",
      label: "",
    });
    setAddressError(null);
  }

  async function handleNotificationToggle() {
    await persistUserSettings(
      {
        ...userSettings,
        notificationsEnabled: !userSettings.notificationsEnabled,
      },
      userSettings.notificationsEnabled
        ? text.toast.notificationsOff
        : text.toast.notificationsOn
    );
  }

  async function handleAccountSave() {
    const name = accountForm.name.trim();
    const email = accountForm.email.trim().toLowerCase();
    const phone = accountForm.phone.trim();

    if (!name || !email) {
      setFeedback({
        message: text.toast.nameEmailRequired,
        tone: "error",
      });
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setFeedback({
        message: text.toast.invalidEmail,
        tone: "error",
      });
      return;
    }

    setIsSavingAccount(true);

    try {
      const updatedUser = await updateCurrentUser({
        email,
        name,
        phone: phone || null,
      });

      setAccountForm({
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone ?? "",
      });
      refresh();
      setFeedback({
        message: text.toast.accountUpdated,
        tone: "success",
      });
      setActivePanel(null);
    } catch (error) {
      setFeedback({
        message: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setIsSavingAccount(false);
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      router.push("/auth/login");
    } catch (error) {
      setFeedback({
        message: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setIsLoggingOut(false);
    }
  }

  async function handleFeedbackSubmit() {
    const message = feedbackMessage.trim();

    if (!message) {
      setFeedback({
        message: text.toast.feedbackEmpty,
        tone: "error",
      });
      return;
    }

    setIsSubmittingFeedback(true);

    try {
      await createFeedback({
        message,
        type: feedbackType,
      });
      setFeedbackMessage("");
      setFeedbackType("SUGGESTION");
      setFeedback({
        message: text.toast.feedbackSent,
        tone: "success",
      });
      setActivePanel(null);
    } catch (error) {
      setFeedback({
        message: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  }

  async function handleAddressSubmit() {
    const label = addressDraft.label.trim();
    const details = addressDraft.details.trim();

    if (!label || !details) {
      setAddressError(text.toast.addressError);
      return;
    }

    const editingId = addressDraft.id.trim();
    const nextAddresses = editingId
      ? userSettings.savedAddresses.map((address) => (
          address.id === editingId
            ? {
                ...address,
                details,
                label,
              }
            : address
        ))
      : [
          ...userSettings.savedAddresses,
          {
            apartmentUnit: null,
            details,
            district: null,
            id: createAddressId(),
            isDefault: userSettings.savedAddresses.length === 0,
            khoroo: null,
            label,
            latitude: null,
            longitude: null,
          },
        ];

    const saved = await persistUserSettings(
      {
        ...userSettings,
        savedAddresses: ensureSingleDefaultSavedAddresses(nextAddresses),
      },
      editingId ? text.toast.addressUpdated : text.toast.addressSaved
    );

    if (saved) {
      resetAddressDraft();
    }
  }

  function handleEditAddress(address: SavedAddress) {
    setAddressDraft({
      details: address.details,
      id: address.id,
      label: address.label,
    });
    setAddressError(null);
  }

  async function handleDeleteAddress(addressId: string) {
    const nextAddresses = userSettings.savedAddresses.filter((address) => address.id !== addressId);

    await persistUserSettings(
      {
        ...userSettings,
        savedAddresses: ensureSingleDefaultSavedAddresses(nextAddresses),
      },
      text.toast.addressRemoved
    );

    if (addressDraft.id === addressId) {
      resetAddressDraft();
    }
  }

  async function handleDefaultAddress(addressId: string) {
    await persistUserSettings(
      {
        ...userSettings,
        savedAddresses: userSettings.savedAddresses.map((address) => ({
          ...address,
          isDefault: address.id === addressId,
        })),
      },
      text.toast.defaultAddressUpdated
    );
  }

  async function handlePaymentMethodChange(value: PaymentMethod) {
    await persistUserSettings(
      {
        ...userSettings,
        preferredPaymentMethod: value,
      },
      text.toast.paymentDefault(value)
    );
  }

  function handleLanguageChange(value: SettingsLanguage) {
    persistInterfaceSettings(text.toast.languageSelected(value), value);
  }

  return (
    <main className="relative overflow-hidden rounded-[30px] bg-[#050505] px-4 py-6 sm:px-5 lg:p-[36px]">
      <div className="pointer-events-none absolute right-[-110px] top-[-130px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(255,106,0,0.42)_0%,rgba(255,106,0,0.16)_28%,rgba(255,106,0,0.06)_48%,transparent_72%)] blur-[10px]" />
      <div className="relative w-full max-w-[1130px]">
        <header className="mb-7 max-w-[980px]">
          <h1 className="text-[34px] font-[850] tracking-[-0.04em] text-white">
            {text.page.title}
          </h1>
          <p className="mt-2 text-[15px] text-[rgba(255,255,255,0.65)]">
            {text.page.description}
          </p>
        </header>

        <div className="w-full space-y-4">
          {feedback ? <Toast message={feedback.message} tone={feedback.tone} /> : null}
          {!feedback && settingsError ? (
            <Toast message={settingsError} tone="error" />
          ) : null}
          {isLoadingSettings || isSavingSettings ? (
            <p className="text-[13px] text-white/42">
              {isSavingSettings ? text.status.saving : text.status.syncing}
            </p>
          ) : null}
        </div>

        <section className="w-full space-y-[14px]">
          {user.role === "ADMIN" ? (
            <SettingsRow
              href="/admin?section=most-sell"
              icon={ShieldCheckIcon}
              subtitle={text.adminBanner.description}
              title={text.adminBanner.title}
            />
          ) : user.role === "MANAGER" ? (
            <SettingsRow
              href="/manager"
              icon={ShieldCheckIcon}
              subtitle={text.managerBanner.description}
              title={text.managerBanner.title}
            />
          ) : null}

          <div className="space-y-[14px]">
            <SettingsRow
              active={activePanel === "account"}
              icon={UserCircleIcon}
              onClick={() => togglePanel("account")}
              subtitle={text.account.description}
              title={text.account.title}
              value={accountForm.email}
            />
            {activePanel === "account" ? (
              <SettingsPanel>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label={text.account.name}
                    onChange={(event) =>
                      setAccountForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    value={accountForm.name}
                  />
                  <Input
                    label={text.account.email}
                    onChange={(event) =>
                      setAccountForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    type="email"
                    value={accountForm.email}
                  />
                </div>
                <div className="mt-4 max-w-[22rem]">
                  <Input
                    label={text.account.phone}
                    onChange={(event) =>
                      setAccountForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="+976 9911 2233"
                    value={accountForm.phone}
                  />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    className="rounded-[14px]"
                    isLoading={isSavingAccount}
                    onClick={handleAccountSave}
                    size="sm"
                  >
                    {text.account.save}
                  </Button>
                  <Button
                    className="rounded-[14px]"
                    onClick={() =>
                      setAccountForm({
                        email: user.email,
                        name: user.name,
                        phone: user.phone ?? "",
                      })
                    }
                    size="sm"
                    variant="secondary"
                  >
                    {text.account.reset}
                  </Button>
                </div>
              </SettingsPanel>
            ) : null}
          </div>

          <div className="space-y-[14px]">
            <SettingsRow
              active={activePanel === "addressBook"}
              icon={MapPinIcon}
              onClick={() => togglePanel("addressBook")}
              subtitle={text.addressBook.description}
              title={text.addressBook.title}
              value={text.addressBook.summary(userSettings.savedAddresses.length)}
            />
            {activePanel === "addressBook" ? (
              <SettingsPanel>
                <div className="space-y-3">
                  {userSettings.savedAddresses.length === 0 ? (
                    <p className="text-sm leading-6 text-white/48">
                      {text.addressBook.empty}
                    </p>
                  ) : (
                    userSettings.savedAddresses.map((address) => (
                      <div
                        className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4"
                        key={address.id}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-white">
                                {address.label}
                              </p>
                              {address.isDefault ? (
                                <span className="rounded-full border border-orange-400/22 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300">
                                  {text.addressBook.defaultBadge}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 max-w-[42rem] text-sm leading-6 text-white/48">
                              {address.details}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              className="rounded-[12px]"
                              disabled={isSavingSettings}
                              onClick={() => void handleDefaultAddress(address.id)}
                              size="sm"
                              variant={address.isDefault ? "secondary" : "outline"}
                            >
                              {address.isDefault
                                ? text.addressBook.selected
                                : text.addressBook.makeDefault}
                            </Button>
                            <Button
                              className="rounded-[12px]"
                              disabled={isSavingSettings}
                              onClick={() => handleEditAddress(address)}
                              size="sm"
                              variant="secondary"
                            >
                              {text.addressBook.edit}
                            </Button>
                            <Button
                              className="rounded-[12px]"
                              disabled={isSavingSettings}
                              onClick={() => void handleDeleteAddress(address.id)}
                              size="sm"
                              variant="danger"
                            >
                              {text.addressBook.remove}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-5 rounded-[18px] border border-white/8 bg-white/[0.025] p-4 sm:p-5">
                  <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
                    <Input
                      error={addressError ?? undefined}
                      label={text.addressBook.label}
                      onChange={(event) =>
                        setAddressDraft((current) => ({
                          ...current,
                          label: event.target.value,
                        }))
                      }
                      placeholder={text.addressBook.labelPlaceholder}
                      value={addressDraft.label}
                    />
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-white/58">
                        {text.addressBook.deliveryDetails}
                      </span>
                      <textarea
                        className="min-h-28 w-full rounded-[18px] border border-white/10 bg-[#101011] px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-white/30 focus:border-orange-400/60 focus:bg-[#151517] focus:shadow-[0_0_0_3px_rgba(255,106,0,0.1)] hover:border-white/18"
                        onChange={(event) =>
                          setAddressDraft((current) => ({
                            ...current,
                            details: event.target.value,
                          }))
                        }
                        placeholder={text.addressBook.deliveryPlaceholder}
                        value={addressDraft.details}
                      />
                    </label>
                  </div>
                  {addressError ? (
                    <p className="mt-3 text-sm text-orange-300">{addressError}</p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      className="rounded-[14px]"
                      disabled={isSavingSettings}
                      onClick={() => void handleAddressSubmit()}
                      size="sm"
                    >
                      {addressDraft.id
                        ? text.addressBook.update
                        : text.addressBook.save}
                    </Button>
                    <Button
                      className="rounded-[14px]"
                      onClick={resetAddressDraft}
                      size="sm"
                      variant="secondary"
                    >
                      {text.addressBook.clear}
                    </Button>
                  </div>
                </div>
              </SettingsPanel>
            ) : null}
          </div>

          <div className="space-y-[14px]">
            <SettingsRow
              active={activePanel === "payment"}
              icon={CreditCardIcon}
              onClick={() => togglePanel("payment")}
              subtitle={text.payment.description}
              title={text.payment.title}
              value={getPaymentMethodLabel(
                userSettings.preferredPaymentMethod,
                isMn
              )}
            />
            {activePanel === "payment" ? (
              <SettingsPanel>
                <p className="mb-4 text-sm leading-6 text-white/48">
                  {text.payment.intro}
                </p>
                <div className="grid gap-3 lg:grid-cols-3">
                  {paymentMethodOptions.map((option) => (
                    <button
                      className={cn(
                        "rounded-[18px] border px-4 py-4 text-left transition duration-300",
                        userSettings.preferredPaymentMethod === option.value
                          ? "border-orange-400/55 bg-orange-500/10 shadow-[0_14px_30px_rgba(255,106,0,0.08)]"
                          : "border-white/10 bg-white/[0.03] hover:-translate-y-[2px] hover:border-orange-400/26 hover:bg-white/[0.05]"
                      )}
                      disabled={isSavingSettings}
                      key={option.value}
                      onClick={() => void handlePaymentMethodChange(option.value)}
                      type="button"
                    >
                      <p className="font-medium text-white">{option.label}</p>
                      <p className="mt-2 text-sm leading-6 text-white/50">
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>
              </SettingsPanel>
            ) : null}
          </div>

          <article className="flex h-[72px] items-center justify-between gap-4 overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(145deg,rgba(24,24,27,0.95),rgba(12,12,14,0.98))] px-[22px]">
            <div className="flex min-w-0 items-center gap-4">
              <span className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] border border-orange-400/16 bg-[linear-gradient(145deg,rgba(255,106,0,0.16),rgba(255,255,255,0.04))] text-orange-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(255,106,0,0.14)]">
                <BellIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-white">
                  {text.notifications.title}
                </p>
                <p className="mt-1 truncate text-[13px] text-white/45">
                  {text.notifications.description}
                </p>
              </div>
            </div>
            <button
              aria-label={text.notifications.title}
              className={cn(
                "relative h-[30px] w-[54px] shrink-0 rounded-full border transition-all duration-300",
                userSettings.notificationsEnabled
                  ? "border-orange-300/40 bg-[linear-gradient(135deg,#ff6a00,#ff9a31)] shadow-[0_0_18px_rgba(255,106,0,0.22)]"
                  : "border-white/10 bg-white/[0.08]"
              )}
              disabled={isSavingSettings}
              onClick={() => void handleNotificationToggle()}
              type="button"
            >
              <span
                className={cn(
                  "absolute left-[3px] top-[3px] h-6 w-6 rounded-full bg-white shadow-[0_6px_18px_rgba(255,255,255,0.2)] transition-transform duration-300",
                  userSettings.notificationsEnabled && "translate-x-6"
                )}
              />
            </button>
          </article>

          <div className="space-y-[14px]">
            <SettingsRow
              active={activePanel === "language"}
              icon={GlobeAltIcon}
              onClick={() => togglePanel("language")}
              subtitle={
                isMn
                  ? "Интерфэйсийн хэл болон текстийн сонголт"
                  : "Choose the language used across the interface"
              }
              title={text.language.title}
              value={getLanguageDisplayLabel(interfaceSettings.language, isMn)}
            />
            {activePanel === "language" ? (
              <SettingsPanel>
                <div className="grid gap-3 md:grid-cols-2">
                  {languageOptions.map((option) => (
                    <button
                      className={cn(
                        "rounded-[18px] border px-4 py-4 text-left transition duration-300",
                        interfaceSettings.language === option.value
                          ? "border-orange-400/55 bg-orange-500/10 shadow-[0_14px_30px_rgba(255,106,0,0.08)]"
                          : "border-white/10 bg-white/[0.03] hover:-translate-y-[2px] hover:border-orange-400/26 hover:bg-white/[0.05]"
                      )}
                      key={option.value}
                      onClick={() => handleLanguageChange(option.value)}
                      type="button"
                    >
                      <p className="font-medium text-white">{option.label}</p>
                      <p className="mt-2 text-sm leading-6 text-white/50">
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>
              </SettingsPanel>
            ) : null}
          </div>

          <div className="space-y-[14px]">
            <SettingsRow
              active={activePanel === "support"}
              icon={LifebuoyIcon}
              onClick={() => togglePanel("support")}
              subtitle={text.support.description}
              title={text.support.title}
            />
            {activePanel === "support" ? (
              <SettingsPanel>
                <p className="text-sm leading-6 text-white/48">
                  {text.support.intro}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Button
                    asChild
                    className="rounded-[14px]"
                    size="sm"
                    variant="secondary"
                  >
                    <Link href="/messages">{text.support.messages}</Link>
                  </Button>
                  <Button
                    asChild
                    className="rounded-[14px]"
                    size="sm"
                    variant="secondary"
                  >
                    <a href="mailto:support@burger.mn">{text.support.email}</a>
                  </Button>
                  <Button
                    asChild
                    className="rounded-[14px]"
                    size="sm"
                    variant="outline"
                  >
                    <a href="tel:+97677112233">{text.support.call}</a>
                  </Button>
                  <Button
                    asChild
                    className="rounded-[14px]"
                    size="sm"
                    variant="outline"
                  >
                    <Link href="/track-order">{text.support.tracking}</Link>
                  </Button>
                </div>

                <div className="mt-6 rounded-[18px] border border-white/8 bg-white/[0.025] p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {text.feedback.sectionTitle}
                      </p>
                      <p className="text-sm text-white/48">
                        {text.feedback.sectionDescription}
                      </p>
                    </div>
                    <label className="block sm:min-w-[210px]">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-white/58">
                        {text.feedback.label}
                      </span>
                      <select
                        className="min-h-12 w-full rounded-[18px] border border-white/10 bg-[#101011] px-4 py-3 text-white outline-none transition-all duration-300 focus:border-orange-400/60 focus:bg-[#151517] focus:shadow-[0_0_0_3px_rgba(255,106,0,0.1)] hover:border-white/18"
                        onChange={(event) =>
                          setFeedbackType(event.target.value as FeedbackType)
                        }
                        value={feedbackType}
                      >
                        <option value="SUGGESTION">
                          {text.feedback.suggestion}
                        </option>
                        <option value="COMPLAINT">
                          {text.feedback.complaint}
                        </option>
                      </select>
                    </label>
                  </div>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-white/58">
                      {text.feedback.message}
                    </span>
                    <textarea
                      className="min-h-32 w-full rounded-[18px] border border-white/10 bg-[#101011] px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-white/30 focus:border-orange-400/60 focus:bg-[#151517] focus:shadow-[0_0_0_3px_rgba(255,106,0,0.1)] hover:border-white/18"
                      onChange={(event) => setFeedbackMessage(event.target.value)}
                      placeholder={text.feedback.placeholder}
                      value={feedbackMessage}
                    />
                  </label>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      className="rounded-[14px]"
                      isLoading={isSubmittingFeedback}
                      onClick={handleFeedbackSubmit}
                      size="sm"
                    >
                      {text.feedback.send}
                    </Button>
                    <Button
                      className="rounded-[14px]"
                      onClick={() => {
                        setFeedbackMessage("");
                        setFeedbackType("SUGGESTION");
                      }}
                      size="sm"
                      variant="secondary"
                    >
                      {text.feedback.clear}
                    </Button>
                  </div>
                </div>
              </SettingsPanel>
            ) : null}
          </div>

          <SettingsRow
            danger
            disabled={isLoggingOut}
            icon={ArrowLeftStartOnRectangleIcon}
            onClick={handleLogout}
            rightSlot={
              isLoggingOut ? (
                <Loader />
              ) : (
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-white/34 transition duration-300 group-hover:text-orange-200" />
              )
            }
            subtitle={isLoggingOut ? text.logout.loading : text.logout.subtitle}
            title={text.logout.title}
          />
        </section>
      </div>
    </main>
  );
}

export default function SettingsPage() {
  const { settings: interfaceSettings } = useInterfaceSettings();
  const { isAuthenticated, isLoading, logout, refresh, user } = useAuth();
  const isMn = interfaceSettings.language === "mn";
  const guestText = getSettingsText(isMn).guest;
  const pageText = getSettingsText(isMn).page;

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main className="space-y-6">
        <PageHeader
          description={guestText.headerDescription}
          title={pageText.title}
        />
        <EmptyState
          action={
            <Button asChild>
              <Link href="/auth/login?redirect=/protected/settings">{guestText.action}</Link>
            </Button>
          }
          description={guestText.description}
          title={guestText.title}
        />
      </main>
    );
  }

  return <SettingsView key={user.id} logout={logout} refresh={refresh} user={user} />;
}
