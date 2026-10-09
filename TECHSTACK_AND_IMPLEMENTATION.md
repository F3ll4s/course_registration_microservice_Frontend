# Technology Stack & Implementation Guide — Frontend

## Next-Gen Student Course Registration System (Project II) — Web Client

> **Audience**: Team Implementation & Technical Defense
> **Course**: 13016228 Software Design and Architecture (KMITL)
> **Tech Stack**: React 19 / TypeScript / Vite / React Router / TanStack Query / Zustand / Tailwind CSS / shadcn/ui
> **Package & Toolchain Manager**: **npm** (bundled with Node.js 22+)

---

## 1. Tech Stack Selection & Architectural Rationale

Two frontend engineers, one semester, and a backend that is still being finished. The stack optimises for **speed of delivery**, **type safety against the backend contract**, and **being able to build without waiting for the backend**.

| Layer                      | Technology                           | Architectural Rationale                                                                                                           |
| -------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **Language**               | **TypeScript (strict)**              | Mirrors the backend's strict typing (Pydantic). Wrong field names fail at compile time, not in the demo.                          |
| **UI Library**             | **React 19**                         | Largest ecosystem and hiring/learning material; component model fits dashboards and forms.                                        |
| **Build Tool / Dev Server**| **Vite**                             | Instant dev server, simple config, built-in dev **proxy** to the gateway and the catalog service (no CORS during development).                            |
| **Routing**                | **React Router (v8)**                | Standard SPA routing with nested layouts and route guards for the protected area.                                                 |
| **Server State**           | **TanStack Query**                   | Caching, request de-duplication, polling (`refetchInterval`) for notifications and seat counts, mutation + invalidation for enroll/drop. |
| **Client State**           | **Zustand**                          | Tiny store for the only real client state: the JWT and the student id. No Redux boilerplate.                                      |
| **Forms & Validation**     | **React Hook Form + Zod**            | Typed forms with schema validation (login, drop confirmation, search filters).                                                    |
| **Styling & Components**   | **Tailwind CSS + shadcn/ui**         | Accessible, copy-in components (dialogs, tables, badges, toasts) that the team owns; fast to make a polished UI.                  |
| **HTTP**                   | **Native `fetch` + thin wrapper**    | No extra dependency; we need to treat `409 WAITLISTED` as a result, which is easier with a small wrapper than with Axios defaults. |
| **Mock Backend**           | **MSW (Mock Service Worker)**        | Lets the frontend run, test and demo **without the backend**. Critical while backend tasks are still in progress.                  |
| **Unit / Component Tests** | **Vitest + React Testing Library**   | Same config as Vite, fast, familiar Jest-style API.                                                                               |
| **E2E Tests**              | **Playwright**                       | Verifies login -> enroll -> drop and the waitlist flow in a real browser.                                                         |
| **Linting**                | **ESLint** (Vite template default)   | Catches real bugs (unused variables, React hook rules) with zero extra setup. Formatting is left to the editor's format-on-save. |

### Why a SPA (Vite) and not Next.js?

The backend already owns auth, business logic and data. The frontend is a client for the gateway, so server-side rendering and a second server runtime add complexity without benefit. A Vite SPA is simpler to run and demo: the build output is just static files.

### Why npm?

1. **Nothing extra to install**: npm ships with Node.js, so there is no setup step for either teammate or the demo machine.
2. **Deterministic `package-lock.json`**: commit it, and every teammate and the demo machine get identical versions. Use `npm ci` instead of `npm install` when you want a clean, exact install from the lockfile (for example on a fresh demo machine).
3. **Familiar to everyone**: it is the default in most tutorials and course material, which keeps onboarding short for a two-person team.

Always add packages with `npm install <name>`, so every dependency is declared in `package.json`. npm's flat `node_modules` lets code import a package that is only installed indirectly, which works locally but can break on another machine.

### Why MSW?

The catalog service is live, but the enrollment flow is still being connected (the backend README shows several unchecked tasks). MSW gives the frontend three run modes, switched by one command:

| Command            | Catalog (`/catalog/*`) | Gateway (`/api/v1/*`: login, enroll, drop, waitlist) |
| ------------------ | ---------------------- | ----------------------------------------------------- |
| `npm run dev`         | real (`:8002`)         | real (`:8000`)                                        |
| `npm run dev:hybrid`  | real (`:8002`)         | **mocked**                                            |
| `npm run dev:mock`    | mocked                 | mocked                                                |

The same handlers power the Vitest tests.

---

## 2. Initial Scaffold (One Person, Once)

