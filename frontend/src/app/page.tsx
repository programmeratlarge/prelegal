import AuthGate from "@/components/AuthGate";
import AuthHeader from "@/components/AuthHeader";
import DocumentCreator, { DocumentBundle } from "@/components/DocumentCreator";
import { parseDocumentBody } from "@/lib/documentTree";
import { loadTemplateFile } from "@/lib/loadTemplates";
import { loadDocumentRegistry } from "@/lib/registry/loadRegistry";

export default function Home() {
  // Build time (static export): every template is parsed here and shipped as
  // props, so switching documents in the browser is a pure data swap.
  const documents: DocumentBundle[] = loadDocumentRegistry().map((definition) => ({
    definition,
    parsed: parseDocumentBody(loadTemplateFile(definition.templateFile)),
  }));

  return (
    <main className="min-h-screen bg-slate-100 py-10">
      <AuthGate>
        <AuthHeader />
        <DocumentCreator documents={documents} />
      </AuthGate>
    </main>
  );
}
