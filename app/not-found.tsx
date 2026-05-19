"use client";

import PagePlaceholder from "@/components/ui/PagePlaceholder";
import { useAppLanguage } from "@/hooks/useAppLanguage";

export default function NotFound() {
  const { t } = useAppLanguage();

  return (
    <PagePlaceholder
      description={t({
        en: "The page you are looking for does not exist or has been moved.",
        mn: "Таны хайж буй хуудас байхгүй эсвэл өөр тийш шилжсэн байна.",
      })}
      title={t({ en: "Page not found", mn: "Хуудас олдсонгүй" })}
    />
  );
}
