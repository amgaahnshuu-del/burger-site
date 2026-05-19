import { cn } from "@/lib/helpers";

type ToastTone = "success" | "error" | "info";

type ToastProps = {
  className?: string;
  message: string;
  tone?: ToastTone;
};

const toneClassMap: Record<ToastTone, string> = {
  success: "border-emerald-400/30 bg-emerald-500/12 text-emerald-100",
  error: "border-orange-400/30 bg-orange-500/12 text-orange-100",
  info: "border-white/10 bg-white/6 text-white/80",
};

export default function Toast({
  className,
  message,
  tone = "info",
}: ToastProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm leading-6",
        toneClassMap[tone],
        className
      )}
      role="status"
    >
      {message}
    </div>
  );
}
