import type { PrereqResult, Section, SectionRow } from "@/api/types";
import { toMin } from "@/lib/time";

export const MAX_CREDITS = 22;

export type CartContext = {
  cart: SectionRow[]; // staged sections (amber on the timetable)
  enrolled: SectionRow[]; // already registered sections (blue on the timetable)
  prereqs: Record<string, PrereqResult | undefined>; // keyed by course code
};
export type RuleResult = { rule: string; ok: boolean; message: string };
export type CartRule = (ctx: CartContext) => RuleResult;

export function sectionsOverlap(a: Section, b: Section): boolean {
  const shareDay = a.schedule_days.some((d) => b.schedule_days.includes(d));
  return (
    shareDay && toMin(a.start_time) < toMin(b.end_time) && toMin(b.start_time) < toMin(a.end_time)
  );
}

export const creditCapRule: CartRule = ({ cart, enrolled }) => {
  const total = [...enrolled, ...cart].reduce((sum, r) => sum + r.course.credits, 0);
  return { rule: "credits", ok: total <= MAX_CREDITS, message: `${total} / ${MAX_CREDITS} Credits` };
};

export const scheduleConflictRule: CartRule = ({ cart, enrolled }) => {
  // A clash only blocks the student when it involves a cart section.
  for (const c of cart) {
    const other = [...enrolled, ...cart].find(
      (r) => r.section.id !== c.section.id && sectionsOverlap(c.section, r.section),
    );
    if (other) {
      return {
        rule: "schedule",
        ok: false,
        message: `Conflict: ${c.section.course_code} Sec ${c.section.section_number} overlaps with ${other.section.course_code} Sec ${other.section.section_number}`,
      };
    }
  }
  return { rule: "schedule", ok: true, message: "Clashes: NONE" };
};

export const prereqRule: CartRule = ({ cart, prereqs }) => {
  const results = cart.map((r) => prereqs[r.course.code]);
  if (results.some((p) => !p)) {
    return { rule: "prereqs", ok: false, message: "Checking prerequisites..." };
  }
  const missing = [...new Set(results.flatMap((p) => p?.missing_prereqs ?? []))];
  const ok = results.every((p) => p?.is_valid);
  return {
    rule: "prereqs",
    ok,
    message: ok ? "Prereqs: MET" : `Prereqs: MISSING ${missing.join(", ")}`,
  };
};

export const DEFAULT_RULES: CartRule[] = [creditCapRule, scheduleConflictRule, prereqRule];

export const runRules = (ctx: CartContext, rules: CartRule[] = DEFAULT_RULES): RuleResult[] =>
  rules.map((rule) => rule(ctx));

export const canConfirm = (ctx: CartContext): boolean =>
  ctx.cart.length > 0 && runRules(ctx).every((r) => r.ok);
