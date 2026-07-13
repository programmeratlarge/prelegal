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

export class ChatError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function sendChatMessage(
  messages: ChatMessage[],
  documentType: string | null,
  form: DocumentFormData
): Promise<ChatResult> {
  const response = await fetch("/api/chat", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentType, messages, form }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ChatError(response.status, body?.detail ?? "Request failed");
  }

  return response.json() as Promise<ChatResult>;
}
