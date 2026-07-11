import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The app is built as a static export and served by the FastAPI backend
  // (see backend/app/main.py). page.tsx's fs read of ../templates/*.md only
  // runs at `next build` time, so it's compatible with a static export.
  output: "export",
  // Emit out/login/index.html instead of out/login.html so FastAPI's
  // StaticFiles(html=True) mount can resolve "/login/" without custom
  // fallback routing.
  trailingSlash: true,
};

export default nextConfig;
