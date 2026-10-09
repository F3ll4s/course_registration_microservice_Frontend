import type { Section } from "@/api/types";

export const isFull = (s: Section) => s.enrolled_count >= s.capacity;
