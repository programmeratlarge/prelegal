/**
 * Substitutes every `*_link` span in a section body with the user's value
 * for that field/party, as a text-level pre-pass before parseInline — the
 * same substitute-then-parse flow assembleNda used, generalized to all five
 * span classes and driven by the registry instead of a hardcoded label map.
 */

import { markFilled } from "./parseInline";
import {
  DocumentDefinition,
  DocumentFormData,
  FieldDefinition,
  PartyRole,
} from "./registry/types";

const FIELD_SPAN_RE =
  /<span class="(?:coverpage_link|orderform_link|keyterms_link|sow_link|businessterms_link)"(?:\s+id="[^"]*")?>(.*?)<\/span>/g;

// Anchor-only spans (no class), e.g. `<span id="5.3.a">if</span>`: unwrap.
const ANCHOR_SPAN_RE = /<span id="[^"]*">(.*?)<\/span>/g;

/**
 * Templates write possessives inconsistently — sometimes inside the span
 * ("Customer's", straight or curly apostrophe), sometimes outside. Bindings
 * are keyed on the possessive-stripped label. Mirrors normalize_label in
 * backend/tests/test_registry.py.
 */
export function normalizeSpanLabel(raw: string): { canonical: string; possessive: boolean } {
  const straight = raw.replace(/’/g, "'").trim();
  const possessive = straight.endsWith("'s");
  return { canonical: possessive ? straight.slice(0, -2) : straight, possessive };
}

type Binding = { kind: "role"; role: PartyRole } | { kind: "field"; field: FieldDefinition };

export function buildSpanBindings(definition: DocumentDefinition): Map<string, Binding> {
  const bindings = new Map<string, Binding>();
  for (const role of definition.roles) {
    for (const label of role.spanLabels) bindings.set(label, { kind: "role", role });
  }
  for (const field of definition.fields) {
    for (const label of field.spanLabels) bindings.set(label, { kind: "field", field });
  }
  return bindings;
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function pluralYears(years: string): string {
  const n = Number(years) || 1;
  return `${n} year${n === 1 ? "" : "s"}`;
}

function formatTerm(field: FieldDefinition, form: DocumentFormData): string {
  const variantId = form[`${field.id}.variant`];
  const variant = field.variants?.find((v) => v.id === variantId);
  if (!variant) return "";
  return variant.template.replace("{years}", pluralYears(form[`${field.id}.years`]));
}

/** The display value for a field, or "" when unset. */
export function formatFieldValue(field: FieldDefinition, form: DocumentFormData): string {
  if (field.kind === "term") return formatTerm(field, form);
  if (field.kind === "date") return formatDate(form[field.id] ?? "");
  return (form[field.id] ?? "").trim();
}

/** The display name for a party: company, else signer name, or "" when unset. */
export function formatPartyName(role: PartyRole, form: DocumentFormData): string {
  return (form[`${role.id}.company`] || form[`${role.id}.name`] || "").trim();
}

export function resolveFieldSpans(
  body: string,
  bindings: Map<string, Binding>,
  form: DocumentFormData
): string {
  return body
    .replace(FIELD_SPAN_RE, (_match, inner: string) => {
      const { canonical, possessive } = normalizeSpanLabel(inner);
      const binding = bindings.get(canonical);
      if (!binding) return markFilled(inner);
      const value =
        binding.kind === "role"
          ? formatPartyName(binding.role, form)
          : formatFieldValue(binding.field, form);
      if (!value) return markFilled(`[${canonical}]`);
      return markFilled(possessive ? `${value}’s` : value);
    })
    .replace(ANCHOR_SPAN_RE, "$1");
}
