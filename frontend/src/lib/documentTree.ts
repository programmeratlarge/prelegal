/**
 * Parses a template's markdown body into a tree of nested sections.
 *
 * Handles both template shapes in templates/:
 * - the NDA's flat clauses:        `1. **Title**. body...`
 * - the nested Common Paper docs:  `1. <span class="header_2" id="1">Title</span>`
 *                                  `    1. <span class="header_3" id="1.1">Title.</span> body`
 *                                  `        a. deeper prose...`
 * Nesting is indentation-based (4 spaces per level); marker style (1/a/i) is
 * display-only. Any non-list, non-title trailing line (the NDA's Common Paper
 * credit) is collected as attribution.
 */

export interface DocumentSection {
  /** Stable render key, e.g. "0", "0.1", "0.1.2" (positional). */
  key: string;
  /** The list marker as written: "1", "a", "i", ... */
  marker: string;
  depth: number;
  heading: string | null;
  /** Raw remaining markdown; may contain **bold**, [links](url), and *_link spans. */
  body: string;
  children: DocumentSection[];
}

export interface ParsedDocument {
  sections: DocumentSection[];
  attribution: string[];
}

const LIST_ITEM_RE = /^(\s*)([0-9]+|[a-z]+)\.\s+(.*)$/;
const HEADER_SPAN_RE = /^<span class="header_[23]"(?:\s+id="[^"]*")?>(.*?)<\/span>\s*/;
const BOLD_HEADING_RE = /^\*\*(.+?)\*\*\.\s*/;

function splitHeading(text: string): { heading: string | null; body: string } {
  const headerMatch = text.match(HEADER_SPAN_RE);
  if (headerMatch) {
    return {
      heading: headerMatch[1].replace(/\.\s*$/, ""),
      body: text.slice(headerMatch[0].length),
    };
  }
  const boldMatch = text.match(BOLD_HEADING_RE);
  if (boldMatch) {
    return { heading: boldMatch[1], body: text.slice(boldMatch[0].length) };
  }
  return { heading: null, body: text };
}

export function parseDocumentBody(markdown: string): ParsedDocument {
  const sections: DocumentSection[] = [];
  const attribution: string[] = [];
  // Stack of the most recent section at each depth.
  const stack: DocumentSection[] = [];

  for (const line of markdown.split(/\r\n|\r|\n/)) {
    if (!line.trim() || line.startsWith("#")) continue;

    const match = line.match(LIST_ITEM_RE);
    if (!match) {
      attribution.push(line.trim());
      continue;
    }

    const depth = Math.floor(match[1].length / 4);
    const { heading, body } = splitHeading(match[3].trim());
    const siblings = depth === 0 ? sections : (stack[depth - 1]?.children ?? sections);
    const section: DocumentSection = {
      key: depth === 0 ? String(sections.length) : `${stack[depth - 1].key}.${siblings.length}`,
      marker: match[2],
      depth,
      heading,
      body,
      children: [],
    };
    siblings.push(section);
    stack[depth] = section;
    stack.length = depth + 1;
  }

  return { sections, attribution };
}
