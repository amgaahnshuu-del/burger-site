"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  TruckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import { completeCourierOrder } from "@/features/courier/courier.service";
import { useCourierOrders } from "@/features/courier/courier.hooks";
import type { Order, Tracking } from "@/features/order/order.types";
import { useAuth } from "@/hooks/useAuth";
import {
  formatCurrency,
  formatDateTime,
  getErrorMessage,
  getOrderStatusLabel,
  getRelativeOrderTime,
  getTrackingStatusLabel,
} from "@/lib/helpers";
import { extractCoordinatesFromAddress } from "@/lib/order-lifecycle";

type Coordinates = {
  latitude: number;
  longitude: number;
};

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
const DEFAULT_LOCATION_QUERY = "Ulaanbaatar, Mongolia";

function getContactPhone(order: Order) {
  return order.contactPhone || order.user?.phone || null;
}

function getTrackingCoordinates(tracking: Tracking | null) {
  if (tracking?.latitude == null || tracking?.longitude == null) {
    return null;
  }

  return {
    latitude: tracking.latitude,
    longitude: tracking.longitude,
  };
}

function getDestinationCoordinates(order: Order) {
  if (
    typeof order.addressLatitude === "number" &&
    Number.isFinite(order.addressLatitude) &&
    typeof order.addressLongitude === "number" &&
    Number.isFinite(order.addressLongitude)
  ) {
    return {
      latitude: order.addressLatitude,
      longitude: order.addressLongitude,
    };
  }

  return extractCoordinatesFromAddress(order.address);
}

function getCoordinatesValue(coords: Coordinates | null) {
  if (!coords) {
    return null;
  }

  return `${coords.latitude},${coords.longitude}`;
}

function formatCoordinates(coords: Coordinates | null) {
  if (!coords) {
    return null;
  }

  return `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
}

function getDestinationQuery(order: Order) {
  const normalizedAddress = order.address.trim();

  if (!normalizedAddress) {
    return DEFAULT_LOCATION_QUERY;
  }

  return `${normalizedAddress}, Ulaanbaatar, Mongolia`;
}

function buildCourierMapEmbedUrl(order: Order) {
  const courierCoords = getTrackingCoordinates(order.tracking);
  const destinationCoords = getDestinationCoordinates(order);
  const destination = getCoordinatesValue(destinationCoords) ?? getDestinationQuery(order);
  const origin = getCoordinatesValue(courierCoords);

  if (GOOGLE_MAPS_API_KEY && origin) {
    const params = new URLSearchParams({
      destination,
      key: GOOGLE_MAPS_API_KEY,
      language: "mn",
      mode: "driving",
      origin,
    });

    return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`;
  }

  if (GOOGLE_MAPS_API_KEY) {
    const params = new URLSearchParams({
      key: GOOGLE_MAPS_API_KEY,
      language: "mn",
      q: destination,
    });

    return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
  }

  if (origin) {
    const params = new URLSearchParams({
      daddr: destination,
      dirflg: "d",
      hl: "mn",
      output: "embed",
      saddr: origin,
    });

    return `https://www.google.com/maps?${params.toString()}`;
  }

  const params = new URLSearchParams({
    hl: "mn",
    output: "embed",
    q: destination,
    z: "14",
  });

  return `https://www.google.com/maps?${params.toString()}`;
}

