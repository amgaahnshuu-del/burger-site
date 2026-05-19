"use client";

import Image from "next/image";
import {
  ArrowPathIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { useEffect, useMemo, useRef, useState } from "react";

import Toast from "@/components/ui/Toast";
import { dashboardAssistantPrompts } from "@/data/mockData";
import { sendAIMessage } from "@/features/ai/ai.service";
import type {
  AIConversationMessage,
  AIResponseMode,
  ChatMessage as AIChatMessage,
} from "@/features/ai/ai.types";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/helpers";

const CHAT_STORAGE_KEY = "burger-ai-chat-v2";
const INITIAL_ASSISTANT_TIMESTAMP = Date.UTC(2024, 0, 1, 10, 25);
const INITIAL_ASSISTANT_MESSAGE_ID = `assistant-${INITIAL_ASSISTANT_TIMESTAMP}-welcome`;

const INITIAL_ASSISTANT_MESSAGE = {
  content:
    `Сайн байна уу. Би таны ${APP_NAME} AI туслах байна.\n\nНадаас хоол санал болгуулах, захиалгын явц шалгах, эсвэл QPay төлбөрийн талаар шууд асууж болно.`,
  id: INITIAL_ASSISTANT_MESSAGE_ID,
  role: "assistant" as const,
};

type StoredChatState = {
  messages: AIChatMessage[];
  meta: {
    mode: AIResponseMode | null;
    model: string | null;
  };
};

function createMessage(role: AIChatMessage["role"], content: string) {
  return {
    content,
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
  };
}

function isChatMessage(value: unknown): value is AIChatMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "content" in value &&
    "id" in value &&
    "role" in value &&
    typeof value.content === "string" &&
    typeof value.id === "string" &&
    (value.role === "assistant" || value.role === "user")
  );
}

function normalizeStoredMessages(messages: AIChatMessage[]) {
  return messages.map((message) => (
    message.id === "assistant-welcome"
      ? {
          ...message,
          id: INITIAL_ASSISTANT_MESSAGE_ID,
        }
      : message
  ));
}

function readStoredChatState() {
  try {
    const rawState = window.localStorage.getItem(CHAT_STORAGE_KEY);

    if (!rawState) {
      return null;
    }

    const parsed = JSON.parse(rawState) as Partial<StoredChatState>;
    const storedMessages = Array.isArray(parsed.messages)
      ? normalizeStoredMessages(parsed.messages.filter(isChatMessage))
      : [];
    const mode =
      parsed.meta?.mode === "local" ||
      parsed.meta?.mode === "openai" ||
      parsed.meta?.mode === "gemini"
        ? parsed.meta.mode
        : null;
    const model =
      typeof parsed.meta?.model === "string" || parsed.meta?.model === null
        ? parsed.meta.model ?? null
        : null;

    return {
      messages: storedMessages.length ? storedMessages : [INITIAL_ASSISTANT_MESSAGE],
      meta: {
        mode,
        model,
      },
    } satisfies StoredChatState;
  } catch {
    window.localStorage.removeItem(CHAT_STORAGE_KEY);
    return null;
  }
}

function getModeLabel(mode: AIResponseMode | null) {
  if (mode === "gemini") {
    return "Gemini mode";
  }

  if (mode === "openai") {
    return "OpenAI mode";
  }

  if (mode === "local") {
    return "Local mode";
  }

  return "Ready";
}

function extractTimestampFromId(messageId: string) {
  const match = messageId.match(/-(\d{10,})-/);

  if (!match) {
    return null;
  }

  const timestamp = Number.parseInt(match[1], 10);

  if (Number.isNaN(timestamp)) {
    return null;
  }

  return timestamp;
}

