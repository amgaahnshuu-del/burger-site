"use client";

import {
  PaperAirplaneIcon,
  PaperClipIcon,
} from "@heroicons/react/24/solid";
import { useState } from "react";

import ChatMessage from "@/components/messages/ChatMessage";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { dashboardThreads } from "@/data/mockData";
import { cn } from "@/lib/helpers";

const ACCENT_MAP = {
  amber: "bg-amber-400",
  blue: "bg-sky-400",
  orange: "bg-orange-500",
} as const;

export default function MessagesPage() {
  const [threads, setThreads] = useState(dashboardThreads);
  const [activeId, setActiveId] = useState(dashboardThreads[0].id);
  const [draft, setDraft] = useState("");
  const activeThread = threads.find((thread) => thread.id === activeId) ?? threads[0];

  function handleSend() {
    const message = draft.trim();
    if (!message) {
      return;
    }

    setThreads((current) =>
      current.map((thread) =>
        thread.id === activeThread.id
          ? {
              ...thread,
              messages: [...thread.messages, { message, role: "user", time: "19:45" }],
              preview: message,
              time: "Now",
            }
          : thread
      )
    );
    setDraft("");
  }

  return (
    <main className="space-y-6">
      <PageHeader title="Messages" />

      <section className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <Card className="premium-scrollbar max-h-[640px] overflow-y-auto" variant="default">
          <div className="space-y-3">
            {threads.map((thread) => (
              <button
                className={cn(
                  "w-full rounded-[16px] border px-4 py-4 text-left",
                  thread.id === activeThread.id
                    ? "border-[var(--border-medium)] bg-white/[0.04]"
                    : "border-[var(--border-soft)] bg-transparent hover:bg-white/[0.03]"
                )}
                key={thread.id}
                onClick={() => setActiveId(thread.id)}
                type="button"
              >
                <div className="flex items-start gap-3">
                  <span className={cn("mt-1 inline-flex h-10 w-10 rounded-full", ACCENT_MAP[thread.accent])} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-white">{thread.title}</p>
                      <p className="text-[11px] text-[var(--text-secondary)]">{thread.time}</p>
                    </div>
                    <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">{thread.preview}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="flex min-h-[640px] flex-col" variant="default">
          <div className="border-b border-[var(--border-soft)] pb-4">
            <h2 className="text-[18px] font-semibold text-white">{activeThread.title}</h2>
          </div>

          <div className="premium-scrollbar mt-6 flex-1 space-y-4 overflow-y-auto pr-2">
            {activeThread.messages.map((message, index) => (
              <ChatMessage
                key={`${activeThread.id}-${index}`}
                message={message.message}
                role={message.role}
                sender={message.role === "assistant" ? activeThread.title : undefined}
                time={message.time}
              />
            ))}
          </div>

          <div className="mt-5 flex gap-3 rounded-[16px] border border-[var(--border-soft)] bg-white/[0.02] p-3">
            <button className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-[12px] border border-[var(--border-soft)] bg-[#111113] text-[var(--text-secondary)] hover:text-white" type="button">
              <PaperClipIcon className="h-5 w-5" />
            </button>
            <input
              className="h-[52px] flex-1 rounded-[12px] border border-[var(--border-soft)] bg-[#111113] px-4 text-sm text-white outline-none"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              value={draft}
            />
            <button
              className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-[12px] bg-[var(--gradient-orange)] text-white hover:brightness-110"
              onClick={handleSend}
              type="button"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </Card>
      </section>
    </main>
  );
}
