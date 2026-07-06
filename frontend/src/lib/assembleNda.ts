import { InlineSegment, markFilled, parseInline } from "./parseInline";
import { StandardTermsSection } from "./parseStandardTerms";
import {
  ConfidentialityTermChoice,
  MndaTermChoice,
  NdaFormData,
  PartyInfo,
} from "./ndaSchema";

export interface AssembledSection {
  number: number;
  title: string;
  segments: InlineSegment[];
}

export interface AssembledNda {
  purpose: string;
  effectiveDateLabel: string;
  mndaTermLabel: string;
  confidentialityTermLabel: string;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: PartyInfo;
  party2: PartyInfo;
  standardTerms: AssembledSection[];
}

function formatDate(iso: string): string {
  if (!iso) return "[Today's date]";
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "[Today's date]";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function pluralYears(years: number): string {
  return `${years} year${years === 1 ? "" : "s"}`;
}

function formatMndaTerm(choice: MndaTermChoice): string {
  return choice.type === "expires"
    ? `Expires ${pluralYears(choice.years)} from the Effective Date.`
    : "Continues until terminated in accordance with the terms of the MNDA.";
}

function formatConfidentialityTerm(choice: ConfidentialityTermChoice): string {
  return choice.type === "years"
    ? `${pluralYears(choice.years)} from the Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`
    : "In perpetuity.";
}

const COVERPAGE_LINK_RE = /<span class="coverpage_link">(.*?)<\/span>/g;

/**
 * Combines form input with the parsed Standard Terms, resolving each
 * `coverpage_link` cross-reference to the actual value the user entered so
 * the generated document reads as a complete, self-contained agreement.
 */
export function assembleNda(
  form: NdaFormData,
  sections: StandardTermsSection[]
): AssembledNda {
  const effectiveDateLabel = formatDate(form.effectiveDate);
  const mndaTermLabel = formatMndaTerm(form.mndaTerm);
  const confidentialityTermLabel = formatConfidentialityTerm(form.confidentialityTerm);

  const replacements: Record<string, string> = {
    Purpose: form.purpose.trim() || "[Purpose not specified]",
    "Effective Date": effectiveDateLabel,
    "MNDA Term": mndaTermLabel,
    "Term of Confidentiality": confidentialityTermLabel,
    "Governing Law": form.governingLaw.trim() || "[Governing law not specified]",
    Jurisdiction: form.jurisdiction.trim() || "[Jurisdiction not specified]",
  };

  const standardTerms: AssembledSection[] = sections.map((section) => {
    const substituted = section.body.replace(COVERPAGE_LINK_RE, (_match, label: string) => {
      const value = replacements[label.trim()];
      return markFilled(value ?? label);
    });

    return {
      number: section.number,
      title: section.title,
      segments: parseInline(substituted),
    };
  });

  return {
    purpose: form.purpose,
    effectiveDateLabel,
    mndaTermLabel,
    confidentialityTermLabel,
    governingLaw: form.governingLaw,
    jurisdiction: form.jurisdiction,
    modifications: form.modifications,
    party1: form.party1,
    party2: form.party2,
    standardTerms,
  };
}
