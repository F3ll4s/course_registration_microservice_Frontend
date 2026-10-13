import { type FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { login } from "@/api/auth";
import { toUserMessage } from "@/lib/errors";
import { isTokenExpired, useAuthStore } from "./store";

const INPUT =
  "h-[42px] rounded-md border border-[#cbd5e1] bg-[#f8fafc] px-[13px] text-sm text-[#1e293b] outline-none focus-visible:border-[#ff6b00] focus-visible:ring-2 focus-visible:ring-[#ff6b00]/30";

// Not designed in Penpot yet; uses the same colors as the portal screens
export function LoginPage() {
  const token = useAuthStore((s) => s.token);
  const saveToken = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  // ProtectedRoute stores where the user was going; send them back there after login
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/catalog";

  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (token && !isTokenExpired(token)) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await login(studentId, password);
      saveToken(res.access_token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#f8fafc] p-4">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-[10px] border border-[#e2e8f0] bg-white p-6"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-[58px] shrink-0 items-center justify-center rounded-lg bg-[#ff6b00] text-[13px] font-extrabold text-white">
            KMITL
          </span>
          <h1 className="text-[15px] leading-tight font-bold text-[#0f172a]">
            STUDENT COURSE REGISTRATION PORTAL
          </h1>
        </div>

        <label className="flex flex-col gap-2 text-[10px] font-bold text-[#64748b] uppercase">
          Student ID
          <input
            className={INPUT}
            autoComplete="username"
            required
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2 text-[10px] font-bold text-[#64748b] uppercase">
          Password
          <input
            type="password"
            className={INPUT}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="text-xs font-semibold text-[#b91c1c]">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="h-[42px] rounded-md bg-[#ff6b00] text-xs font-bold text-white outline-none hover:bg-[#ea580c] focus-visible:ring-2 focus-visible:ring-[#ff6b00]/40 focus-visible:ring-offset-1 disabled:opacity-60"
        >
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
