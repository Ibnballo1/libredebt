"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

interface DebtItem {
  id: string;
  name: string;
  balance: number;
  minPayment: number;
  rate: number;
}

export default function DebtSnowballCalculator() {
  const [debts, setDebts] = useState<DebtItem[]>([
    { id: "1", name: "Credit Card", balance: 1500, minPayment: 50, rate: 19.9 },
    {
      id: "2",
      name: "Personal Loan",
      balance: 5000,
      minPayment: 150,
      rate: 8.5,
    },
  ]);
  const [extraMonthly, setExtraMonthly] = useState<number>(100);

  // Form states for new entry
  const [newName, setNewName] = useState("");
  const [newBalance, setNewBalance] = useState("");
  const [newMin, setNewMin] = useState("");
  const [newRate, setNewRate] = useState("");

  const addDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newBalance || !newMin) return;

    setDebts([
      ...debts,
      {
        id: Date.now().toString(),
        name: newName,
        balance: parseFloat(newBalance) || 0,
        minPayment: parseFloat(newMin) || 0,
        rate: parseFloat(newRate) || 0,
      },
    ]);
    setNewName("");
    setNewBalance("");
    setNewMin("");
    setNewRate("");
  };

  const removeDebt = (id: string) => {
    setDebts(debts.filter((d) => d.id !== id));
  };

  // Snowball Calculation Engine
  const summary = useMemo(() => {
    if (debts.length === 0)
      return { totalBalance: 0, monthsToPayoff: 0, totalInterest: 0 };

    const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
    const sorted = [...debts].sort((a, b) => a.balance - b.balance);

    let currentDebts = sorted.map((d) => ({ ...d }));
    let month = 0;
    let totalInterestPaid = 0;
    const maxMonths = 360; // 30 years safety cap

    while (currentDebts.some((d) => d.balance > 0) && month < maxMonths) {
      month++;
      let rolloverExtra = extraMonthly;

      // Apply monthly interest & minimum payments
      const monthlyInterestPaid = currentDebts.reduce((sum, d) => {
        if (d.balance <= 0) return sum;
        return sum + (d.balance * (d.rate / 100)) / 12;
      }, 0);

      totalInterestPaid += monthlyInterestPaid;

      currentDebts = currentDebts.map((d) => {
        if (d.balance <= 0) return d;

        const monthlyInterest = (d.balance * (d.rate / 100)) / 12;
        let newBal = d.balance + monthlyInterest;

        const payment = Math.min(newBal, d.minPayment);
        newBal -= payment;

        return { ...d, balance: newBal };
      });

      // Apply snowball extra payment to the smallest active balance
      for (let i = 0; i < currentDebts.length; i++) {
        const debt = currentDebts[i];
        if (debt && debt.balance > 0) {
          const extraApplied = Math.min(debt.balance, rolloverExtra);
          debt.balance -= extraApplied;
          rolloverExtra -= extraApplied;
          break;
        }
      }
    }

    return {
      totalBalance,
      monthsToPayoff: month,
      totalInterest: Math.round(totalInterestPaid),
    };
  }, [debts, extraMonthly]);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-slate-900">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <Sparkles className="w-3.5 h-3.5" /> Free Interactive Tool
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Debt Snowball Payoff Calculator
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
            See how fast you can eliminate your debts by rolling over minimum
            payments into your smallest balance first.
          </p>
        </div>

        {/* Results Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-center sm:text-left">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Balance
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ${summary.totalBalance.toLocaleString()}
            </p>
          </div>
          <div className="text-center sm:text-left border-y sm:border-y-0 sm:border-x border-slate-100 py-4 sm:py-0 sm:px-6">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Time to Debt-Free
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {Math.floor(summary.monthsToPayoff / 12)} yrs{" "}
              {summary.monthsToPayoff % 12} mos
            </p>
          </div>
          <div className="text-center sm:text-left sm:pl-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Est. Interest Paid
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              ${summary.totalInterest.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form & List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Extra Payment Slider */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-800">
                  Extra Monthly Payoff Amount
                </label>
                <span className="text-lg font-bold text-emerald-600">
                  ${extraMonthly}/mo
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="25"
                value={extraMonthly}
                onChange={(e) => setExtraMonthly(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <p className="text-xs text-slate-500">
                Increasing this by even $50 drastically reduces your total
                payoff time.
              </p>
            </div>

            {/* Debt List */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                Your Accounts ({debts.length})
              </h2>

              <div className="space-y-3">
                {debts.map((debt) => (
                  <div
                    key={debt.id}
                    className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {debt.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        ${debt.balance.toLocaleString()} bal · $
                        {debt.minPayment}/mo min · {debt.rate}% APR
                      </p>
                    </div>
                    <button
                      onClick={() => removeDebt(debt.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Debt Form */}
              <form
                onSubmit={addDebt}
                className="pt-4 border-t border-slate-100 space-y-3"
              >
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Add Another Account
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="p-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Balance ($)"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    className="p-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Min Pay ($)"
                    value={newMin}
                    onChange={(e) => setNewMin(e.target.value)}
                    className="p-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                  <input
                    type="number"
                    placeholder="APR (%)"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add to Calculation
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: High-Converting Lead Magnet Box */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl space-y-5">
              <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Save Your Plan
              </span>
              <h3 className="text-xl font-bold leading-tight">
                Want to track this plan automatically?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Calculators reset when you leave the page. Create a free
                LibreDebt account to save your balance milestones, get monthly
                payment alerts, and track progress on mobile.
              </p>

              <div className="space-y-2 pt-2">
                <Link
                  href="/sign-up"
                  className="w-full py-3 px-4 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  Save My Payoff Plan <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1 pt-1">
                  <ShieldCheck className="w-3 h-3" /> Free forever · No credit
                  card required
                </p>
              </div>
            </div>

            {/* Educational SEO Content Block */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                How the Snowball Method Works
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The Debt Snowball method prioritizes paying off your smallest
                balance first, regardless of interest rate. Once the smallest
                debt is paid off, its entire monthly payment rolls into the next
                smallest account, accelerating your momentum.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
