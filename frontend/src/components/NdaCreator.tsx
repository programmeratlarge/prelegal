"use client";

import { useMemo, useRef, useState } from "react";
import { assembleNda } from "@/lib/assembleNda";
import { defaultNdaFormData } from "@/lib/ndaSchema";
import { StandardTermsSection } from "@/lib/parseStandardTerms";
import NdaForm from "./NdaForm";
import NdaPreview from "./NdaPreview";

interface NdaCreatorProps {
  sections: StandardTermsSection[];
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "party";
}

export default function NdaCreator({ sections }: NdaCreatorProps) {
  const [form, setForm] = useState(defaultNdaFormData);
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const assembled = useMemo(() => assembleNda(form, sections), [form, sections]);

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
          <h1 className="text-xl font-bold text-slate-900">Mutual NDA Creator</h1>
        </div>
        <NdaForm value={form} onChange={setForm} />
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
