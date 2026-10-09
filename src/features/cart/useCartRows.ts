import { useCatalog } from "@/features/catalog/useCatalog";
import { useCartStore } from "./store";

export function useCartRows() {
  const ids = useCartStore((s) => s.sectionIds);
  const { rows } = useCatalog({ search: "", department: "", openOnly: false });
  return rows.filter((r) => ids.includes(r.section.id));
}
