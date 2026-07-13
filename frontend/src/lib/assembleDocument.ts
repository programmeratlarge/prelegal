/**
 * Combines form input with a parsed template, resolving each *_link span to
 * the value the user entered so the generated document reads as a complete,
 * self-contained agreement (generalized successor to assembleNda).
 */

import { DocumentSection, ParsedDocument } from "./documentTree";
import { InlineSegment, parseInline } from "./parseInline";
import {
  buildSpanBindings,
  formatFieldValue,
  formatPartyName,
  resolveFieldSpans,
} from "./resolveFieldSpans";
import {
  DocumentDefinition,
  DocumentFormData,
  PARTY_SUBFIELDS,
  PartySubfield,
} from "./registry/types";

export interface AssembledSection {
  key: string;
  marker: string;
  depth: number;
  heading: string | null;
  segments: InlineSegment[];
  children: AssembledSection[];
}

export interface AssembledParty {
  label: string;
  values: Record<PartySubfield, string>;
}

export interface AssembledDocument {
  title: string;
  coverFields: { id: string; label: string; value: string }[];
  parties: AssembledParty[];
  sections: AssembledSection[];
  attribution: string;
}

export function assembleDocument(
  definition: DocumentDefinition,
  form: DocumentFormData,
  parsed: ParsedDocument
): AssembledDocument {
  const bindings = buildSpanBindings(definition);

  const assembleSection = (section: DocumentSection): AssembledSection => ({
    key: section.key,
    marker: section.marker,
    depth: section.depth,
    heading: section.heading,
    segments: parseInline(resolveFieldSpans(section.body, bindings, form)),
    children: section.children.map(assembleSection),
  });

  return {
    title: definition.title,
    coverFields: definition.fields.map((field) => ({
      id: field.id,
      label: field.label,
      value: formatFieldValue(field, form),
    })),
    parties: definition.roles.map((role) => ({
      label: role.label,
      values: Object.fromEntries(
        PARTY_SUBFIELDS.map((sub) => [sub, form[`${role.id}.${sub}`] ?? ""])
      ) as Record<PartySubfield, string>,
    })),
    sections: parsed.sections.map(assembleSection),
    attribution:
      parsed.attribution.join(" ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") ||
      `${definition.attribution} free to use under CC BY 4.0.`,
  };
}

export { formatPartyName };
