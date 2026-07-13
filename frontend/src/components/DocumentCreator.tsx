"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { assembleDocument, formatPartyName } from "@/lib/assembleDocument";
import { ChatError, ChatMessage, sendChatMessage } from "@/lib/chatClient";
import { getDocument } from "@/lib/documentsClient";
import { ParsedDocument } from "@/lib/documentTree";
import { carryOverFields } from "@/lib/registry/defaultForm";
import { DocumentDefinition, DocumentFormData } from "@/lib/registry/types";
import { SaveStatus, useDocumentAutosave } from "@/lib/useDocumentAutosave";
import ChatPanel from "./ChatPanel";
import DocumentForm from "./DocumentForm";
import DocumentPreview from "./DocumentPreview";

export interface DocumentBundle {
  definition: DocumentDefinition;
  parsed: ParsedDocument;
}

interface DocumentCreatorProps {
  documents: DocumentBundle[];
}

type Mode = "chat" | "form";

const GREETING =
  "Hi! I'm here to help you draft a legal agreement — tell me what you need (an NDA, a cloud service agreement, a pilot, ...), or pick a document from the menu. As we chat, the document on the right fills in.";

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
    ? "border-b-2 border-brand-blue px-3 py-1.5 text-sm font-semibold text-brand-navy"
    : "border-b-2 border-transparent px-3 py-1.5 text-sm font-medium text-brand-gray hover:text-brand-navy";
}

function SaveStatusPill({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  if (status === "idle") return null;
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="text-xs font-medium text-red-600 hover:underline"
      >
        Couldn&apos;t save — retry
      </button>
    );
  }
  return (
    <span className="text-xs text-brand-gray">
      {status === "saving" ? "Saving…" : "All changes saved"}
    </span>
  );
}

export default function DocumentCreator({ documents }: DocumentCreatorProps) {
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [form, setForm] = useState<DocumentFormData>({});
  const [downloading, setDownloading] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [resuming, setResuming] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("doc")
  );
  const previewRef = useRef<HTMLDivElement>(null);
  const autosave = useDocumentAutosave();

  // Resume a saved document when opened as /?doc=<id> (always via hard
  // navigation, so a mount-time read of the query string is reliable).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("doc");
    if (!param) return;
    getDocument(Number(param))
      .then((detail) => {
        setDocumentType(detail.documentType);
        setForm(detail.form);
        if (detail.messages.length > 0) setMessages(detail.messages);
        autosave.setResumedId(detail.id);
      })
      .catch(() => {
        // Deleted or foreign id: fall back to a clean slate.
        window.history.replaceState(null, "", "/");
      })
      .finally(() => setResuming(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = documents.find((bundle) => bundle.definition.id === documentType) ?? null;

  const assembled = useMemo(
    () => (active ? assembleDocument(active.definition, form, active.parsed) : null),
    [active, form]
  );

  function switchDocument(id: string) {
    const target = documents.find((bundle) => bundle.definition.id === id);
    if (!target || id === documentType) return;
    const nextForm = carryOverFields(form, target.definition);
    const nextMessages: ChatMessage[] = [
      ...messages,
      {
        role: "assistant",
        content: `Let's draft your ${target.definition.title}. You can fill it in here in chat or hand-edit any field on the Form tab.`,
      },
    ];
    setDocumentType(id);
    setForm(nextForm);
    setMessages(nextMessages);
    autosave.save({ documentType: id, form: nextForm, messages: nextMessages }, { immediate: true });
  }

  async function handleSend(text: string) {
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setChatBusy(true);
    setChatError(null);
    try {
      const result = await sendChatMessage(nextMessages, documentType, form);
      const withReply: ChatMessage[] = [
        ...nextMessages,
        { role: "assistant", content: result.reply },
      ];
      setMessages(withReply);
      setDocumentType(result.documentType);
      setForm(result.form);
      if (result.documentType) {
        autosave.save(
          { documentType: result.documentType, form: result.form, messages: withReply },
          { immediate: true }
        );
      }
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

  function handleFormChange(next: DocumentFormData) {
    setForm(next);
    if (documentType) {
      autosave.save({ documentType, form: next, messages });
    }
  }

  async function handleDownload() {
    if (!previewRef.current || !active) return;
    setDownloading(true);
    try {
      const { downloadPdf } = await import("@/lib/downloadPdf");
      const party1 = formatPartyName(active.definition.roles[0], form);
      const party2 = formatPartyName(active.definition.roles[1], form);
      const filename = `${active.definition.id}-${slugify(party1)}-${slugify(party2)}.pdf`;
      await downloadPdf(previewRef.current, filename);
    } finally {
      setDownloading(false);
    }
  }

  if (resuming) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-brand-gray">
        Loading your document…
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="shrink-0 text-xl font-bold text-brand-navy">Document Creator</h1>
          <select
            aria-label="Document type"
            className="w-full min-w-0 rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue disabled:cursor-not-allowed disabled:opacity-60"
            value={documentType ?? ""}
            onChange={(e) => e.target.value && switchDocument(e.target.value)}
            // Disabled while a chat request is in flight: the response applies
            // documentType/form for the document the request was sent against,
            // and would silently revert a mid-flight manual switch.
            disabled={chatBusy}
          >
            <option value="" disabled>
              Choose a document…
            </option>
            {documents.map((bundle) => (
              <option key={bundle.definition.id} value={bundle.definition.id}>
                {bundle.definition.title}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4 flex items-center justify-between border-b border-slate-200">
          <div className="flex">
            <button type="button" onClick={() => setMode("chat")} className={tabClass(mode === "chat")}>
              Chat
            </button>
            <button
              type="button"
              onClick={() => setMode("form")}
              className={tabClass(mode === "form")}
              disabled={!active}
            >
              Form
            </button>
          </div>
          <SaveStatusPill status={autosave.status} onRetry={autosave.retry} />
        </div>
        {mode === "chat" || !active ? (
          <ChatPanel messages={messages} busy={chatBusy} error={chatError} onSend={handleSend} />
        ) : (
          <DocumentForm definition={active.definition} value={form} onChange={handleFormChange} />
        )}
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading || !active}
          className="mt-4 w-full rounded-md bg-brand-purple px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? "Preparing PDF…" : "Download PDF"}
        </button>
      </div>
      <div>
        {assembled ? (
          <DocumentPreview ref={previewRef} document={assembled} />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-lg font-semibold text-brand-navy">No document selected yet</p>
            <p className="mt-2 max-w-md text-sm text-brand-gray">
              Tell the assistant what you need, or pick one of the {documents.length} supported
              documents from the menu — the live preview will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