The GitHub repo already exists and is empty, so clone it first and create the Vite project **inside** it (the `.` means "this folder"). That way the repo is already connected and you can push straight away. Run every command on **one line** (no `\` line breaks) so it works on Windows, Mac and Linux.

### Step 1: Create the project and install the packages

```
git clone https://github.com/F3ll4s/course_registration_microservice_Frontend.git
cd course_registration_microservice_Frontend

npm create vite@latest . -- --template react-ts
npm install

npm install react-router @tanstack/react-query zustand jwt-decode tailwindcss @tailwindcss/vite
npm install -D @types/node msw vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

If the Vite command asks about experimental options, or whether to install and start now, answer **No**. You run `npm install` yourself right after.

### Step 2: Edit four config files (before shadcn)

`shadcn init` fails without the first three edits (it cannot find Tailwind or the `@/` import alias).

1. `src/index.css`: replace all of its contents with `@import "tailwindcss";`
2. `tsconfig.json` **and** `tsconfig.app.json`: add `"baseUrl": "."` and `"paths": { "@/*": ["./src/*"] }` under `compilerOptions`. In `tsconfig.json` there is no `compilerOptions` yet, so add the whole block, with a comma after the `references` array.
3. `vite.config.ts`: replace it with the full file from section 3 below.
4. `package.json`: replace the `scripts` block with the one from section 3 (this adds `dev:mock` and `dev:hybrid`). shadcn does not need this one, but you need it before you run the mock modes.

The Vite template already includes ESLint (`eslint.config.js`); keep it as it is.

### Step 3: Replace the demo files and check that it works

Delete the demo files the Vite template created, because `src/app/App.tsx` replaces them: `src/App.tsx`, `src/App.css` and the files in `src/assets/`. Then replace `src/main.tsx` and create `src/app/App.tsx` (make the `app` folder first):

```tsx
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./index.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

```tsx
// src/app/App.tsx
export function App() {
  return <h1 className="p-8 text-3xl font-bold text-blue-600">It works</h1>;
}
```

Run `npm run dev` and open `http://localhost:5173`. Big blue bold text means Vite, Tailwind and the `@/` alias all work.

This `main.tsx` is the short version for now. The mock-aware version in section 5 imports `src/mocks/browser.ts`, which does not exist yet, and Vite shows an error for an import it cannot find. Switch to the section 5 version once `src/mocks/` exists.

### Step 4: Add shadcn/ui and the mock service worker

```
npx shadcn@latest init
npx shadcn@latest add button input label card table badge dialog sonner
npx msw init public/ --save
```

Accept the defaults when shadcn asks questions. `shadcn init` adds theme variables to `src/index.css`; that is expected, so keep them.

### Step 5: Install later, only when you reach them

Skipping these now keeps setup short and fast:

```
npm install react-hook-form zod @hookform/resolvers
npm install -D @playwright/test
```

`react-hook-form` and `zod` are for login form validation (plain `useState` also works). Playwright is for end-to-end tests and downloads whole browsers, so do it last.

### Step 6: Add the project files and push the baseline

1. Copy the final `README.md` and `TECHSTACK_AND_IMPLEMENTATION.md` into the project root, replacing the template's `README.md`. Create a `docs` folder and put the backend team's `FRONTEND_GUIDE.md` in it.
2. Create `.env.example` in the project root with the content shown in section 3, then make a copy of it named `.env`.
3. Open `.gitignore` in your editor and add a new line containing `.env`. The Vite `.gitignore` does not ignore it, and this keeps secrets out of git. Use the editor rather than `echo >> .gitignore`, which can corrupt the file in older Windows PowerShell.
4. Run `git status`. `node_modules` must **not** be listed, and `.env` must not be listed either.
5. Commit and push:

```
git add .
git commit -m "chore: scaffold Vite + React + TypeScript baseline"
git push origin main
```

Push this baseline to `main` **before** the second teammate starts, so both branch from the same scaffold. The second teammate must first be added under the repo's **Settings -> Collaborators**, then runs the clone steps from the README quickstart.

### TypeScript rules to know

These come from `tsconfig.app.json` in the Vite template. The editor shows an error if you break one:

- `erasableSyntaxOnly`: do not use `enum`, `namespace`, or constructor shorthand such as `constructor(public x: number)`. Use string unions (`"ENROLLED" | "WAITLISTED"`) and normal class fields instead.
- `verbatimModuleSyntax`: import types with `import type { Section } from "..."`, or inline as `import { type Section, getX } from "..."`.
- `noUnusedLocals` / `noUnusedParameters`: unused variables and parameters are errors, so delete them (or prefix an unused parameter with `_`).

---

## 3. Project Directory Structure

```
course_registration_microservice_Frontend/
├── package.json                    # Scripts + dependencies (managed via npm)
├── package-lock.json               # Deterministic lockfile
├── vite.config.ts                  # Dev proxy, @/ alias, Vitest config
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── eslint.config.js                # Vite template + override for shadcn/ui files
├── components.json                 # shadcn/ui config
├── index.html                      # Vite entry page
├── .env.example                    # Copy to .env for local overrides
├── .env.test                       # Absolute base URLs for Vitest
├── .gitignore
├── README.md
├── TECHSTACK_AND_IMPLEMENTATION.md
│
├── docs/
│   └── FRONTEND_GUIDE.md           # Catalog API cheat sheet from the backend team
│
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── mockServiceWorker.js        # Generated by `msw init` (do not edit)
│
└── src/
    ├── main.tsx                    # Starts MSW in `mock` / `hybrid` mode, then renders <App/>
    ├── index.css                   # Tailwind import + shadcn theme variables
    │
    ├── app/
    │   ├── App.tsx                 # Root component (imported by main.tsx)
    │   ├── ProtectedRoute.tsx      # Protection Proxy (client side)
    │   ├── layouts/                # (empty) page shell: navbar + <Outlet/>
    │   ├── provider/               # (empty) QueryClientProvider, Toaster
    │   └── router/
    │       └── AppRouter.tsx       # (empty) route table
    │
    ├── api/                        # Facade over the gateway and the catalog service
    │   ├── client.ts               # fetch wrapper (two bases), ApiError, 401 handling
    │   ├── types.ts                # Shared DTO types (mirror backend schemas)
    │   ├── auth.ts                 # login()
    │   ├── catalog.ts              # getCourses(), getSections(), validatePrereqs()
    │   ├── enrollments.ts          # enroll(), drop(), claimWaitlist()
    │   └── enrollments.test.ts     # enroll() 201 / 409 WAITLISTED
    │
    ├── features/
    │   ├── auth/
    │   │   └── store.ts            # JWT + student id (Zustand, sessionStorage)
    │   ├── catalog/                # View 1
    │   │   ├── useCatalog.ts       # courses + sections, joined on the client
    │   │   ├── SeatBadge.tsx
    │   │   └── seats.ts            # isFull()
    │   ├── timetable/              # View 2
    │   │   └── TimetableBlock.tsx
    │   ├── cart/                   # View 3
    │   │   ├── store.ts            # staged section ids
    │   │   ├── rules.ts            # credit cap, schedule conflict, prereq rules
    │   │   ├── useCartRows.ts
    │   │   ├── usePrereqChecks.ts
    │   │   └── useConfirmCart.ts
    │   └── enrollment/             # View 4
    │       ├── status.ts           # STATUS_UI map
    │       └── useEnroll.ts
    │
    ├── components/ui/              # shadcn/ui primitives (shared)
    │   └── badge.tsx, button.tsx, card.tsx, dialog.tsx, input.tsx, label.tsx, sonner.tsx, table.tsx
    │
    ├── lib/
    │   ├── errors.ts               # toUserMessage(err)
    │   ├── utils.ts                # cn() helper (shadcn)
    │   └── time.ts                 # toMin(), parseServerTime(), useCountdown()
    │
    ├── mocks/
    │   ├── browser.ts              # setupWorker(...handlers)
    │   ├── server.ts               # setupServer(...handlers) for Vitest
    │   └── handlers/
    │       └── auth.ts, catalog.ts, enrollment.ts
    │
    └── test/
        └── setup.ts                # jest-dom matchers, MSW server lifecycle
```

This tree shows the files that exist today. Still to add: the page components for each view (`LoginPage`, `CatalogPage`, `TimetablePage`, `CartPage`, `RegisteredPage` and their sub-components), `api/students.ts` and `api/notifications.ts` (paths not confirmed by the backend yet), the optional `student/` and `notifications/` features, and the Playwright specs in `e2e/`.

### `package.json` (scripts)

```json
{
  "scripts": {
    "dev": "vite",
    "dev:hybrid": "vite --mode hybrid",
    "dev:mock": "vite --mode mock",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -b",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

### `.env.example`

```
# Gateway calls: auth, enrollments, drops, waitlist
VITE_API_BASE_URL=/api/v1

# Catalog calls (live on :8002 today). Switch to /api/v1 once the gateway fronts the catalog.
VITE_CATALOG_BASE_URL=/catalog

# Dev proxy targets, used only by vite.config.ts
VITE_GATEWAY_URL=http://localhost:8000
VITE_CATALOG_URL=http://localhost:8002
```

### `vite.config.ts`

```ts
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
    server: {
      port: 5173,
      // The browser only calls same-origin paths on the Vite server; Vite forwards them.
      // Result: no CORS configuration needed in development.
      proxy: {
        // /api/v1/... -> gateway (:8000), path unchanged
        "/api": {
          target: env.VITE_GATEWAY_URL ?? "http://localhost:8000",
          changeOrigin: true,
        },
        // /catalog/courses -> http://localhost:8002/courses (prefix stripped)
        "/catalog": {
          target: env.VITE_CATALOG_URL ?? "http://localhost:8002",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/catalog/, ""),
        },
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.ts",
      exclude: ["e2e/**", "node_modules/**"],
    },
  };
});
```

Add `"paths": { "@/*": ["./src/*"] }` (with `"baseUrl": "."`) to `tsconfig.app.json` so the `@/` alias type-checks.

---

## 4. Implementation Guide (Key Building Blocks)

### 4.1 API Client Facade (`src/api/client.ts`)

Every request goes through one function, `request`, with two thin wrappers: `api` for the gateway and `catalogApi` for the catalog service. It attaches the token when one exists, parses JSON, and throws a typed `ApiError` for non-2xx responses. A `401` logs the user out centrally.

```ts
import { useAuthStore } from "@/features/auth/store";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const CATALOG_BASE = import.meta.env.VITE_CATALOG_BASE_URL ?? "/catalog";

