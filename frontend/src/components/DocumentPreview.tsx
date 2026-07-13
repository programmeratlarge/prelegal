import { forwardRef } from "react";
import { AssembledDocument, AssembledParty, AssembledSection } from "@/lib/assembleDocument";
import { InlineSegment } from "@/lib/parseInline";

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
  const hasBody = section.segments.some((segment) => segment.type !== "text" || segment.value.trim());
  return (
    <div className={section.depth === 0 ? "mb-3" : "mb-2 ml-5"}>
      <p className="break-inside-avoid text-sm leading-relaxed text-slate-800">
        <strong>{section.marker}. </strong>
        {section.heading && <strong>{section.heading}. </strong>}
        {hasBody && renderSegments(section.segments)}
      </p>
      {section.children.map((child) => (
        <Section key={child.key} section={child} />
      ))}
    </div>
  );
}

function partyRow(label: string, values: string[]) {
  return (
    <tr className="border-t border-slate-200">
      <td className="py-1.5 pr-2 text-xs font-medium text-slate-500">{label}</td>
      {values.map((value, index) => (
        <td key={index} className="py-1.5 px-2 text-sm text-slate-800">
          {value || "—"}
        </td>
      ))}
    </tr>
  );
}

function SignatureBlock({ parties }: { parties: AssembledParty[] }) {
  return (
    <table className="break-inside-avoid mt-4 w-full table-fixed border-collapse text-left">
      <thead>
        <tr>
          <th className="w-1/4" />
          {parties.map((party) => (
            <th
              key={party.label}
              className="py-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              {party.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {partyRow("Signature", parties.map(() => ""))}
        {partyRow("Print Name", parties.map((party) => party.values.name))}
        {partyRow("Title", parties.map((party) => party.values.title))}
        {partyRow("Company", parties.map((party) => party.values.company))}
        {partyRow("Notice Address", parties.map((party) => party.values.noticeAddress))}
        {partyRow("Date", parties.map(() => ""))}
      </tbody>
    </table>
  );
}

interface DocumentPreviewProps {
  document: AssembledDocument;
}

const DocumentPreview = forwardRef<HTMLDivElement, DocumentPreviewProps>(
  function DocumentPreview({ document }, ref) {
    return (
      <div
        ref={ref}
        className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-sm print:shadow-none"
      >
        <h1 className="text-2xl font-bold text-slate-900">{document.title}</h1>

        <section className="break-inside-avoid mt-6 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Cover Page</h2>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {document.coverFields.map((field) => (
              <div key={field.id}>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {field.label}
                </dt>
                <dd className="text-sm text-slate-800">{field.value || "—"}</dd>
              </div>
            ))}
          </dl>

          <SignatureBlock parties={document.parties} />
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">Standard Terms</h2>
          <div className="mt-3">
            {document.sections.map((section) => (
              <Section key={section.key} section={section} />
            ))}
          </div>
        </section>

        <p className="mt-6 text-xs text-slate-400">{document.attribution}</p>
      </div>
    );
  }
);

export default DocumentPreview;
