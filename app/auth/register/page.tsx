"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";

import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import {
  registerUser,
  verifyRegistrationCode,
} from "@/features/auth/auth.service";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_UPDATED_EVENT, CART_UPDATED_EVENT } from "@/lib/constants";
import { dispatchAppEvent, getErrorMessage } from "@/lib/helpers";

function BrandMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-10 w-10 text-orange-400"
      fill="none"
      viewBox="0 0 48 48"
    >
      <path
        d="M12 18c1.6-4.4 5.9-7 12-7s10.4 2.6 12 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.6"
      />
      <path
        d="M11 22h26c1.3 0 2.4 1 2.4 2.2 0 1.1-.8 2-1.9 2.2l-2.5.4c-.8 3.5-3.8 6.2-7.5 6.2h-7.1c-3.7 0-6.8-2.7-7.5-6.2l-2.5-.4C9.4 26.2 8.6 25.3 8.6 24.2 8.6 23 9.7 22 11 22Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.6"
      />
      <path
        d="M16 28h16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.6"
      />
      <path
        d="M18 15.5h.01M24 14h.01M30 15.5h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3.2"
      />
    </svg>
  );
}

export default function RegisterPage() {
  const { isMn, t } = useAppLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";
  const { isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [verificationExpiresAt, setVerificationExpiresAt] = useState<string | null>(
    null
  );
  const displayError = error;
  const isVerificationStep = Boolean(verificationEmail);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      if (!isVerificationStep) {
        const result = await registerUser({ email, name, password });
        setVerificationEmail(result.email);
        setVerificationExpiresAt(result.expiresAt);
        setFeedback(
          t({
            en: `Verification code sent to ${result.email}.`,
            mn: `Баталгаажуулах код ${result.email} хаяг руу илгээгдлээ.`,
          })
        );
        return;
      }

      await verifyRegistrationCode({
        code: verificationCode,
        email: verificationEmail ?? email,
      });
      dispatchAppEvent(AUTH_UPDATED_EVENT);
      dispatchAppEvent(CART_UPDATED_EVENT);
      router.push(redirectTo);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const result = await registerUser({ email, name, password });
      setVerificationEmail(result.email);
      setVerificationExpiresAt(result.expiresAt);
      setFeedback(
        t({
          en: `A new verification code was sent to ${result.email}.`,
          mn: `Шинэ баталгаажуулах код ${result.email} хаяг руу илгээгдлээ.`,
        })
      );
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleResetVerification() {
    setVerificationCode("");
    setVerificationEmail(null);
    setVerificationExpiresAt(null);
    setError(null);
    setFeedback(null);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[#050505] px-4 py-3 xl:overflow-hidden">
      <div className="pointer-events-none absolute right-[-80px] top-[-70px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,106,0,0.16),transparent_68%)] blur-[70px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.01),rgba(255,255,255,0))]" />

      <section className="relative grid w-full max-w-[1120px] gap-[18px] xl:h-[592px] xl:-translate-y-9 xl:grid-cols-[1.1fr_.9fr]">
        <div className="relative flex min-h-[360px] flex-col justify-between overflow-hidden rounded-[30px] border border-[rgba(255,106,0,.35)] bg-[linear-gradient(145deg,rgba(10,10,12,.98),rgba(22,12,8,.95))] px-8 py-8 shadow-[0_0_60px_rgba(255,106,0,.08)] sm:px-9 sm:py-9 xl:px-[40px] xl:py-[34px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_44%,rgba(255,106,0,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.015),rgba(255,255,255,0))]" />
          <div className="pointer-events-none absolute bottom-[18px] right-[8px] z-[1] h-[270px] w-[270px] rounded-full bg-[radial-gradient(circle,rgba(255,106,0,.34),transparent_72%)] blur-[28px]" />
          <span className="pointer-events-none absolute left-[54%] top-[19%] h-1 w-1 rounded-full bg-orange-300/40 shadow-[0_0_12px_rgba(255,106,0,0.38)]" />
          <span className="pointer-events-none absolute left-[66%] top-[28%] h-1.5 w-1.5 rounded-full bg-orange-500/45 shadow-[0_0_14px_rgba(255,106,0,0.42)]" />
          <span className="pointer-events-none absolute left-[74%] top-[40%] h-1 w-1 rounded-full bg-orange-200/30 shadow-[0_0_10px_rgba(255,170,120,0.28)]" />
          <span className="pointer-events-none absolute left-[61%] top-[50%] h-1 w-1 rounded-full bg-orange-400/30 shadow-[0_0_10px_rgba(255,106,0,0.28)]" />
          <span className="pointer-events-none absolute left-[70%] top-[62%] h-1.5 w-1.5 rounded-full bg-orange-500/35 shadow-[0_0_16px_rgba(255,106,0,0.35)]" />

          <div className="relative z-10 max-w-[390px]">
            <p className="text-[18px] font-bold text-[#ff7a1a]">
              {t({ en: "Create account", mn: "Бүртгэл үүсгэх" })}
            </p>
            <h1 className="mt-[16px] text-[50px] font-black leading-[0.92] tracking-[-0.08em] text-white sm:text-[60px] xl:text-[68px]">
              {t({ en: "Join the", mn: "Манай" })}
              <span className="block bg-[linear-gradient(135deg,#ff5a00,#ff9d30)] bg-clip-text text-transparent">
                {t({ en: "delivery", mn: "хүргэлтийн" })}
              </span>
              <span className="block bg-[linear-gradient(135deg,#ff5a00,#ff9d30)] bg-clip-text text-transparent">
                {t({ en: "club", mn: "клубт" })}
              </span>
            </h1>
            <p className="mt-[20px] max-w-[360px] text-[14px] leading-[1.65] text-white/74 xl:text-[15px]">
              {t({
                en: "Save your profile, sync your orders, collect points, and unlock the full premium dashboard experience.",
                mn: "Профайлаа хадгалж, захиалгаа синк хийж, оноо цуглуулаад premium dashboard-ийн бүрэн боломжийг нээгээрэй.",
              })}
            </p>
          </div>

          <div className="relative z-10 flex items-end gap-3 pt-4">
            <BrandMark />
            <div className="pb-1 text-[14px] font-medium italic leading-[1.05] text-white/95">
              <p>{t({ en: "Premium Burgers.", mn: "Premium бургер." })}</p>
              <p>{t({ en: "Delivered Fast.", mn: "Хурдан хүргэнэ." })}</p>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-[0px] right-[-6px] z-[2] hidden w-[210px] sm:block md:w-[250px] xl:bottom-[-4px] xl:right-[-2px] xl:w-[520px]">
            <Image
              alt="Register mascot"
              className="mb-10 ml-10 h-auto w-full object-contain"
              height={360}
              priority
              src="/ai-agenthero.png"
              width={286}
            />
          </div>
        </div>

        <div className="relative flex flex-col justify-center rounded-[30px] border border-[rgba(255,255,255,.08)] bg-[linear-gradient(145deg,rgba(16,16,18,.98),rgba(8,8,10,.99))] px-7 py-7 shadow-[0_0_50px_rgba(0,0,0,.45)] sm:px-8 xl:px-[34px] xl:py-[28px]">
          <div className="w-full">
            <p className="text-[18px] text-[#ff7a1a]">
              {isVerificationStep
                ? t({ en: "Verify", mn: "Баталгаажуулах" })
                : t({ en: "Register", mn: "Бүртгүүлэх" })}
            </p>
            <h2 className="mt-3 max-w-[360px] text-[36px] font-[850] leading-[1.03] text-white sm:text-[42px] xl:mb-[22px] xl:text-[46px]">
              {isVerificationStep
                ? t({ en: "Verify your email", mn: "Имэйлээ баталгаажуулна уу" })
                : t({ en: "Create your account", mn: "Бүртгэлээ үүсгэнэ үү" })}
            </h2>

            <div className="space-y-0">
              {!isVerificationStep ? (
                <>
                  <label className="block">
                    <span className="mb-[10px] block text-[12px] font-medium uppercase tracking-[0.32em] text-white/55">
                      {t({ en: "Name", mn: "Нэр" })}
                    </span>
                    <input
                      className="mb-[16px] h-[52px] w-full rounded-[18px] border border-white/8 bg-white/[0.03] px-[18px] text-[16px] text-white outline-none placeholder:text-white/32 focus:border-orange-400/70 focus:shadow-[0_0_0_3px_rgba(255,106,0,0.12)]"
                      onChange={(event) => setName(event.target.value)}
                      placeholder={t({ en: "Your full name", mn: "Таны бүтэн нэр" })}
                      value={name}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-[10px] block text-[12px] font-medium uppercase tracking-[0.32em] text-white/55">
                      {t({ en: "Email", mn: "Имэйл" })}
                    </span>
                    <input
                      autoComplete="email"
                      className="mb-[16px] h-[52px] w-full rounded-[18px] border border-white/8 bg-white/[0.03] px-[18px] text-[16px] text-white outline-none placeholder:text-white/32 focus:border-orange-400/70 focus:shadow-[0_0_0_3px_rgba(255,106,0,0.12)]"
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      type="email"
                      value={email}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-[10px] block text-[12px] font-medium uppercase tracking-[0.32em] text-white/55">
                      {t({ en: "Password", mn: "Нууц үг" })}
                    </span>
                    <div className="relative mb-[16px]">
                      <input
                        autoComplete="new-password"
                        className="h-[52px] w-full rounded-[18px] border border-white/8 bg-white/[0.03] px-[18px] pr-14 text-[16px] text-white outline-none placeholder:text-white/32 focus:border-orange-400/70 focus:shadow-[0_0_0_3px_rgba(255,106,0,0.12)]"
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder={t({ en: "Create a strong password", mn: "Хүчтэй нууц үг үүсгэнэ үү" })}
                        type={showPassword ? "text" : "password"}
                        value={password}
                      />
                      <button
                        aria-label={showPassword
                          ? t({ en: "Hide password", mn: "Нууц үг нуух" })
                          : t({ en: "Show password", mn: "Нууц үг харах" })}
                        className="absolute right-[18px] top-1/2 -translate-y-1/2 text-white/60 transition hover:text-white/85"
                        onClick={() => setShowPassword((current) => !current)}
                        type="button"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </label>
                </>
              ) : (
                <>
                  <div className="mb-[16px] rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-white/70">
                    {t({ en: "We sent a 6-digit verification code to", mn: "Бид 6 оронтой баталгаажуулах кодыг" })}{" "}
                    <span className="font-semibold text-white">
                      {verificationEmail}
                    </span>
                    .
                    {verificationExpiresAt ? (
                      <>
                        {" "}
                        {t({ en: "This code is valid until", mn: "Энэ код" })}{" "}
                        <span className="font-semibold text-white">
                          {new Date(verificationExpiresAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMn ? " хүртэл хүчинтэй." : "."}
                      </>
                    ) : null}
                  </div>

                  <label className="block">
                    <span className="mb-[10px] block text-[12px] font-medium uppercase tracking-[0.32em] text-white/55">
                      {t({ en: "Verification code", mn: "Баталгаажуулах код" })}
                    </span>
                    <input
                      autoComplete="one-time-code"
                      className="mb-[16px] h-[52px] w-full rounded-[18px] border border-white/8 bg-white/[0.03] px-[18px] text-[16px] text-white outline-none placeholder:text-white/32 focus:border-orange-400/70 focus:shadow-[0_0_0_3px_rgba(255,106,0,0.12)]"
                      onChange={(event) =>
                        setVerificationCode(
                          event.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      placeholder={t({ en: "Enter the 6-digit code", mn: "6 оронтой кодоо оруулна уу" })}
                      value={verificationCode}
                    />
                  </label>
                </>
              )}

              {feedback ? (
                <div className="mb-4">
                  <Toast message={feedback} tone="success" />
                </div>
              ) : null}
              {displayError ? (
                <div className="mb-4">
                  <Toast message={displayError} tone="error" />
                </div>
              ) : null}

              <Button
                className="mt-[4px] h-[54px] w-full rounded-[18px] border-0 px-6 text-[17px] font-extrabold text-white shadow-[0_18px_40px_rgba(255,106,0,.35)]"
                fullWidth
                isLoading={isSubmitting}
                onClick={handleSubmit}
                size="lg"
              >
                {isVerificationStep
                  ? t({ en: "Verify code and sign in", mn: "Кодоор баталгаажуулаад нэвтрэх" })
                  : t({ en: "Send verification code", mn: "Баталгаажуулах код илгээх" })}
              </Button>

              {isVerificationStep ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Button
                    className="h-[48px] rounded-[16px] text-[14px] font-semibold"
                    fullWidth
                    isLoading={isSubmitting}
                    onClick={handleResendCode}
                    size="lg"
                    variant="secondary"
                  >
                    {t({ en: "Resend code", mn: "Код дахин илгээх" })}
                  </Button>
                  <Button
                    className="h-[48px] rounded-[16px] text-[14px] font-semibold"
                    fullWidth
                    onClick={handleResetVerification}
                    size="lg"
                    variant="ghost"
                  >
                    {t({ en: "Use different email", mn: "Өөр имэйл ашиглах" })}
                  </Button>
                </div>
              ) : null}

              <p className="mt-[18px] text-[13px] text-white/52">
                {t({ en: "Already have an account?", mn: "Бүртгэлтэй юу?" })}{" "}
                <Link
                  className="text-[#ff7a1a] transition hover:underline"
                  href="/auth/login"
                >
                  {t({ en: "Sign in", mn: "Нэвтрэх" })}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
