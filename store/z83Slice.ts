import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ─── Row types ────────────────────────────────────────────────────────────────

export interface LangRow { language: string; speak: string; read: string; write: string; }
export interface QualRow { institution: string; qualification: string; year: string; province: string; }
export interface ExpRow  { employer: string; post: string; from: string; to: string; reason: string; publicConditions: string; }
export interface RefRow  { name: string; relationship: string; tel: string; }

// ─── State ────────────────────────────────────────────────────────────────────

export interface Z83State {
  // A – Advertised Post
  availability: string;
  // B – Personal Information
  surname: string;
  fullnames: string;
  dob: string;
  idnumber: string;
  passportnumber: string;
  ethnicity: string;
  gender: string;
  disability: string;
  disabilityDetails: string;
  saCitizen: string;
  nationality: string;
  criminalOffence: string;
  criminalDetails: string;
  pendingCriminal: string;
  pendingCriminalDetails: string;
  dismissalHistory: string;
  dismissalDetails: string;
  pendingDisciplinary: string;
  pendingDisciplinaryDetails: string;
  resignationPending: string;
  dischargeHistory: string;
  businessConduct: string;
  businessDetails: string;
  relinquishBusiness: string;
  yearsPublic: string;
  yearsPrivate: string;
  registrationDate: string;
  registrationNumber: string;
  // C – Contact Details
  email: string;
  mobile: string;
  streetAddress: string;
  municipality: string;
  township: string;
  // D – Language Proficiency
  languages: LangRow[];
  // E – Formal Qualification
  qualifications: QualRow[];
  // F – Work Experience
  experience: ExpRow[];
  // G – References
  references: RefRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "ems_z83_draft";

const DEFAULT: Z83State = {
  availability: "",
  surname: "", fullnames: "", dob: "", idnumber: "", passportnumber: "",
  ethnicity: "", gender: "", disability: "No", disabilityDetails: "",
  saCitizen: "Yes", nationality: "", criminalOffence: "No", criminalDetails: "",
  pendingCriminal: "No", pendingCriminalDetails: "", dismissalHistory: "No", dismissalDetails: "",
  pendingDisciplinary: "No", pendingDisciplinaryDetails: "", resignationPending: "No",
  dischargeHistory: "No", businessConduct: "No", businessDetails: "", relinquishBusiness: "No",
  yearsPublic: "", yearsPrivate: "", registrationDate: "", registrationNumber: "",
  email: "", mobile: "", streetAddress: "", municipality: "", township: "",
  languages:     [{ language: "", speak: "", read: "", write: "" }],
  qualifications: [{ institution: "", qualification: "", year: "", province: "" }],
  experience:    [{ employer: "", post: "", from: "", to: "", reason: "", publicConditions: "" }],
  references:    [{ name: "", relationship: "", tel: "" }],
};

function load(): Z83State {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch { return DEFAULT; }
}

function persist(state: Z83State) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* quota */ }
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const z83Slice = createSlice({
  name: "z83",
  initialState: load,
  reducers: {
    /** Set any flat (string) field */
    setField(state, action: PayloadAction<{ key: string; value: string }>) {
      (state as Record<string, unknown>)[action.payload.key] = action.payload.value;
      persist(state as Z83State);
    },

    /** Pre-fill from auth profile (runs once on mount, skips already-set fields) */
    seedFromProfile(state, action: PayloadAction<{ name: string; email: string; identification: string }>) {
      const { name, email, identification } = action.payload;
      const parts = name.trim().split(" ");
      if (!state.surname)   state.surname   = parts[parts.length - 1] ?? "";
      if (!state.fullnames) state.fullnames = name.trim();
      if (!state.email)     state.email     = email;
      if (!state.idnumber)  state.idnumber  = identification ?? "";
      persist(state as Z83State);
    },

    // D – Languages
    updateLang(state, action: PayloadAction<{ i: number; field: keyof LangRow; value: string }>) {
      const { i, field, value } = action.payload;
      if (state.languages[i]) { state.languages[i][field] = value; persist(state as Z83State); }
    },
    addLang(state) {
      state.languages.push({ language: "", speak: "", read: "", write: "" });
      persist(state as Z83State);
    },
    removeLang(state, action: PayloadAction<number>) {
      if (state.languages.length > 1) { state.languages.splice(action.payload, 1); persist(state as Z83State); }
    },

    // E – Qualifications
    updateQual(state, action: PayloadAction<{ i: number; field: keyof QualRow; value: string }>) {
      const { i, field, value } = action.payload;
      if (state.qualifications[i]) { state.qualifications[i][field] = value; persist(state as Z83State); }
    },
    addQual(state) {
      state.qualifications.push({ institution: "", qualification: "", year: "", province: "" });
      persist(state as Z83State);
    },
    removeQual(state, action: PayloadAction<number>) {
      if (state.qualifications.length > 1) { state.qualifications.splice(action.payload, 1); persist(state as Z83State); }
    },

    // F – Work Experience
    updateExp(state, action: PayloadAction<{ i: number; field: keyof ExpRow; value: string }>) {
      const { i, field, value } = action.payload;
      if (state.experience[i]) { state.experience[i][field] = value; persist(state as Z83State); }
    },
    addExp(state) {
      state.experience.push({ employer: "", post: "", from: "", to: "", reason: "", publicConditions: "" });
      persist(state as Z83State);
    },
    removeExp(state, action: PayloadAction<number>) {
      if (state.experience.length > 1) { state.experience.splice(action.payload, 1); persist(state as Z83State); }
    },

    // G – References
    updateRef(state, action: PayloadAction<{ i: number; field: keyof RefRow; value: string }>) {
      const { i, field, value } = action.payload;
      if (state.references[i]) { state.references[i][field] = value; persist(state as Z83State); }
    },
    addRef(state) {
      state.references.push({ name: "", relationship: "", tel: "" });
      persist(state as Z83State);
    },
    removeRef(state, action: PayloadAction<number>) {
      if (state.references.length > 1) { state.references.splice(action.payload, 1); persist(state as Z83State); }
    },

    clearZ83(state) {
      Object.assign(state, DEFAULT);
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* quota */ }
    },
  },
});

export const {
  setField, seedFromProfile,
  updateLang, addLang, removeLang,
  updateQual, addQual, removeQual,
  updateExp, addExp, removeExp,
  updateRef, addRef, removeRef,
  clearZ83,
} = z83Slice.actions;

export default z83Slice.reducer;
