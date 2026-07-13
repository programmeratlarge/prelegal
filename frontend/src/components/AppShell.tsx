"use client";

import { useState } from "react";
import { signout } from "@/lib/authClient";
import { useAuthUser } from "@/lib/authContext";
import BrandMark from "./BrandMark";

/**
 * Shared chrome for authenticated pages: header (wordmark, nav, account)
 * over the page content. Plain anchors on purpose — hard navigation is the
 * app-wide pattern so pages always remount and re-read their query string.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const user = useAuthUser();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignout() {
    setSigningOut(true);
    try {
      await signout();
    } finally {
      window.location.href = "/login/";
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <a href="/" aria-label="Prelegal home">
              <BrandMark />
            </a>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <a href="/" className="text-brand-navy hover:text-brand-blue">
                New document
              </a>
              <a href="/documents/" className="text-brand-navy hover:text-brand-blue">
                My documents
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {user && <span className="hidden text-brand-gray sm:inline">{user.email}</span>}
            <button
              type="button"
              onClick={handleSignout}
              disabled={signingOut}
              className="font-medium text-brand-blue hover:underline disabled:opacity-60"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 py-8">{children}</main>
    </div>
  );
}
