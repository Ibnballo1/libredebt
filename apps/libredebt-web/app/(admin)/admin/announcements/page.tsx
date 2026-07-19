"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Mail,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor"; // Adjust path to match your alias settings

type TargetGroup = "all" | "pro" | "free" | "no-debts" | "individual";

interface UserOption {
  id: string;
  email: string;
  name: string | null;
}

export default function AdminAnnouncementPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetGroup, setTargetGroup] = useState<TargetGroup>("all");
  const [registeredUsers, setRegisteredUsers] = useState<UserOption[]>([]);
  const [targetEmails, setTargetEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setFetchError(null);
        const res = await fetch("/api/admin/users");

        if (!res.ok) {
          const errorText = await res.text();
          setFetchError(
            `Server returned status ${res.status}: ${errorText || "No error message provided"}`,
          );
          return;
        }

        const data = await res.json();
        console.log("Successfully fetched users:", data);
        setRegisteredUsers(data);
      } catch (err) {
        console.error("Fetch operation completely failed:", err);
        setFetchError(
          err instanceof Error
            ? err.message
            : "Network request failed entirely.",
        );
      }
    }
    fetchUsers();
  }, []);

  const handleSelectEmail = (email: string) => {
    if (email && !targetEmails.includes(email)) {
      setTargetEmails([...targetEmails, email]);
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setTargetEmails(targetEmails.filter((email) => email !== emailToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    // Safeguard to ensure our rich text editor has body content before sending
    if (!content || content === "<p></p>") {
      setStatus({
        type: "error",
        message: "Please write a message body before sending.",
      });
      setIsLoading(false);
      return;
    }

    if (targetGroup === "individual" && targetEmails.length === 0) {
      setStatus({
        type: "error",
        message: "Please select at least one individual recipient email.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          targetGroup,
          targetEmails: targetGroup === "individual" ? targetEmails : [],
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Broadcast delivery crash.");

      setStatus({ type: "success", message: data.message });
      setTitle("");
      setContent(""); // Resets rich editor's state
      setTargetEmails([]);
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

          {/* New Multi-Select Dropdown Filter for Individual Email Selection */}
          {targetGroup === "individual" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="text-sm font-semibold">
                Select Individual Recipients
              </label>
              <select
                onChange={(e) => {
                  handleSelectEmail(e.target.value);
                  e.target.value = ""; // Clear option state back to label
                }}
                defaultValue=""
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm appearance-none"
              >
                <option value="" disabled>
                  -- Choose a registered user email --
                </option>
                {registeredUsers.map((user) => (
                  <option key={user.id} value={user.email}>
                    {user.name ? `${user.name} (${user.email})` : user.email}
                  </option>
                ))}
              </select>
              {fetchError && (
                <div className="p-3 mb-4 rounded-xl text-xs font-mono bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400">
                  <strong>⚠️ Dropdown Fetch Error:</strong> {fetchError}
                </div>
              )}

              {/* Recipient Chips Container */}
              {targetEmails.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  {targetEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 rounded-full text-xs font-medium transition-all"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="hover:bg-emerald-200 dark:hover:bg-emerald-900 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

          {/* Message Content with RichTextEditor integration */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Message Body</label>
            <RichTextEditor content={content} onChange={setContent} />
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Rich Text formatting is automatically converted to
              production-ready HTML structure.
            </p>
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
            ) : targetGroup === "individual" ? (
              `Send to ${targetEmails.length} Selected Recipient(s)`
            ) : (
              "Send System Broadcast"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
