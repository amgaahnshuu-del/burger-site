export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type AIConversationMessage = Pick<ChatMessage, "role" | "content">;

export type AIResponseMode = "local" | "openai" | "gemini";

export type AIReply = {
  mode: AIResponseMode;
  model: string | null;
  reply: string;
};

export type SendAIMessageInput = {
  history?: AIConversationMessage[];
  message: string;
};
