/**
 * components/simulation/what-if-simulator.tsx
 *
 * The core interactive UI for Stage 4.
 *
 * A draggable slider controls "extra monthly payment". As the user drags,
 * the Server Action re-runs the simulation (debounced 300ms to avoid
 * flooding the server on every pixel of drag movement) and the headline
 * numbers animate to the new values.
 *
 * THE HEADLINE FRAMING:
 * "Pay an extra ₦20,000/month → become debt-free 8 months sooner and
 *  save ₦150,000 in interest."
 * This sentence is the entire value proposition of the feature.
 */

"use client";

import { useState, useRef, useCallback } from "react";
import { useAction } from "next-safe-action/hooks";
import { Sparkles, Calendar, TrendingDown } from "lucide-react";
import { runSimulationAction } from "@/server/actions/simulation.actions";
import type { SimulationResult } from "@/server/services/simulation.service";
import { formatCurrency, fromMinorUnits, cn } from "@/lib/utils";

type WhatIfSimulatorProps = {
  initialResult: SimulationResult;
  previewPoints: Array<{
    extraMinor: number;
    monthsSaved: number;
    interestSavedMinor: number;
  }>;
  currency: string;
};

const SLIDER_MAX_MINOR = 20_000_000; // ₦200,000 max extra/month on the slider
const SLIDER_STEP_MINOR = 100_000; // ₦1,000 increments

export function WhatIfSimulator({
  initialResult,
  previewPoints,
  currency,
}: WhatIfSimulatorProps) {
  const [result, setResult] = useState(initialResult);
  const [extraMinor, setExtraMinor] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { execute, isPending } = useAction(runSimulationAction, {
    onSuccess: ({ data }) => {
      if (data?.success && data.result) {
        setResult(data.result);
      }
    },
  });

  const triggerSimulation = useCallback(
    (newExtraMinor: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        execute({
          extraMonthly: fromMinorUnits(newExtraMinor),
          baselineBudget: fromMinorUnits(initialResult.baselineBudgetMinor),
        });
      }, 250);
    },
    [execute, initialResult.baselineBudgetMinor],
  );

  function handleSliderChange(value: number) {
    setExtraMinor(value);
    triggerSimulation(value);
  }

  function handleChipClick(value: number) {
    setExtraMinor(value);
    triggerSimulation(value);
  }

  const { delta } = result;
  const hasExtra = extraMinor > 0;
  const sliderPercent = (extraMinor / SLIDER_MAX_MINOR) * 100;

  return (
    <div className="space-y-6">
      {/* Headline sentence */}
      <div
        className={cn(
          "rounded-xl border p-6 transition-colors",
          hasExtra
            ? "border-[#10B981]/30 bg-[#10B981]/5"
            : "border-[#E2E8F0] bg-white",
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
              hasExtra ? "bg-[#10B981]/15" : "bg-[#F1F5F9]",
            )}
          >
            <Sparkles
              className={cn(
                "h-4 w-4 transition-colors",
                hasExtra ? "text-[#10B981]" : "text-[#94A3B8]",
              )}
            />
          </div>
          <div className="flex-1">
            {hasExtra ? (
              <p className="text-base leading-relaxed text-[#0F172A]">
                Pay an extra{" "}
                <strong className="text-[#10B981]">
                  {formatCurrency(extraMinor, { currency })}
                </strong>{" "}
                per month and become debt-free{" "}
                <strong className="text-[#10B981]">
                  {delta.monthsSaved}{" "}
                  {delta.monthsSaved === 1 ? "month" : "months"} sooner
                </strong>
                , saving{" "}
                <strong className="text-[#10B981]">
                  {formatCurrency(delta.interestSavedMinor, { currency })}
                </strong>{" "}
                in interest.
              </p>
            ) : (
              <p className="text-base leading-relaxed text-[#64748B]">
                Drag the slider below to see how an extra monthly payment
                changes your payoff timeline and total interest.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Slider card */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
            Extra monthly payment
          </p>
          <span className="text-lg font-bold text-[#0F172A] tabular-nums">
            {formatCurrency(extraMinor, { currency })}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={SLIDER_MAX_MINOR}
          step={SLIDER_STEP_MINOR}
          value={extraMinor}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#10B981]"
          style={{
            background: `linear-gradient(to right, #10B981 ${sliderPercent}%, #F1F5F9 ${sliderPercent}%)`,
          }}
          aria-label="Extra monthly payment amount"
        />

        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-[#94A3B8]">₦0</span>
          <span className="text-[10px] text-[#94A3B8]">
            {formatCurrency(SLIDER_MAX_MINOR, { currency, compact: true })}
          </span>
        </div>

        {/* Quick preview chips */}
        <div className="flex flex-wrap gap-2 mt-5">
          {previewPoints.map((point) => (
            <button
              key={point.extraMinor}
              onClick={() => handleChipClick(point.extraMinor)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                extraMinor === point.extraMinor
                  ? "bg-[#10B981] text-white"
                  : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]",
              )}
            >
              +{formatCurrency(point.extraMinor, { currency, compact: true })}
            </button>
          ))}
          {extraMinor !== 0 && (
            <button
              onClick={() => handleChipClick(0)}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#64748B] transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Comparison stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-3.5 w-3.5 text-[#94A3B8]" />
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
              Debt-free date
            </p>
          </div>
          <div className="flex items-baseline gap-3">
            <div>
              <p
                className={cn(
                  "text-xs",
                  hasExtra
                    ? "text-[#94A3B8] line-through"
                    : "text-[#0F172A] font-bold",
                )}
              >
                {result.delta.baselineDebtFreeMonths} months
              </p>
              {hasExtra && (
                <p className="text-lg font-bold text-[#10B981] tabular-nums">
                  {result.delta.newDebtFreeMonths} months
                </p>
              )}
            </div>
          </div>
          <p className="text-[10px] text-[#94A3B8] mt-2">
            {isPending
              ? "Recalculating…"
              : "at your current budget vs. with extra payment"}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-3.5 w-3.5 text-[#94A3B8]" />
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
              Interest saved
            </p>
          </div>
          <p className="text-2xl font-bold text-[#10B981] tabular-nums">
            {formatCurrency(delta.interestSavedMinor, { currency })}
          </p>
          <p className="text-[10px] text-[#94A3B8] mt-2">
            compared to your current payment plan
          </p>
        </div>
      </div>

      <p className="text-xs text-[#94A3B8] text-center">
        Calculated using the{" "}
        {result.strategyUsed === "avalanche"
          ? "Debt Avalanche"
          : "Debt Snowball"}{" "}
        method.{" "}
        <a
          href="/strategies"
          className="text-[#10B981] hover:text-[#059669] font-medium"
        >
          Compare strategies →
        </a>
      </p>
    </div>
  );
}
