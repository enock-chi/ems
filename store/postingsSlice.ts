import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Posting } from "./types";

// ─── State ────────────────────────────────────────────────────────────────────

export interface PostingsFilter {
  search: string;
  department: string; // "" = all
}

interface PostingsState {
  /** Last data synced from the server */
  server: Posting[];
  /** Working copy — edits happen here before being saved */
  draft: Posting[];
  /** IDs of postings with unsaved local changes */
  dirtyIds: number[];
  status: "idle" | "loading" | "error";
  filter: PostingsFilter;
}

const STORAGE_KEY = "ems_hr_postings";

function loadFromStorage(): Posting[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Handle old shape { postings: Posting[] } and new shape Posting[]
    if (Array.isArray(parsed)) return parsed as Posting[];
    if (parsed && Array.isArray(parsed.postings)) return parsed.postings as Posting[];
    return [];
  } catch {
    return [];
  }
}

const initial = loadFromStorage();

const initialState: PostingsState = {
  server: initial,
  draft: initial,
  dirtyIds: [],
  status: "idle",
  filter: { search: "", department: "" },
};

// ─── Async thunk ─────────────────────────────────────────────────────────────

export const fetchPostings = createAsyncThunk("postings/fetch", async () => {
  const { apiClient } = await import("@/lib/api");
  return apiClient.get<Posting[]>("/postings");
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const postingsSlice = createSlice({
  name: "postings",
  initialState,
  reducers: {
    /** Called when fresh data arrives from Hygraph */
    serverLoaded(state, action: PayloadAction<Posting[]>) {
      state.server = action.payload;
      // Merge: keep local draft edits for dirty postings, replace the rest
      state.draft = action.payload.map((serverPosting) => {
        const existingDraft = state.draft.find((d) => d.id === serverPosting.id);
        const isDirty = state.dirtyIds.includes(serverPosting.id);
        return isDirty && existingDraft ? existingDraft : serverPosting;
      });
      // Persist clean server data to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(action.payload));
      } catch { /* quota */ }
    },

    /** Edit a field on a draft posting */
    updateDraft(
      state,
      action: PayloadAction<{ id: number; changes: Partial<Omit<Posting, "id">> }>
    ) {
      const { id, changes } = action.payload;
      const idx = state.draft.findIndex((p) => p.id === id);
      if (idx !== -1) {
        state.draft[idx] = { ...state.draft[idx], ...changes };
        if (!state.dirtyIds.includes(id)) state.dirtyIds.push(id);
      }
    },

    /** Discard local edits and revert to server version */
    revertDraft(state, action: PayloadAction<number>) {
      const id = action.payload;
      const server = state.server.find((p) => p.id === id);
      if (server) {
        const idx = state.draft.findIndex((p) => p.id === id);
        if (idx !== -1) state.draft[idx] = server;
      }
      state.dirtyIds = state.dirtyIds.filter((d) => d !== id);
    },

    /** Mark a posting as saved (clears dirty flag) */
    markSaved(state, action: PayloadAction<number>) {
      const id = action.payload;
      state.dirtyIds = state.dirtyIds.filter((d) => d !== id);
      // Promote draft to server snapshot
      const draft = state.draft.find((p) => p.id === id);
      if (draft) {
        const idx = state.server.findIndex((p) => p.id === id);
        if (idx !== -1) state.server[idx] = draft;
      }
    },

    setStatus(state, action: PayloadAction<PostingsState["status"]>) {
      state.status = action.payload;
    },

    /** Add a newly created posting straight into server + draft */
    addPosting(state, action: PayloadAction<Posting>) {
      state.server.push(action.payload);
      state.draft.push(action.payload);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.server)); } catch { /* quota */ }
    },

    /** Remove a deleted posting from server + draft */
    removePosting(state, action: PayloadAction<number>) {
      state.server = state.server.filter((p) => p.id !== action.payload);
      state.draft  = state.draft.filter((p)  => p.id !== action.payload);
      state.dirtyIds = state.dirtyIds.filter((id) => id !== action.payload);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.server)); } catch { /* quota */ }
    },

    setFilter(state, action: PayloadAction<Partial<PostingsFilter>>) {
      state.filter = { ...state.filter, ...action.payload };
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchPostings.pending, (state) => { state.status = "loading"; })
      .addCase(fetchPostings.fulfilled, (state, action) => {
        state.status = "idle";
        state.server = action.payload;
        state.draft = action.payload.map((sp) => {
          const existing = state.draft.find((d) => d.id === sp.id);
          return state.dirtyIds.includes(sp.id) && existing ? existing : sp;
        });
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(action.payload)); } catch { /* quota */ }
      })
      .addCase(fetchPostings.rejected, (state) => { state.status = "error"; });
  },
});

export const { serverLoaded, updateDraft, revertDraft, markSaved, setStatus, addPosting, removePosting, setFilter } =
  postingsSlice.actions;
export default postingsSlice.reducer;

// ─── Selector ─────────────────────────────────────────────────────────────────

import type { RootState } from "./index";

export function selectFilteredPostings(state: RootState): Posting[] {
  const { draft, filter } = state.postings;
  const search = filter.search.toLowerCase();
  return draft.filter((p) => {
    const matchesDept = !filter.department || p.department === filter.department;
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search) ||
      p.ref_code.toLowerCase().includes(search) ||
      p.department.toLowerCase().includes(search) ||
      p.location.toLowerCase().includes(search);
    return matchesDept && matchesSearch;
  });
}

export function selectDepartments(state: RootState): string[] {
  const depts = state.postings.draft
    .map((p) => p.department)
    .filter(Boolean);
  return [...new Set(depts)].sort();
}
