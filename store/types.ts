// ─── Shared domain types (single source of truth) ────────────────────────────
// Aligned with ems_recruitment_db MySQL schema.

// ─── users table ─────────────────────────────────────────────────────────────
export interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  empid: string | null;
  identification: string | null;
  contact: string | null;
  is_applicant: boolean;
  is_hr: boolean;
}

// ─── postings table ───────────────────────────────────────────────────────────
export interface Posting {
  id: number;
  ref_code: string;
  title: string;
  department: string;
  positions: number;
  description: string;
  notes: string;
  closing_date: string;   // DATE → ISO string "YYYY-MM-DD"
  location: string;
  compensation: string;
  enquiries: string;
}

// ─── applications table ───────────────────────────────────────────────────────
export interface Application {
  id: number;
  user_id: number;
  posting_id: number;
  ref_number: string;
  firstname: string;
  lastname: string;
  identification: string;
  cv_url: string | null;
  docs_url: string | null;
  screening_pass: boolean;
}

// ─── application_questions table ──────────────────────────────────────────────
export interface ApplicationQuestion {
  id: number;
  application_id: number;
  disability: boolean;
  citizen: boolean;
  criminal: boolean;
  pending_criminal: boolean;
  disciplinary: boolean;
  discharged: boolean;
  professional_reg_number: string | null;
}

// ─── education table ──────────────────────────────────────────────────────────
export interface Education {
  id: number;
  application_id: number;
  institution: string;
  qualification: string;
  obtained_year: string;
  province: string;
}

// ─── work_experience table ────────────────────────────────────────────────────
export interface WorkExperience {
  id: number;
  application_id: number;
  employer: string;
  job_title: string;
  from_date: string;
  to_date: string;
  reason_for_leaving: string;
}

// ─── references_list table ────────────────────────────────────────────────────
export interface Reference {
  id: number;
  application_id: number;
  fullname: string;
  relationship: string;
  tel_number: string;
}