export class ApiError extends Error {
  status: number;
  body: unknown;

  // Fields are written out in full on purpose: the Vite template enables
  // "erasableSyntaxOnly", which rejects constructor shorthand like `public status: number`.
  constructor(status: number, body: unknown) {
    super(`HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

export async function request<T>(base: string, path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (res.status === 401) {
    useAuthStore.getState().logout(); // ProtectedRoute redirects to /login
  }
  if (!res.ok) {
    throw new ApiError(res.status, body);
  }
  return body as T;
}

// Gateway: auth, enrollments, drops, waitlist
export const api = <T>(path: string, init?: RequestInit) => request<T>(API_BASE, path, init);

// Catalog service: courses, sections, validate-prereqs.
// Today this is the catalog on :8002 via the /catalog proxy; later the gateway may front it.
export const catalogApi = <T>(path: string, init?: RequestInit) =>
  request<T>(CATALOG_BASE, path, init);
```

### 4.2 Auth Store (`src/features/auth/store.ts`)

The token lives in a Zustand store persisted to `sessionStorage` (cleared when the tab closes). The student id is read from the JWT `sub` claim, never typed by the user after login.

```ts
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
```

### 4.3 Route Guard — Client-Side Protection Proxy (`src/app/ProtectedRoute.tsx`)

```tsx
import { Navigate, Outlet, useLocation } from "react-router";
import { isTokenExpired, useAuthStore } from "@/features/auth/store";

export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();

  if (!token || isTokenExpired(token)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
```

### 4.4 Enrollment: `409 WAITLISTED` Is a Result, Not an Error (`src/api/enrollments.ts`)

The backend returns `201 {"status": "ENROLLED"}` on success and `409 {"status": "WAITLISTED"}` when the section is full. The facade converts the 409 into a normal return value so the UI never treats it as a failure.

```ts
import { ApiError, api } from "./client";

export type EnrollResult = {
  status: "ENROLLED" | "WAITLISTED" | "REJECTED";
  message?: string;
  detail?: string;
};

export async function enroll(sectionId: number): Promise<EnrollResult> {
  try {
    // Identity comes from the JWT; never send student_id
    return await api<EnrollResult>("/enrollments", {
      method: "POST",
      body: JSON.stringify({ section_id: sectionId }),
    });
  } catch (err) {
    if (
      err instanceof ApiError &&
      err.status === 409 &&
      (err.body as EnrollResult | null)?.status === "WAITLISTED"
    ) {
      return err.body as EnrollResult;
    }
    throw err;
  }
}
```

### 4.5 Enroll Mutation Hook (`src/features/enrollment/useEnroll.ts`)

`isPending` is used to disable the button. This prevents double-clicks and works hand in hand with the gateway's rate limiter.

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { enroll } from "@/api/enrollments";
import { toUserMessage } from "@/lib/errors";

export function useEnroll() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: enroll,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["sections"] });
      qc.invalidateQueries({ queryKey: ["enrollments", "me"] });

