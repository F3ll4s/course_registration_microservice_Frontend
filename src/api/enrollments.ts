import { ApiError, api } from "./client";
import type { Enrollment, WaitlistEntry } from "./types";

// 201 ENROLLED, 409 WAITLISTED (section full) or 400 REJECTED (a validation rule failed).
// All three carry this body; a duplicate request is a 409 with only `detail` and stays an error.
export type EnrollResult = {
  status: "ENROLLED" | "WAITLISTED" | "REJECTED";
  message: string;
  waitlist_position?: number | null;
  rule_name?: string | null;
};

const RESULT_STATUS: Record<number, EnrollResult["status"]> = { 409: "WAITLISTED", 400: "REJECTED" };

export async function enroll(sectionId: number): Promise<EnrollResult> {
  try {
    // Identity comes from the JWT; never send student_id
    return await api<EnrollResult>("/enrollments", {
      method: "POST",
      body: JSON.stringify({ section_id: sectionId }),
    });
  } catch (err) {
    if (err instanceof ApiError && (err.body as EnrollResult | null)?.status === RESULT_STATUS[err.status]) {
      return err.body as EnrollResult;
    }
    throw err;
  }
}

// Also leaves a waitlist or declines a seat offer. 404 when there is nothing to drop.
export type DropResult = { status: "DROPPED"; message: string };

export const drop = (sectionId: number) =>
  api<DropResult>("/drops", { method: "POST", body: JSON.stringify({ section_id: sectionId }) });

export type ClaimResult = {
  status: "CLAIMED" | "EXPIRED_OR_ALREADY_CLAIMED";
  message?: string;
};

export const claimWaitlist = (offerId: number) =>
  api<ClaimResult>("/waitlist/claim", {
    method: "POST",
    body: JSON.stringify({ offer_id: offerId }),
  });

export const getMyEnrollments = () => api<Enrollment[]>("/enrollments/me");

export const getMyWaitlist = () => api<WaitlistEntry[]>("/waitlist/me");
