"use client";

import { useState } from "react";
import {
  Users,
  Mail,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

type TargetGroup = "all" | "pro" | "free" | "no-debts" | "individual";

export default function AdminAnnouncementPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetGroup, setTargetGroup] = useState<TargetGroup>("all");
  const [targetEmail, setTargetEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, targetGroup, targetEmail }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Broadcast delivery crash.");

      setStatus({ type: "success", message: data.message });
      setTitle("");
      setContent("");
      setTargetEmail("");
    } catch (err: unknown) {
      setStatus({
        type: "error",
        message:
          err instanceof Error ? err.message : "Broadcast delivery crash.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 p-6 sm:p-12 transition-colors">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header section */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Admin Communications Hub
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Broadcast high-impact announcements or target specific user
              segments instantly.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm"
        >
          {/* Target Group */}
          <div className="space-y-2">
            <label className="text-sm font-semibold tracking-wide">
              Target Audience
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {(
                [
                  "all",
                  "pro",
                  "free",
                  "no-debts",
                  "individual",
                ] as TargetGroup[]
              ).map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setTargetGroup(group)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all duration-150 flex flex-col items-center justify-center gap-1.5 ${
                    targetGroup === group
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {group === "individual" ? (
                    <Mail className="h-4 w-4" />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                  {group.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Target Email Input */}
          {targetGroup === "individual" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="text-sm font-semibold">
                User Email Address
              </label>
              <input
                type="email"
                required
                placeholder="user@example.com"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          )}

          {/* Subject Line */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Subject / Notification Title
            </label>
            <input
              type="text"
              required
              placeholder="Important: Update regarding your debt schedule optimizations"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Message Body</label>
            <textarea
              required
              rows={8}
              placeholder="Write your announcement details here. Feel free to use rich text structures..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
            />
          </div>

          {/* Status Indicators */}
          {status && (
            <div
              className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
                status.type === "success"
                  ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/20"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  {status.type === "success" ? "Success!" : "Action Failed"}
                </p>
                <p className="opacity-90">{status.message}</p>
              </div>
            </div>
          )}

          {/* Action Trigger */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors font-semibold rounded-xl flex items-center justify-center gap-2 text-sm shadow-sm disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Preparing system
                broadcast...
              </>
            ) : (
              "Send System Broadcast"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
