import NdaCreator from "@/components/NdaCreator";
import { loadTemplateFile } from "@/lib/loadTemplates";
import { parseStandardTerms } from "@/lib/parseStandardTerms";

export default function Home() {
  const standardTermsMarkdown = loadTemplateFile("mutual-nda-standard-terms.md");
  const sections = parseStandardTerms(standardTermsMarkdown);

  return (
    <main className="min-h-screen bg-slate-100 py-10">
      <NdaCreator sections={sections} />
    </main>
  );
}
