"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { hygraph } from "@/lib/hygraph";
import { GET_POSTINGS, GET_APPLICATIONS } from "@/lib/queries";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Requirement { id: string; criteria: string[]; }
interface Posting {
  id: string; ref: string; title: string; department: string;
  positions: string; description: string; notes: string;
  closingdate: string; location: string; enquiries: string;
  compensation: string; requirements: Requirement[];
}
interface AssetRef { id: string; url: string; fileName: string; }
interface Application {
  id: string; ref: string; firstname: string; lastname: string;
  identification: string; screeningpass: boolean; createdAt: string;
  cv: AssetRef | null; supportingdocs: AssetRef | null;
}

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
  const { data, isLoading, isError } = useQuery<{ postings: Posting[] }>({
    queryKey: ["postings"],
    queryFn: () => hygraph.request(GET_POSTINGS),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorMsg>Failed to load postings.</ErrorMsg>;
  const postings = data?.postings ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Postings</h2>
      {postings.length === 0 && (
        <p className="text-sm text-zinc-400">No postings found.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {postings.map((p) => (
          <div key={p.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-2">
            <p className="text-xs text-zinc-400">{p.ref}</p>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 leading-snug">{p.title}</h3>
            {p.department && <p className="text-xs text-zinc-500">{p.department}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              {p.location && <Tag>{p.location}</Tag>}
              {p.positions && <Tag>{p.positions} position{p.positions !== "1" ? "s" : ""}</Tag>}
              {p.closingdate && <Tag>Closes {p.closingdate}</Tag>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Applications panel ───────────────────────────────────────────────────────

function ApplicationsPanel() {
  const { data, isLoading, isError } = useQuery<{ applications: Application[] }>({
    queryKey: ["applications"],
    queryFn: () => hygraph.request(GET_APPLICATIONS),
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorMsg>Failed to load applications.</ErrorMsg>;
  const apps = data?.applications ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Applications</h2>
        <span className="text-sm text-zinc-400">{apps.length} total</span>
      </div>
      {apps.length === 0 && (
        <p className="text-sm text-zinc-400">No applications yet.</p>
      )}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 text-left">Ref</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">ID Number</th>
              <th className="px-4 py-3 text-left">Screening</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Docs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
            {apps.map((a) => (
              <tr key={a.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 font-mono text-xs">{a.ref}</td>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{a.firstname} {a.lastname}</td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{a.identification || "—"}</td>
                <td className="px-4 py-3">
                  {a.screeningpass
                    ? <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 text-xs font-medium">Pass</span>
                    : <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 text-xs font-medium">Fail</span>
                  }
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(a.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {a.cv && (
                      <a href={a.cv.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-red-600 hover:text-red-700 underline underline-offset-2">CV</a>
                    )}
                    {a.supportingdocs && (
                      <a href={a.supportingdocs.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-red-600 hover:text-red-700 underline underline-offset-2">Supporting</a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  const { user, logout } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState<NavItem>("postings");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) { router.replace("/"); return; }
    if (user.role !== "hr") { router.replace("/applicant"); return; }
  }, [user, router]);

  if (!user || user.role !== "hr") {
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
