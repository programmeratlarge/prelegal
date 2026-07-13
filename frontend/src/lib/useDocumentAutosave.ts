"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "./apiClient";
import { createDocument, DocumentPayload, updateDocument } from "./documentsClient";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 800;

/**
 * Single-flight, coalesce-to-latest autosave. The first save POSTs a new
 * document (once a documentType exists); later saves PUT the same row. At
 * most one request is ever in flight — anything queued behind it collapses
 * to the latest snapshot, so rapid edits can't create duplicate rows or
 * out-of-order writes.
 */
export function useDocumentAutosave() {
  const documentIdRef = useRef<number | null>(null);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const inFlight = useRef(false);
  const pending = useRef<DocumentPayload | null>(null);
  const lastPayload = useRef<DocumentPayload | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async (payload: DocumentPayload) => {
    if (inFlight.current) {
      pending.current = payload;
      return;
    }
    inFlight.current = true;
    setStatus("saving");
    lastPayload.current = payload;
    try {
      if (documentIdRef.current == null) {
        const created = await createDocument(payload);
        documentIdRef.current = created.id;
        setDocumentId(created.id);
        // Keep the URL resumable across a refresh without a navigation.
        window.history.replaceState(null, "", `/?doc=${created.id}`);
      } else {
        await updateDocument(documentIdRef.current, payload);
      }
      setStatus("saved");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = "/login/";
        return;
      }
      setStatus("error");
    } finally {
      inFlight.current = false;
      const next = pending.current;
      pending.current = null;
      if (next) void flush(next);
    }
  }, []);

  const save = useCallback(
    (payload: DocumentPayload, options?: { immediate?: boolean }) => {
      if (!payload.documentType) return;
      if (timer.current) clearTimeout(timer.current);
      if (options?.immediate) {
        void flush(payload);
      } else {
        timer.current = setTimeout(() => void flush(payload), DEBOUNCE_MS);
      }
    },
    [flush]
  );

  const retry = useCallback(() => {
    if (lastPayload.current) void flush(lastPayload.current);
  }, [flush]);

  const setResumedId = useCallback((id: number) => {
    documentIdRef.current = id;
    setDocumentId(id);
    setStatus("saved");
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { documentId, status, save, retry, setResumedId };
}
