import { jwtDecode } from "jwt-decode";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useCartStore } from "@/features/cart/store";

type Claims = { sub: string; exp: number };

type AuthState = {
  token: string | null;
  studentId: string | null;
  login: (token: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      studentId: null,
      login: (token) => set({ token, studentId: jwtDecode<Claims>(token).sub }),
      logout: () => {
        useCartStore.getState().clear(); // the cart belongs to the logged-in student
        set({ token: null, studentId: null });
      },
    }),
    { name: "auth", storage: createJSONStorage(() => sessionStorage) },
  ),
);

export function isTokenExpired(token: string): boolean {
  return jwtDecode<Claims>(token).exp * 1000 <= Date.now();
}
