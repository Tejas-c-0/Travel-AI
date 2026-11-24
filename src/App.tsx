import React, { useState, useEffect } from "react";
import {
  Compass,
  Sparkles,
  CreditCard,
  Bookmark,
  Users,
  MessageSquare,
  Wallet,
  Settings,
  Activity,
  Bell,
  Sun,
  Moon,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import ExploreTab from "./components/ExploreTab";
import PlannerTab from "./components/PlannerTab";
import BookingsTab from "./components/BookingsTab";
import SavedTab from "./components/SavedTab";
import CommunityTab from "./components/CommunityTab";
import AssistantTab from "./components/AssistantTab";
import WalletTab from "./components/WalletTab";
import ProfileTab from "./components/ProfileTab";
import DashboardTab from "./components/DashboardTab";

import BookingModal from "./components/BookingModal";
import LoginScreen from "./components/LoginScreen";
import ErrorBoundary from "./components/ErrorBoundary";
import { subscribeToast, showToast, ToastType } from "./utils/toast";
import {
  loadSafeUser,
  loadSafeSavedTrips,
  loadSafeActiveTrip,
  loadSafeBookings,
  loadSafeNumber,
  loadSafeBoolean,
  loadSafeTransactions,
  loadSafeCommunityPosts,
  loadSafeWishlist,
  loadSafeJournal,
  safeWriteStorage,
} from "./utils/storage";
import {
  TravelPlan,
  ChatMessage,
  CommunityPost,
  PriceTrackItem,
  BookingItem,
  WalletTransaction,
} from "./types";

const INITIAL_PRICE_TRACKERS: PriceTrackItem[] = [
  {
    id: "pt_1",
    type: "flight",
    title: "Mumbai (BOM) to Goa (GOI)",
    originalPrice: 5200,
    currentPrice: 4350,
    history: [
      { date: "June 15", price: 5200 },
      { date: "June 18", price: 5100 },
      { date: "June 22", price: 4800 },
      { date: "June 30", price: 4350 },
    ],
    notifyOnDrop: true,
    status: "down",
  },
  {
    id: "pt_2",
    type: "hotel",
    title: "Beachside Palms Homestay (Goa)",
    originalPrice: 2800,
    currentPrice: 2400,
    history: [
      { date: "June 15", price: 2800 },
      { date: "June 22", price: 2600 },
      { date: "June 30", price: 2400 },
    ],
    notifyOnDrop: true,
    status: "down",
  },
];

const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "post_1",
    author: "Arjun Mehta",
    avatar: "",
    destination: "Goa, India",
    rating: 5,
    tips: "Take the KSRTC Sleeper bus from Mumbai instead of flying. It drops you right in Mapusa by 8 AM, saving nearly ₹4,000 on flights and airport taxis.",
    itinerarySummary:
      "4 Days · Day 1 Fontainhas & Panaji -> Day 2 Butterfly Beach -> Day 3 Dudhsagar Falls -> Day 4 Candolim Sunset",
    story:
      "Just spent 4 days exploring South Goa. Found an incredible hidden cove called Butterfly Beach. Rent a scooter for ₹350/day and ride through the canopy roads.",
    likes: 42,
    hasLiked: false,
    comments: [
      { author: "Sneha Rao", text: "Butterfly beach is gorgeous! Did you take the boat from Palolem?", time: "2 hours ago" },
      { author: "Kunal Shah", text: "Great tip on the overnight sleeper bus route.", time: "1 day ago" },
    ],
    createdAt: "July 1, 2026",
  },
  {
    id: "post_2",
    author: "Elena Petrova",
    avatar: "",
    destination: "Tokyo, Japan",
    rating: 5,
    tips: "Always buy a 72-hour Tokyo Subway Pass in advance—it costs ¥1,500 and saves massively over point-to-point fares.",
    itinerarySummary:
      "5 Days · Day 1 Asakusa & Ueno -> Day 2 Shibuya & Harajuku -> Day 3 Tsukiji & Ginza -> Day 4 Shinjuku -> Day 5 Yanaka",
    story:
      "My solo trip to Japan was unforgettable. Omoide Yokocho has tiny 4-seat yakitori counters, and convenience store meals cut my daily food spend in half.",
    likes: 89,
    hasLiked: true,
    comments: [{ author: "Kenji Sato", text: "Solid Tokyo transit advice!", time: "5 hours ago" }],
    createdAt: "June 28, 2026",
  },
];

