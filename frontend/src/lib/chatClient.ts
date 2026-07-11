import { NdaFormData } from "./ndaSchema";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResult {
  reply: string;
  form: NdaFormData;
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
  form: NdaFormData
): Promise<ChatResult> {
  const response = await fetch("/api/chat", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentType: "mutual-nda", messages, form }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ChatError(response.status, body?.detail ?? "Request failed");
  }

  return response.json() as Promise<ChatResult>;
}
