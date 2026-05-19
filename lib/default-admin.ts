import { areDemoAccountsEnabled } from "@/lib/demo-accounts";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "admin@burger.mn")
  .trim()
  .toLowerCase();
export const DEFAULT_ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD ?? "Admin123456").trim();
export const DEFAULT_ADMIN_NAME = (process.env.ADMIN_NAME ?? "Burger Admin").trim();

export async function getOrBootstrapDefaultAdmin(email: string) {
  if (!areDemoAccountsEnabled()) {
    return null;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return existingUser;
  }

  if (email !== DEFAULT_ADMIN_EMAIL) {
    return null;
  }

  const hashedPassword = await hashPassword(DEFAULT_ADMIN_PASSWORD);

  return prisma.user.create({
    data: {
      email,
      name: DEFAULT_ADMIN_NAME,
      password: hashedPassword,
      role: "ADMIN",
    },
  });
}
