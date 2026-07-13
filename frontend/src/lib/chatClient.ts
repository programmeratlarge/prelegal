import { ApiError, request } from "./apiClient";
import { DocumentFormData } from "./registry/types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResult {
  reply: string;
  documentType: string | null;
  form: DocumentFormData;
}

export { ApiError as ChatError };

export function sendChatMessage(
  messages: ChatMessage[],
  documentType: string | null,
  form: DocumentFormData
): Promise<ChatResult> {
  return request<ChatResult>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ documentType, messages, form }),
  });
}
