"use client";

import { useMemo, useRef, useState } from "react";
import { assembleNda } from "@/lib/assembleNda";
import { ChatError, ChatMessage, sendChatMessage } from "@/lib/chatClient";
import { defaultNdaFormData } from "@/lib/ndaSchema";
import { StandardTermsSection } from "@/lib/parseStandardTerms";
import ChatPanel from "./ChatPanel";
import NdaForm from "./NdaForm";
import NdaPreview from "./NdaPreview";

interface NdaCreatorProps {
  sections: StandardTermsSection[];
}

type Mode = "chat" | "form";

const GREETING =
  "Hi! I'm here to help you draft your Mutual NDA — as we chat, the document on the right fills in. To get started: who are the two parties to this agreement?";

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "party";
}

function tabClass(active: boolean): string {
  return active
    ? "border-b-2 border-[#209dd7] px-3 py-1.5 text-sm font-semibold text-[#032147]"
    : "border-b-2 border-transparent px-3 py-1.5 text-sm font-medium text-[#888888] hover:text-[#032147]";
}

export default function NdaCreator({ sections }: NdaCreatorProps) {
  const [form, setForm] = useState(defaultNdaFormData);
  const [downloading, setDownloading] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const assembled = useMemo(() => assembleNda(form, sections), [form, sections]);

  async function handleSend(text: string) {
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setChatBusy(true);
    setChatError(null);
    try {
      const result = await sendChatMessage(nextMessages, form);
      setMessages([...nextMessages, { role: "assistant", content: result.reply }]);
      setForm(result.form);
    } catch (error) {
      setChatError(
        error instanceof ChatError && error.status !== 401
          ? error.message
          : "Something went wrong — please try again."
      );
    } finally {
      setChatBusy(false);
    }
  }

  async function handleDownload() {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      const { downloadNdaPdf } = await import("@/lib/downloadNdaPdf");
      const filename = `mutual-nda-${slugify(form.party1.company || form.party1.name)}-${slugify(
        form.party2.company || form.party2.name
      )}.pdf`;
      await downloadNdaPdf(previewRef.current, filename);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#032147]">Mutual NDA Creator</h1>
        </div>
        <div className="mb-4 flex border-b border-slate-200">
          <button type="button" onClick={() => setMode("chat")} className={tabClass(mode === "chat")}>
            Chat
          </button>
          <button type="button" onClick={() => setMode("form")} className={tabClass(mode === "form")}>
            Form
          </button>
        </div>
        {mode === "chat" ? (
          <ChatPanel messages={messages} busy={chatBusy} error={chatError} onSend={handleSend} />
        ) : (
          <NdaForm value={form} onChange={setForm} />
        )}
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="mt-4 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? "Preparing PDF…" : "Download PDF"}
        </button>
      </div>
      <div>
        <NdaPreview ref={previewRef} nda={assembled} />
      </div>
    </div>
  );
}
