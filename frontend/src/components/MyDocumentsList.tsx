"use client";

import { useEffect, useState } from "react";
import {
  deleteDocument,
  DocumentSummary,
  listDocuments,
} from "@/lib/documentsClient";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import Button from "./ui/Button";

type LoadState = "loading" | "ready" | "error";

export default function MyDocumentsList() {
  const [state, setState] = useState<LoadState>("loading");
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    listDocuments()
      .then((docs) => {
        setDocuments(docs);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  async function handleDelete(doc: DocumentSummary) {
    if (!window.confirm(`Delete "${doc.title}"? This can't be undone.`)) return;
    setDeletingId(doc.id);
    setDocuments((current) => current.filter((d) => d.id !== doc.id));
    try {
      await deleteDocument(doc.id);
    } catch {
      // Re-insert only this document (in server order) — restoring a whole
      // prior snapshot could resurrect rows another in-flight delete removed.
      setDocuments((current) =>
        [...current, doc].sort(
          (a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id - a.id
        )
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (state === "loading") {
    return <p className="py-12 text-center text-sm text-brand-gray">Loading your documents…</p>;
  }

  if (state === "error") {
    return (
      <p className="py-12 text-center text-sm text-red-600">
        Couldn&apos;t load your documents — refresh the page to try again.
      </p>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-lg font-semibold text-brand-navy">No documents yet</p>
        <p className="mt-2 text-sm text-brand-gray">
          Start a draft and it will be saved here automatically.
        </p>
        <a
          href="/"
          className="mt-4 rounded-md bg-brand-purple px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
        >
          Start your first draft
        </a>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <a href={`/?doc=${doc.id}`} className="min-w-0 flex-1 group">
            <p className="truncate text-sm font-semibold text-brand-navy group-hover:text-brand-blue">
              {doc.title}
            </p>
            <p className="text-xs text-brand-gray">
              Updated {formatRelativeTime(doc.updatedAt)}
            </p>
          </a>
          <div className="flex shrink-0 items-center gap-3">
            <a
              href={`/?doc=${doc.id}`}
              className="text-sm font-medium text-brand-blue hover:underline"
            >
              Open
            </a>
            <Button
              variant="danger"
              onClick={() => handleDelete(doc)}
              disabled={deletingId === doc.id}
            >
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
