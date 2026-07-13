"use client";

import {
  DocumentDefinition,
  DocumentFormData,
  FieldDefinition,
  PartyRole,
} from "@/lib/registry/types";

interface DocumentFormProps {
  definition: DocumentDefinition;
  value: DocumentFormData;
  onChange: (next: DocumentFormData) => void;
}

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";
const fieldsetClass = "space-y-4 rounded-lg border border-slate-200 p-4";
const legendClass = "px-1 text-sm font-semibold text-slate-900";

function PartyFields({
  role,
  value,
  onSet,
}: {
  role: PartyRole;
  value: DocumentFormData;
  onSet: (key: string, next: string) => void;
}) {
  const subfields: { sub: string; label: string; placeholder: string }[] = [
    { sub: "name", label: "Print Name", placeholder: "Jane Doe" },
    { sub: "title", label: "Title", placeholder: "VP of Engineering" },
    { sub: "company", label: "Company", placeholder: "Acme, Inc." },
    { sub: "noticeAddress", label: "Notice Address", placeholder: "legal@acme.com" },
  ];
  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>{role.label}</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {subfields.map(({ sub, label, placeholder }) => (
          <label key={sub}>
            <span className={labelClass}>{label}</span>
            <input
              className={inputClass}
              value={value[`${role.id}.${sub}`] ?? ""}
              onChange={(e) => onSet(`${role.id}.${sub}`, e.target.value)}
              placeholder={placeholder}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function TermField({
  field,
  value,
  onSet,
}: {
  field: FieldDefinition;
  value: DocumentFormData;
  onSet: (key: string, next: string) => void;
}) {
  const activeVariant = value[`${field.id}.variant`];
  const years = value[`${field.id}.years`] || "1";
  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>{field.label}</legend>
      {(field.variants ?? []).map((variant) => (
        <label key={variant.id} className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={activeVariant === variant.id}
            onChange={() => onSet(`${field.id}.variant`, variant.id)}
          />
          {variant.label}
          {variant.hasYears && (
            <>
              <input
                type="number"
                min={1}
                className={`${inputClass} w-20`}
                disabled={activeVariant !== variant.id}
                value={years}
                onChange={(e) =>
                  onSet(`${field.id}.years`, String(Math.max(1, Number(e.target.value) || 1)))
                }
              />
              year(s)
            </>
          )}
        </label>
      ))}
    </fieldset>
  );
}

function SimpleField({
  field,
  value,
  onSet,
}: {
  field: FieldDefinition;
  value: DocumentFormData;
  onSet: (key: string, next: string) => void;
}) {
  const current = value[field.id] ?? "";
  return (
    <label className="block">
      <span className={labelClass}>{field.label}</span>
      {field.kind === "choice" ? (
        <select
          className={inputClass}
          value={current}
          onChange={(e) => onSet(field.id, e.target.value)}
        >
          <option value="">—</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.multiline ? (
        <textarea
          className={inputClass}
          rows={2}
          value={current}
          onChange={(e) => onSet(field.id, e.target.value)}
          placeholder={field.guidance}
        />
      ) : (
        <input
          type={field.kind === "date" ? "date" : "text"}
          className={inputClass}
          value={current}
          onChange={(e) => onSet(field.id, e.target.value)}
          placeholder={field.kind === "date" ? undefined : field.guidance}
        />
      )}
    </label>
  );
}

export default function DocumentForm({ definition, value, onChange }: DocumentFormProps) {
  const onSet = (key: string, next: string) => onChange({ ...value, [key]: next });
  const termFields = definition.fields.filter((field) => field.kind === "term");
  const simpleFields = definition.fields.filter((field) => field.kind !== "term");

  return (
    <div className="space-y-4">
      {definition.roles.map((role) => (
        <PartyFields key={role.id} role={role} value={value} onSet={onSet} />
      ))}
      {termFields.map((field) => (
        <TermField key={field.id} field={field} value={value} onSet={onSet} />
      ))}
      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Key Terms</legend>
        {simpleFields.map((field) => (
          <SimpleField key={field.id} field={field} value={value} onSet={onSet} />
        ))}
      </fieldset>
    </div>
  );
}
