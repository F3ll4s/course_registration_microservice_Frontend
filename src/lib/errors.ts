import { ApiError } from "@/api/client";

export function toUserMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return "Too many requests. Please wait a moment and try again.";
    if (err.status === 401) return "Your session has expired. Please log in again.";

    const detail = (err.body as { detail?: unknown } | null)?.detail;
    if (typeof detail === "string") return detail; // FastAPI HTTPException
  }
  return "Something went wrong. Please try again.";
}
