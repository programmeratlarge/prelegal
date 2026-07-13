#!/usr/bin/env node
// Dev-only authoring aid: prints each template's deduped <span class="*_link">
// labels (possessives normalized away) with occurrence counts, to bootstrap
// and audit registry/documents.json. Not part of the app or the build.
//
// Usage: node scripts/extract-template-fields.mjs [template.md ...]

import fs from "node:fs";
import path from "node:path";

const repoRoot = path.join(import.meta.dirname, "..");
const templatesDir = path.join(repoRoot, "templates");

const SPAN_RE =
  /<span class="(coverpage_link|orderform_link|keyterms_link|sow_link|businessterms_link)"(?:\s+id="[^"]*")?>(.*?)<\/span>/g;

function normalizeLabel(raw) {
  const straight = raw.replace(/’/g, "'").trim();
  return straight.endsWith("'s") ? straight.slice(0, -2) : straight;
}

const files =
  process.argv.length > 2
    ? process.argv.slice(2)
    : fs.readdirSync(templatesDir).filter((f) => f.endsWith(".md"));

for (const file of files) {
  const text = fs.readFileSync(path.join(templatesDir, path.basename(file)), "utf8");
  const counts = new Map();
  for (const match of text.matchAll(SPAN_RE)) {
    const key = `${match[1]} :: ${normalizeLabel(match[2])}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  console.log(`\n=== ${path.basename(file)} ===`);
  for (const [key, count] of [...counts.entries()].sort()) {
    console.log(`  ${key}  (x${count})`);
  }
}
