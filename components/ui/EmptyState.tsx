import type { HTMLAttributes, ReactNode } from "react";

import Card from "@/components/ui/Card";
import { cn } from "@/lib/helpers";

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export default function EmptyState({
  title,
  description,
  action,
  icon,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <Card className={cn("py-12 text-center", className)} variant="default" {...props}>
      {icon ? (
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] bg-orange-500/10 text-orange-300">
          {icon}
        </div>
      ) : null}
      <h2 className="font-display text-2xl font-semibold text-white">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/58">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </Card>
  );
}
