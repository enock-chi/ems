"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchPostings,
  updateDraft,
  markSaved,
  addPosting,
  removePosting,
  setFilter,
  selectFilteredPostings,
  selectDepartments,
} from "@/store/postingsSlice";
import {
  serverLoaded as applicationsServerLoaded,
} from "@/store/applicationsSlice";
import type { Posting, Application } from "@/store/types";

type NavItem = "postings" | "applications";

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV: { id: NavItem; label: string; icon: React.ReactNode }[] = [
  {
    id: "postings",
    label: "Postings",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "applications",
    label: "Applications",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// ─── Postings panel ───────────────────────────────────────────────────────────

function PostingsPanel() {
  const dispatch = useAppDispatch();
  const { status, dirtyIds, filter } = useAppSelector((s) => s.postings);
  const postings = useAppSelector(selectFilteredPostings);
  const departments = useAppSelector(selectDepartments);
  const [drawer, setDrawer] = useState<DrawerMode | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch once on mount; subsequent creates/edits/deletes update Redux directly
  useEffect(() => { dispatch(fetchPostings()); }, [dispatch]);

  async function handleDelete(id: number) {
    if (!confirm("Delete this posting? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await apiClient.delete(`/postings/${id}`);
      dispatch(removePosting(id));
    } catch (err) {
      console.error(err);
      alert("Delete failed. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  const totalAll = useAppSelector((s) => s.postings.draft.length);

  if (status === "loading" && totalAll === 0) return <Spinner />;
  if (status === "error"   && totalAll === 0) return <ErrorMsg>Failed to load postings.</ErrorMsg>;

  return (
    <>
      {drawer && <PostingDrawer mode={drawer} onClose={() => setDrawer(null)} />}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Postings
            {totalAll > 0 && (
              <span className="ml-2 text-xs font-normal text-zinc-400">
                {postings.length !== totalAll ? `${postings.length} of ${totalAll}` : totalAll}
              </span>
            )}
          </h2>
          <button
            onClick={() => setDrawer({ kind: "create" })}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Posting
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-45">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search postings…"
              value={filter.search}
              onChange={(e) => dispatch(setFilter({ search: e.target.value }))}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
            />
          </div>
          {departments.length > 0 && (
            <select
              value={filter.department}
              onChange={(e) => dispatch(setFilter({ department: e.target.value }))}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition">
              <option value="">All departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          {(filter.search || filter.department) && (
            <button
              onClick={() => dispatch(setFilter({ search: "", department: "" }))}
              className="rounded-xl px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              Clear
            </button>
          )}
        </div>

        {postings.length === 0 && (
          <p className="text-sm text-zinc-400">
            {filter.search || filter.department ? "No postings match your filter." : "No postings found."}
          </p>
        )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {postings.map((p) => {
          const isDirty = dirtyIds.includes(p.id);
          return (
          <div key={p.id} className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Card accent bar — amber when unsaved */}
            <div className={`h-1 w-full bg-linear-to-r ${isDirty ? "from-amber-400 to-amber-300" : "from-red-500 to-red-400"}`} />

            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 leading-snug text-base">{p.title}</h3>
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {isDirty && (
                      <span className="font-mono text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded px-1.5 py-0.5">
                        unsaved
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">{p.ref_code}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {p.department && (
                    <span className="inline-block rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium px-2.5 py-0.5">
                      {p.department}
                    </span>
                  )}
                </div>
              </div>

              {/* Meta rows */}
              <ul className="space-y-1.5 text-sm">
                {p.location && (
                  <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {p.location}
                  </li>
                )}
                {p.positions && (
                  <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {p.positions} position{p.positions !== 1 ? "s" : ""}
                  </li>
                )}
                {p.compensation && (
                  <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {p.compensation}
                  </li>
                )}
              </ul>

              {/* Footer */}
              <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                {p.closing_date ? (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Closes&nbsp;<span className="font-medium text-zinc-700 dark:text-zinc-300">{p.closing_date}</span>
                  </div>
                ) : <span />}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDrawer({ kind: "edit", posting: p })}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 transition-colors">
                    {deletingId === p.id ? (
                      <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
          );  
        })}
      </div>
    </div>
    </>
  );
}

// ─── Applications panel ───────────────────────────────────────────────────────

function AppRow({ a }: { a: Application }) {
  const initials = `${a.firstname?.[0] ?? ""}${a.lastname?.[0] ?? ""}`.toUpperCase();
  return (
    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
      <td className="px-5 py-4 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">{a.ref_number}</td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold shrink-0">
            {initials}
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{a.firstname} {a.lastname}</span>
        </div>
      </td>
      <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400 hidden md:table-cell">
        {a.identification || <span className="text-zinc-300 dark:text-zinc-600">—</span>}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          {a.cv_url && (
            <a href={a.cv_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 px-2.5 py-1 text-xs font-medium transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CV
            </a>
          )}
          {a.docs_url && (
            <a href={a.docs_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 px-2.5 py-1 text-xs font-medium transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Docs
            </a>
          )}
          {!a.cv_url && !a.docs_url && <span className="text-zinc-300 dark:text-zinc-600 text-xs">None</span>}
        </div>
      </td>
    </tr>
  );
}

function AppSection({
  title, apps, accent, open, onToggle,
}: {
  title: string; apps: Application[];
  accent: "green" | "red"; open: boolean; onToggle: () => void;
}) {
  const accentBar = accent === "green" ? "from-green-500 to-emerald-400" : "from-red-500 to-rose-400";
  const badgeCls  = accent === "green"
    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
    : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left">
        <div className={`h-2.5 w-2.5 rounded-full bg-linear-to-r ${accentBar} shrink-0`} />
        <span className="flex-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">{title}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeCls}`}>{apps.length}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        apps.length === 0 ? (
          <p className="px-5 py-6 text-sm text-zinc-400 bg-white dark:bg-zinc-900">No applications in this group.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Ref</th>
                  <th className="px-5 py-3 text-left">Applicant</th>
                  <th className="px-5 py-3 text-left hidden md:table-cell">ID Number</th>
                  <th className="px-5 py-3 text-left">Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                {apps.map((a) => <AppRow key={a.id} a={a} />)}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

function ApplicationsPanel() {
  const dispatch = useAppDispatch();
  const apps     = useAppSelector((s) => s.applications.draft);

  const { isLoading, isError, data: freshData } = useQuery<Application[]>({
    queryKey: ["applications"],
    queryFn: () => apiClient.get<Application[]>("/applications"),
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (freshData) dispatch(applicationsServerLoaded(freshData));
  }, [freshData, dispatch]);

  const [passOpen, setPassOpen] = useState(true);
  const [failOpen, setFailOpen] = useState(true);

  const passed = apps.filter((a) => a.screening_pass);
  const failed  = apps.filter((a) => !a.screening_pass);

  if (isLoading && apps.length === 0) return <Spinner />;
  if (isError   && apps.length === 0) return <ErrorMsg>Failed to load applications.</ErrorMsg>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Applications</h2>
        <span className="text-sm text-zinc-400">{apps.length} total</span>
      </div>

      {apps.length === 0 && <p className="text-sm text-zinc-400">No applications yet.</p>}

      {apps.length > 0 && (
        <div className="space-y-3">
          <AppSection title="Passed Screening" apps={passed} accent="green" open={passOpen} onToggle={() => setPassOpen((v) => !v)} />
          <AppSection title="Failed Screening"  apps={failed}  accent="red"   open={failOpen} onToggle={() => setFailOpen((v) => !v)} />
        </div>
      )}
    </div>
  );
}
// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Posting Drawer (create / edit) ──────────────────────────────────────────

type DrawerMode = { kind: "create" } | { kind: "edit"; posting: Posting };

const EMPTY_FORM = {
  ref_code: "", title: "", department: "", positions: "",
  description: "", notes: "", closing_date: "",
  location: "", enquiries: "", compensation: "",
};

function PostingDrawer({
  mode,
  onClose,
}: {
  mode: DrawerMode;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const isEdit = mode.kind === "edit";
  const existing = isEdit ? mode.posting : null;

  const [form, setForm] = useState(
    existing
      ? {
          ref_code: existing.ref_code,
          title: existing.title,
          department: existing.department,
          positions: String(existing.positions),
          description: existing.description,
          notes: existing.notes,
          closing_date: existing.closing_date,
          location: existing.location,
          enquiries: existing.enquiries,
          compensation: existing.compensation,
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof EMPTY_FORM, string>>>({});

  function clearFieldError(key: keyof typeof EMPTY_FORM) {
    if (fieldErrors[key]) setFieldErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }

  function field(key: keyof typeof EMPTY_FORM) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
        clearFieldError(key);
      },
    };
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof typeof EMPTY_FORM, string>> = {};
    if (!form.ref_code.trim())   errs.ref_code   = "Reference is required.";
    if (!form.title.trim()) errs.title = "Title is required.";
    if (!form.department.trim()) errs.department = "Department is required.";
    if (!form.closing_date.trim()) errs.closing_date = "Closing date is required.";
    if (form.positions.trim() && !/^\d+$/.test(form.positions.trim()))
      errs.positions = "Must be a whole number.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      ref_code:     form.ref_code.trim(),
      title:        form.title.trim(),
      department:   form.department.trim(),
      positions:    form.positions.trim() ? Number(form.positions.trim()) : 0,
      description:  form.description.trim(),
      notes:        form.notes.trim(),
      closing_date: form.closing_date.trim(),
      location:     form.location.trim(),
      enquiries:    form.enquiries.trim(),
      compensation: form.compensation.trim(),
    };

    try {
      if (isEdit && existing) {
        dispatch(updateDraft({ id: existing.id, changes: payload }));
        await apiClient.put(`/postings/${existing.id}`, payload);
        dispatch(markSaved(existing.id));
      } else {
        const created = await apiClient.post<Posting>("/postings", payload);
        dispatch(addPosting(created));
      }
      onClose();
    } catch (err) {
      console.error(err);
      setFieldErrors((prev) => ({ ...prev, ref_code: "Save failed — please try again." }));
    } finally {
      setSaving(false);
    }
  }

  const inputCls = (key: keyof typeof EMPTY_FORM) =>
    `w-full rounded-lg border ${fieldErrors[key] ? "border-red-500 focus:ring-red-500" : "border-zinc-300 dark:border-zinc-700 focus:ring-red-500"} bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:border-transparent transition`;
  const labelCls = "block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1";
  const errCls = "mt-1 text-xs text-red-500";

  function F({ k, label, required, placeholder, as: As = "input", rows }: {
    k: keyof typeof EMPTY_FORM; label: string; required?: boolean;
    placeholder?: string; as?: "input" | "textarea"; rows?: number;
  }) {
    const props = { className: inputCls(k), placeholder, ...field(k) };
    return (
      <div>
        <label className={labelCls}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
        {As === "textarea" ? <textarea rows={rows ?? 3} {...props} /> : <input {...props} />}
        {fieldErrors[k] && <p className={errCls}>{fieldErrors[k]}</p>}
      </div>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white dark:bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {isEdit ? "Edit Posting" : "New Posting"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <F k="ref_code" label="Reference" required placeholder="e.g. REFS/001" />
            <F k="positions" label="Positions" placeholder="e.g. 2" />
          </div>

          <F k="title" label="Title" required placeholder="Job title" />

          <div className="grid grid-cols-2 gap-4">
            <F k="department" label="Department" required placeholder="Department" />
            <F k="location" label="Location" placeholder="Location" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <F k="closing_date" label="Closing Date" required placeholder="e.g. 30-06-2026" />
            <F k="compensation" label="Compensation" placeholder="e.g. R200 000 p.a." />
          </div>

          <F k="enquiries" label="Enquiries" placeholder="Contact for enquiries" />
          <F k="description" label="Description" as="textarea" rows={4} placeholder="Role description..." />
          <F k="notes" label="Notes" as="textarea" rows={3} placeholder="Additional notes..." />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 px-5 py-2 text-sm font-semibold text-white transition-colors">
            {saving && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {isEdit ? "Save changes" : "Create & publish"}
          </button>
        </div>
      </div>
    </>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-500 dark:text-zinc-400">
      {children}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-6 w-6 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
    </div>
  );
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
      {children}
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HRDashboard() {
  const { user, hydrating, logout } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState<NavItem>("postings");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (hydrating) return;
    if (!user) { router.replace("/"); return; }
    if (user.role !== "hr") { router.replace("/applicant"); return; }
  }, [user, hydrating, router]);

  if (hydrating || !user || user.role !== "hr") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">

      {/* ── Mobile overlay ──────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white dark:bg-zinc-900
        border-r border-zinc-200 dark:border-zinc-800
        transform transition-transform duration-200
        lg:static lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 text-white text-xs font-bold shrink-0">EMS</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">HR Portal</p>
            <p className="text-xs text-zinc-400 truncate">{user.name}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => (
            <button key={item.id} onClick={() => { setActive(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active === item.id
                  ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <button onClick={() => { logout(); router.push("/"); }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 py-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 capitalize">
            {NAV.find((n) => n.id === active)?.label}
          </span>
        </header>

        <main className="flex-1 px-6 py-8 max-w-6xl w-full mx-auto">
          {active === "postings" && <PostingsPanel />}
          {active === "applications" && <ApplicationsPanel />}
        </main>
      </div>
    </div>
  );
}
