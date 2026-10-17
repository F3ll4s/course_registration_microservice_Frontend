import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router";
import { login } from "@/api/auth";
import { ApiError } from "@/api/client";
import { toUserMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { type LoginValues, loginSchema } from "./loginSchema";
import { isTokenExpired, useAuthStore } from "./store";

const LABEL = "text-[10px] font-bold text-[#64748b] uppercase";
const INPUT =
  "h-[42px] rounded-md border border-[#cbd5e1] bg-[#f8fafc] px-[13px] text-sm text-[#1e293b] outline-none focus-visible:border-[#ff5722] focus-visible:ring-2 focus-visible:ring-[#ff5722]/30 aria-invalid:border-[#ef4444] aria-invalid:bg-[#fffafa] aria-invalid:focus-visible:ring-[#ef4444]/30";
const FIELD_ERROR = "text-xs font-medium text-[#b91c1c]";

// Not designed in Penpot yet; uses the same colors as the portal screens
export function LoginPage() {
  const token = useAuthStore((s) => s.token);
  const saveToken = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  // ProtectedRoute stores where the user was going; send them back there after login
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/registration";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { studentId: "", password: "" },
  });

  if (token && !isTokenExpired(token)) return <Navigate to={from} replace />;

  // Only runs once both fields pass loginSchema
  async function onSubmit({ studentId, password }: LoginValues) {
    try {
      const res = await login(studentId, password);
      saveToken(res.access_token);
      navigate(from, { replace: true });
    } catch (err) {
      // On this page a 401 means wrong credentials, not an expired session
      setError("root", {
        message:
          err instanceof ApiError && err.status === 401 ? "Incorrect student ID or password." : toUserMessage(err),
      });
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#f8fafc] p-4">
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-sm flex-col gap-4 rounded-[10px] border border-[#e2e8f0] bg-white p-6"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-[58px] shrink-0 items-center justify-center rounded-lg bg-[#ff5722] text-[13px] font-extrabold text-white">
            KMITL
          </span>
          <h1 className="text-[15px] leading-tight font-bold text-[#0f172a]">
            STUDENT COURSE REGISTRATION PORTAL
          </h1>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="studentId" className={LABEL}>
            Student ID
          </label>
          <input
            id="studentId"
            autoComplete="username"
            placeholder="e.g. STU_001"
            aria-invalid={errors.studentId ? true : undefined}
            aria-describedby={errors.studentId ? "studentId-error" : undefined}
            className={cn(INPUT, "placeholder:text-[#94a3b8]")}
            {...register("studentId")}
          />
          {errors.studentId && (
            <p id="studentId-error" className={FIELD_ERROR}>
              {errors.studentId.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className={LABEL}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={INPUT}
            {...register("password")}
          />
          {errors.password && (
            <p id="password-error" className={FIELD_ERROR}>
              {errors.password.message}
            </p>
          )}
        </div>

        {errors.root && (
          <p role="alert" className="text-xs font-semibold text-[#b91c1c]">
            {errors.root.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-[42px] rounded-md bg-[#ff5722] text-xs font-bold text-white outline-none hover:bg-[#e64a19] focus-visible:ring-2 focus-visible:ring-[#ff5722]/40 focus-visible:ring-offset-1 disabled:opacity-60"
        >
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
