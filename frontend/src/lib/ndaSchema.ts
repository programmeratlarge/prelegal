export interface PartyInfo {
  name: string;
  title: string;
  company: string;
  noticeAddress: string;
}

export type MndaTermChoice =
  | { type: "expires"; years: number }
  | { type: "untilTerminated" };

export type ConfidentialityTermChoice =
  | { type: "years"; years: number }
  | { type: "perpetuity" };

export interface NdaFormData {
  purpose: string;
  effectiveDate: string; // yyyy-mm-dd
  mndaTerm: MndaTermChoice;
  confidentialityTerm: ConfidentialityTermChoice;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: PartyInfo;
  party2: PartyInfo;
}

export function emptyParty(): PartyInfo {
  return { name: "", title: "", company: "", noticeAddress: "" };
}

export function defaultNdaFormData(): NdaFormData {
  return {
    purpose: "Evaluating whether to enter into a business relationship with the other party.",
    effectiveDate: new Date().toISOString().slice(0, 10),
    mndaTerm: { type: "expires", years: 1 },
    confidentialityTerm: { type: "years", years: 1 },
    governingLaw: "",
    jurisdiction: "",
    modifications: "",
    party1: emptyParty(),
    party2: emptyParty(),
  };
}
