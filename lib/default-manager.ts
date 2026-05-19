import { areDemoAccountsEnabled } from "@/lib/demo-accounts";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export const DEFAULT_MANAGER_EMAIL = (process.env.MANAGER_EMAIL ?? "manager@burger.mn")
  .trim()
  .toLowerCase();
export const DEFAULT_MANAGER_PASSWORD = (process.env.MANAGER_PASSWORD ?? "Manager123456").trim();
export const DEFAULT_MANAGER_NAME = (process.env.MANAGER_NAME ?? "Kitchen Manager").trim();
export const DEFAULT_MANAGER_PHONE = (process.env.MANAGER_PHONE ?? "+976 9911 3344").trim();

export async function getOrBootstrapDefaultManager(email: string) {
  if (!areDemoAccountsEnabled()) {
    return null;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return existingUser;
  }

  if (email !== DEFAULT_MANAGER_EMAIL) {
    return null;
  }

  const hashedPassword = await hashPassword(DEFAULT_MANAGER_PASSWORD);

  return prisma.user.create({
    data: {
      email,
      name: DEFAULT_MANAGER_NAME,
      password: hashedPassword,
      phone: DEFAULT_MANAGER_PHONE,
      role: "MANAGER",
    },
  });
}
