"use client";

import { useAppLanguage } from "@/hooks/useAppLanguage";

export default function Loading() {
  const { t } = useAppLanguage();

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 py-24 text-white">
      <p className="text-lg font-medium text-white/80">
        {t({ en: "Loading...", mn: "Ачаалж байна..." })}
      </p>
    </main>
  );
}
