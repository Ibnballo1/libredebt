/**
 * components/reminders/reminder-preferences-form.tsx
 *
 * Three toggle switches for global reminder categories.
 * Each toggle calls updateReminderPreferencesAction immediately on change
 * (no separate save button — settings should feel instant).
 */

"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Bell, AlertTriangle, BarChart3 } from "lucide-react";
import { updateReminderPreferencesAction } from "@/server/actions/reminder.actions";
import { cn } from "@/lib/utils";

type Preferences = {
  dueSoonEnabled: boolean;
  overdueEnabled: boolean;
  weeklySummaryEnabled: boolean;
};

type ReminderPreferencesFormProps = {
  initialPreferences: Preferences;
};

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/50",
        checked ? "bg-[#10B981]" : "bg-[#E2E8F0]",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}

export function ReminderPreferencesForm({
  initialPreferences,
}: ReminderPreferencesFormProps) {
  const [prefs, setPrefs] = useState(initialPreferences);

  const { execute, isPending } = useAction(updateReminderPreferencesAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success("Reminder preferences updated");
      } else {
        toast.error(data?.error ?? "Failed to update preferences");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });

  function updatePref(key: keyof Preferences, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    execute(next);
  }

  const items = [
    {
      key: "dueSoonEnabled" as const,
      icon: Bell,
      color: "#10B981",
      title: "Due date reminders",
      description: "Get notified 7, 3, and 1 day before a payment is due",
    },
    {
      key: "overdueEnabled" as const,
      icon: AlertTriangle,
      color: "#F59E0B",
      title: "Overdue alerts",
      description:
        "Get notified if a payment hasn't been recorded by its due date",
    },
    {
      key: "weeklySummaryEnabled" as const,
      icon: BarChart3,
      color: "#38BDF8",
      title: "Weekly summary",
      description: "A progress recap every Monday morning",
    },
  ];

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E2E8F0]">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
          Notification preferences
        </p>
        <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
          Choose what you want to be notified about
        </p>
      </div>

      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={item.key}
            className="flex items-center gap-4 px-5 py-4"
            style={{
              borderBottom:
                index < items.length - 1 ? "1px solid #F1F5F9" : "none",
            }}
          >
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${item.color}15` }}
            >
              <Icon className="h-4 w-4" style={{ color: item.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#0F172A]">
                {item.title}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">
                {item.description}
              </p>
            </div>
            <Toggle
              checked={prefs[item.key]}
              onChange={(value) => updatePref(item.key, value)}
              disabled={isPending}
            />
          </div>
        );
      })}
    </div>
  );
}
