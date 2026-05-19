type CourierOrderPartyLike = {
  email: string;
  name: string;
  phone: string | null;
} & Record<string, unknown>;

type CourierTrackingLike = {
  latitude: number | null;
  longitude: number | null;
} & Record<string, unknown>;

type CourierAvailableOrderLike = {
  address: string;
  addressDistrict?: string | null;
  addressKhoroo?: string | null;
  addressLabel?: string | null;
  addressLatitude?: number | null;
  addressLongitude?: number | null;
  addressNotes?: string | null;
  addressUnit?: string | null;
  contactPhone?: string | null;
  payment?: unknown;
  tracking?: CourierTrackingLike | null;
  user?: CourierOrderPartyLike | null;
} & Record<string, unknown>;

function getAvailableOrderLocationPreview(order: CourierAvailableOrderLike) {
  const parts = [
    order.addressLabel,
    order.addressDistrict,
    order.addressKhoroo,
  ].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0
  );

  if (parts.length > 0) {
    return parts.join(" / ");
  }

  return "Delivery details unlock after you claim this order.";
}

export function sanitizeCourierAvailableOrder<T extends CourierAvailableOrderLike>(
  order: T
) {
  return {
    ...order,
    address: getAvailableOrderLocationPreview(order),
    addressLatitude: null,
    addressLongitude: null,
    addressNotes: null,
    addressUnit: null,
    contactPhone: null,
    payment: null,
    tracking: order.tracking
      ? {
          ...order.tracking,
          latitude: null,
          longitude: null,
        }
      : null,
    user: order.user
      ? {
          ...order.user,
          email: "",
          name: "Customer",
          phone: null,
        }
      : order.user,
  } as T;
}
