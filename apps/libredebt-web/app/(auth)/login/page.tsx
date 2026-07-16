"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="google"
      className={className}
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 488 512"
    >
      <path
        fill="currentColor"
        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
      ></path>
    </svg>
  );
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/overview";

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormValues) {
    setError(null);
    await signIn.email(
      { email: data.email, password: data.password },
      {
        onSuccess: () => {
          router.push(callbackUrl);
          router.refresh();
        },
        onError: (ctx) => {
          setError(
            ctx.error.message ?? "Invalid email or password. Please try again.",
          );
        },
      },
    );
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    await signIn.social({
      provider: "google",
      callbackURL: callbackUrl,
    });
    setGoogleLoading(false);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8 dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50 leading-tight">
            Sign in to {siteConfig.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track every debt. Record every payment.
          </p>
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || isSubmitting}
          className={cn(
            "flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-200 dark:border-slate-800",
            "px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-200 transition-all",
            "hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
          )}
        >
          {googleLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-600 dark:border-t-slate-100" />
          ) : (
            <GoogleIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          )}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span className="text-xs text-slate-400 font-medium">or</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Email/password form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              {...register("email")}
              className={cn(
                "w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:bg-slate-950",
                "transition-colors outline-none",
                "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                errors.email
                  ? "border-red-300 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900 text-red-900 dark:text-red-200"
                  : "border-slate-200 dark:border-slate-800 bg-white hover:border-slate-300 dark:hover:border-slate-700",
              )}
            />
            {errors.email && (
              <p className="text-xs text-red-500 dark:text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 pr-10 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:bg-slate-950",
                  "transition-colors outline-none",
                  "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                  errors.password
                    ? "border-red-300 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900 text-red-900 dark:text-red-200"
                    : "border-slate-200 dark:border-slate-800 bg-white hover:border-slate-300 dark:hover:border-slate-700",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 dark:text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Global error */}
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 px-3 py-2.5">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                {error}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || googleLoading}
            className={cn(
              "w-full rounded-lg bg-slate-900 dark:bg-slate-50 px-4 py-2.5 text-sm font-semibold text-white dark:text-slate-950",
              "transition-all hover:bg-slate-800 dark:hover:bg-slate-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/50",
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/30 dark:border-t-slate-950" />
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Register link */}
        <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
          No account?{" "}
          <Link
            href="/register"
            className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 transition-colors"
          >
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * LoginPage Entry Component
 * Wrapped in Suspense to preserve optimized Next.js partial static prerendering blocks.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 animate-pulse h-[480px]" />
      }
    >
      <LoginForm />
    </Suspense>
  );
}
