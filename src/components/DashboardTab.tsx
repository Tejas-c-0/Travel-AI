import React, { useState, useEffect } from "react";
import {
  Compass,
  Wallet,
  Activity,
  Award,
  Plus,
  ShieldCheck,
  ArrowLeftRight,
  GitCompare,
  BookmarkPlus,
  CheckCircle2,
  Clock,
  Check,
  X,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { TravelPlan, PriceTrackItem } from "../types";

interface DashboardTabProps {
  activeTrip: TravelPlan | null;
  savedTrips: TravelPlan[];
  priceTrackers: PriceTrackItem[];
  setActiveTab: (tab: any) => void;
  onSelectTrip: (trip: TravelPlan) => void;
  onSaveTrip?: () => void;
}

function getHotelSafetyAvg(trip: TravelPlan): number {
  if (!trip.hotels || trip.hotels.length === 0) return 90;
  const scores = trip.hotels
    .map((h) => h.safetyScore)
    .filter((s): s is number => typeof s === "number" && !Number.isNaN(s));
  if (scores.length === 0) return 90;
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

function getTransitSafetyAvg(trip: TravelPlan): number {
  if (!trip.transports || trip.transports.length === 0) return 90;
  const scores = trip.transports
    .map((t) => t.safetyScore)
    .filter((s): s is number => typeof s === "number" && !Number.isNaN(s));
  if (scores.length === 0) return 90;
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

function getOverallSafetyScore(trip: TravelPlan): number {
  return Math.round((getHotelSafetyAvg(trip) + getTransitSafetyAvg(trip)) / 2);
}

export default function DashboardTab({
  activeTrip,
  savedTrips,
  priceTrackers,
  setActiveTab,
  onSelectTrip,
  onSaveTrip,
}: DashboardTabProps) {
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>(() =>
    savedTrips.length >= 2 ? [savedTrips[0].id, savedTrips[1].id] : []
  );

  // Keep selectedTripIds valid when savedTrips changes
  useEffect(() => {
    setSelectedTripIds((prev) => {
      const valid = prev.filter((id) => savedTrips.some((t) => t.id === id));
      if (valid.length === 0 && savedTrips.length >= 2) {
        return [savedTrips[0].id, savedTrips[1].id];
      }
      return valid.slice(0, 2);
    });
  }, [savedTrips]);

  const toggleSelectTrip = (id: string) => {
    setSelectedTripIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length < 2) {
        return [...prev, id];
      }
      // Replace the oldest selected trip so switching is effortless
      return [prev[1], id];
    });
  };

  const tripA = savedTrips.find((t) => t.id === selectedTripIds[0]) || null;
  const tripB = savedTrips.find((t) => t.id === selectedTripIds[1]) || null;

  const handleSwapTrips = () => {
    if (selectedTripIds.length !== 2) return;
    setSelectedTripIds([selectedTripIds[1], selectedTripIds[0]]);
  };

  const handleClearSelection = () => {
    setSelectedTripIds([]);
  };

  // Aggregated dashboard stats
  const totalTrips = savedTrips.length + (activeTrip ? 1 : 0);
  const totalSavings =
    priceTrackers.reduce((acc, t) => acc + Math.max(0, t.originalPrice - t.currentPrice), 0) +
    4200;
  const travelScore = 96;
  const carbonOffset = totalTrips * 48;

  const savingsTimeline = [
    { name: "Jan", index: 102, savings: 800 },
    { name: "Feb", index: 95, savings: 1400 },
    { name: "Mar", index: 88, savings: 2100 },
    { name: "Apr", index: 84, savings: 3400 },
    { name: "May", index: 78, savings: 5600 },
    { name: "Jun", index: 72, savings: totalSavings },
  ];

  const getBudgetPieData = () => {
    if (!activeTrip || !activeTrip.budgetBreakdown) {
      return [
        { name: "Flights", value: 12000, color: "#06b6d4" },
        { name: "Hotels", value: 9500, color: "#3b82f6" },
        { name: "Food", value: 4500, color: "#f59e0b" },
        { name: "Transport", value: 3000, color: "#10b981" },
        { name: "Activities", value: 2000, color: "#64748b" },
      ];
    }
    const b = activeTrip.budgetBreakdown;
    return [
      { name: "Flights", value: b.flights || 0, color: "#06b6d4" },
      { name: "Hotels", value: b.hotels || 0, color: "#3b82f6" },
      { name: "Food", value: b.food || 0, color: "#f59e0b" },
      { name: "Transport", value: b.transport || 0, color: "#10b981" },
      { name: "Shopping", value: b.shopping || 0, color: "#6366f1" },
      { name: "Activities", value: b.activities || 0, color: "#64748b" },
    ].filter((item) => item.value > 0);
  };

  const pieData = getBudgetPieData();

  const canSaveActiveTrip =
    Boolean(activeTrip) &&
    Boolean(onSaveTrip) &&
    !savedTrips.some((t) => t.id === activeTrip?.id);

  // Comparison calculations when both trips are selected
  const renderComparisonTable = () => {
    if (!tripA || !tripB) return null;

    const costA = tripA.budgetBreakdown?.totalBudget || 0;
    const costB = tripB.budgetBreakdown?.totalBudget || 0;
    const costDiff = Math.abs(costA - costB);
    const cheaperTrip = costA < costB ? "A" : costB < costA ? "B" : "tie";

    const dailyA = tripA.budgetBreakdown?.dailyBudget || 0;
    const dailyB = tripB.budgetBreakdown?.dailyBudget || 0;
    const dailyDiff = Math.abs(dailyA - dailyB);

    const daysA = tripA.query?.days || 1;
    const daysB = tripB.query?.days || 1;
    const daysDiff = Math.abs(daysA - daysB);

    const safetyA = getOverallSafetyScore(tripA);
    const safetyB = getOverallSafetyScore(tripB);
    const safetyDiff = Math.abs(safetyA - safetyB);
    const saferTrip = safetyA > safetyB ? "A" : safetyB > safetyA ? "B" : "tie";

    const hotelSafetyA = getHotelSafetyAvg(tripA);
    const hotelSafetyB = getHotelSafetyAvg(tripB);

    const transitSafetyA = getTransitSafetyAvg(tripA);
    const transitSafetyB = getTransitSafetyAvg(tripB);

    const transitCostA = (tripA.budgetBreakdown?.flights || 0) + (tripA.budgetBreakdown?.transport || 0);
    const transitCostB = (tripB.budgetBreakdown?.flights || 0) + (tripB.budgetBreakdown?.transport || 0);

    return (
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900/70 border-b border-zinc-200 dark:border-zinc-800 text-xs">
              <th className="py-3.5 px-4 font-semibold text-zinc-500 dark:text-zinc-400 w-1/4">
                Comparison Metric
              </th>
              <th className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white w-1/4">
                <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 block">
                  Trip A
                </span>
                {tripA.query.destination}
              </th>
              <th className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white w-1/4">
                <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 block">
                  Trip B
                </span>
                {tripB.query.destination}
              </th>
              <th className="py-3.5 px-4 font-semibold text-zinc-500 dark:text-zinc-400 w-1/4">
                Delta / Advantage
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-xs">
            {/* Route & Style */}
            <tr className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30">
              <td className="py-3.5 px-4 font-medium text-zinc-600 dark:text-zinc-400">
                Route & Style
              </td>
              <td className="py-3.5 px-4 text-zinc-900 dark:text-zinc-100">
                <span className="font-semibold">
                  {tripA.query.startingLocation} ➔ {tripA.query.destination}
                </span>
                <span className="block text-[11px] text-zinc-500 capitalize mt-0.5">
                  {tripA.query.style} · {tripA.query.travelers} Pax
                </span>
              </td>
              <td className="py-3.5 px-4 text-zinc-900 dark:text-zinc-100">
                <span className="font-semibold">
                  {tripB.query.startingLocation} ➔ {tripB.query.destination}
                </span>
                <span className="block text-[11px] text-zinc-500 capitalize mt-0.5">
                  {tripB.query.style} · {tripB.query.travelers} Pax
                </span>
              </td>
              <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400">
                {tripA.query.style === tripB.query.style ? "Same style" : "Different styles"}
              </td>
            </tr>

            {/* Total Cost */}
            <tr className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30">
              <td className="py-3.5 px-4 font-medium text-zinc-600 dark:text-zinc-400">
                Total Estimated Cost
              </td>
              <td className="py-3.5 px-4 tabular-nums">
                <span
                  className={`text-sm font-bold ${
                    cheaperTrip === "A"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-900 dark:text-white"
                  }`}
                >
                  ₹{costA.toLocaleString()}
                </span>
                {cheaperTrip === "A" && (
                  <span className="block text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    Lower Cost
                  </span>
                )}
              </td>
              <td className="py-3.5 px-4 tabular-nums">
                <span
                  className={`text-sm font-bold ${
                    cheaperTrip === "B"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-900 dark:text-white"
                  }`}
                >
                  ₹{costB.toLocaleString()}
                </span>
                {cheaperTrip === "B" && (
                  <span className="block text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    Lower Cost
                  </span>
                )}
              </td>
              <td className="py-3.5 px-4 tabular-nums font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                {cheaperTrip === "tie"
                  ? "Equal cost"
                  : `Trip ${cheaperTrip} saves ₹${costDiff.toLocaleString()}`}
              </td>
            </tr>

            {/* Daily Budget */}
            <tr className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30">
              <td className="py-3.5 px-4 font-medium text-zinc-600 dark:text-zinc-400">
                Daily Spend Estimate
              </td>
              <td className="py-3.5 px-4 tabular-nums font-semibold text-zinc-900 dark:text-zinc-200">
                ₹{dailyA.toLocaleString()} / day
              </td>
              <td className="py-3.5 px-4 tabular-nums font-semibold text-zinc-900 dark:text-zinc-200">
                ₹{dailyB.toLocaleString()} / day
              </td>
              <td className="py-3.5 px-4 tabular-nums font-mono text-zinc-500 dark:text-zinc-400">
                {dailyDiff === 0
                  ? "Equal daily spend"
                  : `₹${dailyDiff.toLocaleString()} / day difference`}
              </td>
            </tr>

            {/* Cost Breakdown: Transit & Stays */}
            <tr className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30">
              <td className="py-3.5 px-4 font-medium text-zinc-600 dark:text-zinc-400">
                Flights & Transit / Lodging
              </td>
              <td className="py-3.5 px-4 tabular-nums text-zinc-700 dark:text-zinc-300">
                ₹{transitCostA.toLocaleString()} / ₹{tripA.budgetBreakdown.hotels.toLocaleString()}
              </td>
              <td className="py-3.5 px-4 tabular-nums text-zinc-700 dark:text-zinc-300">
                ₹{transitCostB.toLocaleString()} / ₹{tripB.budgetBreakdown.hotels.toLocaleString()}
              </td>
              <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400">
                Transit vs Stays split
              </td>
            </tr>

            {/* Duration */}
            <tr className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30">
              <td className="py-3.5 px-4 font-medium text-zinc-600 dark:text-zinc-400">
                Trip Duration
              </td>
              <td className="py-3.5 px-4 tabular-nums font-bold text-zinc-900 dark:text-white">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-500" />
                  {daysA} {daysA === 1 ? "Day" : "Days"}
                </span>
              </td>
              <td className="py-3.5 px-4 tabular-nums font-bold text-zinc-900 dark:text-white">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-500" />
                  {daysB} {daysB === 1 ? "Day" : "Days"}
                </span>
              </td>
              <td className="py-3.5 px-4 tabular-nums font-mono text-zinc-700 dark:text-zinc-300">
                {daysDiff === 0
                  ? "Same duration"
                  : `${daysA > daysB ? "Trip A" : "Trip B"} is +${daysDiff} ${
                      daysDiff === 1 ? "day" : "days"
                    }`}
              </td>
            </tr>

            {/* Overall Safety Score */}
            <tr className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30">
              <td className="py-3.5 px-4 font-medium text-zinc-600 dark:text-zinc-400">
                Overall Safety Score
              </td>
              <td className="py-3.5 px-4 tabular-nums">
                <span
                  className={`inline-flex items-center gap-1.5 text-sm font-bold ${
                    saferTrip === "A"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-900 dark:text-white"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  {safetyA} / 100
                </span>
                {saferTrip === "A" && (
                  <span className="block text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    Higher Safety
                  </span>
                )}
              </td>
              <td className="py-3.5 px-4 tabular-nums">
                <span
                  className={`inline-flex items-center gap-1.5 text-sm font-bold ${
                    saferTrip === "B"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-900 dark:text-white"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  {safetyB} / 100
                </span>
                {saferTrip === "B" && (
                  <span className="block text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    Higher Safety
                  </span>
                )}
              </td>
              <td className="py-3.5 px-4 tabular-nums font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                {saferTrip === "tie"
                  ? "Equal safety rating"
                  : `Trip ${saferTrip} +${safetyDiff} pts`}
              </td>
            </tr>

            {/* Sub-scores: Hotel & Transit Safety */}
            <tr className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30">
              <td className="py-3.5 px-4 font-medium text-zinc-600 dark:text-zinc-400">
                Stay / Transit Safety
              </td>
              <td className="py-3.5 px-4 tabular-nums text-zinc-700 dark:text-zinc-300">
                {hotelSafetyA}/100 stay · {transitSafetyA}/100 transit
              </td>
              <td className="py-3.5 px-4 tabular-nums text-zinc-700 dark:text-zinc-300">
                {hotelSafetyB}/100 stay · {transitSafetyB}/100 transit
              </td>
              <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400">
                Avg across vetted options
              </td>
            </tr>

            {/* Actions */}
            <tr className="bg-zinc-50/50 dark:bg-zinc-900/30">
              <td className="py-3.5 px-4 font-medium text-zinc-600 dark:text-zinc-400">
                Workspace Action
              </td>
              <td className="py-3.5 px-4">
                <button
                  type="button"
                  onClick={() => onSelectTrip(tripA)}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Open Trip A
                </button>
              </td>
              <td className="py-3.5 px-4">
                <button
                  type="button"
                  onClick={() => onSelectTrip(tripB)}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-zinc-950 text-xs font-bold cursor-pointer transition-colors"
                >
                  Open Trip B
                </button>
              </td>
              <td className="py-3.5 px-4 text-[11px] text-zinc-500 dark:text-zinc-400">
                Loads itinerary into Planner
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div id="dashboard-tab-panel" className="space-y-8 text-left">
      {/* HEADER BANNER */}
      <div className="rounded-xl bg-zinc-950 text-white border border-zinc-800 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <Activity className="w-4 h-4" />
            <span>Analytics Hub</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span className="text-zinc-400">Trip Comparison & Savings</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-display">
            Travel Intelligence Overview
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Compare saved itineraries side-by-side by total cost, duration, and verified safety ratings.
          </p>
        </div>
        <button
          id="dash-plan-btn"
          type="button"
          onClick={() => setActiveTab("planner")}
          className="px-4 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-zinc-950 text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" /> Plan Next AI Trip
        </button>
      </div>

      {/* METRIC OVERVIEW ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Trips Planned
            </span>
            <Compass className="w-4 h-4 text-cyan-500" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
            {totalTrips}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            {savedTrips.length} Saved · {activeTrip ? "1 Active" : "0 Active"}
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Money Saved
            </span>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
            ₹{totalSavings.toLocaleString()}
          </h3>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
            +14.2% optimized rate
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Travel Score
            </span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
            {travelScore}/100
          </h3>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full"
              style={{ width: `${travelScore}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Carbon Offset
            </span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
            {carbonOffset} kg CO2
          </h3>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Low-emission routing
          </p>
        </div>
      </div>

      {/* SIDE-BY-SIDE SAVED TRIP COMPARISON SECTION (MULTI-SELECT) */}
      <section
        id="trip-comparison-section"
        className="p-6 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white font-display flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-cyan-500" />
              Compare Saved Trips Side-by-Side
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Select two saved itineraries below to compare cost, duration, and safety scores.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300 tabular-nums px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              {selectedTripIds.length} / 2 Selected
            </span>
            {selectedTripIds.length === 2 && (
              <button
                type="button"
                onClick={handleSwapTrips}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:border-cyan-500 transition-colors cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Swap A ↔ B
              </button>
            )}
            {selectedTripIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {savedTrips.length === 0 ? (
          <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-center space-y-4">
            <div className="space-y-1 max-w-md mx-auto">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Save at least 2 trips to compare them side-by-side
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Generate a plan in the Trip Planner and click Save Trip to add it to your multi-select comparison list.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("planner")}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-zinc-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Plan & Save a Trip
              </button>

              {canSaveActiveTrip && activeTrip && (
                <button
                  type="button"
                  onClick={onSaveTrip}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-emerald-400" />
                  Save Active Trip ({activeTrip.query.destination})
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* MULTI-SELECT SAVED TRIPS GRID */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              role="group"
              aria-label="Multi-select saved trips for comparison"
            >
              {savedTrips.map((trip) => {
                const slotIndex = selectedTripIds.indexOf(trip.id);
                const isSelected = slotIndex !== -1;
                const slotLabel = slotIndex === 0 ? "Trip A" : slotIndex === 1 ? "Trip B" : null;
                const safetyScore = getOverallSafetyScore(trip);

                return (
                  <button
                    key={trip.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleSelectTrip(trip.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? "bg-cyan-50/50 dark:bg-cyan-950/25 border-cyan-500 dark:border-cyan-400"
                        : "bg-zinc-50/60 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                        isSelected
                          ? "bg-cyan-600 dark:bg-cyan-400 border-cyan-600 dark:border-cyan-400 text-white dark:text-zinc-950"
                          : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {trip.query.startingLocation} ➔ {trip.query.destination}
                        </span>
                        {slotLabel && (
                          <span className="text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-300 shrink-0">
                            {slotLabel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          ₹{trip.budgetBreakdown.totalBudget.toLocaleString()}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{trip.query.days}d</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Safety {safetyScore}/100
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {savedTrips.length < 2 ? (
              <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-zinc-600 dark:text-zinc-300">
                  1 trip saved (<strong className="text-zinc-900 dark:text-white">{savedTrips[0].query.destination}</strong>). Save 1 more trip to unlock the side-by-side comparison table.
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  {canSaveActiveTrip && activeTrip && (
                    <button
                      type="button"
                      onClick={onSaveTrip}
                      className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5 text-emerald-400" />
                      Save Active Trip
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab("planner")}
                    className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-zinc-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Plan Another Trip
                  </button>
                </div>
              </div>
            ) : selectedTripIds.length < 2 ? (
              <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-dashed border-zinc-300 dark:border-zinc-700 text-center space-y-1">
                <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Select {2 - selectedTripIds.length} more saved{" "}
                  {2 - selectedTripIds.length === 1 ? "trip" : "trips"} above to compare
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Check any two trips in the multi-select grid to render cost, duration, and safety metrics side-by-side.
                </p>
              </div>
            ) : (
              renderComparisonTable()
            )}
          </div>
        )}
      </section>

      {/* RECHARTS VISUALIZATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-5">
          <div className="flex justify-between items-center gap-2">
            <div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white font-display">
                {activeTrip ? `Budget Layout: ${activeTrip.query.destination}` : "Budget Allocation Model"}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Category breakdown for active trip
              </p>
            </div>
            {activeTrip && (
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 tabular-nums font-mono">
                ₹{activeTrip.budgetBreakdown.totalBudget.toLocaleString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
            <div className="sm:col-span-5 space-y-2">
              {pieData.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-xs px-2.5 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800"
                >
                  <span className="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-300">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.name}
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    ₹{item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="sm:col-span-7 h-52 relative flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `₹${Number(val).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center pointer-events-none">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Style</span>
                <span className="text-xs font-bold text-cyan-500 capitalize">
                  {activeTrip ? activeTrip.query.style : "Budget"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-5">
          <div>
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white font-display">
              Savings & Booking Indices
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Cumulative savings vs route pricing index
            </p>
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={savingsTimeline}>
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line
                  type="monotone"
                  dataKey="savings"
                  name="Cumulative Savings"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3.5 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="index"
                  name="Route Price Index"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TRAVEL TIMELINE */}
      <div className="p-6 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-5">
        <h4 className="font-bold text-sm text-zinc-900 dark:text-white font-display">
          Trip Activity Timeline
        </h4>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {activeTrip && (
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Active Trip
                  </span>
                  <span aria-hidden="true" className="text-zinc-400">·</span>
                  <span className="text-zinc-500 dark:text-zinc-400 capitalize">
                    {activeTrip.query.style} · {activeTrip.query.days} Days
                  </span>
                </div>
                <h5 className="font-bold text-zinc-900 dark:text-white text-sm">
                  {activeTrip.query.startingLocation} ➔ {activeTrip.query.destination}
                </h5>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectTrip(activeTrip)}
                  className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-200 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  View Plan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("bookings")}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-zinc-950 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Manage Bookings
                </button>
              </div>
            </div>
          )}

          {savedTrips.map((trip) => (
            <div
              key={trip.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                    Saved Plan
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{new Date(trip.createdAt || Date.now()).toLocaleDateString()}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums font-mono">
                    ₹{trip.budgetBreakdown.totalBudget.toLocaleString()}
                  </span>
                </div>
                <h5 className="font-bold text-zinc-900 dark:text-white text-sm">
                  {trip.query.startingLocation} ➔ {trip.query.destination} ({trip.query.days} Days)
                </h5>
              </div>
              <button
                type="button"
                onClick={() => onSelectTrip(trip)}
                className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-200 rounded-lg text-xs font-semibold cursor-pointer self-start sm:self-center"
              >
                Open in Planner
              </button>
            </div>
          ))}

          {!activeTrip && savedTrips.length === 0 && (
            <div className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
              No trips planned yet. Start in the Trip Planner to see your timeline here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
