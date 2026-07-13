import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import AuthGate from "@/components/AuthGate";
import DocumentCreator, { DocumentBundle } from "@/components/DocumentCreator";
import { parseDocumentBody } from "@/lib/documentTree";
import { loadTemplateFile } from "@/lib/loadTemplates";
import { loadDocumentRegistry } from "@/lib/registry/loadRegistry";

export const metadata: Metadata = {
  title: "Document Creator",
};

export default function Home() {
  // Build time (static export): every template is parsed here and shipped as
  // props, so switching documents in the browser is a pure data swap.
  const documents: DocumentBundle[] = loadDocumentRegistry().map((definition) => ({
    definition,
    parsed: parseDocumentBody(loadTemplateFile(definition.templateFile)),
  }));

  return (
    <AuthGate>
      <AppShell>
        <DocumentCreator documents={documents} />
      </AppShell>
    </AuthGate>
  );
}
