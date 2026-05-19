import type { HTMLAttributes } from "react";

import { cn } from "@/lib/helpers";

export default function Badge({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
