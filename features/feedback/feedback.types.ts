import type { AuthUser } from "@/features/auth/auth.types";

export type FeedbackType = "COMPLAINT" | "SUGGESTION";
export type FeedbackStatus = "OPEN" | "RESOLVED";

export type FeedbackEntry = {
  createdAt: string;
  email: string;
  id: string;
  message: string;
  name: string;
  resolvedAt: string | null;
  status: FeedbackStatus;
  type: FeedbackType;
  user: Pick<AuthUser, "email" | "id" | "name" | "role"> | null;
  userId: string | null;
};

export type CreateFeedbackInput = {
  message: string;
  type: FeedbackType;
};
