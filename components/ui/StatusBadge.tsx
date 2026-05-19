import Badge from "@/components/ui/Badge";

type StatusBadgeProps = {
  status: string;
};

function resolveStatusStyle(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("deliver") ||
    normalized.includes("complete") ||
    normalized.includes("paid")
  ) {
    return "border-emerald-500/16 bg-emerald-500/10 text-emerald-300";
  }

  if (normalized.includes("cancel") || normalized.includes("fail")) {
    return "border-white/10 bg-white/[0.04] text-white/60";
  }

  if (normalized.includes("pending") || normalized.includes("confirm")) {
    return "border-white/10 bg-white/[0.04] text-[var(--text-secondary)]";
  }

  return "border-orange-500/16 bg-orange-500/10 text-[var(--accent-3)]";
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge className={resolveStatusStyle(status)}>{status}</Badge>;
}
