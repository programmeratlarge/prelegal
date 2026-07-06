import fs from "node:fs";
import path from "node:path";

const TEMPLATES_DIR = path.join(process.cwd(), "..", "templates");

export function loadTemplateFile(filename: string): string {
  return fs.readFileSync(path.join(TEMPLATES_DIR, filename), "utf-8");
}
