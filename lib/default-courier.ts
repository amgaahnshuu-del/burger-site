import { areDemoAccountsEnabled } from "@/lib/demo-accounts";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export const DEFAULT_COURIER_EMAIL = (process.env.COURIER_EMAIL ?? "courier@burger.mn")
  .trim()
  .toLowerCase();
export const DEFAULT_COURIER_PASSWORD = (process.env.COURIER_PASSWORD ?? "Courier123456").trim();
export const DEFAULT_COURIER_NAME = (process.env.COURIER_NAME ?? "Night Courier").trim();
export const DEFAULT_COURIER_PHONE = (process.env.COURIER_PHONE ?? "+976 9911 2233").trim();

export async function getOrBootstrapDefaultCourier(email: string) {
  if (!areDemoAccountsEnabled()) {
    return null;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return existingUser;
  }

  if (email !== DEFAULT_COURIER_EMAIL) {
    return null;
  }

  const hashedPassword = await hashPassword(DEFAULT_COURIER_PASSWORD);

  return prisma.user.create({
    data: {
      email,
      name: DEFAULT_COURIER_NAME,
      password: hashedPassword,
      phone: DEFAULT_COURIER_PHONE,
      role: "COURIER",
    },
  });
}
