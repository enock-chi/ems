/**
 * Base API client for the backend (served via ngrok / Vercel env var).
 *
 * Usage:
 *   import { apiClient } from "@/lib/api";
 *
 *   const data = await apiClient.get("/postings");
 *   const result = await apiClient.post("/auth/login", { email, password });
 */

const BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      // ngrok free tier: bypass the browser-warning interstitial
      "ngrok-skip-browser-warning": "true",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`[api] ${options.method ?? "GET"} ${path} → ${res.status}: ${text}`);
  }

  // Return parsed JSON, or undefined for 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const apiClient = {
  get:    <T = unknown>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),

  post:   <T = unknown>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "POST", body }),

  put:    <T = unknown>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PUT", body }),

  patch:  <T = unknown>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PATCH", body }),

  delete: <T = unknown>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
