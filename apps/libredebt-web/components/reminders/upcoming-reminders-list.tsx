/**
 * components/reminders/upcoming-reminders-list.tsx
 *
 * Shows what's actually scheduled to be sent — builds trust by making
 * the reminder system transparent rather than a black box.
 */

import { Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared";

type UpcomingReminder = {
  id: string;
  debtId: string;
  type:
    | "payment_due"
    | "payment_overdue"
    | "general_notification"
    | "weekly_summary";
  remindAt: Date;
  debtName: string;
};

const typeLabels: Record<UpcomingReminder["type"], string> = {
  payment_due: "Payment due",
  payment_overdue: "Payment overdue",
  general_notification: "General notification",
  weekly_summary: "Weekly summary",
};

const typeColors: Record<UpcomingReminder["type"], string> = {
  payment_due: "#10B981",
  payment_overdue: "#F59E0B",
  general_notification: "#8B5CF6",
  weekly_summary: "#38BDF8",
};

export function UpcomingRemindersList({
  reminders,
}: {
  reminders: UpcomingReminder[];
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E2E8F0]">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
          Scheduled reminders
        </p>
        <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
          {reminders.length} upcoming
        </p>
      </div>

      {reminders.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No reminders scheduled"
          description="Set a due day on your debts to automatically schedule reminders."
          className="py-10"
        />
      ) : (
        <div>
          {reminders.map((reminder, index) => (
            <div
              key={reminder.id}
              className="flex items-center gap-3.5 px-5 py-3.5"
              style={{
                borderBottom:
                  index < reminders.length - 1 ? "1px solid #F1F5F9" : "none",
              }}
            >
              <div
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ background: typeColors[reminder.type] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#0F172A]">
                  {reminder.debtName}
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">
                  {typeLabels[reminder.type]}
                </p>
              </div>
              <time
                dateTime={reminder.remindAt.toISOString()}
                className="text-xs font-medium text-[#64748B] flex-shrink-0"
              >
                {formatDate(reminder.remindAt, "medium")}
              </time>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
