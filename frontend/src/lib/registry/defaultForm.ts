import { DocumentDefinition, DocumentFormData, PARTY_SUBFIELDS } from "./types";

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
  for (const key of Object.keys(form)) {
    if (oldForm[key]) form[key] = oldForm[key];
  }
  return form;
}
