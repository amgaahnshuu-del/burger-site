export type UserRole = "CUSTOMER" | "ADMIN" | "MANAGER" | "COURIER";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
};

export type AuthSessionResponse = {
  authenticated: true;
  user: AuthUser;
  expiresAt: string;
} | {
  authenticated: false;
  user: null;
  expiresAt: null;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type RegisterVerificationStartResponse = {
  email: string;
  expiresAt: string;
  verificationRequired: true;
};

export type VerifyRegistrationCodeInput = {
  code: string;
  email: string;
};

export type UpdateAccountInput = {
  email: string;
  name: string;
  phone: string | null;
};
