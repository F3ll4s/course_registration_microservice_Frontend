import { ApiError, api } from "./client";

export type EnrollResult = {
  status: "ENROLLED" | "WAITLISTED" | "REJECTED";
  message?: string;
  detail?: string;
};

export async function enroll(sectionId: number): Promise<EnrollResult> {
  try {
    // Identity comes from the JWT; never send student_id
    return await api<EnrollResult>("/enrollments", {
      method: "POST",
      body: JSON.stringify({ section_id: sectionId }),
    });
  } catch (err) {
    if (
      err instanceof ApiError &&
      err.status === 409 &&
      (err.body as EnrollResult | null)?.status === "WAITLISTED"
    ) {
      return err.body as EnrollResult;
    }
    throw err;
  }
}

export type DropResult = { status?: string; message?: string }; // shape not documented yet

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
