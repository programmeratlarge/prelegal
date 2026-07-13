import { request } from "./apiClient";
import { ChatMessage } from "./chatClient";
import { DocumentFormData } from "./registry/types";

export interface DocumentPayload {
  documentType: string;
  form: DocumentFormData;
  messages: ChatMessage[];
}

export interface DocumentSummary {
  id: number;
  documentType: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDetail extends DocumentSummary {
  form: DocumentFormData;
  messages: ChatMessage[];
}

export function listDocuments(): Promise<DocumentSummary[]> {
  return request<DocumentSummary[]>("/api/documents");
}

export function getDocument(id: number): Promise<DocumentDetail> {
  return request<DocumentDetail>(`/api/documents/${id}`);
}

export function createDocument(payload: DocumentPayload): Promise<DocumentDetail> {
  return request<DocumentDetail>("/api/documents", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDocument(id: number, payload: DocumentPayload): Promise<DocumentDetail> {
  return request<DocumentDetail>(`/api/documents/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteDocument(id: number): Promise<void> {
  return request<void>(`/api/documents/${id}`, { method: "DELETE" });
}
