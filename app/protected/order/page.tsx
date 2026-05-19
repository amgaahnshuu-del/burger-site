"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import OrderForm from "@/components/order/OrderForm";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import PageHeader from "@/components/ui/PageHeader";
import { useCart } from "@/features/cart/cart.hooks";
import type { Cart } from "@/features/cart/cart.types";
import { createOrder } from "@/features/order/order.service";
import type { DeliveryLocationInput } from "@/features/order/order.types";
import { useUserSettings } from "@/features/settings/settings.hooks";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import { useAuth } from "@/hooks/useAuth";
import { CART_UPDATED_EVENT } from "@/lib/constants";
import { dispatchAppEvent, getErrorMessage } from "@/lib/helpers";
import { getDefaultSavedAddress } from "@/lib/settings-preferences";

type AuthenticatedOrderPageProps = {
  cart: Cart;
  refresh: () => Promise<void> | void;
  userId: string;
  userPhone: string | null;
};

function createDeliveryLocationFromDefaultAddress(
  defaultAddress: ReturnType<typeof getDefaultSavedAddress>
): DeliveryLocationInput {
  if (!defaultAddress) {
    return {
      address: "",
      addressDistrict: null,
      addressKhoroo: null,
      addressLabel: null,
      addressLatitude: null,
      addressLongitude: null,
      addressNotes: null,
      addressUnit: null,
    };
  }

  return {
    address: defaultAddress.details,
    addressDistrict: defaultAddress.district,
    addressKhoroo: defaultAddress.khoroo,
    addressLabel: defaultAddress.label,
    addressLatitude: defaultAddress.latitude,
    addressLongitude: defaultAddress.longitude,
    addressNotes: null,
    addressUnit: defaultAddress.apartmentUnit,
  };
}

