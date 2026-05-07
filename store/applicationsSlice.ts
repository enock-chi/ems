import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Application } from "./types";

// ─── State ────────────────────────────────────────────────────────────────────

interface ApplicationsState {
  server: Application[];
  draft: Application[];
  dirtyIds: string[];
  status: "idle" | "loading" | "error";
}

const STORAGE_KEY = "ems_hr_applications";

function loadFromStorage(): Application[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Handle old shape { applications: Application[] } and new shape Application[]
    if (Array.isArray(parsed)) return parsed as Application[];
    if (parsed && Array.isArray(parsed.applications)) return parsed.applications as Application[];
    return [];
  } catch {
    return [];
  }
}

const initial = loadFromStorage();

const initialState: ApplicationsState = {
  server: initial,
  draft: initial,
  dirtyIds: [],
  status: "idle",
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const applicationsSlice = createSlice({
  name: "applications",
  initialState,
  reducers: {
    serverLoaded(state, action: PayloadAction<Application[]>) {
      state.server = action.payload;
      state.draft = action.payload.map((serverApp) => {
        const existingDraft = state.draft.find((d) => d.id === serverApp.id);
        const isDirty = state.dirtyIds.includes(serverApp.id);
        return isDirty && existingDraft ? existingDraft : serverApp;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(action.payload));
      } catch { /* quota */ }
    },

    updateDraft(
      state,
      action: PayloadAction<{ id: string; changes: Partial<Omit<Application, "id">> }>
    ) {
      const { id, changes } = action.payload;
      const idx = state.draft.findIndex((a) => a.id === id);
      if (idx !== -1) {
        state.draft[idx] = { ...state.draft[idx], ...changes };
        if (!state.dirtyIds.includes(id)) state.dirtyIds.push(id);
      }
    },

    revertDraft(state, action: PayloadAction<string>) {
      const id = action.payload;
      const server = state.server.find((a) => a.id === id);
      if (server) {
        const idx = state.draft.findIndex((a) => a.id === id);
        if (idx !== -1) state.draft[idx] = server;
      }
      state.dirtyIds = state.dirtyIds.filter((d) => d !== id);
    },

    markSaved(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.dirtyIds = state.dirtyIds.filter((d) => d !== id);
      const draft = state.draft.find((a) => a.id === id);
      if (draft) {
        const idx = state.server.findIndex((a) => a.id === id);
        if (idx !== -1) state.server[idx] = draft;
      }
    },

    setStatus(state, action: PayloadAction<ApplicationsState["status"]>) {
      state.status = action.payload;
    },
  },
});

export const { serverLoaded, updateDraft, revertDraft, markSaved, setStatus } =
  applicationsSlice.actions;
export default applicationsSlice.reducer;
