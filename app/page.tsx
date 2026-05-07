"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { compare, hash } from "bcryptjs";
import { hygraph } from "@/lib/hygraph";
import { GET_AUTH_BY_EMAIL, CREATE_AUTH, PUBLISH_AUTH } from "@/lib/queries";
import { useAuth, AuthUser, UserRole } from "@/context/auth-context";

interface AuthRecord {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  passwordHash: string;
  hr: boolean;
  applicant: boolean;
}
interface AuthResult {
  auth: AuthRecord | null;
}
interface CreateAuthResult {
  createAuth: { id: string; firstname: string; lastname: string; email: string };
}

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
  const { login } = useAuth();

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
    setRegRole(null);
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
      const { auth } = await hygraph.request<AuthResult>(GET_AUTH_BY_EMAIL, {
        email: email.toLowerCase().trim(),
      });
      if (!auth) { setError("No account found with that email address."); return; }
      const valid = await compare(password, auth.passwordHash);
      if (!valid) { setError("Incorrect password."); return; }
      const role: UserRole = auth.hr ? "hr" : "applicant";
      const user: AuthUser = { id: auth.id, name: `${auth.firstname} ${auth.lastname}`, email: auth.email, role };
      login(user);
      router.push(role === "hr" ? "/hr" : "/applicant");
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
      const normalizedEmail = regEmail.toLowerCase().trim();
      const existing = await hygraph.request<AuthResult>(GET_AUTH_BY_EMAIL, { email: normalizedEmail });
      if (existing.auth) { setError("An account with that email already exists."); return; }

      const passwordHash = await hash(regPassword, 10);

      const result = await hygraph.request<CreateAuthResult>(CREATE_AUTH, {
        firstname: regFirstname.trim(),
        lastname: regLastname.trim(),
        email: normalizedEmail,
        passwordHash,
        contact: regContact.trim(),
        empid: regRole === "hr" ? regIdNumber.trim() : null,
        identification: regRole === "applicant" ? regIdNumber.trim() : null,
        hr: regRole === "hr",
        applicant: regRole === "applicant",
      });

      await hygraph.request(PUBLISH_AUTH, { id: result.createAuth.id });

      const user: AuthUser = {
        id: result.createAuth.id,
        name: `${result.createAuth.firstname} ${result.createAuth.lastname}`,
        email: result.createAuth.email,
        role: regRole,
      };
      login(user);
      router.push(regRole === "hr" ? "/hr" : "/applicant");
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
              <div>
                <p className={labelClass}>I am registering as</p>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button type="button" onClick={() => pickRole("applicant")}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 text-sm font-medium transition-all ${
                      regRole === "applicant"
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500"
                    }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Applicant
                  </button>
                  <button type="button" onClick={() => pickRole("hr")}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 text-sm font-medium transition-all ${
                      regRole === "hr"
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500"
                    }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    HR Staff
                  </button>
                </div>
              </div>

              {regRole !== null && (
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
                    <label htmlFor="reg-id" className={labelClass}>
                      {regRole === "hr" ? "Employee ID" : "National ID"}
                    </label>
                    <input id="reg-id" type="text" required value={regIdNumber}
                      onChange={(e) => setRegIdNumber(e.target.value)} className={inputClass}
                      placeholder={regRole === "hr" ? "EMP-00000" : "ID number"} />
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
