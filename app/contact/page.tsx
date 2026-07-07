"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Mail, CheckCircle2 } from "lucide-react";

const contactFormSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(3, "Please provide a subject topic"),
  message: z
    .string()
    .min(10, "Your message should be at least 10 characters long"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  });

  async function onSubmit(data: ContactFormValues) {
    setGlobalError(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || "Something went wrong.");
      }

      setIsSuccess(true);
      reset();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Could not dispatch your message. Please try again.";
      setGlobalError(errorMessage);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isSuccess ? (
          <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-200">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Message received!
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Thank you for reaching out. The LibreDebt team will get back to
              your inbox shortly.
            </p>
            <button
              onClick={() => setIsSuccess(false)}
              className="mt-6 text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              Send another message
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50 leading-tight">
                Contact LibreDebt
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Have questions about features, partnerships, or bugs? Drop us a
                line.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              {/* Full Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase"
                >
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Amaka Obi"
                  {...register("name")}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:bg-slate-950 outline-none transition-colors",
                    "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                    errors.name
                      ? "border-red-300 bg-red-50/50 dark:border-red-900"
                      : "border-slate-200 dark:border-slate-800 bg-white",
                  )}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:bg-slate-950 outline-none transition-colors",
                    "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                    errors.email
                      ? "border-red-300 bg-red-50/50 dark:border-red-900"
                      : "border-slate-200 dark:border-slate-800 bg-white",
                  )}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label
                  htmlFor="subject"
                  className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase"
                >
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  placeholder="Feature request / Partnership query"
                  {...register("subject")}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:bg-slate-950 outline-none transition-colors",
                    "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                    errors.subject
                      ? "border-red-300 bg-red-50/50 dark:border-red-900"
                      : "border-slate-200 dark:border-slate-800 bg-white",
                  )}
                />
                {errors.subject && (
                  <p className="text-xs text-red-500">
                    {errors.subject.message}
                  </p>
                )}
              </div>

              {/* Message Content */}
              <div className="space-y-1.5">
                <label
                  htmlFor="message"
                  className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  placeholder="Tell us what you need..."
                  {...register("message")}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:bg-slate-950 outline-none transition-colors resize-none",
                    "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                    errors.message
                      ? "border-red-300 bg-red-50/50 dark:border-red-900"
                      : "border-slate-200 dark:border-slate-800 bg-white",
                  )}
                />
                {errors.message && (
                  <p className="text-xs text-red-500">
                    {errors.message.message}
                  </p>
                )}
              </div>

              {/* Server Error Message */}
              {globalError && (
                <div className="rounded-lg border border-red-200 bg-red-50/50 px-3 py-2.5 dark:border-red-900/50 dark:bg-red-950/20">
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">
                    {globalError}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full rounded-lg bg-slate-900 dark:bg-slate-50 px-4 py-2.5 text-sm font-semibold text-white dark:text-slate-950",
                  "transition-all hover:bg-slate-800 dark:hover:bg-slate-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/30 dark:border-t-slate-950" />
                    Sending message…
                  </span>
                ) : (
                  "Send Message"
                )}
              </button>
            </form>
          </>
        )}

        {/* Footer Navigation Back Links */}
        <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-500">
          Back to{" "}
          <Link
            href="/login"
            className="underline hover:text-slate-600 dark:hover:text-slate-400"
          >
            Sign In
          </Link>{" "}
          or{" "}
          <Link
            href="/"
            className="underline hover:text-slate-600 dark:hover:text-slate-400"
          >
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}
