// ─── Shared domain types (single source of truth) ────────────────────────────

export interface AssetRef {
  id: string;
  url: string;
  fileName: string;
}

export interface Requirement {
  id: string;
  criteria: string[];
}

export interface Application {
  id: string;
  ref: string;
  firstname: string;
  lastname: string;
  identification: string;
  screeningpass: boolean;
  z83pass: boolean | null;
  createdAt: string;
  cv: AssetRef | null;
  supportingdocs: AssetRef | null;
}

export interface Posting {
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
  applications?: Application[];
}
