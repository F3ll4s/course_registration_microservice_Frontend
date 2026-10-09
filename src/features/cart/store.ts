import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type CartState = {
  sectionIds: number[];
  add: (id: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      sectionIds: [],
      add: (id) =>
        set((s) => (s.sectionIds.includes(id) ? s : { sectionIds: [...s.sectionIds, id] })),
      remove: (id) => set((s) => ({ sectionIds: s.sectionIds.filter((x) => x !== id) })),
      clear: () => set({ sectionIds: [] }),
    }),
    { name: "cart", storage: createJSONStorage(() => sessionStorage) },
  ),
);
