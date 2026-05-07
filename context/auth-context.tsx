"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

export type UserRole = "hr" | "applicant";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface StoredSession {
  user: AuthUser;
  expiresAt: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "ems_auth_session";
// Rolling 7-day session — long enough for multi-day CV work.
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
// How often to tick-check for expiry (every minute).
const CHECK_INTERVAL_MS = 60_000;
// Debounce activity refresh to at most once every 5 minutes.
const ACTIVITY_DEBOUNCE_MS = 5 * 60 * 1000;

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as StoredSession;
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function writeSession(user: AuthUser): void {
  const session: StoredSession = {
    user,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const lastActivityRefresh = useRef<number>(0);

  // Hydrate from storage on mount.
  useEffect(() => {
    const session = readSession();
    if (session) setUser(session.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const login = useCallback((authUser: AuthUser) => {
    writeSession(authUser);
    lastActivityRefresh.current = Date.now();
    setUser(authUser);
  }, []);

  // Periodic expiry check — catches the case where the tab is left open.
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      const session = readSession();
      if (!session) {
        setUser(null); // expired
      }
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [user]);

  // Re-check (and refresh) on tab focus.
  useEffect(() => {
    if (!user) return;
    const onFocus = () => {
      const session = readSession();
      if (!session) { setUser(null); return; }
      // Refresh expiry on focus too.
      writeSession(session.user);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user]);

  // Rolling expiry: extend session on user activity (debounced).
  useEffect(() => {
    if (!user) return;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastActivityRefresh.current < ACTIVITY_DEBOUNCE_MS) return;
      const session = readSession();
      if (!session) { setUser(null); return; }
      writeSession(session.user);
      lastActivityRefresh.current = now;
    };
    const events = ["mousemove", "keydown", "pointerdown", "scroll"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, onActivity));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
