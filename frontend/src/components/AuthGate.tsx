"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { me } from "@/lib/authClient";

type Status = "loading" | "authenticated" | "unauthenticated";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    me()
      .then(() => {
        if (cancelled) return;
        setStatus("authenticated");
      })
      .catch(() => {
        // Treat any failure (401, network error, backend unavailable) the
        // same way: send the user to the login page rather than leaving
        // them stuck on the loading state indefinitely.
        if (cancelled) return;
        setStatus("unauthenticated");
        router.replace("/login/");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-[#888888]">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
