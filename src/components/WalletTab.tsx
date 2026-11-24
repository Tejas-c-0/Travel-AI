import React, { useState } from "react";
import {
  Wallet,
  Award,
  Gift,
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { WalletTransaction } from "../types";

interface WalletTabProps {
  user?: any;
  rewardPoints: number;
  walletBalance: number;
  transactions: WalletTransaction[];
  onAddCredits: (amount: number, source?: string) => void;
}

const CURRENCY_RATES_FROM_INR: Record<string, { symbol: string; name: string; rate: number }> = {
  INR: { symbol: "₹", name: "Indian Rupee", rate: 1 },
  USD: { symbol: "$", name: "US Dollar", rate: 0.0119 },
  EUR: { symbol: "€", name: "Euro", rate: 0.011 },
  JPY: { symbol: "¥", name: "Japanese Yen", rate: 1.82 },
  GBP: { symbol: "£", name: "British Pound", rate: 0.0094 },
  SGD: { symbol: "S$", name: "Singapore Dollar", rate: 0.016 },
  AED: { symbol: "د.إ", name: "UAE Dirham", rate: 0.0437 },
};

export default function WalletTab({
  user,
  rewardPoints,
  walletBalance,
  transactions,
  onAddCredits,
}: WalletTabProps) {
  const [scratched, setScratched] = useState(false);
  const [scratchedCode, setScratchedCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Top-up state
  const [customTopup, setCustomTopup] = useState("");
  const [topupSuccess, setTopupSuccess] = useState<string | null>(null);

  // Currency Converter state
  const [amount, setAmount] = useState<string>("15000");
  const [fromCurrency, setFromCurrency] = useState<string>("INR");
  const [toCurrency, setToCurrency] = useState<string>("JPY");

  // Transaction filter
  const [txFilter, setTxFilter] = useState<"all" | "credit" | "debit">("all");

  const numericAmount = parseFloat(amount) || 0;
  const inrBase = numericAmount / CURRENCY_RATES_FROM_INR[fromCurrency].rate;
  const convertedValue = inrBase * CURRENCY_RATES_FROM_INR[toCurrency].rate;
  const unitRate =
    CURRENCY_RATES_FROM_INR[toCurrency].rate / CURRENCY_RATES_FROM_INR[fromCurrency].rate;

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleQuickTopup = (value: number) => {
    onAddCredits(value, "Instant Wallet Top-Up");
    setTopupSuccess(`Added ₹${value.toLocaleString()} to Travel Credits`);
    setTimeout(() => setTopupSuccess(null), 2500);
  };

  const handleCustomTopup = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customTopup, 10);
    if (!val || val <= 0) return;
    handleQuickTopup(val);
    setCustomTopup("");
  };

  const handleScratch = () => {
    if (scratched) return;
    const codes = ["TRAVELAI20", "FLYSHIELD100", "GOASAVINGS", "HOSTELFREE"];
    const randomCode = codes[Math.floor(Math.random() * codes.length)];
    setScratchedCode(randomCode);
    setScratched(true);
  };

  const handleCopyCode = () => {
    if (!scratchedCode) return;
    navigator.clipboard?.writeText(scratchedCode).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (txFilter === "all") return true;
    if (txFilter === "credit") return tx.type === "credit" || tx.type === "cashback";
    return tx.type === "debit";
  });

  const nextTierTarget = 5000;
  const xpProgress = Math.min(100, Math.round((rewardPoints / nextTierTarget) * 100));

  const achievements = [
    {
      title: "Scam Shield Verified",
      desc: "Vetted 3 transit routes using safety indices.",
      unlocked: true,
    },
    {
      title: "Eco-Voyager",
      desc: "Saved 100+ kg CO2 via rail & direct coach routes.",
      unlocked: true,
    },
    {
      title: "Budget Optimizer",
      desc: "Kept trip spend 15% under initial target limit.",
      unlocked: true,
    },
    {
      title: "Global Explorer",
      desc: "Reach 5,000 XP through bookings and community tips.",
      unlocked: rewardPoints >= 5000,
    },
  ];

  return (
    <div id="wallet-tab-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      {/* LEFT COLUMN (span 8) */}
      <div className="lg:col-span-8 space-y-6">
        {/* AVAILABLE TRAVEL CREDITS CARD */}
        <div className="rounded-xl bg-zinc-950 text-white border border-zinc-800 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Available Travel Credits</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="text-zinc-400 font-mono">
                  {user?.name || "Traveler"}
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums font-display pt-1">
                ₹{walletBalance.toLocaleString()}
              </div>
              <p className="text-xs text-zinc-400">
                Redeemable instantly across flights, hotels, and quick-book experiences.
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-1 shrink-0">
              <span className="text-xs text-zinc-400">Reward XP</span>
              <span className="text-lg font-bold text-cyan-400 tabular-nums font-mono">
                {rewardPoints.toLocaleString()} XP
              </span>
              <span className="text-[11px] text-zinc-400">
                {xpProgress}% to Tier 4
              </span>
            </div>
          </div>

          {/* Quick Top-Up Strip */}
          <div className="pt-5 border-t border-zinc-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-medium text-zinc-300">Add Travel Credits</span>
              {topupSuccess && (
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {topupSuccess}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[1000, 5000, 10000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickTopup(val)}
                  className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-white tabular-nums transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  + ₹{val.toLocaleString()}
                </button>
              ))}

              <form onSubmit={handleCustomTopup} className="flex items-center gap-2 flex-1 min-w-[180px]">
                <input
                  type="number"
                  min={100}
                  max={500000}
                  value={customTopup}
                  onChange={(e) => setCustomTopup(e.target.value)}
                  placeholder="Custom ₹ amount"
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-cyan-400 tabular-nums"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-zinc-950 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* LIVE CURRENCY CONVERTER */}
        <div className="p-6 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-display">
                Currency Converter
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Estimate foreign trip costs against your travel credit balance
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFromCurrency("INR");
                setAmount(String(walletBalance));
              }}
              className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer whitespace-nowrap shrink-0"
            >
              Use Wallet Balance (₹{walletBalance.toLocaleString()})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-end">
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">
                Amount & From
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-bold text-zinc-900 dark:text-white tabular-nums focus:outline-hidden focus:border-cyan-500"
                />
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-white cursor-pointer"
                >
                  {Object.entries(CURRENCY_RATES_FROM_INR).map(([code, meta]) => (
                    <option key={code} value={code}>
                      {code} ({meta.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-1 flex justify-center">
              <button
                type="button"
                onClick={handleSwapCurrencies}
                className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-cyan-500 transition-colors cursor-pointer"
                aria-label="Swap currencies"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">
                Converted To
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums flex items-center">
                  {CURRENCY_RATES_FROM_INR[toCurrency].symbol}
                  {convertedValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-white cursor-pointer"
                >
                  {Object.entries(CURRENCY_RATES_FROM_INR).map(([code, meta]) => (
                    <option key={code} value={code}>
                      {code} ({meta.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums pt-1">
            1 {fromCurrency} = {unitRate.toFixed(4)} {toCurrency} ·{" "}
            {CURRENCY_RATES_FROM_INR[toCurrency].name}
          </div>
        </div>

        {/* RECENT TRANSACTION HISTORY */}
        <div className="p-6 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-display">
                Recent Transaction History
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {transactions.length} recorded wallet operations
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              {(["all", "debit", "credit"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTxFilter(tab)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors cursor-pointer ${
                    txFilter === tab
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-zinc-500 dark:text-zinc-400">
              No {txFilter === "all" ? "" : txFilter} transactions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {filteredTransactions.map((tx) => {
                const isPositive = tx.type === "credit" || tx.type === "cashback";
                return (
                  <div
                    key={tx.id}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 px-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isPositive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {tx.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          <span>{tx.date}</span>
                          {tx.reference && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono">{tx.reference}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-sm font-bold tabular-nums font-mono shrink-0 ${
                        isPositive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-zinc-900 dark:text-zinc-200"
                      }`}
                    >
                      {isPositive ? "+" : "-"}₹{tx.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN (span 4) */}
      <div className="lg:col-span-4 space-y-6">
        {/* REWARD MILESTONES */}
        <div className="p-6 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-display">
              Reward Milestones
            </h4>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Tier 3 Explorer
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
              <span>{rewardPoints.toLocaleString()} XP</span>
              <span>{nextTierTarget.toLocaleString()} XP goal</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-cyan-500 dark:bg-cyan-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Earn XP when confirming bookings or sharing verified itineraries. Every 1,000 XP unlocks 5% cashback on flights.
          </p>
        </div>

        {/* SCRATCH COUPON ARENA */}
        <div className="p-6 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-cyan-500" />
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-display">
              Promo Scratch Card
            </h4>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Reveal a discount code to apply inside Quick Checkout or Bookings.
          </p>

          <div
            onClick={handleScratch}
            className={`p-5 rounded-xl border border-dashed text-center transition-colors ${
              scratched
                ? "bg-zinc-50 dark:bg-zinc-900 border-cyan-500/60"
                : "bg-zinc-100/70 dark:bg-zinc-900/60 border-zinc-300 dark:border-zinc-700 hover:border-cyan-500 cursor-pointer"
            }`}
          >
            {scratched ? (
              <div className="space-y-2.5">
                <p className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                  Unlocked Promo Code
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700">
                  <span className="text-sm font-bold font-mono text-zinc-900 dark:text-white select-all">
                    {scratchedCode}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCode();
                    }}
                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                    aria-label="Copy promo code"
                  >
                    {copiedCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Apply at checkout for up to 20% off.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 py-2">
                <Sparkles className="w-5 h-5 text-cyan-500 mx-auto" />
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  Click to Reveal Promo Code
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Instant discount up to ₹1,500
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ACHIEVEMENTS */}
        <div className="p-6 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-500" />
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-display">
              Traveler Badges
            </h4>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {achievements.map((ach) => (
              <div
                key={ach.title}
                className={`py-3 flex items-start justify-between gap-3 ${
                  ach.unlocked ? "" : "opacity-50"
                }`}
              >
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                    {ach.title}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {ach.desc}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-medium shrink-0 ${
                    ach.unlocked
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-400"
                  }`}
                >
                  {ach.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
