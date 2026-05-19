import { cn } from "@/lib/helpers";

type LoaderProps = {
  className?: string;
  size?: "sm" | "md";
};

export default function Loader({
  className,
  size = "md",
}: LoaderProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-white/18 border-t-current",
        size === "sm" ? "h-4 w-4" : "h-5 w-5",
        className
      )}
    />
  );
}
