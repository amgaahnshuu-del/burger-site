"use client";

import { useAppLanguage } from "@/hooks/useAppLanguage";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const { t } = useAppLanguage();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-24">
      <section className="w-full rounded-3xl border border-orange-500/20 bg-black px-8 py-10 text-white">
        <p className="text-sm uppercase tracking-[0.3em] text-orange-400">
          {t({ en: "Something went wrong", mn: "Алдаа гарлаа" })}
        </p>
        <h1 className="mt-4 text-3xl font-semibold">
          {t({ en: "Unexpected application error", mn: "Системийн гэнэтийн алдаа" })}
        </h1>
        <p className="mt-3 text-base leading-7 text-white/70">
          {error.message || t({ en: "An unknown error occurred.", mn: "Тодорхойгүй алдаа гарлаа." })}
        </p>
        <button
          className="mt-6 rounded-2xl bg-orange-500 px-5 py-3 font-medium text-white transition hover:bg-orange-600"
          onClick={() => reset()}
          type="button"
        >
          {t({ en: "Try again", mn: "Дахин оролдох" })}
        </button>
      </section>
    </main>
  );
}
