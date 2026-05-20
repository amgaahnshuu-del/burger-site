"use client";

import Link from "next/link";

import { cn } from "@/lib/helpers";

type FooterProps = {
  className?: string;
  isMn?: boolean;
};

export default function Footer({ className, isMn = false }: FooterProps) {
  return (
    <footer
      className={cn(
        "flex flex-wrap items-center border-t border-white/8 text-white/42 gap-4 pt-6 text-xs",
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
