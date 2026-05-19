import { cn } from "@/lib/helpers";

type ChatMessageProps = {
  message: string;
  role: "assistant" | "user";
  sender?: string;
  time?: string;
  neutralUser?: boolean;
};

export default function ChatMessage({
  message,
  neutralUser = false,
  role,
  sender,
  time,
}: ChatMessageProps) {
  const assistant = role === "assistant";

  return (
    <div className={cn("fade-in-up flex", assistant ? "justify-start" : "justify-end")}>
      <div className="max-w-[78%]">
        <div
          className={cn(
            "whitespace-pre-wrap rounded-[14px] px-4 py-3 text-[13px] leading-6",
            assistant
              ? "border border-[var(--border-soft)] bg-[#26262A] text-white"
              : neutralUser
                ? "border border-[var(--border-soft)] bg-[#17181B] text-white shadow-[0_16px_36px_rgba(0,0,0,0.28)]"
                : "bg-[var(--gradient-accent)] text-white shadow-[var(--shadow-button)]"
          )}
        >
          {message}
        </div>
        {(sender || time) && (
          <p
            className={cn(
              "mt-2 text-[10px] text-[var(--text-muted)]",
              assistant ? "pl-1 text-left" : "pr-1 text-right"
            )}
          >
            {sender ? `${sender} ` : ""}
            {time ?? ""}
          </p>
        )}
      </div>
    </div>
  );
}
