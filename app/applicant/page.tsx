"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { hygraph } from "@/lib/hygraph";
import { GET_POSTINGS } from "@/lib/queries";
import { useAuth } from "@/context/auth-context";

interface Requirement {
  id: string;
  criteria: string[];
}

interface Posting {
  id: string;
  ref: string;
  title: string;
  department: string;
  positions: string;
  description: string;
  notes: string;
  closingdate: string;
  location: string;
  enquiries: string;
  compensation: string;
  requirements: Requirement[];
}

interface PostingsResult {
  postings: Posting[];
}

// â”€â”€â”€ Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PostingCard({ posting, onClick }: { posting: Posting; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex flex-col gap-4 hover:border-red-400 dark:hover:border-red-500 hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
            {posting.title}
          </h3>
          {posting.department && (
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{posting.department}</p>
          )}
        </div>
        {posting.positions && (
          <span className="shrink-0 rounded-full bg-red-50 dark:bg-red-900/30 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-400">
            {posting.positions} {Number(posting.positions) === 1 ? "slot" : "slots"}
          </span>
        )}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between gap-2 text-xs text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-auto">
        <span className="flex items-center gap-1">
          {posting.location && (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {posting.location}
            </>
          )}
        </span>
        <span>{posting.closingdate ? `Closes ${posting.closingdate}` : ""}</span>
      </div>
    </button>
  );
}

// â”€â”€â”€ Detail slide-over â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PostingDetail({ posting, onClose }: { posting: Posting; onClose: () => void }) {
  const allCriteria = posting.requirements.flatMap((r) => r.criteria);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white dark:bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">{posting.ref}</p>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 leading-snug">{posting.title}</h2>
            {posting.department && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{posting.department}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 mt-1 rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Quick facts */}
        <div className="grid grid-cols-2 gap-px bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800">
          {[
            { label: "Location", value: posting.location },
            { label: "Vacancies", value: posting.positions },
            { label: "Compensation", value: posting.compensation },
            { label: "Closing date", value: posting.closingdate },
          ].filter((f) => f.value).map((f) => (
            <div key={f.label} className="bg-white dark:bg-zinc-900 px-5 py-3">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">{f.label}</p>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
          {posting.description && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">About this role</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{posting.description}</p>
            </div>
          )}

          {allCriteria.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Requirements</h3>
              <ul className="space-y-2.5">
                {allCriteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {posting.notes && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Notes</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{posting.notes}</p>
            </div>
          )}

          {posting.enquiries && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Enquiries</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{posting.enquiries}</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 space-y-3">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
            <span className="font-semibold text-red-600 dark:text-red-400">Please Note: </span>
            Due to the large number of applications we envisage receiving, applications will not be acknowledged.
            If you do not receive any response within 3 months, please accept that your application was not successful.
          </p>
          <button
            onClick={() => {
              localStorage.setItem("ems_apply_posting", JSON.stringify(posting));
              router.push("/applicant/apply");
            }}
            className="w-full rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 px-4 py-3 text-sm font-semibold text-white transition-colors">
            Apply now
          </button>
        </div>
      </div>
    </>
  );
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ApplicantDashboard() {
  const { user, hydrating, logout } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<Posting | null>(null);

  useEffect(() => {
    if (hydrating) return;
    if (!user) router.replace("/");
    else if (user.role !== "applicant") router.replace("/hr");
  }, [user, hydrating, router]);

  const { data, isLoading, isError } = useQuery<PostingsResult>({
    queryKey: ["postings"],
    queryFn: () => hygraph.request<PostingsResult>(GET_POSTINGS),
    enabled: !!user && !hydrating,
  });

  if (hydrating || !user || user.role !== "applicant") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
      </div>
    );
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
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Open Positions</h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">Find a role that matches your skills and passion.</p>
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 animate-pulse h-40" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-5 py-4 text-sm text-red-700 dark:text-red-400">
            Failed to load postings. Please try again later.
          </div>
        )}

        {!isLoading && !isError && data?.postings.length === 0 && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center">
            <p className="text-zinc-400 text-sm">No open positions right now â€” check back soon.</p>
          </div>
        )}

        {!isLoading && !isError && data && data.postings.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.postings.map((posting) => (
              <PostingCard key={posting.id} posting={posting} onClick={() => setSelected(posting)} />
            ))}
          </div>
        )}

      </main>

      {selected && <PostingDetail posting={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
