/**
 * components/admin/admin-metric-section.tsx
 * Reusable section wrapper for admin dashboard metric groups.
 */

import { cn } from "@/lib/utils";

export function AdminMetricSection({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569]">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{children}</div>
    </div>
  );
}
