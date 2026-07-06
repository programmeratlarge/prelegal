"use client";

import { NdaFormData, PartyInfo } from "@/lib/ndaSchema";

interface NdaFormProps {
  value: NdaFormData;
  onChange: (next: NdaFormData) => void;
}

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";
const fieldsetClass = "space-y-4 rounded-lg border border-slate-200 p-4";
const legendClass = "px-1 text-sm font-semibold text-slate-900";

function PartyFields({
  title,
  value,
  onChange,
}: {
  title: string;
  value: PartyInfo;
  onChange: (next: PartyInfo) => void;
}) {
  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>{title}</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Print Name</span>
          <input
            className={inputClass}
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="Jane Doe"
          />
        </label>
        <label>
          <span className={labelClass}>Title</span>
          <input
            className={inputClass}
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="VP of Engineering"
          />
        </label>
        <label>
          <span className={labelClass}>Company</span>
          <input
            className={inputClass}
            value={value.company}
            onChange={(e) => onChange({ ...value, company: e.target.value })}
            placeholder="Acme, Inc."
          />
        </label>
        <label>
          <span className={labelClass}>Notice Address</span>
          <input
            className={inputClass}
            value={value.noticeAddress}
            onChange={(e) => onChange({ ...value, noticeAddress: e.target.value })}
            placeholder="legal@acme.com"
          />
        </label>
      </div>
    </fieldset>
  );
}

export default function NdaForm({ value, onChange }: NdaFormProps) {
  return (
    <div className="space-y-4">
      <PartyFields
        title="Party 1"
        value={value.party1}
        onChange={(party1) => onChange({ ...value, party1 })}
      />
      <PartyFields
        title="Party 2"
        value={value.party2}
        onChange={(party2) => onChange({ ...value, party2 })}
      />

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Purpose & Effective Date</legend>
        <label>
          <span className={labelClass}>Purpose</span>
          <textarea
            className={inputClass}
            rows={2}
            value={value.purpose}
            onChange={(e) => onChange({ ...value, purpose: e.target.value })}
          />
        </label>
        <label>
          <span className={labelClass}>Effective Date</span>
          <input
            type="date"
            className={inputClass}
            value={value.effectiveDate}
            onChange={(e) => onChange({ ...value, effectiveDate: e.target.value })}
          />
        </label>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>MNDA Term</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={value.mndaTerm.type === "expires"}
            onChange={() =>
              onChange({
                ...value,
                mndaTerm: { type: "expires", years: value.mndaTerm.type === "expires" ? value.mndaTerm.years : 1 },
              })
            }
          />
          Expires
          <input
            type="number"
            min={1}
            className={`${inputClass} w-20`}
            disabled={value.mndaTerm.type !== "expires"}
            value={value.mndaTerm.type === "expires" ? value.mndaTerm.years : 1}
            onChange={(e) =>
              onChange({
                ...value,
                mndaTerm: { type: "expires", years: Math.max(1, Number(e.target.value) || 1) },
              })
            }
          />
          year(s) from Effective Date
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={value.mndaTerm.type === "untilTerminated"}
            onChange={() => onChange({ ...value, mndaTerm: { type: "untilTerminated" } })}
          />
          Continues until terminated
        </label>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Term of Confidentiality</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={value.confidentialityTerm.type === "years"}
            onChange={() =>
              onChange({
                ...value,
                confidentialityTerm: {
                  type: "years",
                  years: value.confidentialityTerm.type === "years" ? value.confidentialityTerm.years : 1,
                },
              })
            }
          />
          Expires
          <input
            type="number"
            min={1}
            className={`${inputClass} w-20`}
            disabled={value.confidentialityTerm.type !== "years"}
            value={value.confidentialityTerm.type === "years" ? value.confidentialityTerm.years : 1}
            onChange={(e) =>
              onChange({
                ...value,
                confidentialityTerm: { type: "years", years: Math.max(1, Number(e.target.value) || 1) },
              })
            }
          />
          year(s) from Effective Date
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={value.confidentialityTerm.type === "perpetuity"}
            onChange={() => onChange({ ...value, confidentialityTerm: { type: "perpetuity" } })}
          />
          In perpetuity
        </label>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Governing Law & Jurisdiction</legend>
        <label>
          <span className={labelClass}>Governing Law (state)</span>
          <input
            className={inputClass}
            value={value.governingLaw}
            onChange={(e) => onChange({ ...value, governingLaw: e.target.value })}
            placeholder="Delaware"
          />
        </label>
        <label>
          <span className={labelClass}>Jurisdiction (city/county and state)</span>
          <input
            className={inputClass}
            value={value.jurisdiction}
            onChange={(e) => onChange({ ...value, jurisdiction: e.target.value })}
            placeholder="New Castle, DE"
          />
        </label>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>MNDA Modifications (optional)</legend>
        <textarea
          className={inputClass}
          rows={2}
          value={value.modifications}
          onChange={(e) => onChange({ ...value, modifications: e.target.value })}
          placeholder="List any modifications to the MNDA"
        />
      </fieldset>
    </div>
  );
}
