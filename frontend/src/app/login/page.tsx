import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-100 py-10">
      <LoginForm />
    </main>
  );
}
