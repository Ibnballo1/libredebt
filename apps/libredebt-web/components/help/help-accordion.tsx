/**
 * components/help/help-accordion.tsx
 *
 * Same accordion pattern as the marketing FAQ section (Step on the
 * landing page) — reused here for in-app help, with local useState
 * per item rather than the native <details> approach since this list
 * is shorter and benefits from the chevron-rotate animation.
 */

"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Faq = { question: string; answer: string };

function HelpAccordionItem({ question, answer }: Faq) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#F1F5F9] last:border-none">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left focus-visible:outline-none"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-[#0F172A] pr-6">
          {question}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-shrink-0 text-[#94A3B8] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-96 pb-4" : "max-h-0",
        )}
      >
        <p className="text-sm leading-relaxed text-[#64748B]">{answer}</p>
      </div>
    </div>
  );
}

export function HelpAccordion({ faqs }: { faqs: readonly Faq[] }) {
  return (
    <div>
      {faqs.map((faq) => (
        <HelpAccordionItem key={faq.question} {...faq} />
      ))}
    </div>
  );
}
