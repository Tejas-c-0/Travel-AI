import React, { useState } from "react";
import {
  Plane,
  Hotel,
  Train,
  Bus,
  ShieldCheck,
  CreditCard,
  Trash2,
  CheckCircle2,
  Utensils,
  Compass,
  Ticket,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TravelPlan, BookingItem } from "../types";

interface BookingsTabProps {
  activeTrip: TravelPlan | null;
  confirmedBookings: BookingItem[];
  walletBalance: number;
  onConfirmCartCheckout: (
    items: { name: string; type: BookingCategory; price: number; provider: string }[],
    totalAfterDiscounts: number,
    walletUsed: number,
    date: string,
    pax: number
  ) => void;
  onCancelBooking: (bookingId: string) => void;
  onAddNotification: (notif: any) => void;
  onAddRewardPoints: (points: number) => void;
  onSwitchToExplore: () => void;
}

type BookingCategory = "flight" | "hotel" | "train" | "bus" | "food" | "insurance";

export default function BookingsTab({
  activeTrip,
  confirmedBookings,
  walletBalance,
  onConfirmCartCheckout,
  onCancelBooking,
  onAddNotification,
  onAddRewardPoints,
  onSwitchToExplore,
}: BookingsTabProps) {
  const [activeCategory, setActiveCategory] = useState<BookingCategory>("flight");
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [promoError, setPromoError] = useState("");
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [lastPaidTotal, setLastPaidTotal] = useState(0);
  const [useWalletBalance, setUseWalletBalance] = useState(true);

  const [fromLoc, setFromLoc] = useState(activeTrip?.query?.startingLocation || "Mumbai");
  const [toLoc, setToLoc] = useState(activeTrip?.query?.destination || "Goa");
  const [date, setDate] = useState("2026-07-15");
  const [pax, setPax] = useState(activeTrip?.query?.travelers || 2);

  const [cart, setCart] = useState<
    { id: string; name: string; type: BookingCategory; price: number; provider: string }[]
  >(
    activeTrip
      ? [
          {
            id: "c_f1",
            name: `Flight ${activeTrip.query?.startingLocation || "Origin"} ➔ ${activeTrip.query?.destination || "Destination"} (${activeTrip.query?.travelers || 1} Pax)`,
            type: "flight",
            price: (activeTrip.budgetBreakdown?.flights && activeTrip.budgetBreakdown.flights > 0) ? activeTrip.budgetBreakdown.flights : 8700,
            provider: "IndiGo Airlines Verified",
          },
          {
            id: "c_h1",
            name: `${activeTrip.hotels?.[0]?.name || "Beachside Residency"} (${activeTrip.query?.days || 3} Nights)`,
            type: "hotel",
            price: (activeTrip.budgetBreakdown?.hotels && activeTrip.budgetBreakdown.hotels > 0) ? activeTrip.budgetBreakdown.hotels : 9600,
            provider: "Booking.com Partner",
          },
        ]
      : []
  );

  const handleDeleteCartItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleApplyPromo = () => {
    const clean = promoCode.trim().toUpperCase();
    if (clean === "TRAVELAI20" || clean === "FLYSHIELD100" || clean === "GOASAVINGS" || clean === "HOSTELFREE") {
      setAppliedDiscount(20);
      setPromoError("");
      onAddNotification({
        id: "n_" + Date.now(),
        title: "Promo Code Applied",
        text: `Unlocked a 20% discount using code ${clean}.`,
        time: "Just now",
        read: false,
      });
    } else {
      setPromoError("Invalid code. Try TRAVELAI20");
    }
  };

  const subTotal = cart.reduce((acc, item) => acc + item.price, 0);
  const couponDiscountAmount = Math.round(subTotal * (appliedDiscount / 100));
  const afterCoupon = Math.max(0, subTotal - couponDiscountAmount);
  const walletDeductionAmount = useWalletBalance ? Math.min(walletBalance, afterCoupon) : 0;
  const finalTotal = Math.max(0, afterCoupon - walletDeductionAmount);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setLastPaidTotal(finalTotal);
    onConfirmCartCheckout(cart, afterCoupon, walletDeductionAmount, date, pax);
    onAddRewardPoints(500);
    setCheckoutSuccess(true);
    setCart([]);
  };

  const renderSearchResults = () => {
    switch (activeCategory) {
      case "flight":
        return [
          { provider: "IndiGo Airlines Direct", time: "06:15 - 07:30", price: 4350, type: "flight" },
          { provider: "Air India Express", time: "09:45 - 11:15", price: 5600, type: "flight" },
        ];
      case "hotel":
        return [
          { provider: "Residency Inn Boutique", time: "Central District", price: 2400, type: "hotel" },
          { provider: "Taj Waterfront Oasis", time: "Beachfront Road", price: 6800, type: "hotel" },
        ];
      case "train":
        return [
          { provider: "Mandovi AC Express", time: "07:10 - 18:45", price: 1250, type: "train" },
          { provider: "Tejas High-Speed Rail", time: "05:50 - 14:10", price: 1850, type: "train" },
        ];
      case "bus":
        return [
          { provider: "KSRTC Volvo Sleeper", time: "20:00 - 07:30", price: 1600, type: "bus" },
          { provider: "VRL Multi-Axle Coach", time: "21:30 - 08:45", price: 1450, type: "bus" },
        ];
      case "food":
        return [
          { provider: "In-Flight Fresh Meal Box", time: "Pre-booked Veg/Non-Veg", price: 450, type: "food" },
          { provider: "Local Tasting Pass", time: "3-stop curated dining", price: 950, type: "food" },
        ];
      case "insurance":
        return [
          { provider: "Acko Travel Shield", time: "Medical & delay coverage", price: 499, type: "insurance" },
          { provider: "HDFC ERGO Smart Cover", time: "Flight & baggage cover", price: 799, type: "insurance" },
        ];
    }
  };

  const handleAddToCart = (item: any) => {
    const newItem = {
      id: "cart_" + Date.now(),
      name: `${item.provider} (${fromLoc} ➔ ${toLoc})`,
      type: item.type as BookingCategory,
      price: item.price * pax,
      provider: item.provider,
    };
    setCart((prev) => [...prev, newItem]);
  };

  return (
    <div id="bookings-tab-panel" className="text-left space-y-8">
      {/* CONFIRMED BOOKINGS LEDGER */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight font-display text-zinc-900 dark:text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-emerald-500" />
              Confirmed Reservations & E-Tickets
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Saved locally across sessions · {confirmedBookings.length} total reservations
            </p>
          </div>
          <button
            type="button"
            onClick={onSwitchToExplore}
            className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
          >
            + Browse More Hotspots & Packages
          </button>
        </div>

        {confirmedBookings.length === 0 ? (
          <div className="p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-center space-y-3">
            <Compass className="w-7 h-7 text-zinc-400 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                No confirmed bookings yet
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Use Book Now or Quick Book on the Home tab, or add segments below to confirm your first reservation.
              </p>
            </div>
            <button
              type="button"
              onClick={onSwitchToExplore}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-zinc-950 text-xs font-bold cursor-pointer"
            >
              Explore Destinations
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {confirmedBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`font-semibold ${
                          booking.status === "Confirmed"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-zinc-400"
                        }`}
                      >
                        {booking.status}
                      </span>
                      <span aria-hidden="true" className="text-zinc-400">·</span>
                      <span className="font-mono text-zinc-500 dark:text-zinc-400">
                        PNR {booking.pnr}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                      {booking.name}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {booking.provider} · {booking.date} · {booking.pax} Pax
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums font-mono">
                      ₹{booking.price.toLocaleString()}
                    </p>
                    {booking.paidWithWallet > 0 && (
                      <p className="text-[11px] text-cyan-600 dark:text-cyan-400 tabular-nums">
                        Wallet: -₹{booking.paidWithWallet.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {booking.status === "Confirmed" && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-mono">{booking.createdAt}</span>
                    <button
                      type="button"
                      onClick={() => onCancelBooking(booking.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-rose-500 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Cancel & Refund Credits
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MULTI-SEGMENT BOOKING BUILDER */}
      <AnimatePresence mode="wait">
        {checkoutSuccess ? (
          <motion.div
            id="checkout-success-pane"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-6 sm:p-8 bg-zinc-950 border border-zinc-800 rounded-xl space-y-5 max-w-xl mx-auto text-center text-white"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold font-display">Segments Confirmed</h3>
              <p className="text-xs text-zinc-400">
                Your new tickets have been added to Confirmed Reservations above and +500 XP was credited.
              </p>
            </div>
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-400">Card Paid</span>
              <span className="font-bold text-white tabular-nums">
                ₹{lastPaidTotal.toLocaleString()}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCheckoutSuccess(false)}
              className="w-full py-2.5 px-6 rounded-lg bg-cyan-400 text-zinc-950 font-bold text-xs hover:bg-cyan-300 transition-colors cursor-pointer"
            >
              Add More Segments
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              {/* Category tabs */}
              <div className="flex space-x-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-x-auto border border-zinc-200 dark:border-zinc-800">
                {(
                  [
                    { id: "flight", label: "Flights", icon: Plane },
                    { id: "hotel", label: "Hotels", icon: Hotel },
                    { id: "train", label: "Trains", icon: Train },
                    { id: "bus", label: "Buses", icon: Bus },
                    { id: "food", label: "Food", icon: Utensils },
                    { id: "insurance", label: "Insurance", icon: ShieldCheck },
                  ] as const
                ).map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                        activeCategory === cat.id
                          ? "bg-zinc-900 dark:bg-zinc-800 text-white"
                          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Search parameters */}
              <div className="p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Add Multi-Segment Booking
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
                      From
                    </label>
                    <input
                      type="text"
                      value={fromLoc}
                      onChange={(e) => setFromLoc(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
                      Destination
                    </label>
                    <input
                      type="text"
                      value={toLoc}
                      onChange={(e) => setToLoc(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
                      Departure
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
                      Travelers
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={pax}
                      onChange={(e) => setPax(parseInt(e.target.value, 10) || 1)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Results list */}
              <div className="space-y-3">
                {renderSearchResults()?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white text-sm">
                        {item.provider}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                        {item.time}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 justify-between w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {pax} Pax Total
                        </p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums">
                          ₹{(item.price * pax).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        className="px-3.5 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:opacity-90 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        + Add to Bag
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CHECKOUT BAG SIDEBAR (span 4) */}
            <div className="lg:col-span-4">
              <div className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-display">
                    Checkout Bag
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Combine segments and pay with Travel Credits
                  </p>
                </div>

                {cart.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400 border-y border-zinc-100 dark:border-zinc-900">
                    Your checkout bag is empty. Add a segment on the left.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-900 max-h-56 overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="py-3 flex justify-between items-start gap-2"
                      >
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {item.provider}
                          </p>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-white text-xs tabular-nums">
                            ₹{item.price.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCartItem(item.id)}
                            className="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Promo code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="TRAVELAI20"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono uppercase rounded-lg text-zinc-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-3.5 py-2 bg-zinc-900 dark:bg-zinc-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[11px] text-rose-500">{promoError}</p>
                  )}
                </div>

                {/* Wallet toggle */}
                <label className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useWalletBalance}
                      disabled={walletBalance <= 0}
                      onChange={(e) => setUseWalletBalance(e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white block">
                        Apply Wallet Credits
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                        Available: ₹{walletBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </label>

                {/* Totals */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                    <span>Subtotal</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-200 tabular-nums">
                      ₹{subTotal.toLocaleString()}
                    </span>
                  </div>
                  {couponDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Promo ({appliedDiscount}%)</span>
                      <span className="tabular-nums">-₹{couponDiscountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {walletDeductionAmount > 0 && (
                    <div className="flex justify-between text-cyan-600 dark:text-cyan-400 font-semibold">
                      <span>Wallet Credits</span>
                      <span className="tabular-nums">-₹{walletDeductionAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center text-sm font-bold text-zinc-900 dark:text-white">
                    <span>Total Payable</span>
                    <span className="tabular-nums text-base">
                      ₹{finalTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-zinc-950 rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  Confirm & Pay
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
