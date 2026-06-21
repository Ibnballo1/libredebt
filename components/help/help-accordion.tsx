/**
 * components/help/help-accordion.tsx — Help Accordion Layout
 *
 * Client Component utilizing state mapping loops to build out fully
 * fluid disclosure transitions without heavy structural dependencies.
 */

"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  readonly question: string;
  readonly answer: string;
}

interface HelpAccordionProps {
  faqs: readonly FAQItem[];
}

export function HelpAccordion({ faqs }: HelpAccordionProps) {
  // Store expanded state using primitive integer index references
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggleAccordion(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <div className="w-full divide-y divide-[#F1F5F9] pb-4">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;

        return (
          <div key={index} className="py-4 first:pt-2 last:pb-2">
            <h3>
              <button
                type="button"
                onClick={() => toggleAccordion(index)}
                aria-expanded={isOpen}
                aria-controls={`faq-content-${index}`}
                id={`faq-button-${index}`}
                className="flex w-full items-start justify-between text-left gap-4 group focus:outline-none"
              >
                <span className="text-sm font-semibold text-[#0F172A] group-hover:text-[#10B981] transition-colors leading-snug">
                  {faq.question}
                </span>
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-[#F8FAFC] border border-[#E2E8F0] group-hover:border-[#CBD5E1] transition-colors mt-0.5">
                  <ChevronDown
                    className={`h-3 w-3 text-[#64748B] transition-transform duration-300 ease-out ${
                      isOpen ? "rotate-180 text-[#10B981]" : ""
                    }`}
                  />
                </span>
              </button>
            </h3>

            <div
              id={`faq-content-${index}`}
              aria-labelledby={`faq-button-${index}`}
              role="region"
              className={`grid transition-all duration-300 ease-in-out text-[#64748B] text-xs leading-relaxed ${
                isOpen
                  ? "grid-rows-[1fr] opacity-100 mt-2.5"
                  : "grid-rows-[0fr] opacity-0 pointer-events-none"
              }`}
            >
              <div className="overflow-hidden">
                <p className="bg-[#F8FAFC] p-3.5 rounded-lg border border-[#F1F5F9] whitespace-pre-line shadow-inner-sm">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
