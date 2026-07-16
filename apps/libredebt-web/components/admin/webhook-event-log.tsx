/**
 * components/admin/webhook-event-log.tsx
 * Recent Paystack subscription events inferred from the subscriptions table.
 */

import type { WebhookEventLogItem } from "@/server/services/admin.service";
import { formatDate } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export function WebhookEventLog({ events }: { events: WebhookEventLogItem[] }) {
  return (
    <div className="rounded-lg border border-[#1E2530] bg-[#11161F] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1E2530] flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569]">
            Webhook / Payment Event Log
          </p>
          <p className="text-sm font-semibold text-white mt-0.5">
            Recent successful Paystack events
          </p>
        </div>
        <span className="text-[10px] text-[#475569]">
          Latest {events.length}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="px-5 py-8 text-center text-xs text-[#475569]">
          No payment events yet
        </div>
      ) : (
        <div>
          {events.map((event, i) => (
            <div
              key={event.id}
              className="flex items-center gap-4 px-5 py-3"
              style={{
                borderBottom:
                  i < events.length - 1 ? "1px solid #1A2029" : "none",
              }}
            >
              <CheckCircle2 className="h-4 w-4 text-[#10B981] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {event.userEmail}
                </p>
                <p className="text-[10px] text-[#64748B]">
                  {event.provider} · {event.plan} plan · {event.status}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-[#64748B]">
                  {formatDate(event.createdAt, "medium")}
                </p>
                {event.currentPeriodEnd && (
                  <p className="text-[10px] text-[#475569]">
                    Ends {formatDate(event.currentPeriodEnd, "short")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