function AuthenticatedOrderPage({
  cart,
  refresh,
  userId,
  userPhone,
}: AuthenticatedOrderPageProps) {
  const { t } = useAppLanguage();
  const router = useRouter();
  const { settings } = useUserSettings(userId);
  const defaultAddress = getDefaultSavedAddress(settings);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocationInput>(
    () => createDeliveryLocationFromDefaultAddress(defaultAddress)
  );
  const [deliveryLocationError, setDeliveryLocationError] = useState<string | undefined>();
  const [contactPhone, setContactPhone] = useState(userPhone ?? "");
  const [contactPhoneError, setContactPhoneError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [hasEditedAddress, setHasEditedAddress] = useState(false);
  const [hasEditedPhone, setHasEditedPhone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const effectiveDeliveryLocation = hasEditedAddress
    ? deliveryLocation
    : createDeliveryLocationFromDefaultAddress(defaultAddress);
  const effectivePaymentMethod = "QPAY";
  const effectiveContactPhone = hasEditedPhone ? contactPhone : userPhone ?? "";

  async function handleSubmit() {
    if (!effectiveDeliveryLocation.address.trim()) {
      setDeliveryLocationError(
        t({
          en: "Delivery address is required.",
          mn: "Хүргэлтийн хаяг заавал шаардлагатай.",
        })
      );
      return;
    }

    if (!effectiveContactPhone.trim()) {
      setContactPhoneError(
        t({
          en: "Contact phone is required for delivery.",
          mn: "Хүргэлтэд холбоо барих утас шаардлагатай.",
        })
      );
      return;
    }

    setDeliveryLocationError(undefined);
    setContactPhoneError(undefined);
    setError(null);
    setIsSubmitting(true);

    try {
      const order = await createOrder({
        ...effectiveDeliveryLocation,
        contactPhone: effectiveContactPhone.trim(),
        items: cart.items.map((item) => ({
          foodId: item.foodId,
          quantity: item.quantity,
        })),
        paymentMethod: effectivePaymentMethod,
      });

      dispatchAppEvent(CART_UPDATED_EVENT);
      await refresh();
      router.push(`/protected/order/success?id=${order.id}`);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1120px] space-y-6">
      <TopBar searchPlaceholder={t({ en: "Search address or checkout notes", mn: "Хаяг эсвэл тэмдэглэл хайх" })} />
      <PageHeader
        description={t({
          en: "Confirm your delivery address, contact number, and payment method before sending the order.",
          mn: "Хүргэлтийн хаяг, утасны дугаар, төлбөрийн мэдээллээ баталгаажуулаад захиалгаа илгээнэ үү.",
        })}
        eyebrow={t({ en: "Checkout", mn: "Захиалга" })}
        title={t({ en: "Checkout", mn: "Захиалах" })}
      />
      <OrderForm
        contactPhone={effectiveContactPhone}
        contactPhoneError={contactPhoneError}
        deliveryLocation={effectiveDeliveryLocation}
        deliveryLocationError={deliveryLocationError}
        error={error}
        isSubmitting={isSubmitting}
        items={cart.items}
        onContactPhoneChange={(nextPhone) => {
          setHasEditedPhone(true);
          setContactPhone(nextPhone);
        }}
        onDeliveryLocationChange={(nextLocation) => {
          setHasEditedAddress(true);
          setDeliveryLocation(nextLocation);
        }}
        onPaymentMethodChange={() => undefined}
        onSubmit={handleSubmit}
        paymentMethod={effectivePaymentMethod}
        subtotal={cart.subtotal}
      />
    </main>
  );
}

export default function OrderPage() {
  const { t } = useAppLanguage();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { cart, isLoading: cartLoading, refresh } = useCart();

  if (authLoading || cartLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main className="mx-auto w-full max-w-[1120px] space-y-6">
        <PageHeader
          description={t({
            en: "Please sign in first to place an order.",
            mn: "Захиалга өгөхийн тулд эхлээд нэвтэрнэ үү.",
          })}
          eyebrow={t({ en: "Checkout", mn: "Захиалга" })}
          title={t({ en: "Checkout", mn: "Захиалах" })}
        />
        <EmptyState
          action={(
            <Button asChild>
              <Link href="/auth/login?redirect=/protected/order">
                {t({ en: "Go to login", mn: "Нэвтрэх" })}
              </Link>
            </Button>
          )}
          description={t({
            en: "Sign in first to load your cart and place the order into the delivery system.",
            mn: "Сагсаа ачаалж, захиалгаа хүргэлтийн систем рүү илгээхийн тулд эхлээд нэвтэрнэ үү.",
          })}
          title={t({
            en: "Checkout requires login.",
            mn: "Захиалга нэвтрэлт шаардлагатай.",
          })}
        />
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-[1120px] space-y-6">
        <PageHeader
          description={t({
            en: "Choose a few dishes from the menu, then return here to finish your order.",
            mn: "Цэснээс хоолоо сонгоод, дараа нь энд эргэж ирж захиалгаа үргэлжлүүлнэ үү.",
          })}
          eyebrow={t({ en: "Checkout", mn: "Захиалга" })}
          title={t({ en: "Checkout", mn: "Захиалах" })}
        />
        <EmptyState
          action={(
            <Button asChild>
              <Link href="/public/explore">{t({ en: "Browse menu", mn: "Цэс үзэх" })}</Link>
            </Button>
          )}
          description={t({
            en: "Your basket is empty right now. Add a few dishes from the menu and come back here.",
            mn: "Таны сагс одоогоор хоосон байна. Цэснээс хоол нэмж байгаад энд эргэж ирээрэй.",
          })}
          title={t({
            en: "No items ready for checkout.",
            mn: "Захиалахад бэлэн бүтээгдэхүүн алга.",
          })}
        />
      </main>
    );
  }

  return (
    <AuthenticatedOrderPage
      cart={cart}
      key={user.id}
      refresh={refresh}
      userId={user.id}
      userPhone={user.phone}
    />
  );
}