const INITIAL_WALLET_TRANSACTIONS: WalletTransaction[] = [
  {
    id: "tx_init_1",
    title: "Welcome Travel Credit Grant",
    type: "credit",
    amount: 12000,
    date: "June 20, 2026",
    reference: "CR-WELCOME",
  },
  {
    id: "tx_init_2",
    title: "Flight Cashback Rebate (5%)",
    type: "cashback",
    amount: 3000,
    date: "June 27, 2026",
    reference: "CB-BOM-GOI",
  },
];

const INITIAL_JOURNAL = [
  {
    id: "j_1",
    title: "Peaceful morning at Candolim beach",
    date: "2026-06-25",
    content:
      "Quiet beachfront walk. Bought fresh coconut water for ₹50 and watched the sunrise. Highly recommend Candolim over Calangute to avoid crowds.",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=500&auto=format&fit=crop&q=60",
  },
];

type AppTab =
  | "explore"
  | "planner"
  | "bookings"
  | "saved"
  | "community"
  | "assistant"
  | "wallet"
  | "profile"
  | "dashboard";

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("explore");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() =>
    loadSafeBoolean("travelai_dark_mode", true)
  );

  // Persisted Authentication & User Profile (Validated)
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar: string;
    role: string;
    level: string;
    provider?: string;
    isGuest?: boolean;
  } | null>(() => loadSafeUser(null));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    Boolean(loadSafeUser(null))
  );

  // Search & Planner Prefill States
  const [searchQuery, setSearchQuery] = useState("");
  const [prefilledDestination, setPrefilledDestination] = useState<string>("");
  const [prefillNonce, setPrefillNonce] = useState<number>(0);

  // Persistent App States (Schema-Checked)
  const [savedTrips, setSavedTrips] = useState<TravelPlan[]>(() =>
    loadSafeSavedTrips([])
  );
  const [activeTrip, setActiveTrip] = useState<TravelPlan | null>(() =>
    loadSafeActiveTrip(null)
  );
  const [confirmedBookings, setConfirmedBookings] = useState<BookingItem[]>(() =>
    loadSafeBookings([])
  );
  const [walletBalance, setWalletBalance] = useState<number>(() =>
    loadSafeNumber("travelai_wallet_balance", 15000)
  );
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(() =>
    loadSafeTransactions(INITIAL_WALLET_TRANSACTIONS)
  );
  const [rewardPoints, setRewardPoints] = useState<number>(() =>
    loadSafeNumber("travelai_reward_points", 3450)
  );
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() =>
    loadSafeCommunityPosts(INITIAL_COMMUNITY_POSTS)
  );
  const [wishlist, setWishlist] = useState<string[]>(() =>
    loadSafeWishlist(["Butterfly Beach", "Fort Aguada", "Dudhsagar Falls"])
  );
  const [journalEntries, setJournalEntries] = useState<
    { id: string; title: string; date: string; content: string; image?: string }[]
  >(() => loadSafeJournal(INITIAL_JOURNAL));

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [priceTrackers, setPriceTrackers] = useState<PriceTrackItem[]>(INITIAL_PRICE_TRACKERS);
  const [mapFilter, setMapFilter] = useState<
    "attractions" | "restaurants" | "hotels" | "hospitals" | "police"
  >("attractions");
  const [mapDownloadProgress, setMapDownloadProgress] = useState<number | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "c_1",
      role: "assistant",
      text: "Welcome to TravelAI Explorer. Ask anything about route safety, transit savings, or local beach routes.",
      timestamp: "10:33 AM",
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<
    { id: string; title: string; text: string; time: string; read: boolean }[]
  >([
    {
      id: "n_1",
      title: "Price Drop Alert",
      text: "Flight BOM ➔ GOI dropped from ₹5,200 to ₹4,350 (16% savings).",
      time: "10m ago",
      read: false,
    },
    {
      id: "n_2",
      title: "Weather Advisory",
      text: "Clear skies forecasted for Goa and Bali departures this week.",
      time: "2h ago",
      read: false,
    },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Toast confirmation state
  const [toast, setToast] = useState<{
    id?: string;
    title: string;
    subtitle?: string;
    type?: ToastType;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  // Subscribe to global toast dispatcher
  useEffect(() => {
    const unsubscribe = subscribeToast((msg) => {
      setToast(msg);
      setTimeout(() => {
        setToast((prev) => (prev?.id === msg.id ? null : prev));
      }, 5000);
    });
    return unsubscribe;
  }, []);

  // Quick Checkout Modal State
  const [bookingModal, setBookingModal] = useState<{
    isOpen: boolean;
    itemType: "flight" | "hotel" | "bus" | "train" | "activity";
    itemName: string;
    price: number;
    provider?: string;
  }>({
    isOpen: false,
    itemType: "flight",
    itemName: "",
    price: 0,
  });

  // Sync states to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("travelai_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("travelai_user");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("travelai_saved_trips", JSON.stringify(savedTrips));
  }, [savedTrips]);

  useEffect(() => {
    if (activeTrip) {
      localStorage.setItem("travelai_active_trip", JSON.stringify(activeTrip));
    }
  }, [activeTrip]);

  useEffect(() => {
    localStorage.setItem("travelai_bookings", JSON.stringify(confirmedBookings));
  }, [confirmedBookings]);

  useEffect(() => {
    localStorage.setItem("travelai_wallet_balance", String(walletBalance));
  }, [walletBalance]);

  useEffect(() => {
    localStorage.setItem("travelai_wallet_transactions", JSON.stringify(walletTransactions));
  }, [walletTransactions]);

  useEffect(() => {
    localStorage.setItem("travelai_reward_points", String(rewardPoints));
  }, [rewardPoints]);

  useEffect(() => {
    localStorage.setItem("travelai_community_posts", JSON.stringify(communityPosts));
  }, [communityPosts]);

  useEffect(() => {
    localStorage.setItem("travelai_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem("travelai_journal", JSON.stringify(journalEntries));
  }, [journalEntries]);

  useEffect(() => {
    localStorage.setItem("travelai_dark_mode", String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const showToastMessage = (
    title: string,
    subtitle: string,
    actionLabel?: string,
    onAction?: () => void,
    type: ToastType = "success"
  ) => {
    showToast(title, subtitle, type, actionLabel && onAction ? { label: actionLabel, onClick: onAction } : undefined);
  };

  const handleAddNotification = (notif: {
    id: string;
    title: string;
    text: string;
    time: string;
    read: boolean;
  }) => {
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleAddRewardPoints = (points: number) => {
    setRewardPoints((prev) => prev + points);
  };

  // Wallet Handlers
  const handleAddWalletCredits = (amount: number, source = "Wallet Credit Top-Up") => {
    setWalletBalance((prev) => prev + amount);
    const tx: WalletTransaction = {
      id: "tx_" + Date.now(),
      title: source,
      type: "credit",
      amount,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      reference: `TOP-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setWalletTransactions((prev) => [tx, ...prev]);
  };

  // End-to-End Quick Checkout Confirmation
  const handleConfirmQuickBooking = (details: {
    itemType: "flight" | "hotel" | "bus" | "train" | "activity";
    itemName: string;
    provider: string;
    totalPrice: number;
    pax: number;
    date: string;
    walletUsed: number;
  }) => {
    const pnr = `TRV-${Math.floor(100000 + Math.random() * 899999)}`;
    const newBooking: BookingItem = {
      id: "bk_" + Date.now(),
      name: details.itemName,
      type: details.itemType,
      price: details.totalPrice,
      provider: details.provider,
      date: details.date,
      pax: details.pax,
      pnr,
      status: "Confirmed",
      paidWithWallet: details.walletUsed,
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };

    setConfirmedBookings((prev) => [newBooking, ...prev]);

    if (details.walletUsed > 0) {
      setWalletBalance((prev) => Math.max(0, prev - details.walletUsed));
      const debitTx: WalletTransaction = {
        id: "tx_" + Date.now(),
        title: `Booking: ${details.itemName}`,
        type: "debit",
        amount: details.walletUsed,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        reference: pnr,
      };
      setWalletTransactions((prev) => [debitTx, ...prev]);
    }

    handleAddRewardPoints(250);
    handleAddNotification({
      id: "n_bk_" + Date.now(),
      title: "Booking Confirmed",
      text: `${details.itemName} confirmed (PNR ${pnr}).`,
      time: "Just now",
      read: false,
    });

    showToastMessage(
      `Booking Confirmed (${pnr})`,
      details.walletUsed > 0
        ? `Deducted ₹${details.walletUsed.toLocaleString()} from Travel Credits.`
        : `Added ${details.itemName} to Bookings.`,
      "View Bookings",
      () => setActiveTab("bookings")
    );
  };

  // Multi-Segment Cart Checkout from BookingsTab
  const handleConfirmCartCheckout = (
    items: { name: string; type: any; price: number; provider: string }[],
    totalAfterDiscounts: number,
    walletUsed: number,
    date: string,
    pax: number
  ) => {
    const nowStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const newBookings: BookingItem[] = items.map((item, idx) => ({
      id: `bk_${Date.now()}_${idx}`,
      name: item.name,
      type: item.type,
      price: item.price,
      provider: item.provider,
      date,
      pax,
      pnr: `TRV-${Math.floor(100000 + Math.random() * 899999)}`,
      status: "Confirmed",
      paidWithWallet: idx === 0 ? walletUsed : 0,
      createdAt: nowStr,
    }));

    setConfirmedBookings((prev) => [...newBookings, ...prev]);

    if (walletUsed > 0) {
      setWalletBalance((prev) => Math.max(0, prev - walletUsed));
      const debitTx: WalletTransaction = {
        id: "tx_" + Date.now(),
        title: `Multi-Segment Checkout (${items.length} items)`,
        type: "debit",
        amount: walletUsed,
        date: nowStr,
        reference: newBookings[0]?.pnr,
      };
      setWalletTransactions((prev) => [debitTx, ...prev]);
    }

    handleAddNotification({
      id: "n_cart_" + Date.now(),
      title: "Checkout Completed",
      text: `Confirmed ${items.length} reservation(s) totaling ₹${totalAfterDiscounts.toLocaleString()}.`,
      time: "Just now",
      read: false,
    });
  };

  const handleCancelBooking = (bookingId: string) => {
    const target = confirmedBookings.find((b) => b.id === bookingId);
    if (!target || target.status === "Cancelled") return;

    setConfirmedBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "Cancelled" } : b))
    );

    if (target.paidWithWallet > 0) {
      setWalletBalance((prev) => prev + target.paidWithWallet);
      const refundTx: WalletTransaction = {
        id: "tx_ref_" + Date.now(),
        title: `Refund: ${target.name}`,
        type: "credit",
        amount: target.paidWithWallet,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        reference: target.pnr,
      };
      setWalletTransactions((prev) => [refundTx, ...prev]);
    }

    showToastMessage(
      "Reservation Cancelled",
      target.paidWithWallet > 0
        ? `Refunded ₹${target.paidWithWallet.toLocaleString()} back to Wallet.`
        : `${target.pnr} marked as cancelled.`
    );
  };

  // End-to-End Plan Route from ExploreTab or CommunityTab -> PlannerTab Wizard
  const handlePlanRouteFromCard = (dest: string) => {
    setPrefilledDestination(dest);
    setPrefillNonce((n) => n + 1);
    setActiveTab("planner");
  };

  // Fetch plan from server-side Gemini endpoint
  const handleSearchTrip = async (query: any) => {
    setIsLoading(true);
    const start = Date.now();
    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        let errMessage = "Failed to generate travel plan.";
        try {
          const errData = await response.json();
          if (errData.error) errMessage = errData.error;
        } catch {}
        showToast("Plan Request Failed", errMessage, "error");
        return;
      }

      const data: TravelPlan = await response.json();

      const elapsed = Date.now() - start;
      if (elapsed < 800) {
        await new Promise((resolve) => setTimeout(resolve, 800 - elapsed));
      }

      setActiveTrip(data);

      if (data.source === "mock") {
        showToast(
          "Notice: Offline Route Mode Active",
          "Generated using verified regional transport database (offline fallback mode).",
          "warning"
        );
      } else {
        showToast(
          "Travel Plan Ready",
          `Generated verified ${data.query?.days || 3}-day itinerary to ${data.query?.destination || "destination"}.`,
          "success"
        );
      }

      if (data.hotels && data.hotels.length > 0 && data.hotels[0]) {
        const h = data.hotels[0];
        const t: PriceTrackItem = {
          id: "pt_" + Date.now(),
          type: "hotel",
          title: `${h.name} (${data.query?.destination || "Destination"})`,
          originalPrice: Math.round(h.price * 1.15),
          currentPrice: h.price,
          history: [
            { date: "Earlier", price: Math.round(h.price * 1.15) },
            { date: "Now", price: h.price },
          ],
          notifyOnDrop: true,
          status: "down",
        };
        setPriceTrackers((prev) => [t, ...prev]);
      }

      const daysCount = data.query?.days || 3;
      const destTarget = data.query?.destination || "your destination";
      setChatMessages((prev) => [
        ...prev,
        {
          id: "c_as_" + Date.now(),
          role: "assistant",
          text: `Loaded your ${daysCount}-day plan to ${destTarget}.${data.source === "mock" ? " (Compiled in offline verified route mode)" : ""} Check out the day-by-day schedule, safety breakdown, and carrier booking routes.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      setActiveTab("planner");
    } catch (err: any) {
      console.error("Trip search connection error:", err);
      showToast("Network Error", "Unable to connect to the trip planning service. Please verify your connection.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: "u_" + Date.now(),
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          currentTrip: activeTrip,
        }),
      });
      if (!res.ok) {
        let errText = "Service error";
        try {
          const errData = await res.json();
          if (errData.error) errText = errData.error;
        } catch {}
        throw new Error(errText);
      }
      const replyData = await res.json();

      setChatMessages((prev) => [
        ...prev,
        {
          id: "ai_" + Date.now(),
          role: "assistant",
          text: replyData.text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: "ai_err_" + Date.now(),
          role: "assistant",
          text: `Staying safe is a priority in ${
            activeTrip?.query?.destination || "Goa"
          }. Rent vehicles from certified suppliers, check official fares, and store valuables securely in your room safe.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      showToast("Chat Assistant Note", err?.message || "Using local cached travel guidance.", "info");
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSaveActiveTrip = () => {
    if (!activeTrip) return;
    if (savedTrips.some((t) => t.id === activeTrip.id)) return;
    setSavedTrips((prev) => [activeTrip, ...prev]);

    handleAddNotification({
      id: "n_" + Date.now(),
      title: "Plan Saved",
      text: `Saved your ${activeTrip.query.destination} itinerary to local storage.`,
      time: "Just now",
      read: false,
    });
    showToastMessage("Trip Saved", `${activeTrip.query.destination} itinerary saved locally.`);
  };

  const handleDeleteTrip = (id: string) => {
    setSavedTrips((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddPriceTrackerManual = (
    title: string,
    price: string,
    type: "flight" | "hotel" | "bus"
  ) => {
    const priceNum = parseInt(price, 10) || 1000;
    const newItem: PriceTrackItem = {
      id: "pt_" + Date.now(),
      type,
      title,
      originalPrice: Math.round(priceNum * 1.1),
      currentPrice: priceNum,
      history: [
        { date: "Earlier", price: Math.round(priceNum * 1.1) },
        { date: "Now", price: priceNum },
      ],
      notifyOnDrop: true,
      status: "down",
    };
    setPriceTrackers((prev) => [newItem, ...prev]);
  };

  const handleToggleNotifyDrop = (id: string) => {
    setPriceTrackers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, notifyOnDrop: !t.notifyOnDrop } : t))
    );
  };

  const handleAddPostManual = (
    story: string,
    tips: string,
    destination: string,
    rating: number,
    itinerarySummary?: string
  ) => {
    const newPost: CommunityPost = {
      id: "post_" + Date.now(),
      author: user?.name || "Traveler",
      avatar: "",
      destination,
      rating,
      tips,
      story,
      itinerarySummary,
      likes: 1,
      hasLiked: true,
      comments: [],
      createdAt: "Just now",
    };
    setCommunityPosts((prev) => [newPost, ...prev]);
    handleAddRewardPoints(100);
    showToastMessage("Published to Feed", "Earned +100 XP for sharing with the community.");
  };

  const handleLikePostManual = (postId: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: p.hasLiked ? Math.max(0, p.likes - 1) : p.likes + 1, hasLiked: !p.hasLiked }
          : p
      )
    );
  };

  const handleAddCommentManual = (postId: string, commentText: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                { author: user?.name || "Traveler", text: commentText, time: "Just now" },
              ],
            }
          : p
      )
    );
  };

  const handleAddWishManual = (e: React.FormEvent, wish: string) => {
    e.preventDefault();
    setWishlist((prev) => [...prev, wish]);
  };

  const handleRemoveWishManual = (wish: string) => {
    setWishlist((prev) => prev.filter((w) => w !== wish));
  };

  const handleAddJournalManual = (entry: { title: string; content: string; image?: string }) => {
    setJournalEntries((prev) => [
      {
        id: "j_" + Date.now(),
        title: entry.title,
        date: new Date().toISOString().split("T")[0],
        content: entry.content,
        image: entry.image,
      },
      ...prev,
    ]);
  };

  const handleDownloadMapManual = () => {
    setMapDownloadProgress(0);
    const interval = setInterval(() => {
      setMapDownloadProgress((p) => {
        if (p === null) return null;
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setMapDownloadProgress(null), 2000);
          return 100;
        }
        return p + 10;
      });
    }, 200);
  };

  const handleHeaderSearchChange = (val: string) => {
    setSearchQuery(val);
    if (activeTab !== "explore" && val.trim().length > 0) {
      setActiveTab("explore");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={isDarkMode ? "dark" : ""}>
        <LoginScreen
          onLoginSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            setIsAuthenticated(true);
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors duration-200 ${
        isDarkMode ? "dark bg-[#090b0d] text-zinc-100" : "bg-[#f7f7f4] text-zinc-900"
      }`}
    >
      {/* UNIFIED STICKY HEADER & TAB BAR */}
      <div className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-[#f7f7f4]/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#090b0d]/95">
        <header className="mx-auto flex h-18 max-w-[1360px] items-center justify-between gap-5 px-5 lg:px-10">
          {/* Brand wordmark */}
          <button
            type="button"
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
            onClick={() => setActiveTab("explore")}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
              <Compass className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight font-display text-zinc-950 dark:text-white whitespace-nowrap">
              TravelAI
            </span>
          </button>

          {/* Real-Time Search Bar */}
          <div className="relative hidden max-w-lg flex-1 sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleHeaderSearchChange(e.target.value)}
              placeholder="Search destinations (e.g. Goa, Tokyo, Paris)..."
              className="h-11 w-full rounded-full border border-zinc-200 bg-white pl-10 pr-9 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(20,20,20,.03)] placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("wallet")}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white hover:border-cyan-500 transition-colors cursor-pointer tabular-nums"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-500" />
              ₹{walletBalance.toLocaleString()}
            </button>

            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-zinc-900" />}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.some((n) => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 text-left"
                  >
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                      <span className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                        Alerts
                      </span>
                      <button
                        type="button"
                        onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                        className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium cursor-pointer"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-900 max-h-60 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 ${!n.read ? "bg-zinc-50/80 dark:bg-zinc-900/30" : ""}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                              {n.title}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono">{n.time}</span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{n.text}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800 cursor-pointer"
              onClick={() => setActiveTab("profile")}
            >
              <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black flex items-center justify-center font-bold text-xs font-mono">
                {user?.avatar || "GU"}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
                  {user?.name || "Guest User"}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-none mt-1">
                  {user?.role || "Explorer"}
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* STICKY DESKTOP TAB NAVIGATION */}
        <nav className="hidden border-t border-zinc-200/70 dark:border-white/5 md:block">
          <div className="mx-auto flex max-w-[1360px] items-center justify-between px-5 py-2 lg:px-10">
            <div className="flex items-center gap-1">
              {[
                { id: "explore", label: "Home", icon: Compass },
                { id: "planner", label: "Plan Trip", icon: Sparkles },
                {
                  id: "bookings",
                  label: confirmedBookings.length > 0 ? `Bookings (${confirmedBookings.length})` : "Bookings",
                  icon: CreditCard,
                },
                { id: "wallet", label: "Wallet", icon: Wallet },
                { id: "community", label: "Community", icon: Users },
                { id: "profile", label: "Profile", icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as AppTab)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? "bg-zinc-900 text-white dark:bg-cyan-400 dark:text-zinc-950 font-bold"
                        : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="relative" onMouseLeave={() => setShowMoreMenu(false)}>
              <button
                type="button"
                onClick={() => setShowMoreMenu((prev) => !prev)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
              >
                <span>More</span>
                <span className="text-[10px]">▼</span>
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-40 text-left">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("saved");
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left cursor-pointer ${
                      activeTab === "saved"
                        ? "bg-zinc-100 dark:bg-zinc-900 font-bold"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    } text-zinc-800 dark:text-zinc-200`}
                  >
                    <Bookmark className="w-3.5 h-3.5" /> Wishlist & Diaries
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("assistant");
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left cursor-pointer ${
                      activeTab === "assistant"
                        ? "bg-zinc-100 dark:bg-zinc-900 font-bold"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    } text-zinc-800 dark:text-zinc-200`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> AI Chat Companion
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("dashboard");
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left cursor-pointer ${
                      activeTab === "dashboard"
                        ? "bg-zinc-100 dark:bg-zinc-900 font-bold"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    } text-zinc-800 dark:text-zinc-200`}
                  >
                    <Activity className="w-3.5 h-3.5" /> Analytics Hub
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <main className="mx-auto w-full max-w-[1360px] flex-1 px-5 pb-28 pt-8 lg:px-10 md:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
          >
            {activeTab === "explore" && (
              <ErrorBoundary fallbackTitle="Explore Feed Unavailable">
                <ExploreTab
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  onPlanRoute={handlePlanRouteFromCard}
                  setBookingModal={setBookingModal}
                />
              </ErrorBoundary>
            )}

            {activeTab === "planner" && (
              <ErrorBoundary fallbackTitle="Trip Planner Unavailable">
                <PlannerTab
                  user={user}
                  activeTrip={activeTrip}
                  isLoading={isLoading}
                  isDarkMode={isDarkMode}
                  onSearch={handleSearchTrip}
                  chatMessages={chatMessages}
                  isChatLoading={isChatLoading}
                  onSendMessage={handleSendMessage}
                  priceTrackers={priceTrackers}
                  onToggleNotifyDrop={handleToggleNotifyDrop}
                  onAddPriceTracker={handleAddPriceTrackerManual}
                  onSaveTrip={handleSaveActiveTrip}
                  savedTrips={savedTrips}
                  mapFilter={mapFilter}
                  setMapFilter={setMapFilter}
                  mapDownloadProgress={mapDownloadProgress}
                  onDownloadMap={handleDownloadMapManual}
                  setBookingModal={setBookingModal}
                  setActiveTab={setActiveTab}
                  prefilledDestination={prefilledDestination}
                  prefillNonce={prefillNonce}
                />
              </ErrorBoundary>
            )}

            {activeTab === "bookings" && (
              <ErrorBoundary fallbackTitle="Bookings Hub Unavailable">
                <BookingsTab
                  activeTrip={activeTrip}
                  confirmedBookings={confirmedBookings}
                  walletBalance={walletBalance}
                  onConfirmCartCheckout={handleConfirmCartCheckout}
                  onCancelBooking={handleCancelBooking}
                  onAddNotification={handleAddNotification}
                  onAddRewardPoints={handleAddRewardPoints}
                  onSwitchToExplore={() => setActiveTab("explore")}
                />
              </ErrorBoundary>
            )}

            {activeTab === "saved" && (
              <ErrorBoundary fallbackTitle="Saved Itineraries Unavailable">
                <SavedTab
                  savedTrips={savedTrips}
                  onDeleteTrip={handleDeleteTrip}
                  onSelectTrip={(trip) => {
                    setActiveTrip(trip);
                    setActiveTab("planner");
                  }}
                  wishlist={wishlist}
                  onAddWish={handleAddWishManual}
                  onRemoveWish={handleRemoveWishManual}
                  journalEntries={journalEntries}
                  onAddJournal={handleAddJournalManual}
                />
              </ErrorBoundary>
            )}

            {activeTab === "community" && (
              <ErrorBoundary fallbackTitle="Community Feed Unavailable">
                <CommunityTab
                  user={user}
                  rewardPoints={rewardPoints}
                  communityPosts={communityPosts}
                  onAddPost={handleAddPostManual}
                  onLikePost={handleLikePostManual}
                  onAddComment={handleAddCommentManual}
                  onPlanRoute={handlePlanRouteFromCard}
                />
              </ErrorBoundary>
            )}

            {activeTab === "assistant" && (
              <ErrorBoundary fallbackTitle="AI Assistant Unavailable">
                <AssistantTab
                  chatMessages={chatMessages}
                  isChatLoading={isChatLoading}
                  onSendMessage={handleSendMessage}
                  activeTrip={activeTrip}
                />
              </ErrorBoundary>
            )}

            {activeTab === "wallet" && (
              <ErrorBoundary fallbackTitle="Wallet & Credits Unavailable">
                <WalletTab
                  user={user}
                  rewardPoints={rewardPoints}
                  walletBalance={walletBalance}
                  transactions={walletTransactions}
                  onAddCredits={handleAddWalletCredits}
                />
              </ErrorBoundary>
            )}

            {activeTab === "profile" && (
              <ErrorBoundary fallbackTitle="Profile Settings Unavailable">
                <ProfileTab
                  user={user}
                  onUpdateUser={(updated) => setUser((prev) => (prev ? { ...prev, ...updated } : prev))}
                  onLogout={() => {
                    setIsAuthenticated(false);
                    setUser(null);
                  }}
                  onAddNotification={handleAddNotification}
                  isDarkMode={isDarkMode}
                  setIsDarkMode={setIsDarkMode}
                />
              </ErrorBoundary>
            )}

            {activeTab === "dashboard" && (
              <ErrorBoundary fallbackTitle="Analytics Dashboard Unavailable">
                <DashboardTab
                  savedTrips={savedTrips}
                  activeTrip={activeTrip}
                  priceTrackers={priceTrackers}
                  setActiveTab={setActiveTab}
                  onSaveTrip={handleSaveActiveTrip}
                  onSelectTrip={(trip) => {
                    setActiveTrip(trip);
                    setActiveTab("planner");
                  }}
                />
              </ErrorBoundary>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white/95 dark:bg-black/95 backdrop-blur-md border-zinc-200 dark:border-zinc-800 z-30 md:hidden py-1.5 px-2">
        <div className="flex justify-around items-center">
          {[
            { id: "explore", label: "Home", icon: Compass },
            { id: "planner", label: "Plan", icon: Sparkles },
            { id: "bookings", label: "Bookings", icon: CreditCard },
            { id: "wallet", label: "Wallet", icon: Wallet },
            { id: "community", label: "Feed", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as AppTab)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? "text-cyan-600 dark:text-cyan-400 font-semibold"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-black mt-12 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-200">TravelAI</p>
            <p className="mt-0.5">© 2026 TravelAI Inc. Verified route planning and instant trip checkout.</p>
          </div>
          <div className="flex gap-6 font-medium">
            <button type="button" onClick={() => setActiveTab("profile")} className="hover:text-zinc-900 dark:hover:text-white cursor-pointer">
              Privacy & Security
            </button>
            <button type="button" onClick={() => setActiveTab("assistant")} className="hover:text-zinc-900 dark:hover:text-white cursor-pointer">
              Support Assistant
            </button>
          </div>
        </div>
      </footer>

      {/* IN-APP TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-full bg-zinc-950 text-white border ${
              toast.type === "error"
                ? "border-rose-800 bg-rose-950/90 text-rose-50"
                : toast.type === "warning"
                ? "border-amber-800 bg-amber-950/90 text-amber-50"
                : toast.type === "info"
                ? "border-sky-800 bg-zinc-950 text-white"
                : "border-zinc-800 bg-zinc-950 text-white"
            } rounded-xl shadow-2xl p-4 flex items-start gap-3`}
          >
            {toast.type === "error" ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : toast.type === "warning" ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : toast.type === "info" ? (
              <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold">{toast.title}</p>
              {toast.subtitle && <p className="text-xs text-zinc-300 dark:text-zinc-400 mt-0.5">{toast.subtitle}</p>}
              {toast.actionLabel && toast.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction?.();
                    setToast(null);
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  {toast.actionLabel}
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-zinc-400 hover:text-white cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUICK CHECKOUT MODAL */}
      <BookingModal
        isOpen={bookingModal.isOpen}
        onClose={() => setBookingModal((prev) => ({ ...prev, isOpen: false }))}
        itemType={bookingModal.itemType}
        itemName={bookingModal.itemName}
        price={bookingModal.price}
        provider={bookingModal.provider}
        walletBalance={walletBalance}
        onConfirmBooking={handleConfirmQuickBooking}
      />
    </div>
  );
}
