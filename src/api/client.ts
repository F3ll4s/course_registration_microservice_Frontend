import { useAuthStore } from "@/features/auth/store";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export class ApiError extends Error {
  status: number;
  body: unknown;

  // Fields are written out in full on purpose: the Vite template enables
  // "erasableSyntaxOnly", which rejects constructor shorthand like `public status: number`.
  constructor(status: number, body: unknown) {
    super(`HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

export async function request<T>(base: string, path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (res.status === 401) {
    useAuthStore.getState().logout(); // ProtectedRoute redirects to /login
  }
  if (!res.ok) {
    throw new ApiError(res.status, body);
  }
  return body as T;
}

// Everything goes through the API gateway: auth, catalog, students, enrollments, drops, waitlist.
// The gateway checks the JWT and passes the student id on, so requests never name the student.
export const api = <T>(path: string, init?: RequestInit) => request<T>(API_BASE, path, init);
