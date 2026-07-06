import { forwardRef } from "react";
import { AssembledNda, AssembledSection } from "@/lib/assembleNda";
import { InlineSegment } from "@/lib/parseInline";
import { PartyInfo } from "@/lib/ndaSchema";

function renderSegments(segments: InlineSegment[]) {
  return segments.map((segment, index) => {
    switch (segment.type) {
      case "bold":
        return <strong key={index}>{segment.value}</strong>;
      case "link":
        return (
          <a
            key={index}
            href={segment.href}
            className="text-blue-700 underline"
            target="_blank"
            rel="noreferrer"
          >
            {segment.text}
          </a>
        );
      case "filled":
        return (
          <span key={index} className="rounded bg-amber-100 px-1 font-medium text-amber-900">
            {segment.value}
          </span>
        );
      case "text":
      default:
        return <span key={index}>{segment.value}</span>;
    }
  });
}

function Section({ section }: { section: AssembledSection }) {
  return (
    <p className="break-inside-avoid mb-3 text-sm leading-relaxed text-slate-800">
      <strong>{section.number}. </strong>
      {renderSegments(section.segments)}
    </p>
  );
}

function partyRow(label: string, party1Value: string, party2Value: string) {
  return (
    <tr className="border-t border-slate-200">
      <td className="py-1.5 pr-2 text-xs font-medium text-slate-500">{label}</td>
      <td className="py-1.5 px-2 text-sm text-slate-800">{party1Value || "—"}</td>
      <td className="py-1.5 px-2 text-sm text-slate-800">{party2Value || "—"}</td>
    </tr>
  );
}

function SignatureBlock({ party1, party2 }: { party1: PartyInfo; party2: PartyInfo }) {
  return (
    <table className="break-inside-avoid mt-4 w-full table-fixed border-collapse text-left">
      <thead>
        <tr>
          <th className="w-1/4" />
          <th className="w-3/8 py-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Party 1
          </th>
          <th className="w-3/8 py-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Party 2
          </th>
        </tr>
      </thead>
      <tbody>
        {partyRow("Signature", "", "")}
        {partyRow("Print Name", party1.name, party2.name)}
        {partyRow("Title", party1.title, party2.title)}
        {partyRow("Company", party1.company, party2.company)}
        {partyRow("Notice Address", party1.noticeAddress, party2.noticeAddress)}
        {partyRow("Date", "", "")}
      </tbody>
    </table>
  );
}

interface NdaPreviewProps {
  nda: AssembledNda;
}

const NdaPreview = forwardRef<HTMLDivElement, NdaPreviewProps>(function NdaPreview(
  { nda },
  ref
) {
  return (
    <div ref={ref} className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-sm print:shadow-none">
      <h1 className="text-2xl font-bold text-slate-900">Mutual Non-Disclosure Agreement</h1>

      <section className="break-inside-avoid mt-6 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Cover Page</h2>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Purpose</dt>
            <dd className="text-sm text-slate-800">{nda.purpose || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Effective Date
            </dt>
            <dd className="text-sm text-slate-800">{nda.effectiveDateLabel}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">MNDA Term</dt>
            <dd className="text-sm text-slate-800">{nda.mndaTermLabel}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Term of Confidentiality
            </dt>
            <dd className="text-sm text-slate-800">{nda.confidentialityTermLabel}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Governing Law
            </dt>
            <dd className="text-sm text-slate-800">{nda.governingLaw || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Jurisdiction</dt>
            <dd className="text-sm text-slate-800">{nda.jurisdiction || "—"}</dd>
          </div>
          {nda.modifications && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                MNDA Modifications
              </dt>
              <dd className="text-sm text-slate-800">{nda.modifications}</dd>
            </div>
          )}
        </dl>

        <SignatureBlock party1={nda.party1} party2={nda.party2} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Standard Terms</h2>
        <div className="mt-3">
          {nda.standardTerms.map((section) => (
            <Section key={section.number} section={section} />
          ))}
        </div>
      </section>

      <p className="mt-6 text-xs text-slate-400">
        Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under CC BY 4.0.
      </p>
    </div>
  );
});

export default NdaPreview;
