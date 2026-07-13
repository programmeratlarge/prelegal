/**
 * TS mirror of backend/app/registry/models.py — both describe the shape of
 * registry/documents.json, the single source of truth for every supported
 * document type.
 *
 * Forms are flat string maps on the wire. A field's form keys are:
 * - text/date/money/choice: the field id itself, e.g. "governingLaw"
 * - term: "<id>.variant" and "<id>.years"
 * - party roles: "<roleId>.name", ".title", ".company", ".noticeAddress"
 */

export type FieldKind = "text" | "date" | "money" | "choice" | "term";

export const PARTY_SUBFIELDS = ["name", "title", "company", "noticeAddress"] as const;
export type PartySubfield = (typeof PARTY_SUBFIELDS)[number];

export interface TermVariant {
  id: string;
  label: string;
  hasYears: boolean;
  template: string;
}

export interface FieldDefinition {
  id: string;
  kind: FieldKind;
  label: string;
  guidance: string;
  spanLabels: string[];
  multiline?: boolean;
  default?: string;
  options?: string[];
  variants?: TermVariant[];
}

export interface PartyRole {
  id: string;
  label: string;
  spanLabels: string[];
}

export interface DocumentDefinition {
  id: string;
  title: string;
  description: string;
  templateFile: string;
  attribution: string;
  roles: PartyRole[];
  fields: FieldDefinition[];
}

export type DocumentFormData = Record<string, string>;
