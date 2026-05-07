import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Posting } from "./types";

// ─── State ────────────────────────────────────────────────────────────────────

interface ApplyState {
  /** The posting being applied for */
  posting: Posting | null;
  /** Screening answers keyed by criterion text */
  answers: Record<string, boolean | null>;
}

const STORAGE_KEY = "ems_apply_draft";

function loadFromStorage(): ApplyState {
  if (typeof window === "undefined") return { posting: null, answers: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { posting: null, answers: {} };
    return JSON.parse(raw) as ApplyState;
  } catch {
    return { posting: null, answers: {} };
  }
}

function persist(state: ApplyState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota */ }
}

const initialState: ApplyState = loadFromStorage();

// ─── Slice ────────────────────────────────────────────────────────────────────

const applySlice = createSlice({
  name: "apply",
  initialState,
  reducers: {
    /** Set the posting and initialise fresh answers for it */
    setPosting(state, action: PayloadAction<Posting>) {
      const posting = action.payload;
      // Only reset answers if switching to a different posting
      if (state.posting?.id !== posting.id) {
        const fresh: Record<string, boolean | null> = {};
        posting.requirements.flatMap((r) => r.criteria).forEach((c) => {
          fresh[c] = null;
        });
        state.answers = fresh;
      }
      state.posting = posting;
      persist({ posting, answers: state.answers });
    },

    /** Update a single criterion answer */
    setAnswer(state, action: PayloadAction<{ criterion: string; value: boolean }>) {
      const { criterion, value } = action.payload;
      state.answers[criterion] = value;
      persist({ posting: state.posting, answers: state.answers });
    },

    /** Clear draft after successful submission */
    clearDraft(state) {
      state.posting = null;
      state.answers = {};
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch { /* noop */ }
    },
  },
});

export const { setPosting, setAnswer, clearDraft } = applySlice.actions;
export default applySlice.reducer;
