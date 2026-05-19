import type {
  CreateFeedbackInput,
  FeedbackEntry,
  FeedbackStatus,
} from "@/features/feedback/feedback.types";
import { fetchJson } from "@/lib/fetcher";

export function createFeedback(payload: CreateFeedbackInput) {
  return fetchJson<FeedbackEntry>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateFeedbackStatus(feedbackId: string, status: FeedbackStatus) {
  return fetchJson<FeedbackEntry>(`/api/admin/feedback/${feedbackId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
