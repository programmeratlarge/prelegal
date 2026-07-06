import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // page.tsx reads ../templates/*.md via fs at request time. Next.js can't
  // statically detect that dynamic path, so it must be traced explicitly to
  // end up in the deployed server bundle. The tracing root is moved up to the
  // repo root so the templates/ glob (a sibling of frontend/) stays inside it.
  outputFileTracingRoot: path.join(__dirname, ".."),
  outputFileTracingIncludes: {
    "/": ["templates/**/*"],
  },
};

export default nextConfig;
