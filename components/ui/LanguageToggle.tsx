"use client";

import { cn } from "@/lib/helpers";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import type { SettingsLanguage } from "@/lib/settings-preferences";

type LanguageToggleProps = {
  className?: string;
  compact?: boolean;
};

const OPTIONS: Array<{
  label: string;
  value: SettingsLanguage;
}> = [
  { label: "EN", value: "en" },
  { label: "MN", value: "mn" },
];

export default function LanguageToggle({
  className,
  compact = false,
}: LanguageToggleProps) {
  const { language, t, updateLanguage } = useAppLanguage();

  return (
    <div
      aria-label={t({
        en: "Language switcher",
        mn: "Хэл солигч",
      })}
      className={cn(
        "inline-flex items-center rounded-[14px] border border-[var(--border-soft)] bg-[#111113] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
        compact ? "gap-1" : "gap-1.5",
        className
      )}
      role="group"
    >
      {OPTIONS.map((option) => {
        const active = option.value === language;

        return (
          <button
            aria-pressed={active}
            className={cn(
              "rounded-[10px] font-semibold transition",
              compact ? "min-w-10 px-3 py-2 text-[11px]" : "min-w-11 px-3.5 py-2 text-xs",
              active
                ? "bg-orange-500 text-white shadow-[0_10px_24px_rgba(255,106,0,0.26)]"
                : "text-white/68 hover:bg-white/[0.05] hover:text-white"
            )}
            key={option.value}
            onClick={() => {
              updateLanguage(option.value);
            }}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
