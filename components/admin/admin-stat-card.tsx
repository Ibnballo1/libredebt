/**
 * components/admin/admin-stat-card.tsx
 *
 * Dark-theme stat card for the admin surface. Deliberately distinct
 * from the regular dashboard's StatCard (white background, emerald
 * accent) — reinforces that this is a different surface, not the same
 * UI with extra data bolted on.
 */

type AdminStatCardProps = {
  label: string;
  value: string;
  sub?: string;
  accent?: "default" | "amber" | "emerald";
};

export function AdminStatCard({
  label,
  value,
  sub,
  accent = "default",
}: AdminStatCardProps) {
  const accentColor = {
    default: "#475569",
    amber: "#F59E0B",
    emerald: "#10B981",
  }[accent];

  return (
    <div
      className="rounded-lg border border-[#1E2530] bg-[#11151F] p-4"
      style={{ borderLeftWidth: 2, borderLeftColor: accentColor }}
    >
      <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569] mb-1.5">
        {label}
      </p>
      <p className="text-xl font-bold text-white tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-[#64748B] mt-1">{sub}</p>}
    </div>
  );
}
