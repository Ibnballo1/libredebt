/**
 * components/admin/admin-stat-card.tsx
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
      className="rounded-lg border border-[#1E2530] bg-[#11151F] p-4 transition-all duration-200"
      style={{ borderLeftWidth: 3, borderLeftColor: accentColor }} // Slightly increased width for clearer distinction
    >
      <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569] mb-1.5 truncate">
        {label}
      </p>
      {/* Added responsive scaling values and fallback word-breaking properties */}
      <p className="text-lg font-bold text-white tabular-nums sm:text-xl break-words tracking-tight">
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-[#64748B] mt-1 leading-snug sm:line-clamp-1">
          {sub}
        </p>
      )}
    </div>
  );
}
