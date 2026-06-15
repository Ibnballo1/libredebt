/**
 * components/marketing/testimonials-section.tsx
 *
 * Localized multi-column user social proof cards grid block.
 * Refactored to drop dynamic string style interpolation and leverage systemic layout tokens.
 */

const TESTIMONIALS = [
  {
    quote:
      "I used to dread checking my bank account. LibreDebt gave me one clean view of everything I owe and everything I've paid. That visibility alone reduced so much anxiety.",
    name: "Amaka O.",
    role: "Marketing Manager, Lagos",
    initials: "AO",
    textColor: "text-emerald-500 dark:text-emerald-400",
    bgColor: "bg-emerald-500",
  },
  {
    quote:
      "I had four debts and no idea which one to pay down first. The Avalanche strategy showed me I was paying ₦84,000 in unnecessary interest every year. That number made the Pro plan an obvious decision.",
    name: "Chidi E.",
    role: "Software Engineer, Abuja",
    initials: "CE",
    textColor: "text-sky-500 dark:text-sky-400",
    bgColor: "bg-sky-500",
  },
  {
    quote:
      "The reminders are what sold me. I missed two payments last year because I lost track of dates. LibreDebt sends me an alert three days before — I haven't missed one since I signed up.",
    name: "Fatima B.",
    role: "Accountant, Kano",
    initials: "FB",
    textColor: "text-violet-500 dark:text-violet-400",
    bgColor: "bg-violet-500",
  },
] as const;

export function TestimonialsSection() {
  return (
    <section
      className="bg-white py-20 md:py-24 dark:bg-slate-900"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-[1100px] px-6">
        {/* ─── Ledger Index Section Marker ──────────────────────────────────── */}
        <div className="mb-12 flex items-center gap-4">
          <span
            className="font-mono text-[11px] font-bold tracking-widest text-slate-400 uppercase"
            aria-hidden="true"
          >
            07 / Stories
          </span>
          <div
            className="h-px flex-1 bg-slate-200 dark:bg-slate-800"
            aria-hidden="true"
          />
        </div>

        {/* Structural Heading Accent */}
        <h2
          id="testimonials-heading"
          className="mb-14 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl max-w-md leading-[1.15] dark:text-slate-50"
        >
          Real people,
          <br />
          real progress.
        </h2>

        {/* ─── Uniform Height Layout Grid ───────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-stretch">
          {TESTIMONIALS.map(
            ({ quote, name, role, initials, textColor, bgColor }) => (
              <blockquote
                key={name}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div>
                  {/* Decorative Styled Blockquote Token */}
                  <span
                    className={`block mb-2 text-4xl font-serif font-bold leading-none select-none ${textColor}`}
                    aria-hidden="true"
                  >
                    “
                  </span>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 mb-6 font-medium">
                    {quote}
                  </p>
                </div>

                {/* Card Meta Footer Section */}
                <footer className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/60">
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white text-xs font-bold shadow-sm ${bgColor}`}
                    aria-hidden="true"
                  >
                    {initials}
                  </div>
                  <div>
                    <cite className="not-italic text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {name}
                    </cite>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">
                      {role}
                    </p>
                  </div>
                </footer>
              </blockquote>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
