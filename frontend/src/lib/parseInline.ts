export type InlineSegment =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "link"; text: string; href: string }
  | { type: "filled"; value: string };

// Private-use-area delimiters are used (rather than a plain marker string) so a
// user-entered value containing "**" or "[...]" can never be misread as markdown.
export const FILL_START = "";
export const FILL_END = "";

export function markFilled(value: string): string {
  return `${FILL_START}${value}${FILL_END}`;
}

const INLINE_RE = /(.*?)|\*\*(.*?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;

/** Splits a string containing our "filled value" markers, **bold**, and [text](links) into renderable segments. */
export function parseInline(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, index) });
    }

    if (match[1] !== undefined) {
      segments.push({ type: "filled", value: match[1] });
    } else if (match[2] !== undefined) {
      segments.push({ type: "bold", value: match[2] });
    } else if (match[3] !== undefined && match[4] !== undefined) {
      segments.push({ type: "link", text: match[3], href: match[4] });
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
}
