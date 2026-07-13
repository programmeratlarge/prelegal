import fs from "node:fs";
import path from "node:path";
import { DocumentDefinition } from "./types";

const REGISTRY_PATH = path.join(process.cwd(), "..", "registry", "documents.json");

/** Build-time only (Node fs), same pattern as loadTemplates.ts. */
export function loadDocumentRegistry(): DocumentDefinition[] {
  const parsed = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
  return parsed.documentTypes as DocumentDefinition[];
}
