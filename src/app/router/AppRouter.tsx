import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { ProtectedRoute } from "@/app/ProtectedRoute";

// Stand-in until the real page exists. Replace each <Placeholder /> below with the page component.
function Placeholder({ title }: { title: string }) {
  return <h1 className="p-8 text-2xl font-semibold">{title}</h1>;
}

const router = createBrowserRouter([
  // Public
  { path: "/login", element: <Placeholder title="Login" /> },

  // Everything under ProtectedRoute needs a valid token; otherwise it redirects to /login
  {
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/catalog" replace /> },
      { path: "catalog", element: <Placeholder title="Course Catalog" /> }, // View 1
      { path: "timetable", element: <Placeholder title="Weekly Timetable" /> }, // View 2
      { path: "cart", element: <Placeholder title="Registration Cart" /> }, // View 3
      { path: "registered", element: <Placeholder title="Registered Courses" /> }, // View 4
    ],
  },

  // Unknown URL: go home (which redirects to /catalog, or to /login when logged out)
  { path: "*", element: <Navigate to="/" replace /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
