"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setPosting as reduxSetPosting, clearDraft } from "@/store/applySlice";
import type { Posting } from "@/store/types";

const STORAGE_KEY = "ems_apply_posting";
const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");

const inputClass =
  "w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition";

// ─── File Drop Zone ────────────────────────────────────────────────────────────
function FileZone({
  label,
  hint,
  accept,
  multiple,
  files,
  onChange,
}: {
  label: string;
  hint: string;
  accept: string;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return;
    const arr = Array.from(incoming);
    onChange(multiple ? [...files, ...arr] : arr);
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragging
            ? "border-red-400 bg-red-50 dark:bg-red-900/20"
            : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <span className="font-medium text-red-600 dark:text-red-400">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{hint}</p>
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden"
          onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {files.length > 0 && (
        <ul className="space-y-1.5 mt-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate">{f.name}</span>
                <span className="text-xs text-zinc-400 shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
              </div>
              <button type="button" onClick={() => removeFile(i)}
                className="ml-2 shrink-0 text-zinc-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ApplyPage() {
  const { user, hydrating, logout } = useAuth();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { posting } = useAppSelector((s) => s.apply);

  // File state — File objects cannot be serialized, these always reset on refresh
  const [cvFiles, setCvFiles] = useState<File[]>([]);
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (hydrating) return;
    if (!user) { router.replace("/"); return; }
    if (user.role !== "applicant") { router.replace("/hr"); return; }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // No posting selected — only redirect if Redux draft is also empty
        if (!posting) { router.replace("/applicant"); return; }
        return;
      }
      const p = JSON.parse(raw) as Posting;
      // Always dispatch so Redux is the source of truth (handles refresh)
      dispatch(reduxSetPosting(p));
    } catch {
      router.replace("/applicant");
    }
  }, [user, hydrating, router]);

  if (!user || user.role !== "applicant" || !posting) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 text-center space-y-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Application submitted</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Thank you for applying for <span className="font-medium text-zinc-700 dark:text-zinc-300">{posting?.title}</span>.
            We will be in touch if your application is successful.
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
            <span className="font-semibold text-red-600 dark:text-red-400">Please Note: </span>
            Due to the large number of applications we envisage receiving, applications will not be acknowledged.
            If you do not receive any response within 3 months, please accept that your application was not successful.
          </p>
          <button onClick={() => router.push("/applicant")}
            className="mt-2 w-full rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors">
            Back to positions
          </button>
        </div>
      </div>
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user || !posting) return;
    if (cvFiles.length === 0) { setError("Please upload your CV."); return; }

    const [firstName, ...rest] = (user.name ?? "").trim().split(" ");
    const lastName = rest.join(" ") || firstName;

    setSubmitting(true);

    (async () => {
      try {
        const form = new FormData();
        form.append("user_id", String(user.id));
        form.append("posting_id", String(posting.id));
        form.append("ref_number", posting.ref_code);
        form.append("firstname", firstName);
        form.append("lastname", lastName);
        form.append("identification", user.identification ?? "");
        form.append("cv", cvFiles[0]);
        if (supportingFiles[0]) form.append("docs", supportingFiles[0]);

        const res = await fetch(`${BACKEND_URL}/applications`, {
          method: "POST",
          headers: { "ngrok-skip-browser-warning": "true" },
          body: form,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(data.error ?? "Submission failed.");
        }

        localStorage.removeItem(STORAGE_KEY);
        dispatch(clearDraft());
        setSubmitted(true);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
      } finally {
        setSubmitting(false);
      }
    })();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 text-white text-xs font-bold">EMS</span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Careers</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-zinc-500 dark:text-zinc-400">{user.name}</span>
          <button onClick={() => { logout(); router.push("/"); }}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to positions
        </button>

        {/* Posting header */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-3">
          <div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">{posting.ref_code}</p>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{posting.title}</h1>
            {posting.department && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{posting.department}</p>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden">
            {[
              { label: "Location", value: posting.location },
              { label: "Vacancies",    value: posting.positions },
              { label: "Compensation", value: posting.compensation },
              { label: "Closing date", value: posting.closing_date },
            ].filter((f) => f.value).map((f) => (
              <div key={f.label} className="bg-white dark:bg-zinc-900 px-4 py-3">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">{f.label}</p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Application form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Applicant info (pre-filled, read-only) */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Your details</h2>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">Pre-filled from your account.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Full name</label>
                <input type="text" readOnly value={user.name} className={`${inputClass} bg-zinc-50 dark:bg-zinc-800/50 cursor-not-allowed`} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Email address</label>
                <input type="text" readOnly value={user.email} className={`${inputClass} bg-zinc-50 dark:bg-zinc-800/50 cursor-not-allowed`} />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Documents</h2>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">Upload your CV and any supporting documents.</p>
            </div>

            <FileZone
              label="Curriculum Vitae (CV) *"
              hint="PDF or Word — max 5 MB"
              accept=".pdf,.doc,.docx"
              files={cvFiles}
              onChange={setCvFiles}
            />

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
              <FileZone
                label="Supporting Document *"
                hint="One file required — transcript, certificate, etc. — PDF, JPG, PNG — max 5 MB"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                files={supportingFiles}
                onChange={setSupportingFiles}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          )}

          {/* Disclaimer + Submit */}
          <div className="space-y-4 pb-10">
            <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
              <span className="font-semibold text-red-600 dark:text-red-400">Please Note: </span>
              Due to the large number of applications we envisage receiving, applications will not be acknowledged.
              If you do not receive any response within 3 months, please accept that your application was not successful.
            </p>
            <button type="submit" disabled={submitting}
              className="w-full rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-3 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2">
              {submitting
                ? <><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Submitting…</>
                : "Submit application"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
