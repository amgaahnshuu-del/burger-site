import type { AIReply, SendAIMessageInput } from "@/features/ai/ai.types";
import { fetchJson } from "@/lib/fetcher";

export async function sendAIMessage(payload: SendAIMessageInput) {
  return fetchJson<AIReply>("/api/ai", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