      if (result.status === "ENROLLED") toast.success("You are enrolled!");
      else if (result.status === "WAITLISTED")
        toast.info("Section is full. You were added to the waitlist.");
      else toast.error(result.detail ?? "Enrollment was rejected.");
    },
    onError: (err) => toast.error(toUserMessage(err)),
  });
}

// Usage:  <Button disabled={enroll.isPending} onClick={() => enroll.mutate(section.id)}>Enroll</Button>
```

### 4.6 Error Mapping — Strategy by Status (`src/lib/errors.ts`)

```ts
import { ApiError } from "@/api/client";

export function toUserMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return "Too many requests. Please wait a moment and try again.";
    if (err.status === 401) return "Your session has expired. Please log in again.";

    const detail = (err.body as { detail?: unknown } | null)?.detail;
    if (typeof detail === "string") return detail; // FastAPI HTTPException
  }
  return "Something went wrong. Please try again.";
}
```

### 4.7 Notifications by Polling (`src/features/notifications/`)

The backend delivers alerts asynchronously through the Notification Service and exposes them with `GET /notifications/{student_id}`. There is no push channel in the backend docs, so the UI polls.

```ts
import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "@/api/notifications";
import { useAuthStore } from "@/features/auth/store";

export function useNotifications() {
  const studentId = useAuthStore((s) => s.studentId);
  return useQuery({
    queryKey: ["notifications", studentId],
    queryFn: () => getNotifications(studentId as string),
    enabled: !!studentId,
    refetchInterval: 15_000,
  });
}
```

### 4.8 Waitlist Offer Countdown (`src/lib/time.ts`)

The countdown is cosmetic. The server decides whether an offer is still valid, so the claim handler must still handle `EXPIRED_OR_ALREADY_CLAIMED`.

```ts
import { useEffect, useState } from "react";

// "09:30" -> 570 (minutes since midnight). Used for schedule overlap and timetable placement.
export const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// SQLite's CURRENT_TIMESTAMP is UTC but has no timezone suffix.
// If the backend sends "2026-10-08 10:00:00", treat it as UTC (Bangkok is UTC+7!).
export function parseServerTime(value: string): Date {
  const hasZone = /Z|[+-]\d{2}:?\d{2}$/.test(value);
  return new Date(hasZone ? value : `${value.replace(" ", "T")}Z`);
}

const secondsLeft = (expiresAt: string) =>
  Math.max(0, Math.floor((parseServerTime(expiresAt).getTime() - Date.now()) / 1000));

