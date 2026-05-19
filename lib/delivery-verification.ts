import { randomInt } from "node:crypto";

import { sendEmail } from "@/lib/email";
import { APP_NAME } from "@/lib/constants";
import { hashPassword, verifyPassword } from "@/lib/password";

const DELIVERY_VERIFICATION_CODE_LENGTH = 6;
const DELIVERY_VERIFICATION_EXPIRY_MS = 1000 * 60 * 10;
const MAX_DELIVERY_VERIFICATION_ATTEMPTS = 5;

export type DeliveryVerificationChannel = "SMS" | "EMAIL" | "DEVELOPMENT_LOG";

export type DeliveryVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "EXPIRED";

type DeliveryVerificationRecordLike = {
  channel: string;
  expiresAt: Date;
  lastSentAt: Date;
  recipientEmail: string | null;
  recipientPhone: string | null;
  verifiedAt: Date | null;
};

function maskPhone(phone: string | null | undefined) {
  if (!phone) {
    return "customer phone";
  }

  const trimmed = phone.trim();
  const prefix = trimmed.slice(0, Math.min(3, trimmed.length));
  const suffix = trimmed.slice(-2);
  const middleLength = Math.max(trimmed.length - prefix.length - suffix.length, 2);

  return `${prefix}${"*".repeat(middleLength)}${suffix}`;
}

function maskEmail(email: string | null | undefined) {
  if (!email) {
    return "customer email";
  }

  const normalizedEmail = email.trim().toLowerCase();
  const atIndex = normalizedEmail.indexOf("@");

  if (atIndex <= 0) {
    return "customer email";
  }

  const username = normalizedEmail.slice(0, atIndex);
  const domain = normalizedEmail.slice(atIndex + 1);

  if (!domain) {
    return "customer email";
  }

  const visiblePrefix = username.slice(0, Math.min(2, username.length));
  const hiddenLength = Math.max(username.length - visiblePrefix.length, 2);

  return `${visiblePrefix}${"*".repeat(hiddenLength)}@${domain}`;
}

function getChannel(channel: string): DeliveryVerificationChannel {
  if (channel === "SMS" || channel === "EMAIL" || channel === "DEVELOPMENT_LOG") {
    return channel;
  }

  return "EMAIL";
}

function getDeliveryVerificationEmailContent(code: string, orderId: string) {
  const shortOrderId = orderId.slice(0, 8);
  const subject = `${APP_NAME} delivery confirmation code`;
  const text = [
    "Hello,",
    "",
    `Your ${APP_NAME} delivery confirmation code for order #${shortOrderId} is: ${code}`,
    "Share this code with your courier only after you receive your order.",
    "This code expires in 10 minutes.",
  ].join("\n");
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 12px;">${APP_NAME} delivery confirmation</h2>
      <p>Hello,</p>
      <p>Your delivery confirmation code for order <strong>#${shortOrderId}</strong> is:</p>
      <div style="margin: 16px 0; font-size: 32px; font-weight: 700; letter-spacing: 6px;">
        ${code}
      </div>
      <p>Share this code with your courier only after you receive your order.</p>
      <p>This code expires in <strong>10 minutes</strong>.</p>
    </div>
  `;

  return {
    html,
    subject,
    text,
  };
}

async function sendDeliveryVerificationEmail(
  email: string,
  code: string,
  orderId: string
) {
  const content = getDeliveryVerificationEmailContent(code, orderId);

  await sendEmail({
    html: content.html,
    subject: content.subject,
    text: content.text,
    to: email,
  });
}

export function createDeliveryVerificationCode() {
  return String(randomInt(0, 10 ** DELIVERY_VERIFICATION_CODE_LENGTH)).padStart(
    DELIVERY_VERIFICATION_CODE_LENGTH,
    "0"
  );
}

export function getDeliveryVerificationExpiryDate() {
  return new Date(Date.now() + DELIVERY_VERIFICATION_EXPIRY_MS);
}

export function getDeliveryVerificationMaxAttempts() {
  return MAX_DELIVERY_VERIFICATION_ATTEMPTS;
}

export function getDeliveryVerificationMaskedDestination(
  channel: string,
  phone: string | null | undefined,
  email: string | null | undefined
) {
  if (getChannel(channel) === "EMAIL") {
    return maskEmail(email);
  }

  return maskPhone(phone);
}

export function getDeliveryVerificationStatus(
  verification: DeliveryVerificationRecordLike
): DeliveryVerificationStatus {
  if (verification.verifiedAt) {
    return "VERIFIED";
  }

  if (verification.expiresAt.getTime() <= Date.now()) {
    return "EXPIRED";
  }

  return "PENDING";
}

export function getPublicDeliveryVerification(
  verification: DeliveryVerificationRecordLike | null | undefined
) {
  if (!verification) {
    return null;
  }

  const channel = getChannel(verification.channel);

  return {
    channel,
    expiresAt: verification.expiresAt,
    lastSentAt: verification.lastSentAt,
    maskedDestination: getDeliveryVerificationMaskedDestination(
      channel,
      verification.recipientPhone,
      verification.recipientEmail
    ),
    status: getDeliveryVerificationStatus(verification),
    verifiedAt: verification.verifiedAt,
  };
}

export async function hashDeliveryVerificationCode(code: string) {
  return hashPassword(code);
}

export async function verifyDeliveryVerificationCode(
  code: string,
  hashedCode: string
) {
  return verifyPassword(code, hashedCode);
}

export async function sendDeliveryVerificationCode(input: {
  code: string;
  customerEmail?: string | null;
  orderId: string;
  phone?: string | null;
}) {
  const customerEmail = input.customerEmail?.trim().toLowerCase() || "";

  if (!customerEmail) {
    throw new Error("DELIVERY_CODE_DELIVERY_UNAVAILABLE");
  }

  await sendDeliveryVerificationEmail(customerEmail, input.code, input.orderId);

  return {
    channel: "EMAIL" as const,
    recipientEmail: customerEmail,
    recipientPhone: input.phone?.trim() || null,
  };
}
