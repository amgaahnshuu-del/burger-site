"use client";

import Link from "next/link";

import { useAppLanguage } from "@/hooks/useAppLanguage";
import { cn } from "@/lib/helpers";

type FooterProps = {
  className?: string;
  isMn?: boolean;
};

export default function Footer({ className, isMn: forcedIsMn }: FooterProps) {
  const { isMn: settingsIsMn } = useAppLanguage();
  const isMn = forcedIsMn ?? settingsIsMn;

  return (
    <footer
      className={cn(
        "flex flex-wrap items-center gap-4 border-t border-white/8 pt-6 text-xs text-white/42",
        className
      )}
    >
      <Link className="transition-colors hover:text-orange-300" href="/privacy">
        {isMn ? "Нууцлал" : "Privacy"}
      </Link>
      <Link className="transition-colors hover:text-orange-300" href="/terms">
        {isMn ? "Нөхцөл" : "Terms"}
      </Link>
      <Link className="transition-colors hover:text-orange-300" href="/refund-policy">
        {isMn ? "Буцаалтын бодлого" : "Refund Policy"}
      </Link>
      <Link className="transition-colors hover:text-orange-300" href="/contact">
        {isMn ? "Холбоо барих" : "Contact"}
      </Link>
    </footer>
  );
}
