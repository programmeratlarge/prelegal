import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import AuthGate from "@/components/AuthGate";
import MyDocumentsList from "@/components/MyDocumentsList";

export const metadata: Metadata = {
  title: "My documents",
};

export default function DocumentsPage() {
  return (
    <AuthGate>
      <AppShell>
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="mb-4 text-xl font-bold text-brand-navy">My documents</h1>
          <MyDocumentsList />
        </div>
      </AppShell>
    </AuthGate>
  );
}
