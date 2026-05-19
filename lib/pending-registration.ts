import { randomInt } from "node:crypto";

import { createUserSessionWithClient } from "@/lib/auth";
import { sendRegistrationVerificationEmail } from "@/lib/email";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const VERIFICATION_CODE_EXPIRY_MS = 1000 * 60 * 10;
const VERIFICATION_CODE_LENGTH = 6;
const MAX_VERIFICATION_ATTEMPTS = 5;

function getExpiryDate() {
  return new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MS);
}

function createVerificationCode() {
  return String(randomInt(0, 10 ** VERIFICATION_CODE_LENGTH)).padStart(
    VERIFICATION_CODE_LENGTH,
    "0"
  );
}

function getPublicExpiryDate(expiresAt: Date) {
  return expiresAt.toISOString();
}

export async function startRegistrationVerification(input: {
  email: string;
  name: string;
  password: string;
}) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const verificationCode = createVerificationCode();
  const [passwordHash, codeHash] = await Promise.all([
    hashPassword(input.password),
    hashPassword(verificationCode),
  ]);
  const expiresAt = getExpiryDate();

  await prisma.pendingRegistration.upsert({
    where: {
      email: input.email,
    },
    create: {
      email: input.email,
      name: input.name,
      passwordHash,
      codeHash,
      expiresAt,
    },
    update: {
      attempts: 0,
      codeHash,
      expiresAt,
      name: input.name,
      passwordHash,
    },
  });

  await sendRegistrationVerificationEmail(input.email, verificationCode);

  return {
    email: input.email,
    expiresAt: getPublicExpiryDate(expiresAt),
    verificationRequired: true as const,
  };
}

export async function verifyRegistrationCode(input: {
  code: string;
  email: string;
}) {
  const pendingRegistration = await prisma.pendingRegistration.findUnique({
    where: {
      email: input.email,
    },
  });

  if (!pendingRegistration) {
    throw new Error("VERIFICATION_NOT_FOUND");
  }

  if (pendingRegistration.expiresAt.getTime() <= Date.now()) {
    await prisma.pendingRegistration.delete({
      where: {
        email: input.email,
      },
    });

    throw new Error("VERIFICATION_EXPIRED");
  }

  if (pendingRegistration.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    await prisma.pendingRegistration.delete({
      where: {
        email: input.email,
      },
    });

    throw new Error("VERIFICATION_TOO_MANY_ATTEMPTS");
  }

  const isCodeValid = await verifyPassword(input.code, pendingRegistration.codeHash);

  if (!isCodeValid) {
    await prisma.pendingRegistration.update({
      where: {
        email: input.email,
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    throw new Error("VERIFICATION_CODE_INVALID");
  }

  const sessionToken = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: {
        email: input.email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      await tx.pendingRegistration.deleteMany({
        where: {
          email: input.email,
        },
      });

      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const user = await tx.user.create({
      data: {
        email: pendingRegistration.email,
        name: pendingRegistration.name,
        password: pendingRegistration.passwordHash,
        cart: {
          create: {},
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    const session = await createUserSessionWithClient(tx, user.id);

    await tx.pendingRegistration.delete({
      where: {
        email: input.email,
      },
    });

    return {
      session,
      user,
    };
  });

  return sessionToken;
}
