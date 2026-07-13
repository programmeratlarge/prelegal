"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/lib/chatClient";

interface ChatPanelProps {
  messages: ChatMessage[];
  busy: boolean;
  error: string | null;
  onSend: (text: string) => void;
}

export default function ChatPanel({ messages, busy, error, onSend }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    onSend(text);
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                message.role === "user"
                  ? "max-w-[85%] rounded-lg bg-brand-navy px-3 py-2 text-sm text-white"
                  : "max-w-[85%] rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-900"
              }
            >
              {message.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg bg-slate-100 px-3 py-2 text-sm text-brand-gray">
              Thinking…
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mx-4 mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 p-3">
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer…"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-md bg-brand-purple px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
