import { Menu } from "@base-ui/react/menu";
import { BookOpenCheck, CalendarRange, LogOut, Settings, UserRound } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Dot } from "@/components/portal";
import { useAuthStore } from "@/features/auth/store";
import { MAX_CREDITS } from "@/features/cart/rules";
import { useEnrolledRows } from "@/features/enrollment/useMyEnrollments";
import { useOfferAlerts } from "@/features/enrollment/useOfferAlerts";
import { cn } from "@/lib/utils";

const PAGES = [
  { to: "/registration", label: "Course Registration", Icon: CalendarRange },
  { to: "/registered", label: "Registered Courses & Waitlist", Icon: BookOpenCheck },
];

const MENU_ITEM =
  "flex h-9 cursor-default items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-[#334155] outline-none select-none data-highlighted:bg-[#f1f5f9] data-highlighted:text-[#0f172a] [&_svg]:size-4 [&_svg]:text-[#64748b]";

// Page shell for every logged-in view: the Penpot "Design #1" Persistent Global Header, then the page.
// Design #1 has no tab bar; the Profile menu switches between the two pages and logs out.
export function AppLayout() {
  useOfferAlerts();

  return (
    <div className="min-h-svh bg-[#f8fafc]">
      <header className="border-b border-[#e2e8f0] bg-white">
        <div className="mx-auto flex min-h-[72px] max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-8 w-[42px] shrink-0 items-center justify-center rounded-lg bg-[#ff5722] text-xs font-extrabold text-white">
              KMITL
            </span>
            <span className="truncate text-[15px] font-bold text-[#0f172a]">STUDENT COURSE REGISTRATION PORTAL</span>
            <span className="hidden h-7 shrink-0 items-center rounded-full border border-[#cbd5e1] bg-[#f1f5f9] px-2 text-xs font-semibold text-[#475569] lg:flex">
              Term: 2026/1
            </span>
            {/* The backend has no registration-window endpoint yet, so the window is shown as open */}
            <span className="hidden h-7 shrink-0 items-center gap-1.5 rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-2.5 text-xs font-semibold text-[#065f46] lg:flex">
              <Dot tone="green" />
              Window Open
            </span>
          </div>

          <div className="flex items-center gap-5">
            <CreditMeter />
            <StudentPill />
            <ProfileMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 pt-6 pb-10 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

// "Credits: 12 / 22 Cr" with a bar, counting enrolled sections only
function CreditMeter() {
  const { rows } = useEnrolledRows();
  const credits = rows.reduce((sum, r) => sum + r.course.credits, 0);

  return (
    <div className="hidden items-center gap-2.5 md:flex">
      <span className="text-[13px] font-semibold text-[#0f172a]">
        Credits: {credits} / {MAX_CREDITS} Cr
      </span>
      <span
        role="meter"
        aria-label="Enrolled credits"
        aria-valuenow={credits}
        aria-valuemin={0}
        aria-valuemax={MAX_CREDITS}
        className="h-2 w-[110px] overflow-hidden rounded-full border border-[#e2e8f0] bg-[#f1f5f9]"
      >
        <span
          className="block h-full rounded-full bg-[#ff5722]"
          style={{ width: `${Math.min(100, (credits / MAX_CREDITS) * 100)}%` }}
        />
      </span>
    </div>
  );
}

function StudentPill() {
  const studentId = useAuthStore((s) => s.studentId);
  return (
    <div className="hidden h-9 items-center gap-2 rounded-full border border-[#e2e8f0] bg-[#f1f5f9] pr-3.5 pl-1.5 sm:flex">
      <span className="flex size-6 items-center justify-center rounded-full border border-[#ffccbc] bg-[#fff3e0] text-[#ff5722]">
        <UserRound className="size-3.5" strokeWidth={2.5} />
      </span>
      <span className="text-[13px] font-semibold text-[#0f172a]">{studentId}</span>
    </div>
  );
}

function ProfileMenu() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const logout = useAuthStore((s) => s.logout);

  return (
    <Menu.Root>
      <Menu.Trigger className="flex h-9 items-center gap-1.5 rounded-md border border-[#cbd5e1] bg-white px-3.5 text-[13px] font-semibold text-[#475569] outline-none hover:bg-[#f8fafc] focus-visible:ring-2 focus-visible:ring-[#ff5722]/40 data-popup-open:bg-[#f1f5f9]">
        Profile
        <Settings className="size-3.5" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={6} className="z-50">
          <Menu.Popup className="w-64 rounded-lg border border-[#e2e8f0] bg-white p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.12)] outline-none">
            {PAGES.map(({ to, label, Icon }) => (
              <Menu.Item
                key={to}
                onClick={() => navigate(to)}
                aria-current={pathname === to ? "page" : undefined}
                className={cn(
                  MENU_ITEM,
                  pathname === to && "font-bold text-[#d84315] data-highlighted:text-[#d84315] [&_svg]:text-[#ff5722]",
                )}
              >
                <Icon />
                {label}
              </Menu.Item>
            ))}
            <Menu.Separator className="my-1.5 h-px bg-[#e2e8f0]" />
            <Menu.Item onClick={logout} className={MENU_ITEM}>
              <LogOut />
              Log out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
