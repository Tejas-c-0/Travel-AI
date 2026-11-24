import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, ShieldCheck, Wallet, CreditCard, Users, Tag } from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: "flight" | "hotel" | "bus" | "train" | "activity";
  itemName: string;
  price: number;
  provider?: string;
  walletBalance: number;
  onConfirmBooking: (details: {
    itemType: "flight" | "hotel" | "bus" | "train" | "activity";
    itemName: string;
    provider: string;
    totalPrice: number;
    pax: number;
    date: string;
    walletUsed: number;
  }) => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  itemType,
  itemName,
  price,
  provider,
  walletBalance,
  onConfirmBooking,
}: BookingModalProps) {
  const [pax, setPax] = useState(1);
  const [travelDate, setTravelDate] = useState("2026-07-15");
  const [useWallet, setUseWallet] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPax(1);
      setPromoCode("");
      setPromoApplied(false);
      setUseWallet(walletBalance > 0);
    }
  }, [isOpen, walletBalance]);

  if (!isOpen) return null;

  const getPartner = () => {
    switch (itemType) {
      case "flight":
        return "Skyscanner Verified";
      case "hotel":
        return "Booking.com Partner";
      case "bus":
        return "RedBus Direct";
      case "train":
        return "IRCTC / ConfirmTkt";
      default:
        return "Klook Experiences";
    }
  };

  const partnerName = provider || getPartner();
  const baseSubtotal = price * pax;
  const promoDiscount = promoApplied ? Math.round(baseSubtotal * 0.15) : 0;
  const afterPromo = Math.max(0, baseSubtotal - promoDiscount);
  const walletDeduction = useWallet ? Math.min(walletBalance, afterPromo) : 0;
  const cardDue = Math.max(0, afterPromo - walletDeduction);

  const handleApplyPromo = () => {
    const clean = promoCode.trim().toUpperCase();
    if (clean === "TRAVELAI20" || clean === "FLYSHIELD100" || clean === "GOASAVINGS" || clean === "HOSTELFREE") {
      setPromoApplied(true);
    }
  };

  const handleConfirm = () => {
    onConfirmBooking({
      itemType,
      itemName,
      provider: partnerName,
      totalPrice: afterPromo,
      pax,
      date: travelDate,
      walletUsed: walletDeduction,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        id="booking-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          id="booking-modal-content"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.16 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md overflow-hidden bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl text-left"
        >
          {/* Header */}
          <div className="p-5 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Instant Checkout · Best Price Guarantee</span>
              </div>
              <h3 className="mt-1.5 text-lg font-bold text-zinc-900 dark:text-white font-display">
                Quick Checkout
              </h3>
            </div>
            <button
              id="close-booking-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
              aria-label="Close checkout modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Item Summary */}
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex justify-between items-start gap-4">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                  {itemType} · {partnerName}
                </p>
                <p className="font-bold text-sm text-zinc-900 dark:text-white mt-0.5 leading-snug">
                  {itemName}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-base font-bold text-zinc-900 dark:text-white tabular-nums">
                  ₹{price.toLocaleString()}
                </p>
                <p className="text-[11px] text-zinc-400">per traveler</p>
              </div>
            </div>

            {/* Date & Travelers */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
                  Travel Date
                </label>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Travelers
                </label>
                <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 h-[34px]">
                  <button
                    type="button"
                    onClick={() => setPax((p) => Math.max(1, p - 1))}
                    className="w-9 h-full font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center text-xs font-bold tabular-nums text-zinc-900 dark:text-white">
                    {pax}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPax((p) => Math.min(10, p + 1))}
                    className="w-9 h-full font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Promo Code */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Promo code (e.g. TRAVELAI20)"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white uppercase font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyPromo}
                className="px-3 py-2 text-xs font-semibold bg-zinc-900 dark:bg-zinc-800 text-white rounded-lg hover:opacity-90 cursor-pointer"
              >
                {promoApplied ? "Applied" : "Apply"}
              </button>
            </div>

            {/* Wallet Credits Toggle */}
            <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={useWallet}
                  disabled={walletBalance <= 0}
                  onChange={(e) => setUseWallet(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-cyan-500" />
                    Pay with TravelAI Wallet Credits
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                    Available: ₹{walletBalance.toLocaleString()}
                  </p>
                </div>
              </div>
              {walletDeduction > 0 && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  -₹{walletDeduction.toLocaleString()}
                </span>
              )}
            </label>

            {/* Price Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Subtotal ({pax} traveler{pax > 1 ? "s" : ""})</span>
                <span className="tabular-nums font-medium text-zinc-900 dark:text-zinc-200">
                  ₹{baseSubtotal.toLocaleString()}
                </span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Promo Discount (15%)</span>
                  <span className="tabular-nums font-semibold">-₹{promoDiscount.toLocaleString()}</span>
                </div>
              )}
              {walletDeduction > 0 && (
                <div className="flex justify-between text-cyan-600 dark:text-cyan-400">
                  <span>Wallet Credits Applied</span>
                  <span className="tabular-nums font-semibold">-₹{walletDeduction.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-800 text-sm font-bold text-zinc-900 dark:text-white">
                <span>Remaining Payable</span>
                <span className="tabular-nums text-base">₹{cardDue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 pt-0 flex flex-col gap-2">
            <button
              id="confirm-booking-partner"
              type="button"
              onClick={handleConfirm}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-5 text-xs font-bold text-white dark:text-zinc-950 bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-400 dark:hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              Confirm & Add to Bookings (+250 XP)
            </button>
            <button
              id="cancel-booking-partner"
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
