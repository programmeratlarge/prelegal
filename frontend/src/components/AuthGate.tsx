"use client";

import { useEffect, useState } from "react";
import { AuthUser, me } from "@/lib/authClient";
import { AuthUserContext } from "@/lib/authContext";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    me()
      .then((authUser) => {
        if (!cancelled) setUser(authUser);
      })
      .catch(() => {
        // Treat any failure (401, network error, backend unavailable) the
        // same way: send the user to the login page rather than leaving
        // them stuck on the loading state indefinitely.
        if (!cancelled) window.location.href = "/login/";
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (user === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-brand-gray">
        Loading…
      </div>
    );
  }

  return <AuthUserContext.Provider value={user}>{children}</AuthUserContext.Provider>;
}
