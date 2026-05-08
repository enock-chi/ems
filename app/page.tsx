"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, AuthUser, UserRole } from "@/context/auth-context";

const inputClass =
  "w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition";

const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5";

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const { login, user, hydrating } = useAuth();

  // Redirect already-logged-in users away from the login page
  useEffect(() => {
    if (hydrating) return;
    if (user?.role === "hr") router.replace("/hr");
    else if (user?.role === "applicant") router.replace("/applicant");
  }, [user, hydrating, router]);

  const [mode, setMode] = useState<"login" | "register">("login");

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [regRole, setRegRole] = useState<UserRole | null>(null);
  const [regFirstname, setRegFirstname] = useState("");
  const [regLastname, setRegLastname] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regContact, setRegContact] = useState("");
  const [regIdNumber, setRegIdNumber] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: "login" | "register") {
    setError(null);
    if (next === "register") {
      setRegRole("applicant");
      setRegFirstname("");
      setRegLastname("");
      setRegEmail("");
      setRegContact("");
      setRegIdNumber("");
      setRegPassword("");
      setRegConfirm("");
    } else {
      setRegRole(null);
    }
    setMode(next);
  }

  function pickRole(role: UserRole) {
    setRegRole(role);
    setRegFirstname("");
    setRegLastname("");
    setRegEmail("");
    setRegContact("");
    setRegIdNumber("");
    setRegPassword("");
    setRegConfirm("");
    setError(null);
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { error?: string; id?: string; name?: string; email?: string; role?: UserRole; identification?: string };
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      const user: AuthUser = { id: data.id!, name: data.name!, email: data.email!, role: data.role!, identification: data.identification };
      login(user);
      router.push(data.role === "hr" ? "/hr" : "/applicant");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!regRole) return;
    if (regPassword !== regConfirm) { setError("Passwords do not match."); return; }
    if (regPassword.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: regRole,
          firstname: regFirstname,
          lastname: regLastname,
          email: regEmail,
          contact: regContact,
          idNumber: regIdNumber,
          password: regPassword,
        }),
      });
      const data = await res.json() as { error?: string; id?: string; name?: string; email?: string; role?: UserRole; identification?: string };
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      const user: AuthUser = { id: data.id!, name: data.name!, email: data.email!, role: data.role!, identification: data.identification };
      login(user);
      router.push(data.role === "hr" ? "/hr" : "/applicant");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-600 text-white text-2xl font-bold mb-4">
            EMS
          </span>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {mode === "login" ? "Sign in to your account" : "Create an account"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Emergency Medical Services Recruitment Portal
          </p>
        </div>

        <div className="flex rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-1 mb-6">
          <button type="button" onClick={() => switchMode("login")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}>
            Sign in
          </button>
          <button type="button" onClick={() => switchMode("register")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === "register"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}>
            Create account
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 px-8 py-10">

          {mode === "login" && (
            <form onSubmit={handleLogin} noValidate className="space-y-5">
              <div>
                <label htmlFor="email" className={labelClass}>Email address</label>
                <input id="email" type="email" autoComplete="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
              </div>
              <div>
                <label htmlFor="password" className={labelClass}>Password</label>
                <input id="password" type="password" autoComplete="current-password" required value={password}
                  onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
              </div>
              {error && <p className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-red-700 dark:text-red-400">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors">
                {loading ? <><Spinner /> Signing in…</> : "Sign in"}
              </button>
            </form>
          )}

          {mode === "register" && (
            <div className="space-y-6">
              <form onSubmit={handleRegister} noValidate className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="reg-firstname" className={labelClass}>First name</label>
                      <input id="reg-firstname" type="text" autoComplete="given-name" required value={regFirstname}
                        onChange={(e) => setRegFirstname(e.target.value)} className={inputClass} placeholder="Jane" />
                    </div>
                    <div>
                      <label htmlFor="reg-lastname" className={labelClass}>Last name</label>
                      <input id="reg-lastname" type="text" autoComplete="family-name" required value={regLastname}
                        onChange={(e) => setRegLastname(e.target.value)} className={inputClass} placeholder="Smith" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="reg-email" className={labelClass}>Email address</label>
                    <input id="reg-email" type="email" autoComplete="email" required value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
                  </div>
                  <div>
                    <label htmlFor="reg-contact" className={labelClass}>Contact number</label>
                    <input id="reg-contact" type="tel" autoComplete="tel" required value={regContact}
                      onChange={(e) => setRegContact(e.target.value)} className={inputClass} placeholder="+27 82 000 0000" />
                  </div>
                  <div>
                    <label htmlFor="reg-id" className={labelClass}>National ID</label>
                    <input id="reg-id" type="text" required value={regIdNumber}
                      onChange={(e) => setRegIdNumber(e.target.value)} className={inputClass}
                      placeholder="ID number" />
                  </div>
                  <div>
                    <label htmlFor="reg-password" className={labelClass}>Password</label>
                    <input id="reg-password" type="password" autoComplete="new-password" required value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)} className={inputClass} placeholder="Min. 8 characters" />
                  </div>
                  <div>
                    <label htmlFor="reg-confirm" className={labelClass}>Confirm password</label>
                    <input id="reg-confirm" type="password" autoComplete="new-password" required value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)} className={inputClass} placeholder="••••••••" />
                  </div>
                  {error && <p className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-red-700 dark:text-red-400">{error}</p>}
                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors">
                    {loading ? <><Spinner /> Creating account…</> : "Create account"}
                  </button>
                </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
