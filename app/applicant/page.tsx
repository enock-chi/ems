"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function ApplicantDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/");
    } else if (user.role !== "applicant") {
      router.replace("/hr");
    }
  }, [user, router]);

  if (!user || user.role !== "applicant") return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            My Applications
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Welcome back, {user.name}</p>
        </div>
        <button
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Sign out
        </button>
      </header>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-zinc-400">
        Applicant content coming soon.
      </div>
    </div>
  );
}