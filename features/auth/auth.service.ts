import type {
  AuthSessionResponse,
  AuthUser,
  LoginInput,
  RegisterInput,
  RegisterVerificationStartResponse,
  UpdateAccountInput,
  VerifyRegistrationCodeInput,
} from "@/features/auth/auth.types";
import { fetchJson } from "@/lib/fetcher";

export async function getCurrentSession() {
  const session = await fetchJson<AuthSessionResponse>("/api/auth/me");
  return session.authenticated ? session : null;
}

export function loginUser(payload: LoginInput) {
  return fetchJson<AuthUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerUser(payload: RegisterInput) {
  return fetchJson<RegisterVerificationStartResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyRegistrationCode(payload: VerifyRegistrationCodeInput) {
  return fetchJson<AuthUser>("/api/auth/register/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logoutUser() {
  return fetchJson<{ message: string }>("/api/auth/logout", {
    method: "POST",
  });
}

export function updateCurrentUser(payload: UpdateAccountInput) {
  return fetchJson<AuthUser>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
