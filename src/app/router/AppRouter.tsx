import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { AppLayout } from "@/app/layouts/AppLayout";
import { ProtectedRoute } from "@/app/ProtectedRoute";
import { LoginPage } from "@/features/auth/LoginPage";
import { CartPage } from "@/features/cart/CartPage";
import { CatalogPage } from "@/features/catalog/CatalogPage";
import { RegisteredPage } from "@/features/enrollment/RegisteredPage";
import { TimetablePage } from "@/features/timetable/TimetablePage";

const router = createBrowserRouter([
  // Public
  { path: "/login", element: <LoginPage /> },

  // Everything under ProtectedRoute needs a valid token; otherwise it redirects to /login
  {
    element: <ProtectedRoute />,
    children: [
      {
        // Navbar + tab bar around every logged-in page
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/catalog" replace /> },
          { path: "catalog", element: <CatalogPage /> }, // View 1
          { path: "timetable", element: <TimetablePage /> }, // View 2
          { path: "cart", element: <CartPage /> }, // View 3
          { path: "registered", element: <RegisteredPage /> }, // View 4
        ],
      },
    ],
  },

  // Unknown URL: go home (which redirects to /catalog, or to /login when logged out)
  { path: "*", element: <Navigate to="/" replace /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
