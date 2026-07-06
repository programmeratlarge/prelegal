export interface StandardTermsSection {
  number: number;
  title: string;
  /** Raw section text; may contain **bold**, [text](url) links, and <span class="coverpage_link">Label</span> markers. */
  body: string;
}

const SECTION_LINE_RE = /^(\d+)\.\s+\*\*(.+?)\*\*\.\s*(.*)$/;

/**
 * The Common Paper standard terms file lays out each numbered clause as a
 * single line ("1. **Title**. body..."). This parses those lines into
 * structured sections so the app can render and substitute cover-page
 * cross-references without hand-copying the legal text.
 */
export function parseStandardTerms(markdown: string): StandardTermsSection[] {
  return markdown
    .split(/\r\n|\r|\n/)
    .map((line) => line.match(SECTION_LINE_RE))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map((match) => ({
      number: Number(match[1]),
      title: match[2].trim(),
      body: match[3].trim(),
    }));
}
