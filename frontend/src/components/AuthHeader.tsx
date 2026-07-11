"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signout } from "@/lib/authClient";

export default function AuthHeader() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignout() {
    setSigningOut(true);
    try {
      await signout();
    } finally {
      router.replace("/login/");
    }
  }

  return (
    <div className="mx-auto mb-4 flex max-w-6xl justify-end px-4">
      <button
        type="button"
        onClick={handleSignout}
        disabled={signingOut}
        className="text-sm font-medium text-[#209dd7] hover:underline disabled:opacity-60"
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
