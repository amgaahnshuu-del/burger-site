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
import type {
  DeliveryLocationInput,
} from "@/features/order/order.types";
import { useUserSettings } from "@/features/settings/settings.hooks";
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
  const effectiveContactPhone = hasEditedPhone
    ? contactPhone
    : userPhone ?? "";

  async function handleSubmit() {
    if (!effectiveDeliveryLocation.address.trim()) {
      setDeliveryLocationError("Delivery address is required.");
      return;
    }

    if (!effectiveContactPhone.trim()) {
      setContactPhoneError("Contact phone is required for delivery.");
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
      <TopBar searchPlaceholder="Search address or checkout notes" />
      <PageHeader
        description="Хүргэлтийн хаяг, утасны дугаар, төлбөрийн аргаа баталгаажуулаад захиалгаа илгээнэ үү."
        eyebrow="Checkout"
        title="Захиалах"
      />
      <OrderForm
        contactPhone={effectiveContactPhone}
        contactPhoneError={contactPhoneError}
        deliveryLocation={effectiveDeliveryLocation}
        deliveryLocationError={deliveryLocationError}
        error={error}
        isSubmitting={isSubmitting}
        items={cart.items}
        onDeliveryLocationChange={(nextLocation) => {
          setHasEditedAddress(true);
          setDeliveryLocation(nextLocation);
        }}
        onContactPhoneChange={(nextPhone) => {
          setHasEditedPhone(true);
          setContactPhone(nextPhone);
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
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { cart, isLoading: cartLoading, refresh } = useCart(isAuthenticated);

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
        description="Захиалга өгөхийн тулд эхлээд нэвтэрч орно уу."
          eyebrow="Checkout"
          title="Захиалах"
        />
        <EmptyState
          action={
            <Button asChild>
              <Link href="/auth/login?redirect=/protected/order">Go to login</Link>
            </Button>
          }
          description="Sign in first to load your cart and place the order into the delivery system."
          title="Checkout requires login."
        />
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-[1120px] space-y-6">
        <PageHeader
        description="Цэснээс хоолоо сонгоод энд буцаж ирэн захиалгаа үргэлжлүүлээрэй."
          eyebrow="Checkout"
          title="Захиалах"
        />
        <EmptyState
          action={
            <Button asChild>
              <Link href="/public/explore">Browse menu</Link>
            </Button>
          }
          description="Your basket is empty right now. Add a few dishes from the menu and come back here."
          title="No items ready for checkout."
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
