import { DocumentDefinition, DocumentFormData, FieldDefinition, PARTY_SUBFIELDS } from "./types";

function termDefault(value: string | undefined, firstVariant: string): [string, string] {
  if (value && value.includes(":")) {
    const [variant, years] = value.split(":");
    return [variant, years];
  }
  return [firstVariant, "1"];
}

/**
 * Full flat form with every key present (empty string = unset). Must mirror
 * DocumentDefinition.default_form() in backend/app/registry/models.py.
 */
export function defaultFormData(definition: DocumentDefinition): DocumentFormData {
  const form: DocumentFormData = {};
  for (const role of definition.roles) {
    for (const sub of PARTY_SUBFIELDS) {
      form[`${role.id}.${sub}`] = "";
    }
  }
  for (const field of definition.fields) {
    if (field.kind === "term") {
      const [variant, years] = termDefault(field.default, field.variants?.[0]?.id ?? "");
      form[`${field.id}.variant`] = variant;
      form[`${field.id}.years`] = years;
    } else if (field.default === "$today") {
      form[field.id] = new Date().toISOString().slice(0, 10);
    } else {
      form[field.id] = field.default ?? "";
    }
  }
  return form;
}

function validForField(field: FieldDefinition, key: string, value: string): boolean {
  if (field.kind === "date") return /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (field.kind === "choice") return (field.options ?? []).includes(value);
  if (field.kind === "term") {
    if (key.endsWith(".variant")) return (field.variants ?? []).some((v) => v.id === value);
    return /^\d+$/.test(value) && Number(value) >= 1;
  }
  return true;
}

/**
 * Start a switched-to document from its defaults, keeping any values the old
 * form already collected under the same key (party info, shared field ids).
 * Mirrors carry_over() in backend/app/form_merge.py.
 */
export function carryOverFields(
  oldForm: DocumentFormData,
  target: DocumentDefinition
): DocumentFormData {
  const form = defaultFormData(target);
  const fieldsByKey = new Map<string, FieldDefinition>();
  for (const field of target.fields) {
    const keys =
      field.kind === "term" ? [`${field.id}.variant`, `${field.id}.years`] : [field.id];
    for (const key of keys) fieldsByKey.set(key, field);
  }
  for (const key of Object.keys(form)) {
    const value = oldForm[key];
    const field = fieldsByKey.get(key);
    if (value && (!field || validForField(field, key, value))) form[key] = value;
  }
  return form;
}