export default function ChatBox() {
  const hasHydratedStorageRef = useRef(false);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AIResponseMode | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIChatMessage[]>([
    INITIAL_ASSISTANT_MESSAGE,
  ]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const storedState = readStoredChatState();

      if (storedState) {
        setMessages(storedState.messages);
        setMode(storedState.meta.mode);
        setModel(storedState.meta.model);
      }

      hasHydratedStorageRef.current = true;
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedStorageRef.current) {
      return;
    }

    const snapshot: StoredChatState = {
      messages,
      meta: {
        mode,
        model,
      },
    };

    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(snapshot));
  }, [messages, mode, model]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [isSending, messages]);

  const timeFormatter = useMemo(
    () => new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }),
    []
  );

  function getMessageTime(messageId: string) {
    const extractedTimestamp = extractTimestampFromId(messageId);
    return extractedTimestamp
      ? timeFormatter.format(new Date(extractedTimestamp))
      : timeFormatter.format(new Date(INITIAL_ASSISTANT_TIMESTAMP));
  }

  async function handleSubmit(override?: string) {
    const message = (override ?? input).trim();

    if (!message || isSending) {
      return;
    }

    const conversationHistory: AIConversationMessage[] = messages
      .filter((item) => item.id !== INITIAL_ASSISTANT_MESSAGE.id)
      .map((item) => ({
        content: item.content,
        role: item.role,
      }));

    setInput("");
    setIsSending(true);
    setError(null);
    setMessages((current) => [...current, createMessage("user", message)]);

    try {
      const response = await sendAIMessage({
        history: conversationHistory,
        message,
      });

      setMode(response.mode);
      setModel(response.model);
      setMessages((current) => [
        ...current,
        createMessage("assistant", response.reply),
      ]);
    } catch (chatError) {
      setError(
        chatError instanceof Error ? chatError.message : "AI request failed."
      );
    } finally {
      setIsSending(false);
    }
  }

  function resetConversation() {
    setError(null);
    setInput("");
    setMode(null);
    setModel(null);
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    window.localStorage.removeItem(CHAT_STORAGE_KEY);
  }

  return (
    <section className="grid items-stretch gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-[22px] border border-[rgba(255,106,0,0.34)] bg-[linear-gradient(180deg,rgba(20,14,12,0.96),rgba(8,8,10,0.98))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.44),0_0_20px_rgba(255,106,0,0.06)] backdrop-blur-2xl xl:h-[600px]">
        <div className="flex h-full flex-col">
          <div className="relative mx-auto mt-1 h-[112px] w-[112px] overflow-hidden rounded-full border border-orange-400/18 bg-[radial-gradient(circle_at_top,rgba(255,145,62,0.16),rgba(17,17,19,0.98))] shadow-[0_18px_38px_rgba(0,0,0,0.34),0_0_0_8px_rgba(255,106,0,0.05),0_0_22px_rgba(255,106,0,0.12)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,132,31,0.18),transparent_65%)]" />
            <Image
              alt="AI Туслах"
              className="object-cover"
              fill
              sizes="112px"
              src="/aii.png"
            />
          </div>

          <div className="mt-4 flex justify-center">
            <div className="inline-flex h-[28px] items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 text-[11px] font-medium text-white/78 backdrop-blur-xl">
              <SparklesIcon className="h-3.5 w-3.5 text-orange-300" />
              <span>{getModeLabel(mode)}</span>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.55)]" />
            </div>
          </div>

          <div className="mt-4 text-center">
            <h2 className="text-[26px] font-bold tracking-[-0.04em] text-white">
              AI Туслах
            </h2>
            <p className="mx-auto mt-3 max-w-[252px] text-center text-[12px] leading-[1.8] text-white/[0.64]">
              Gemini or OpenAI can power smart replies here. If neither key is
              available, the local assistant fallback still works.
            </p>
          </div>

          <div className="mt-6">
            <div className="flex flex-col gap-3">
              {dashboardAssistantPrompts.map((prompt) => (
                <button
                  className="group flex h-[48px] items-center gap-3 rounded-[12px] border border-white/7 bg-white/[0.04] px-4 text-left text-[12.5px] font-medium text-white/74 backdrop-blur-xl transition hover:border-orange-400/28 hover:bg-orange-500/10 hover:text-white hover:shadow-[0_0_18px_rgba(255,106,0,0.08)] disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={isSending}
                  key={prompt}
                  onClick={() => {
                    void handleSubmit(prompt);
                  }}
                  type="button"
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-orange-400/14 bg-orange-500/10 text-orange-200">
                    <SparklesIcon className="h-3 w-3" />
                  </span>
                  <span className="leading-none">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,16,18,0.98),rgba(7,7,9,0.99))] shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl xl:h-[600px]">
        <div className="h-[92px] shrink-0 border-b border-white/6 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-white">
                AI Туслах
              </h2>
              <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-white/42">
                Follow-up ойлгож, chat memory хадгалж, илүү context-aware тусална.
              </p>
            </div>

            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border border-white/8 bg-white/[0.03] px-4 text-[12.5px] font-medium text-white/68 backdrop-blur-xl transition hover:border-orange-400/24 hover:bg-orange-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-55"
              disabled={isSending}
              onClick={resetConversation}
              type="button"
            >
              <ArrowPathIcon className="h-4 w-4 text-white/64" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <div className="premium-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5 pr-4">
          <div className="space-y-5">
            {messages.map((message) => {
              const assistant = message.role === "assistant";
              const timeLabel = getMessageTime(message.id);

              return (
                <div
                  className={cn("fade-in-up flex", assistant ? "justify-start" : "justify-end")}
                  key={message.id}
                >
                  {assistant ? (
                    <div className="flex max-w-[82%] items-start gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-orange-400/14 bg-orange-500/10 text-orange-200 shadow-[0_0_14px_rgba(255,106,0,0.12)]">
                        <SparklesIcon className="h-3.5 w-3.5" />
                      </span>

                      <div className="max-w-full">
                        <div className="whitespace-pre-wrap rounded-[16px] border border-white/6 bg-[rgba(42,42,48,0.9)] px-5 py-4 text-[12.5px] leading-[1.8] text-white shadow-[0_16px_34px_rgba(0,0,0,0.22)]">
                          {message.content}
                        </div>
                        <p className="mt-2 pl-1 text-[11px] text-white/30">
                          {`AI Туслах • ${timeLabel}`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[260px]">
                      <div className="whitespace-pre-wrap rounded-[16px] border border-[rgba(255,140,40,0.24)] bg-[linear-gradient(135deg,#8a3a08,#ff6a00)] px-5 py-4 text-[12px] leading-[1.6] text-white shadow-[0_16px_34px_rgba(0,0,0,0.22)]">
                        {message.content}
                      </div>
                      <p className="mt-2 pr-1 text-right text-[11px] text-white/30">
                        {`Та • ${timeLabel}`}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {isSending ? (
              <div className="fade-in-up flex justify-start">
                <div className="flex max-w-[82%] items-start gap-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-orange-400/14 bg-orange-500/10 text-orange-200 shadow-[0_0_14px_rgba(255,106,0,0.12)]">
                    <SparklesIcon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <div className="rounded-[16px] border border-white/6 bg-[rgba(42,42,48,0.9)] px-5 py-4 text-[12.5px] leading-[1.75] text-white shadow-[0_16px_34px_rgba(0,0,0,0.22)]">
                      Түр бодоод илүү сайн хариулт бэлдэж байна...
                    </div>
                    <p className="mt-2 pl-1 text-[11px] text-white/30">
                      AI Туслах
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {error ? <Toast message={error} tone="error" /> : null}

            <div ref={scrollAnchorRef} />
          </div>
        </div>

        <div className="h-[86px] shrink-0 border-t border-white/6 px-5 py-4 backdrop-blur-2xl">
          <div className="flex h-[52px] w-full items-center gap-2.5 rounded-[13px] border border-white/7 bg-[rgba(0,0,0,0.3)] px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
            <input
              className="h-full flex-1 rounded-[12px] border-none bg-transparent px-2.5 text-[12.5px] text-white outline-none placeholder:text-white/28"
              disabled={isSending}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder="Жишээ нь: 20к дотор тахиатай 2 сонголт санал болго"
              value={input}
            />

            <button
              aria-label="Send message"
              className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[12px] border border-orange-300/18 bg-[linear-gradient(135deg,#ff6a00,#ff8a1f)] text-white shadow-[0_14px_28px_rgba(255,106,0,0.26)] transition hover:-translate-y-px hover:shadow-[0_18px_34px_rgba(255,106,0,0.32)] disabled:cursor-not-allowed disabled:opacity-55"
              disabled={isSending}
              onClick={() => {
                void handleSubmit();
              }}
              type="button"
            >
              {isSending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <PaperAirplaneIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}