export function useCountdown(expiresAt: string): number {
  const [left, setLeft] = useState(() => secondsLeft(expiresAt));
  useEffect(() => {
    const id = setInterval(() => setLeft(secondsLeft(expiresAt)), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return left;
}
```

### 4.9 Status Map — State Pattern in One Place (`src/features/enrollment/status.ts`)

```ts
export type EnrollmentStatus = "STAGED" | "OFFERED" | "ENROLLED" | "DROPPED" | "WAITLISTED";

export const STATUS_UI: Record<
  EnrollmentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; canDrop: boolean }
> = {
  STAGED: { label: "Pending", variant: "secondary", canDrop: false },
  OFFERED: { label: "Seat offered", variant: "default", canDrop: false },
  ENROLLED: { label: "Enrolled", variant: "default", canDrop: true },
  DROPPED: { label: "Dropped", variant: "outline", canDrop: false },
  WAITLISTED: { label: "Waitlisted", variant: "secondary", canDrop: true },
};
```

### 4.10 Shared Types From the Backend Guide (`src/api/types.ts`)

These mirror the catalog responses documented in `docs/FRONTEND_GUIDE.md`. Both teammates import from here, so changes need a heads-up (see README, section 8).

```ts
export type Day = "MON" | "TUE" | "WED" | "THU" | "FRI";

export type Course = {
  code: string; // "CS301"
  title: string;
  credits: number;
  prerequisites: string[]; // course codes
};

export type Section = {
  id: number;
  course_code: string; // joins to Course.code
  section_number: number;
  capacity: number;
  enrolled_count: number;
  schedule_days: Day[];
  start_time: string; // "09:00" (24h)
  end_time: string; // "10:30"
  room: string;
  instructor: string;
};

export type PrereqRequest = {
  student_id: string;
  course_code: string;
  completed_courses: string[];
};

export type PrereqResult = {
  is_valid: boolean;
  missing_prereqs: string[];
  message: string;
};

/** A section joined with its course. Sections carry no title or credits, so every view renders this. */
export type SectionRow = { section: Section; course: Course };
```

### 4.11 View 1: Catalog API, Join Hook and Seat Badge

```ts
// src/api/catalog.ts
import { catalogApi } from "./client";
import type { Course, Day, PrereqRequest, PrereqResult, Section } from "./types";

function qs(params: Record<string, string | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== false) sp.set(key, String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const getCourses = (f: { search?: string; department?: string } = {}) =>
  catalogApi<Course[]>(`/courses${qs(f)}`);

export const getSections = (f: { course_code?: string; day?: Day; open_only?: boolean } = {}) =>
  catalogApi<Section[]>(`/sections${qs(f)}`);

export const validatePrereqs = (body: PrereqRequest) =>
  catalogApi<PrereqResult>("/validate-prereqs", { method: "POST", body: JSON.stringify(body) });
```

`search` and `department` filter **courses**; `day` and `open_only` filter **sections**. The hook runs both queries and joins them on the client:

```ts
// src/features/catalog/useCatalog.ts
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getCourses, getSections } from "@/api/catalog";
import type { Day, SectionRow } from "@/api/types";

export type CatalogFilters = { search: string; department: string; day?: Day; openOnly: boolean };

export function useCatalog(f: CatalogFilters) {
  const courses = useQuery({
    queryKey: ["courses", f.search, f.department],
    queryFn: () => getCourses({ search: f.search, department: f.department }),
  });
  const sections = useQuery({
    queryKey: ["sections", f.day, f.openOnly],
    queryFn: () => getSections({ day: f.day, open_only: f.openOnly }),
    refetchInterval: 10_000, // live seat counts
  });

  // Only sections whose course matched the search/department filter are shown.
  const rows = useMemo<SectionRow[]>(() => {
    const byCode = new Map((courses.data ?? []).map((c) => [c.code, c]));
    return (sections.data ?? []).flatMap((section) => {
      const course = byCode.get(section.course_code);
      return course ? [{ section, course }] : [];
    });
  }, [courses.data, sections.data]);

  return {
    rows,
    isLoading: courses.isLoading || sections.isLoading,
    error: courses.error ?? sections.error,
  };
}
```

`isFull` lives in its own file: ESLint's `react-refresh/only-export-components` rule rejects a component file that also exports a plain function.

```ts
// src/features/catalog/seats.ts
import type { Section } from "@/api/types";

export const isFull = (s: Section) => s.enrolled_count >= s.capacity;
```

```tsx
// src/features/catalog/SeatBadge.tsx
import type { Section } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { isFull } from "./seats";

export function SeatBadge({ section }: { section: Section }) {
  const full = isFull(section);
  return (
    <Badge variant={full ? "destructive" : "default"} className={full ? "" : "bg-green-600"}>
      {section.enrolled_count}/{section.capacity} {full ? "FULL" : "OPEN"}
    </Badge>
  );
}

// Row action: full ? "Join Waitlist" (calls enroll(); the backend answers 409 WAITLISTED)
//                  : "Add to Cart"   (useCartStore.getState().add(section.id))
```

### 4.12 View 3: Cart Store (Client-Side Staging)

The backend has no "staged" endpoint, so the cart is client state. It stores **only section ids**; rows are derived from fresh catalog data, so seat counts and times are never stale. Clear it on logout (`useCartStore.getState().clear()` inside the auth store's `logout`).

```ts
// src/features/cart/store.ts
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
```

```ts
// src/features/cart/useCartRows.ts
import { useCatalog } from "@/features/catalog/useCatalog";
import { useCartStore } from "./store";

export function useCartRows() {
  const ids = useCartStore((s) => s.sectionIds);
  const { rows } = useCatalog({ search: "", department: "", openOnly: false });
  return rows.filter((r) => ids.includes(r.section.id));
}
```

### 4.13 View 3: Pre-Flight Rules (Strategy Pattern)

Each check is a small pluggable function, mirroring the backend's `ValidationStrategy`. The summary bar renders `runRules(...)`, and **Confirm & Enroll** is disabled unless `canConfirm(...)` is true. The credit cap and clash checks include already-enrolled sections, not just the cart.

```ts
// src/features/cart/rules.ts
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
```

The prerequisite results come from the catalog service, one call per cart course. The request body needs `completed_courses`, which must come from the student profile (README section 5, request #1), so the query stays disabled until it is known:

```ts
// src/features/cart/usePrereqChecks.ts
import { useQueries } from "@tanstack/react-query";
import { validatePrereqs } from "@/api/catalog";
import type { PrereqResult, SectionRow } from "@/api/types";
import { useAuthStore } from "@/features/auth/store";

export function usePrereqChecks(cart: SectionRow[], completed: string[] | undefined) {
  const studentId = useAuthStore((s) => s.studentId);
  const results = useQueries({
    queries: cart.map((r) => ({
      queryKey: ["prereqs", studentId, r.course.code, completed],
      queryFn: () =>
        validatePrereqs({
          student_id: studentId as string,
          course_code: r.course.code,
          completed_courses: completed as string[],
        }),
      enabled: !!studentId && !!completed,
    })),
  });

  const byCode: Record<string, PrereqResult | undefined> = {};
  cart.forEach((r, i) => {
    byCode[r.course.code] = results[i]?.data;
  });
  return byCode;
}
```

### 4.14 View 3: Confirm & Enroll (One Section at a Time)

Sections are submitted sequentially, which is friendlier to the gateway's rate limiter and keeps results in order. Enrolled and waitlisted sections leave the cart; rejected or failed ones stay so the student can fix and retry.

```ts
// src/features/cart/useConfirmCart.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type EnrollResult, enroll } from "@/api/enrollments";
import { toUserMessage } from "@/lib/errors";
import { useCartStore } from "./store";

type Outcome = { sectionId: number; result?: EnrollResult; error?: unknown };

export function useConfirmCart() {
  const qc = useQueryClient();
  const remove = useCartStore((s) => s.remove);

  return useMutation({
    mutationFn: async (sectionIds: number[]): Promise<Outcome[]> => {
      const outcomes: Outcome[] = [];
      for (const sectionId of sectionIds) {
        try {
          outcomes.push({ sectionId, result: await enroll(sectionId) });
        } catch (error) {
          outcomes.push({ sectionId, error });
        }
      }
      return outcomes;
    },
    onSuccess: (outcomes) => {
      const status = (o: Outcome) => o.result?.status;
      for (const o of outcomes) {
        if (status(o) === "ENROLLED" || status(o) === "WAITLISTED") remove(o.sectionId);
      }
      qc.invalidateQueries({ queryKey: ["sections"] });
      qc.invalidateQueries({ queryKey: ["enrollments", "me"] });

      const enrolled = outcomes.filter((o) => status(o) === "ENROLLED").length;
      const waitlisted = outcomes.filter((o) => status(o) === "WAITLISTED").length;
      toast.success(`${enrolled} enrolled, ${waitlisted} waitlisted`);

      for (const o of outcomes.filter((x) => x.error || status(x) === "REJECTED")) {
        toast.error(o.error ? toUserMessage(o.error) : (o.result?.detail ?? "Enrollment rejected."));
      }
    },
  });
}
```

### 4.15 View 2: Weekly Timetable Grid

A plain CSS grid is enough: five day columns, ten one-hour rows (08:00 to 18:00), and absolutely positioned blocks. No calendar library is needed. Blue blocks are enrolled sections; amber blocks are the cart.

```tsx
// src/features/timetable/TimetableBlock.tsx
import type { Section } from "@/api/types";
import { toMin } from "@/lib/time";
import { cn } from "@/lib/utils";

const GRID_START = 8 * 60; // 08:00
const GRID_SPAN = 10 * 60; // 08:00 to 18:00

export function TimetableBlock({ section, tone }: { section: Section; tone: "enrolled" | "staged" }) {
  const top = ((toMin(section.start_time) - GRID_START) / GRID_SPAN) * 100;
  const height = ((toMin(section.end_time) - toMin(section.start_time)) / GRID_SPAN) * 100;

  return (
    <div
      className={cn(
        "absolute inset-x-1 overflow-hidden rounded-md p-1 text-xs",
        tone === "enrolled" ? "bg-blue-100 text-blue-900" : "bg-amber-100 text-amber-900",
      )}
      style={{ top: `${top}%`, height: `${height}%` }}
    >
      <div className="font-medium">
        {section.course_code} Sec {section.section_number}
      </div>
      <div>
        {section.start_time}-{section.end_time} · {section.room}
      </div>
    </div>
  );
}
```

```tsx
// src/features/timetable/TimetablePage.tsx (the grid body)
const DAYS: Day[] = ["MON", "TUE", "WED", "THU", "FRI"];

// Each column is `relative h-[600px]` (60px per hour), so block percentages map straight to time.
{DAYS.map((day) => (
  <div key={day} className="relative h-[600px] border-l">
    {[
      ...enrolled.map((r) => ({ r, tone: "enrolled" as const })),
      ...cart.map((r) => ({ r, tone: "staged" as const })),
    ]
      .filter(({ r }) => r.section.schedule_days.includes(day))
      .map(({ r, tone }) => (
        <TimetableBlock key={`${tone}-${r.section.id}`} section={r.section} tone={tone} />
      ))}
  </div>
))}
```

`enrolled` comes from the "my enrollments" endpoint (README section 5, request #2), joined with sections and courses the same way as the cart.

### 4.16 View 4: Drop and Claim (`src/api/enrollments.ts`, additions)

Both bodies are confirmed by the backend team. The response shape of `/drops` is not documented yet, and the claim result may arrive as a 2xx or a 4xx, so convert it to a plain result the same way `enroll()` does for 409 once the real behaviour is known.

```ts
export type DropResult = { status?: string; message?: string }; // shape not documented yet

export const drop = (sectionId: number) =>
  api<DropResult>("/drops", { method: "POST", body: JSON.stringify({ section_id: sectionId }) });

export type ClaimResult = {
  status: "CLAIMED" | "EXPIRED_OR_ALREADY_CLAIMED";
  message?: string;
};

export const claimWaitlist = (offerId: number) =>
  api<ClaimResult>("/waitlist/claim", {
    method: "POST",
    body: JSON.stringify({ offer_id: offerId }),
  });
```

The Waitlist table shows `Position: #N in queue` and uses `useCountdown(expires_at)` from section 4.8 on offered seats. Both need the "my waitlist" endpoint (README section 5, request #3).

---

## 5. Mock Backend with MSW

### 5.1 Start the Worker in `mock` and `hybrid` Modes (`src/main.tsx`)

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./index.css"; // Tailwind + shadcn theme. Without this line no styles load.

async function bootstrap() {
  // `mock`: mock everything. `hybrid`: mock only the gateway; /catalog/* passes through to the real service.
  if (import.meta.env.MODE === "mock" || import.meta.env.MODE === "hybrid") {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }
  createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();
```

### 5.2 Handlers (`src/mocks/handlers/`)

Handlers follow the documented backend contract: the catalog handlers return the exact shapes from `docs/FRONTEND_GUIDE.md`, and the gateway handlers follow the backend docs. Sections `101` (open) and `102` (full) cover both enroll outcomes.

```ts
// src/mocks/handlers/auth.ts
import { http, HttpResponse } from "msw";

const b64 = (o: object) =>
  btoa(JSON.stringify(o)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

// Decodable (unsigned) JWT, good enough for jwt-decode in the UI
export const fakeJwt = (sub: string) =>
  `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })}.mock`;

export const authHandlers = [
  http.post("*/api/v1/auth/login", async ({ request }) => {
    const { student_id } = (await request.json()) as { student_id: string; password: string };
    return HttpResponse.json({ access_token: fakeJwt(student_id), token_type: "bearer" });
  }),
];
```

```ts
// src/mocks/handlers/enrollment.ts
import { http, HttpResponse } from "msw";

export const enrollmentHandlers = [
  http.post("*/api/v1/enrollments", async ({ request }) => {
    const { section_id } = (await request.json()) as { section_id: number };

    if (section_id === 102) {
      // Full section: backend answers 409 with a WAITLISTED body
      return HttpResponse.json(
        { status: "WAITLISTED", message: "Section full. Placed on waitlist." },
        { status: 409 },
      );
    }
    return HttpResponse.json(
      { status: "ENROLLED", message: "Successfully enrolled!" },
      { status: 201 },
    );
  }),

  // Body confirmed by the backend team; response shapes are assumed until the service is connected
  http.post("*/api/v1/drops", () => HttpResponse.json({ status: "DROPPED" })),
  http.post("*/api/v1/waitlist/claim", () =>
    HttpResponse.json({ status: "CLAIMED", message: "Seat claimed! You are enrolled." }),
  ),
];
```

```ts
// src/mocks/handlers/catalog.ts
import { http, HttpResponse } from "msw";
import type { Course, Section } from "@/api/types";

const courses: Course[] = [
  { code: "CS101", title: "Programming Fundamentals", credits: 3, prerequisites: [] },
  { code: "CS102", title: "Data Structures", credits: 3, prerequisites: ["CS101"] },
  {
    code: "CS301",
    title: "Software Design & Architecture",
    credits: 3,
    prerequisites: ["CS102", "CS202"],
  },
];

const sections: Section[] = [
  {
    id: 101, course_code: "CS301", section_number: 1, capacity: 10, enrolled_count: 0,
    schedule_days: ["MON", "WED"], start_time: "09:00", end_time: "10:30",
    room: "HM402", instructor: "Dr. Veera B.",
  },
  {
    id: 102, course_code: "CS301", section_number: 2, capacity: 10, enrolled_count: 10, // full
    schedule_days: ["TUE", "THU"], start_time: "13:00", end_time: "14:30",
    room: "HM403", instructor: "Dr. Veera B.",
  },
  {
    id: 103, course_code: "CS102", section_number: 1, capacity: 40, enrolled_count: 12,
    schedule_days: ["MON", "WED"], start_time: "10:00", end_time: "11:30",
    room: "HM201", instructor: "Dr. Somchai K.",
  },
];

export const catalogHandlers = [
  http.get("*/catalog/courses", ({ request }) => {
    const q = new URL(request.url).searchParams.get("search")?.toLowerCase();
    return HttpResponse.json(
      courses.filter(
        (c) => !q || c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q),
      ),
    );
  }),

  http.get("*/catalog/sections", ({ request }) => {
    const p = new URL(request.url).searchParams;
    const code = p.get("course_code");
    const day = p.get("day");
    const openOnly = p.get("open_only") === "true";
    return HttpResponse.json(
      sections.filter(
        (s) =>
          (!code || s.course_code === code) &&
          (!day || s.schedule_days.some((d) => d === day)) &&
          (!openOnly || s.enrolled_count < s.capacity),
      ),
    );
  }),

  http.post("*/catalog/validate-prereqs", async ({ request }) => {
    const { course_code, completed_courses } = (await request.json()) as {
      student_id: string;
      course_code: string;
      completed_courses: string[];
    };
    const required = courses.find((c) => c.code === course_code)?.prerequisites ?? [];
    const missing = required.filter((c) => !completed_courses.includes(c));
    return HttpResponse.json({
      is_valid: missing.length === 0,
      missing_prereqs: missing,
      message: missing.length
        ? `Missing required prerequisite(s): ${missing.join(", ")}`
        : "All prerequisites satisfied.",
    });
  }),
];
```

```ts
// src/mocks/browser.ts
import { setupWorker } from "msw/browser";
import { authHandlers } from "./handlers/auth";
import { catalogHandlers } from "./handlers/catalog";
import { enrollmentHandlers } from "./handlers/enrollment";

const gatewayHandlers = [...authHandlers, ...enrollmentHandlers];

// hybrid: only the gateway is mocked, /catalog/* goes through to the real service on :8002
// mock:   catalog is mocked too
export const worker = setupWorker(
  ...gatewayHandlers,
  ...(import.meta.env.MODE === "mock" ? catalogHandlers : []),
);
```

```ts
// src/mocks/server.ts  (Vitest: everything is mocked)
import { setupServer } from "msw/node";
import { authHandlers } from "./handlers/auth";
import { catalogHandlers } from "./handlers/catalog";
import { enrollmentHandlers } from "./handlers/enrollment";

export const server = setupServer(...authHandlers, ...catalogHandlers, ...enrollmentHandlers);
```

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "@/mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

> In Node (Vitest) `fetch` needs an absolute URL, so `.env.test` sets `VITE_API_BASE_URL=http://localhost/api/v1` and `VITE_CATALOG_BASE_URL=http://localhost/catalog`. All handlers use `*/...` wildcards (`*/api/v1/...`, `*/catalog/...`), so the same handlers match the relative URLs in the browser and the absolute ones in Vitest.

---

## 6. Testing Strategy

| Level         | Tool                         | What to Cover                                                                                              |
| ------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Unit          | Vitest                       | `toUserMessage`, `parseServerTime`, `toMin`, `STATUS_UI`, `isTokenExpired`, the `enroll()` 409 conversion, and **every cart rule** (credit cap at 22, schedule overlap, prereq MET/MISSING).          |
| Component     | Vitest + Testing Library     | Login form validation, enroll button disables while pending, "full section" and "waitlisted" rendering.    |
| Integration   | Vitest + MSW                 | Login -> token stored -> protected route renders; `401` clears the store and redirects.                    |
| End-to-end    | Playwright                   | Login -> browse -> enroll -> drop; waitlist offer -> claim; run against the mock or the real stack.        |

### Demo Day Check

With the real backend running, enroll many students into a small section (the backend has a 100-request stress test). In the UI, verify that exactly `capacity` students see `ENROLLED`, the rest see `WAITLISTED`, and the seat counter never exceeds capacity after a refresh.

---

## 7. Running a Demo (Production Build, No Docker)

The backend lives in its own repository and owns any Docker or compose setup. This repo ships **no Dockerfile**: the frontend is a static site built by Vite.

```
npm run build      # type-check + production build into dist/
npm run preview    # serves dist/ at http://localhost:4173
```

`vite preview` reuses the same `/api` and `/catalog` proxies as `npm run dev`, so the demo needs the gateway (`:8000`) and the catalog service (`:8002`) running. For a demo without any backend, use `npm run dev:mock`.

If the build is ever hosted on another origin, that host must proxy `/api` and `/catalog`, or the base URLs must become absolute URLs and the backend must enable CORS (see section 8, question 2).

---

## 8. Open Decisions to Confirm with the Backend Team

| # | Question                                                                                                                  | Why It Matters                                                                                     |
| - | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1 | What are the **gateway path and response shape** for the student profile (completed courses), "my enrollments", "my waitlist" (with queue position) and notifications? | Views 2, 3 and 4 depend on them and the backend guide does not define them yet (README section 5, requests #1 to #3). |
| 2 | Do the gateway and the catalog service enable **CORS** (`CORSMiddleware`)?                                                                      | Not needed with the Vite `/api` and `/catalog` proxies, but needed if the SPA calls `:8000` or `:8002` directly (as the backend guide's base URLs suggest) or is hosted on another origin. |
| 3 | What does the rate limiter return (status code, `Retry-After` header) and **what does it key on** (IP or student id)?     | Behind a proxy all users can look like one IP, which would throttle everyone together.             |
| 4 | Are timestamps returned as **ISO-8601 with timezone**?                                                                    | SQLite timestamps are UTC without a suffix; parsing them as local time shows wrong countdowns in UTC+7. |
| 5 | What is the **token lifetime**, and is there any refresh mechanism?                                                       | Decides whether we need a "session expiring" warning or just a clean re-login.                     |
| 6 | Which **seeded student accounts** exist for demos and tests?                                                              | Needed for Playwright and for the live demo.                                                       |
| 7 | Will the gateway front the **catalog service** (at which path), and will it then require the JWT?                                                                  | Decides whether `VITE_CATALOG_BASE_URL` stays `/catalog` or becomes `/api/v1`.                  |
| 8 | Will `Course` get a **`department`** field? The filter exists, but the sample response has none. | Needed for the department dropdown options and for display in View 1.                              |
| 9 | What does `POST /drops` return, and is **Join Waitlist** simply `POST /enrollments` on a full section (`409 WAITLISTED`)? | Defines how View 4 refreshes after a drop and whether the waitlist button needs its own endpoint.                  |
