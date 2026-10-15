import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { AppLayout } from "@/app/layouts/AppLayout";
import { ProtectedRoute } from "@/app/ProtectedRoute";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisteredPage } from "@/features/enrollment/RegisteredPage";
import { RegistrationPage } from "@/features/registration/RegistrationPage";

const router = createBrowserRouter([
  // Public
  { path: "/login", element: <LoginPage /> },

  // Everything under ProtectedRoute needs a valid token; otherwise it redirects to /login
  {
    element: <ProtectedRoute />,
    children: [
      {
        // Global header around every logged-in page
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/registration" replace /> },
          { path: "registration", element: <RegistrationPage /> }, // catalog + timetable + cart
          { path: "registered", element: <RegisteredPage /> }, // enrolled courses + waitlist
          // The old one-view-per-tab URLs now all live on the registration page
          ...["catalog", "timetable", "cart"].map((path) => ({
            path,
            element: <Navigate to="/registration" replace />,
          })),
        ],
      },
    ],
  },

  // Unknown URL: go home (which redirects to /registration, or to /login when logged out)
  { path: "*", element: <Navigate to="/" replace /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
