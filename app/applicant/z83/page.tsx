"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { apiClient } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setField, seedFromProfile,
  updateLang, addLang, removeLang,
  updateQual, addQual, removeQual,
  updateExp, addExp, removeExp,
  updateRef, addRef, removeRef,
  clearZ83,
} from "@/store/z83Slice";
import type { LangRow, QualRow, ExpRow, RefRow } from "@/store/z83Slice";

// ─── Shared style helpers ─────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition";
const readonlyCls =
  "w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed";
const labelCls = "block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1";
const sectionCls =
  "rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5";
const sectionHeading = "text-base font-semibold text-zinc-900 dark:text-zinc-50";
const dividerCls = "border-t border-zinc-100 dark:border-zinc-800 pt-5";

// ─── Yes/No toggle ────────────────────────────────────────────────────────────

function YesNo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 mt-1">
      {["Yes", "No"].map((opt) => (
        <button key={opt} type="button" onClick={() => onChange(opt)}
          className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${
            value === opt
              ? opt === "Yes"
                ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                : "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400"
          }`}>
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Add / Remove row button ──────────────────────────────────────────────────

function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors mt-1">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
      </svg>
      {label}
    </button>
  );
}

function RemoveRow({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="self-end mb-0.5 text-zinc-400 hover:text-red-500 transition-colors shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Z83Page() {
  const { user, hydrating, logout } = useAuth();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const z83     = useAppSelector((s) => s.z83);
  const posting = useAppSelector((s) => s.apply.posting);

  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrating) return;
    if (!user)                         { router.replace("/");         return; }
    if (user.role !== "applicant")     { router.replace("/hr");       return; }
    // Seed name / email / id from auth profile (only fills empty fields)
    dispatch(seedFromProfile({
      name:           user.name,
      email:          user.email,
      identification: user.identification ?? "",
    }));
  }, [hydrating, user, dispatch, router]);

  if (hydrating || !user || user.role !== "applicant") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function f(key: string) {
    return {
      value: (z83 as unknown as Record<string, unknown>)[key] as string ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        dispatch(setField({ key, value: e.target.value })),
    };
  }

  function yn(key: string) {
    return {
      value: (z83 as unknown as Record<string, unknown>)[key] as string ?? "No",
      onChange: (v: string) => dispatch(setField({ key, value: v })),
    };
  }

  // ── Proficiency options ────────────────────────────────────────────────────

  const proficiencyOpts = ["", "Basic", "Fluent", "Native"];

  // ── Submit handler ─────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!user || !posting) return;
    setSubmitError(null);
    setSubmitting(true);

    try {
      await apiClient.post("/z83", {
        user_id: user.id,
        posting_id: posting.id,

        // application_questions table
        questions: {
          disability:               z83.disability        === "Yes",
          citizen:                  z83.saCitizen         === "Yes",
          criminal:                 z83.criminalOffence   === "Yes",
          pending_criminal:         z83.pendingCriminal   === "Yes",
          disciplinary:             z83.pendingDisciplinary === "Yes",
          discharged:               z83.dischargeHistory  === "Yes",
          professional_reg_number:  z83.registrationNumber || null,
        },

        // education table
        education: z83.qualifications
          .filter((r) => r.institution.trim())
          .map((r) => ({
            institution:   r.institution,
            qualification: r.qualification,
            obtained_year: r.year,
            province:      r.province,
          })),

        // work_experience table
        work_experience: z83.experience
          .filter((r) => r.employer.trim())
          .map((r) => ({
            employer:           r.employer,
            job_title:          r.post,
            from_date:          r.from,
            to_date:            r.to,
            reason_for_leaving: r.reason,
          })),

        // references_list table
        references: z83.references
          .filter((r) => r.name.trim())
          .map((r) => ({
            fullname:     r.name,
            relationship: r.relationship,
            tel_number:   r.tel,
          })),
      });

      dispatch(clearZ83());
      setDone(true);
    } catch (err) {
      console.error(err);
      setSubmitError("Submission failed. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }



  if (done) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 text-center space-y-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Z83 submitted</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Your Z83 application form has been saved. We will review your full application and be in touch if successful.
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
            <span className="font-semibold text-red-600 dark:text-red-400">Please Note: </span>
            Due to the large number of applications we envisage receiving, applications will not be acknowledged.
            If you do not receive any response within 3 months, please accept that your application was not successful.
          </p>
          <button onClick={() => { dispatch(clearZ83()); router.push("/applicant"); }}
            className="mt-2 w-full rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors">
            Back to positions
          </button>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 text-white text-xs font-bold">EMS</span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Z83 Application Form</span>
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

        {/* Title */}
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">GPG Professional Job Centre</p>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Z83 — Application for Employment</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            All fields marked <span className="text-red-500 font-semibold">*</span> are required. Fields already captured have been pre-filled.
          </p>
        </div>

        {/* Preamble */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="px-6 py-5 space-y-1">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Purpose of this form</p>
            <p>To assist a government department in selecting a person for an advertised post. This form may be used to identify candidates to be interviewed. You need to fill in all sections of this form completely, accurately and legibly. This will help to process your application fairly.</p>
          </div>
          <div className="px-6 py-5 space-y-1">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Who should complete this form</p>
            <p>Only persons wishing to apply for an advertised position in a government department.</p>
          </div>
          <div className="px-6 py-5 space-y-1">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Additional information</p>
            <p>This form requires basic information. Candidates who are selected for interviews will be requested to furnish additional certified information that may be required to make a final selection.</p>
          </div>
          <div className="px-6 py-5 space-y-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Special notes</p>
            <ol className="space-y-2 list-none">
              {[
                "All information will be treated with the strictest confidentiality and will not be disclosed or used for any other purpose than to assess the suitability of a person, except in so far as it may be required and permitted by law. Your personal details must correspond with the details in your ID or passport.",
                "Passport number in the case of non-South Africans.",
                "This information is required to enable the department to comply with the Employment Equity Act, 1998.",
                "This information will only be taken into account if it directly relates to the requirements of the position.",
                "The Executive Authority shall consider the criminal record(s) against the nature of the job functions in line with internal information security and disciplinary code.",
                "The applicant may submit additional information separately where the space provided is not sufficient.",
                "Departments must accept certified documents that accompany the application(s) with certification that is up to 6 months, unless the advert prescribes a longer period.",
                "Each application for employment form must be duly signed and initialed by the applicant. Failure to sign this form may lead to disqualification of the application during the selection process.",
              ].map((note, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px] font-bold mt-0.5">{i + 1}</span>
                  <span>{note}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── A. Advertised Post ─────────────────────────────────────────────── */}
        <section className={sectionCls}>
          <h2 className={sectionHeading}>A. The Advertised Post</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Reference number <span className="text-red-500">*</span></label>
              <input readOnly value={posting?.ref_code ?? ""} className={readonlyCls} />
            </div>
            <div>
              <label className={labelCls}>Department <span className="text-red-500">*</span></label>
              <input readOnly value={posting?.department ?? ""} className={readonlyCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Position Name <span className="text-red-500">*</span></label>
            <input readOnly value={posting?.title ?? ""} className={readonlyCls} />
          </div>

          <div>
            <label className={labelCls}>Availability / Notice Period <span className="text-red-500">*</span></label>
            <input type="text" placeholder="e.g. Immediately, 1 month notice" className={inputCls} {...f("availability")} />
          </div>
        </section>

        {/* ── B. Personal Information ────────────────────────────────────────── */}
        <section className={sectionCls}>
          <h2 className={sectionHeading}>B. Personal Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Surname <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Surname" className={inputCls} {...f("surname")} />
            </div>
            <div>
              <label className={labelCls}>Full Names <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Full names" className={inputCls} {...f("fullnames")} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Date of Birth <span className="text-red-500">*</span></label>
              <input type="date" className={inputCls} {...f("dob")} />
            </div>
            <div>
              <label className={labelCls}>Identity Number (SA citizens)</label>
              <input type="text" placeholder="13-digit ID number" className={inputCls} {...f("idnumber")} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Passport Number (non-SA nationals)</label>
            <input type="text" placeholder="Passport number" className={inputCls} {...f("passportnumber")} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Ethnicity <span className="text-red-500">*</span></label>
              <select className={inputCls} {...f("ethnicity")}>
                <option value="">Select</option>
                {["African", "Coloured", "Indian/Asian", "White", "Other"].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Gender <span className="text-red-500">*</span></label>
              <select className={inputCls} {...f("gender")}>
                <option value="">Select</option>
                {["Male", "Female", "Non-binary", "Prefer not to say"].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={dividerCls}>
            <label className={labelCls}>Do you have a disability?</label>
            <YesNo {...yn("disability")} />
            {z83.disability === "Yes" && (
              <textarea rows={2} placeholder="Please provide details of your disability"
                className={`${inputCls} mt-3`} {...f("disabilityDetails")} />
            )}
          </div>

          <div className={dividerCls}>
            <label className={labelCls}>Are you a South African citizen?</label>
            <YesNo {...yn("saCitizen")} />
            {z83.saCitizen === "No" && (
              <input type="text" placeholder="Nationality" className={`${inputCls} mt-3`} {...f("nationality")} />
            )}
          </div>

          <div className={dividerCls}>
            <label className={labelCls}>Have you ever been convicted of a criminal offence?</label>
            <YesNo {...yn("criminalOffence")} />
            {z83.criminalOffence === "Yes" && (
              <textarea rows={2} placeholder="Provide details" className={`${inputCls} mt-3`} {...f("criminalDetails")} />
            )}
          </div>

          <div className={dividerCls}>
            <label className={labelCls}>Do you have any pending criminal cases?</label>
            <YesNo {...yn("pendingCriminal")} />
            {z83.pendingCriminal === "Yes" && (
              <textarea rows={2} placeholder="Provide details" className={`${inputCls} mt-3`} {...f("pendingCriminalDetails")} />
            )}
          </div>

          <div className={dividerCls}>
            <label className={labelCls}>Have you been dismissed from the Public Service for misconduct?</label>
            <YesNo {...yn("dismissalHistory")} />
            {z83.dismissalHistory === "Yes" && (
              <textarea rows={2} placeholder="Provide details" className={`${inputCls} mt-3`} {...f("dismissalDetails")} />
            )}
          </div>

          <div className={dividerCls}>
            <label className={labelCls}>Do you have any pending disciplinary cases?</label>
            <YesNo {...yn("pendingDisciplinary")} />
            {z83.pendingDisciplinary === "Yes" && (
              <textarea rows={2} placeholder="Provide details" className={`${inputCls} mt-3`} {...f("pendingDisciplinaryDetails")} />
            )}
          </div>

          <div className={dividerCls}>
            <label className={labelCls}>Did you resign while disciplinary proceedings were pending against you?</label>
            <YesNo {...yn("resignationPending")} />
          </div>

          <div className={dividerCls}>
            <label className={labelCls}>Have you been discharged / retired from the Public Service (ill-health or non-re-employment)?</label>
            <YesNo {...yn("dischargeHistory")} />
          </div>

          <div className={dividerCls}>
            <label className={labelCls}>Do you conduct business with the State (Director / private company interests)?</label>
            <YesNo {...yn("businessConduct")} />
            {z83.businessConduct === "Yes" && (
              <textarea rows={2} placeholder="Provide details" className={`${inputCls} mt-3`} {...f("businessDetails")} />
            )}
          </div>

          {z83.businessConduct === "Yes" && (
            <div className={dividerCls}>
              <label className={labelCls}>Will you relinquish those interests if appointed?</label>
              <YesNo {...yn("relinquishBusiness")} />
            </div>
          )}

          <div className={`${dividerCls} grid grid-cols-1 sm:grid-cols-2 gap-4`}>
            <div>
              <label className={labelCls}>Years of experience — Public Sector</label>
              <input type="number" min="0" placeholder="0" className={inputCls} {...f("yearsPublic")} />
            </div>
            <div>
              <label className={labelCls}>Years of experience — Private Sector</label>
              <input type="number" min="0" placeholder="0" className={inputCls} {...f("yearsPrivate")} />
            </div>
          </div>

          <div className={`${dividerCls} grid grid-cols-1 sm:grid-cols-2 gap-4`}>
            <div>
              <label className={labelCls}>Professional Registration Date</label>
              <input type="date" className={inputCls} {...f("registrationDate")} />
            </div>
            <div>
              <label className={labelCls}>Professional Registration Number</label>
              <input type="text" placeholder="Registration number" className={inputCls} {...f("registrationNumber")} />
            </div>
          </div>
        </section>

        {/* ── C. Contact Details ─────────────────────────────────────────────── */}
        <section className={sectionCls}>
          <h2 className={sectionHeading}>C. Contact Details &amp; Medium of Communication</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Email Address <span className="text-red-500">*</span></label>
              <input type="email" placeholder="email@example.com" className={inputCls} {...f("email")} />
            </div>
            <div>
              <label className={labelCls}>Contact / Mobile Number <span className="text-red-500">*</span></label>
              <input type="tel" placeholder="e.g. 071 234 5678" className={inputCls} {...f("mobile")} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Street Address <span className="text-red-500">*</span></label>
            <input type="text" placeholder="Street address" className={inputCls} {...f("streetAddress")} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Municipality</label>
              <input type="text" placeholder="Municipality" className={inputCls} {...f("municipality")} />
            </div>
            <div>
              <label className={labelCls}>Township</label>
              <input type="text" placeholder="Township" className={inputCls} {...f("township")} />
            </div>
          </div>
        </section>

        {/* ── D. Language Proficiency ────────────────────────────────────────── */}
        <section className={sectionCls}>
          <h2 className={sectionHeading}>D. South African Official Language Proficiency</h2>

          <div className="space-y-4">
            {z83.languages.map((row: LangRow, i: number) => (
              <div key={i} className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide flex-1">Language {i + 1}</p>
                  {z83.languages.length > 1 && <RemoveRow onClick={() => dispatch(removeLang(i))} />}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className={labelCls}>Language</label>
                    <input type="text" placeholder="e.g. Zulu" className={inputCls}
                      value={row.language}
                      onChange={(e) => dispatch(updateLang({ i, field: "language", value: e.target.value }))} />
                  </div>
                  {(["speak", "read", "write"] as const).map((skill) => (
                    <div key={skill}>
                      <label className={labelCls}>{skill.charAt(0).toUpperCase() + skill.slice(1)}</label>
                      <select className={inputCls}
                        value={row[skill]}
                        onChange={(e) => dispatch(updateLang({ i, field: skill, value: e.target.value }))}>
                        {proficiencyOpts.map((o) => <option key={o} value={o}>{o || "Select"}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <AddRow label="Add language" onClick={() => dispatch(addLang())} />
        </section>

        {/* ── E. Formal Qualifications ───────────────────────────────────────── */}
        <section className={sectionCls}>
          <h2 className={sectionHeading}>E. Formal Qualification</h2>

          <div className="space-y-4">
            {z83.qualifications.map((row: QualRow, i: number) => (
              <div key={i} className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide flex-1">Qualification {i + 1}</p>
                  {z83.qualifications.length > 1 && <RemoveRow onClick={() => dispatch(removeQual(i))} />}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Institution Name</label>
                    <input type="text" placeholder="University / College" className={inputCls}
                      value={row.institution}
                      onChange={(e) => dispatch(updateQual({ i, field: "institution", value: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Qualification</label>
                    <input type="text" placeholder="Degree / Diploma / Certificate" className={inputCls}
                      value={row.qualification}
                      onChange={(e) => dispatch(updateQual({ i, field: "qualification", value: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Year Obtained</label>
                    <input type="text" placeholder="e.g. 2019" className={inputCls}
                      value={row.year}
                      onChange={(e) => dispatch(updateQual({ i, field: "year", value: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Province</label>
                    <select className={inputCls}
                      value={row.province}
                      onChange={(e) => dispatch(updateQual({ i, field: "province", value: e.target.value }))}>
                      <option value="">Select province</option>
                      {["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","Northern Cape","North West","Western Cape","Other"].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <AddRow label="Add qualification" onClick={() => dispatch(addQual())} />
        </section>

        {/* ── F. Work Experience ─────────────────────────────────────────────── */}
        <section className={sectionCls}>
          <h2 className={sectionHeading}>F. Work Experience</h2>

          <div className="space-y-4">
            {z83.experience.map((row: ExpRow, i: number) => (
              <div key={i} className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide flex-1">Position {i + 1}</p>
                  {z83.experience.length > 1 && <RemoveRow onClick={() => dispatch(removeExp(i))} />}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Employer</label>
                    <input type="text" placeholder="Organisation name" className={inputCls}
                      value={row.employer}
                      onChange={(e) => dispatch(updateExp({ i, field: "employer", value: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Post Held</label>
                    <input type="text" placeholder="Job title" className={inputCls}
                      value={row.post}
                      onChange={(e) => dispatch(updateExp({ i, field: "post", value: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>From (Date)</label>
                    <input type="month" className={inputCls}
                      value={row.from}
                      onChange={(e) => dispatch(updateExp({ i, field: "from", value: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>To (Date)</label>
                    <input type="month" className={inputCls}
                      value={row.to}
                      onChange={(e) => dispatch(updateExp({ i, field: "to", value: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Reason for Leaving</label>
                    <input type="text" placeholder="Reason for leaving" className={inputCls}
                      value={row.reason}
                      onChange={(e) => dispatch(updateExp({ i, field: "reason", value: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Previous Public Service Re-appointment Conditions (if applicable)</label>
                    <input type="text" placeholder="e.g. None / specify conditions" className={inputCls}
                      value={row.publicConditions}
                      onChange={(e) => dispatch(updateExp({ i, field: "publicConditions", value: e.target.value }))} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <AddRow label="Add position" onClick={() => dispatch(addExp())} />
        </section>

        {/* ── G. References ──────────────────────────────────────────────────── */}
        <section className={sectionCls}>
          <h2 className={sectionHeading}>G. References</h2>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 -mt-2">Provide at least one reference contactable during office hours.</p>

          <div className="space-y-4">
            {z83.references.map((row: RefRow, i: number) => (
              <div key={i} className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide flex-1">Reference {i + 1}</p>
                  {z83.references.length > 1 && <RemoveRow onClick={() => dispatch(removeRef(i))} />}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Name</label>
                    <input type="text" placeholder="Full name" className={inputCls}
                      value={row.name}
                      onChange={(e) => dispatch(updateRef({ i, field: "name", value: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Relationship</label>
                    <input type="text" placeholder="e.g. Manager, Supervisor" className={inputCls}
                      value={row.relationship}
                      onChange={(e) => dispatch(updateRef({ i, field: "relationship", value: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Tel No. (office hours)</label>
                    <input type="tel" placeholder="e.g. 011 234 5678" className={inputCls}
                      value={row.tel}
                      onChange={(e) => dispatch(updateRef({ i, field: "tel", value: e.target.value }))} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <AddRow label="Add reference" onClick={() => dispatch(addRef())} />
        </section>

        {/* ── Submit ─────────────────────────────────────────────────────────── */}
        <div className="space-y-4 pb-12">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
            <span className="font-semibold text-red-600 dark:text-red-400">Declaration: </span>
            I certify that the information provided in this application is true and correct. I understand that
            providing false information may result in disqualification or dismissal.
          </p>
          {submitError && (
            <p className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {submitError}
            </p>
          )}
          <button type="button" disabled={submitting} onClick={handleSubmit}
            className="w-full rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-3 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2">
            {submitting && (
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            )}
            {submitting ? "Submitting…" : "Submit Z83 Application"}
          </button>
        </div>

      </main>
    </div>
  );
}