function buildCourierMapLink(order: Order) {
  const courierCoords = getTrackingCoordinates(order.tracking);
  const destinationCoords = getDestinationCoordinates(order);
  const destination = getCoordinatesValue(destinationCoords) ?? getDestinationQuery(order);
  const origin = getCoordinatesValue(courierCoords);

  if (origin) {
    const params = new URLSearchParams({
      api: "1",
      destination,
      origin,
      travelmode: "driving",
    });

    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  const params = new URLSearchParams({
    api: "1",
    query: destination,
  });

  return `https://www.google.com/maps/search/?${params.toString()}`;
}

function OrderItemsPreview({ order }: { order: Order }) {
  return (
    <div className="space-y-2">
      {order.items.map((item) => (
        <div
          className="flex items-center justify-between gap-3 rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3"
          key={item.id}
        >
          <div>
            <p className="text-sm font-semibold text-white">{item.food.name}</p>
            <p className="mt-1 text-xs text-white/42">Qty {item.quantity}</p>
          </div>
          <p className="text-sm text-white/72">
            {formatCurrency(item.price * item.quantity)}
          </p>
        </div>
      ))}
    </div>
  );
}

function CourierDestinationMap({ order }: { order: Order }) {
  const embedUrl = buildCourierMapEmbedUrl(order);
  const googleMapsHref = buildCourierMapLink(order);
  const destinationCoords = getDestinationCoordinates(order);
  const courierCoords = getTrackingCoordinates(order.tracking);
  const destinationCoordinatesLabel = formatCoordinates(destinationCoords);
  const courierCoordinatesLabel = formatCoordinates(courierCoords);

  return (
    <div className="relative h-[420px] overflow-hidden rounded-[22px] border border-white/8 bg-[#09090B] shadow-[0_24px_60px_rgba(0,0,0,0.34)]">
      <iframe
        aria-label="Courier active destination map"
        className="h-full w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={embedUrl}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(9,9,11,0.86),rgba(9,9,11,0))]" />

      <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-black/72 px-3 py-1 text-[11px] text-white/78 backdrop-blur">
          <MapPinIcon className="h-3.5 w-3.5 text-[var(--accent-3)]" />
          Customer destination
        </span>
        <span className="rounded-full border border-white/8 bg-black/72 px-3 py-1 text-[11px] text-white/60 backdrop-blur">
          {getTrackingStatusLabel(order.tracking?.status ?? "PREPARING")}
        </span>
      </div>

      <a
        className="absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/8 bg-black/72 px-3 py-1 text-[11px] text-white/78 backdrop-blur hover:border-white/14 hover:text-white"
        href={googleMapsHref}
        rel="noreferrer"
        target="_blank"
      >
        Open in Google Maps
        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
      </a>

      <div className="absolute bottom-4 left-4 right-4 z-10 max-w-2xl rounded-[20px] border border-white/8 bg-black/78 px-4 py-3 text-sm text-white/65 backdrop-blur">
        <p>{order.address}</p>
        <p className="mt-2">
          {destinationCoordinatesLabel
            ? `Customer coordinates: ${destinationCoordinatesLabel}`
            : "Customer coordinates were not shared, so the map is using the delivery address."}
        </p>
        <p className="mt-2">
          {courierCoordinatesLabel
            ? `Courier origin: ${courierCoordinatesLabel}`
            : "Route origin will become more precise after your courier GPS syncs."}
        </p>
      </div>
    </div>
  );
}

export default function CourierActiveTrackPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const isCourier = user?.role === "COURIER";
  const { data, error, isLoading, refresh } = useCourierOrders({
    enabled: isAuthenticated && isCourier,
    pollIntervalMs: 10000,
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isCompletingDelivery, setIsCompletingDelivery] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === "ADMIN") {
      router.replace("/admin?section=most-sell");
      return;
    }

    if (!authLoading && isAuthenticated && user?.role === "MANAGER") {
      router.replace("/manager");
    }
  }, [authLoading, isAuthenticated, router, user?.role]);

  async function handleComplete(orderId: string) {
    setActionError(null);
    setActionFeedback(null);
    setIsCompletingDelivery(true);

    try {
      await completeCourierOrder(orderId);
      setActionFeedback("Delivery confirmed successfully.");
      refresh();
    } catch (completeError) {
      setActionError(getErrorMessage(completeError));
    } finally {
      setIsCompletingDelivery(false);
    }
  }

  if (authLoading || (!data && isLoading && isCourier)) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="space-y-6">
        <PageHeader
          description="Sign in with a courier account to open the active delivery tracker."
          eyebrow="Courier"
          title="Active Track"
        />
        <EmptyState
          action={
            <Button asChild>
              <Link href="/auth/login?redirect=/courier/active-track">Go to login</Link>
            </Button>
          }
          description="Accepted delivery details and customer location appear here after courier sign-in."
          title="Courier login required."
        />
      </main>
    );
  }

  if (!isCourier || !user) {
    return (
      <main className="space-y-6">
        <PageHeader
          description="This route is reserved for delivery staff accounts."
          eyebrow="Courier"
          title="Restricted courier area"
        />
        <EmptyState
          action={
            <Button asChild variant="secondary">
              <Link href="/">Back to home</Link>
            </Button>
          }
          description="Ask an admin to provide a courier account if you need access to active route tracking."
          title="You do not have courier access."
        />
      </main>
    );
  }

  const activeOrder = data?.activeOrders[0] ?? null;
  const contactPhone = activeOrder ? getContactPhone(activeOrder) : null;

  return (
    <main className="space-y-6">
      <PageHeader
        description="See the delivery you already accepted, the customer handoff details, and the destination preview in one place."
        eyebrow="Courier"
        title="Active Track"
      />

      {error ? <Toast message={error} tone="error" /> : null}
      {actionError ? <Toast message={actionError} tone="error" /> : null}
      {actionFeedback ? <Toast message={actionFeedback} tone="info" /> : null}

      {!activeOrder ? (
        <EmptyState
          action={
            <Button asChild variant="secondary">
              <Link href="/courier">Open delivery dashboard</Link>
            </Button>
          }
          description="Claim an order from the courier dashboard and the customer location will appear here automatically."
          title="No accepted delivery yet."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5" variant="soft">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-orange-500/12 text-orange-300">
                <TruckIcon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/36">
                Accepted route
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                #{activeOrder.id.slice(0, 8)}
              </p>
            </Card>

            <Card className="p-5" variant="soft">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-orange-500/12 text-orange-300">
                <ClockIcon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/36">
                Ordered
              </p>
              <p className="mt-2 text-lg font-black text-white">
                {getRelativeOrderTime(activeOrder.createdAt)}
              </p>
              <p className="mt-1 text-sm text-white/54">
                {formatDateTime(activeOrder.createdAt)}
              </p>
            </Card>

            <Card className="p-5" variant="soft">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-orange-500/12 text-orange-300">
                <MapPinIcon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/36">
                Tracking status
              </p>
              <p className="mt-2 text-lg font-black text-white">
                {getTrackingStatusLabel(activeOrder.tracking?.status ?? "PREPARING")}
              </p>
              <p className="mt-1 text-sm text-white/54">
                {getOrderStatusLabel(activeOrder.status)}
              </p>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <Card className="space-y-5 p-6" variant="glow">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-300/70">
                    Accepted delivery
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    {activeOrder.user?.name ?? "Customer order"}
                  </h2>
                </div>
                <span className="rounded-full border border-orange-400/24 bg-orange-500/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                  {getTrackingStatusLabel(activeOrder.tracking?.status ?? "PREPARING")}
                </span>
              </div>

              <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/34">
                  Customer
                </p>
                <div className="mt-3 flex items-start gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-orange-500/12 text-orange-300">
                    <UserCircleIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">
                      {activeOrder.user?.name ?? "Unknown customer"}
                    </p>
                    <p className="mt-1 text-sm text-white/54">
                      {activeOrder.user?.email ?? "No email on file"}
                    </p>
                    <p className="mt-2 text-sm text-orange-300">
                      {contactPhone ?? "No phone captured"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/34">
                  Customer location
                </p>
                <p className="mt-3 text-base font-semibold text-white">
                  {activeOrder.addressLabel ?? "Delivery address"}
                </p>
                <p className="mt-2 text-sm leading-7 text-white/72">
                  {activeOrder.address}
                </p>
                {activeOrder.addressDistrict || activeOrder.addressKhoroo || activeOrder.addressUnit ? (
                  <p className="mt-3 text-sm text-white/56">
                    {[activeOrder.addressDistrict, activeOrder.addressKhoroo, activeOrder.addressUnit]
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                ) : null}
                {activeOrder.addressNotes ? (
                  <p className="mt-3 text-sm text-white/56">
                    Note: {activeOrder.addressNotes}
                  </p>
                ) : null}
              </div>

              <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/34">
                      Basket total
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {formatCurrency(activeOrder.totalPrice)}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/62">
                    {getOrderStatusLabel(activeOrder.status)}
                  </span>
                </div>

                <div className="mt-4">
                  <OrderItemsPreview order={activeOrder} />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {contactPhone ? (
                  <Button asChild size="sm">
                    <a href={`tel:${contactPhone}`}>
                      <PhoneIcon className="mr-2 h-4 w-4" />
                      Call customer
                    </a>
                  </Button>
                ) : null}
                <Button
                  isLoading={isCompletingDelivery}
                  onClick={() => handleComplete(activeOrder.id)}
                  size="sm"
                >
                  Mark as delivered
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/courier">Back to deliveries</Link>
                </Button>
              </div>
            </Card>

            <Card className="space-y-4 p-6" variant="default">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-300/70">
                  Destination preview
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Customer location on map
                </h2>
                <p className="mt-2 text-sm leading-7 text-white/56">
                  This map focuses on the delivery address the customer submitted during checkout.
                </p>
              </div>

              <CourierDestinationMap order={activeOrder} />
            </Card>
          </div>
        </>
      )}
    </main>
  );
}
