import { LogOut } from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { useAuthStore } from "@/features/auth/store";
import { cn } from "@/lib/utils";

// Tab widths are the ones drawn on the Penpot boards
const TABS = [
  { to: "/catalog", label: "1. Search Catalog", width: "w-[170px]" },
  { to: "/timetable", label: "2. Weekly Timetable", width: "w-[185px]" },
  { to: "/cart", label: "3. My Cart / Validation", width: "w-[205px]" },
  { to: "/registered", label: "4. Registered Courses & Waitlist", width: "w-[260px]" },
];

// Page shell for every logged-in view: navbar, tab bar, then the page in <Outlet/>.
// Sizes and colors follow the Penpot "Initial Draft" boards (1280px canvas, 24px gutters).
export function AppLayout() {
  const studentId = useAuthStore((s) => s.studentId);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-svh bg-[#f8fafc]">
      <header className="border-b border-[#e2e8f0] bg-white">
        <div className="mx-auto flex h-[55px] max-w-[1280px] items-center justify-between gap-4 px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-[58px] shrink-0 items-center justify-center rounded-lg bg-[#ff6b00] text-[13px] font-extrabold text-white">
              KMITL
            </span>
            <span className="truncate text-[15px] font-bold text-[#0f172a]">
              STUDENT COURSE REGISTRATION PORTAL
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <span className="hidden h-7 items-center rounded-full border border-[#ffd2b2] bg-[#fff4ed] px-3 text-xs font-semibold text-[#ea580c] sm:flex">
              Academic Year: 2026/1
            </span>
            <div className="flex h-9 items-center gap-2 rounded-full border border-[#e2e8f0] bg-[#f8fafc] pr-1.5 pl-[5px] md:w-[260px]">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#ff6b00] text-[11px] font-bold text-white">
                {studentId?.slice(0, 2)}
              </span>
              <span className="flex-1 truncate text-xs font-semibold text-[#1e293b]">{studentId}</span>
              <button
                type="button"
                onClick={logout}
                aria-label="Log out"
                title="Log out"
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0f172a] focus-visible:outline-2 focus-visible:outline-[#ff6b00]"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="border-b border-[#e2e8f0] bg-white">
        <div className="mx-auto flex h-[45px] max-w-[1280px] items-start gap-3 overflow-x-auto px-6 pt-1.5 lg:overflow-visible">
          {TABS.map(({ to, label, width }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "relative flex h-[34px] shrink-0 items-center rounded-md pl-3.5 text-[13px] whitespace-nowrap",
                  width,
                  isActive
                    ? "bg-[#fff4ed] font-bold text-[#ea580c] after:absolute after:inset-x-2 after:top-[calc(100%+3px)] after:h-[3px] after:rounded-sm after:bg-[#ff6b00]"
                    : "font-medium text-[#64748b] hover:text-[#0f172a]",
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-[1280px] px-6 pt-3.5 pb-10">
        <Outlet />
      </main>
    </div>
  );
}
