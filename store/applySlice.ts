import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Posting } from "./types";

// ─── State ────────────────────────────────────────────────────────────────────

interface ApplyState {
  /** The posting being applied for */
  posting: Posting | null;
}

const STORAGE_KEY = "ems_apply_draft";

function loadFromStorage(): ApplyState {
  if (typeof window === "undefined") return { posting: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { posting: null };
    return JSON.parse(raw) as ApplyState;
  } catch {
    return { posting: null };
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
    /** Set the posting being applied for */
    setPosting(state, action: PayloadAction<Posting>) {
      state.posting = action.payload;
      persist({ posting: action.payload });
    },

    /** Clear draft after successful submission */
    clearDraft(state) {
      state.posting = null;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch { /* noop */ }
    },
  },
});

export const { setPosting, clearDraft } = applySlice.actions;
export default applySlice.reducer;
