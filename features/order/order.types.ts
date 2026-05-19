import type { Food } from "@/features/food/food.types";
import type { UserRole } from "@/features/auth/auth.types";

export type PaymentMethod = "CASH" | "CARD" | "QPAY";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type TrackingStatus = "PREPARING" | "ON_THE_WAY" | "DELIVERED";
export type DeliveryVerificationChannel =
  | "SMS"
  | "EMAIL"
  | "DEVELOPMENT_LOG";
export type DeliveryVerificationStatus = "PENDING" | "VERIFIED" | "EXPIRED";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COOKING"
  | "DELIVERING"
  | "DELIVERED"
  | "CANCELLED";

export type OrderItem = {
  id: string;
  orderId: string;
  foodId: string | null;
  foodCategory: string;
  foodImage: string;
  foodName: string;
  quantity: number;
  price: number;
  food: Food;
};

export type Payment = {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  providerReference: string | null;
  providerPayload: unknown;
  paidAt: string | null;
  failedAt: string | null;
  refundedAt: string | null;
  failureReason: string | null;
  createdAt: string;
};

export type Tracking = {
  id: string;
  orderId: string;
  status: TrackingStatus;
  latitude: number | null;
  longitude: number | null;
  updatedAt: string;
};

export type DeliveryVerification = {
  channel: DeliveryVerificationChannel;
  expiresAt: string;
  lastSentAt: string;
  maskedDestination: string;
  status: DeliveryVerificationStatus;
  verifiedAt: string | null;
};

export type OrderParty = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
};

export type Order = {
  id: string;
  userId: string;
  courierId?: string | null;
  status: OrderStatus;
  totalPrice: number;
  address: string;
  addressLabel?: string | null;
  addressDistrict?: string | null;
  addressKhoroo?: string | null;
  addressUnit?: string | null;
  addressLatitude?: number | null;
  addressLongitude?: number | null;
  addressNotes?: string | null;
  contactPhone?: string | null;
  acceptedAt?: string | null;
  readyForCourierAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  items: OrderItem[];
  payment: Payment | null;
  tracking: Tracking | null;
  deliveryVerification?: DeliveryVerification | null;
  user?: OrderParty;
  courier?: OrderParty | null;
};

export type DeliveryLocationInput = {
  address: string;
  addressDistrict?: string | null;
  addressKhoroo?: string | null;
  addressLabel?: string | null;
  addressLatitude?: number | null;
  addressLongitude?: number | null;
  addressNotes?: string | null;
  addressUnit?: string | null;
};

export type CreateOrderInput = DeliveryLocationInput & {
  contactPhone: string;
  items: Array<{
    foodId: string;
    quantity: number;
  }>;
  paymentMethod: PaymentMethod;
};
