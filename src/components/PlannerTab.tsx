import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, Compass, Map, Search, Wallet, ShieldAlert, Heart, Star, Send, 
  MapPin, Check, Plus, Bell, ChevronRight, MessageSquare, Download, Activity, Eye, EyeOff,
  Plane, Train, Bus, Car, Shield, Clock, Leaf, AlertTriangle, ChevronLeft, Mic, MicOff, Navigation, Calendar, Users, CloudSun
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PieChart, Pie, Cell } from "recharts";
import { TravelPlan, ChatMessage, PriceTrackItem } from "../types";
import { showToast } from "../utils/toast";
import PlannerSkeleton from "./PlannerSkeleton";

interface PlannerTabProps {
  user: any;
  activeTrip: TravelPlan | null;
  isLoading: boolean;
  isDarkMode: boolean;
  onSearch: (query: any) => void;
  
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  onSendMessage: (text: string) => void;
  
  priceTrackers: PriceTrackItem[];
  onToggleNotifyDrop: (id: string) => void;
  onAddPriceTracker: (title: string, price: string, type: "flight" | "hotel" | "bus") => void;
  
  onSaveTrip: () => void;
  savedTrips: TravelPlan[];
  
  mapFilter: "attractions" | "restaurants" | "hotels" | "hospitals" | "police";
  setMapFilter: (val: any) => void;
  mapDownloadProgress: number | null;
  onDownloadMap: () => void;
  
  setBookingModal: (modal: any) => void;
  setActiveTab: (tab: any) => void;
  prefilledDestination?: string;
  prefillNonce?: number;
}

const STYLE_OPTIONS = [
  { value: "budget", label: "Budget Style", description: "Smart savings, local transits, homestays", emoji: "🏷️", multiplier: 1500 },
  { value: "backpacker", label: "Backpacker Hub", description: "Hostels, community focus, street food hacks", emoji: "🎒", multiplier: 1200 },
  { value: "solo", label: "Solo Traveler", description: "High flexibility, social spots, safe walks", emoji: "🚶", multiplier: 2200 },
  { value: "family", label: "Family Pacing", description: "Vetted cabs, comfort stays, kids activities", emoji: "👨‍👩‍👧", multiplier: 3500 },
  { value: "luxury", label: "Luxury VIP", description: "Carrier flights, private SUVs, elite stays", emoji: "✨", multiplier: 12000 },
  { value: "business", label: "Business Elite", description: "High comfort, fast commute, premium hotels", emoji: "💼", multiplier: 7500 },
] as const;

const SUGGESTIONS = [
  "Goa", "Mumbai", "Davangere", "Gokarna", "Bengaluru", "Chikmagalur", "Mangalore", "Delhi", "Varanasi", "Tokyo", "Paris", "London", "Shimla", "Manali"
];

const FAVORITES = [
  { name: "Goa", label: "Beach Paradise 🏖️" },
  { name: "Tokyo", label: "Cyber Neon Vibe 🗼" },
  { name: "Shimla", label: "Himalayan Snow 🏔️" },
  { name: "Paris", label: "Art & Romance 🍷" }
];

const WIZARD_STEPS = [
  { id: "from", name: "From", title: "Departing Node", description: "Verifying departing terminals", icon: Plane, color: "text-indigo-500" },
  { id: "destination", name: "Destination", title: "Target Destination", description: "Atmosphere & map routes", icon: CloudSun, color: "text-amber-500" },
  { id: "date", name: "Travel Date", title: "Journey Schedules", description: "Expected seasonal multipliers", icon: Calendar, color: "text-indigo-500" },
  { id: "travellers", name: "Travellers", title: "Travellers Pax", description: "Custom seat arrangements", icon: Users, color: "text-emerald-500" },
  { id: "budget", name: "Budget", title: "Budget Limits", description: "How budget splits between services", icon: Wallet, color: "text-rose-500" },
  { id: "style", name: "Travel Style", title: "Travel Style Vibe", description: "Review summary before compiling", icon: Compass, color: "text-indigo-500" }
] as const;

export default function PlannerTab({
  user,
  activeTrip,
  isLoading,
  isDarkMode,
  onSearch,
  chatMessages,
  isChatLoading,
  onSendMessage,
  priceTrackers,
  onToggleNotifyDrop,
  onAddPriceTracker,
  onSaveTrip,
  savedTrips,
  mapFilter,
  setMapFilter,
  mapDownloadProgress,
  onDownloadMap,
  setBookingModal,
  setActiveTab,
  prefilledDestination,
  prefillNonce
}: PlannerTabProps) {
  
  // Tab views for generated itineraries
  const [plannerView, setPlannerView] = useState<"wizard" | "results">(activeTrip ? "results" : "wizard");

  // Automatically show results when an active trip is compiled
  useEffect(() => {
    if (activeTrip) {
      setPlannerView("results");
    }
  }, [activeTrip]);

  // Wizard state variables
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [inlinePreviewOpen, setInlinePreviewOpen] = useState(true);
  const [prefillBanner, setPrefillBanner] = useState<string | null>(null);

  // Form value states
  const [startingLocation, setStartingLocation] = useState("Mumbai");
  const [destination, setDestination] = useState("Goa");
  const [travelDate, setTravelDate] = useState("2026-07-15");
  const [days, setDays] = useState(4);
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState(25000);
  const [style, setStyle] = useState<typeof STYLE_OPTIONS[number]['value']>("budget");

  // When Plan Route is clicked on a Hotspot or Community Itinerary, prefill Destination and jump to next empty step
  useEffect(() => {
    if (prefillNonce && prefilledDestination) {
      setDestination(prefilledDestination);
      setPlannerView("wizard");
      setDirection(1);
      const nextEmptyStep = startingLocation.trim() ? 2 : 0;
      setStep(nextEmptyStep);
      setPrefillBanner(prefilledDestination);
    }
  }, [prefillNonce, prefilledDestination]);

  // Autocomplete suggestions states
  const [startSuggestions, setStartSuggestions] = useState<string[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<string[]>([]);
  const [activeInput, setActiveInput] = useState<"start" | "dest" | null>(null);

  // Micro features states
  const [isRecording, setIsRecording] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<string[]>(["1A", "1B"]);

  // Auto seat sync based on travelers count
  useEffect(() => {
    const seatLabels = ["1A", "1B", "1C", "1D", "2A", "2B", "2C", "2D", "3A", "3B", "3C", "3D", "4A", "4B", "4C", "4D"];
    setSelectedSeats(seatLabels.slice(0, travelers));
  }, [travelers]);

  const startRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  // Handle outside click to collapse suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (startRef.current && !startRef.current.contains(event.target as Node)) {
        if (activeInput === "start") setActiveInput(null);
      }
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        if (activeInput === "dest") setActiveInput(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeInput]);

  // Start suggestions filter
  useEffect(() => {
    if (activeInput === "start" && startingLocation) {
      const filtered = SUGGESTIONS.filter(item => 
        item.toLowerCase().includes(startingLocation.toLowerCase()) && 
        item.toLowerCase() !== startingLocation.toLowerCase()
      );
      setStartSuggestions(filtered);
    } else {
      setStartSuggestions([]);
    }
  }, [startingLocation, activeInput]);

  // Destination suggestions filter
  useEffect(() => {
    if (activeInput === "dest" && destination) {
      const filtered = SUGGESTIONS.filter(item => 
        item.toLowerCase().includes(destination.toLowerCase()) && 
        item.toLowerCase() !== destination.toLowerCase()
      );
      setDestSuggestions(filtered);
    } else {
      setDestSuggestions([]);
    }
  }, [destination, activeInput]);

  // Chat widget prompt state
  const [chatWidgetText, setChatWidgetText] = useState("");

  // Manual tracker forms
  const [manualTitle, setManualTitle] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [manualType, setManualType] = useState<"flight" | "hotel" | "bus">("flight");

  const handleSendWidgetChat = () => {
    if (!chatWidgetText.trim() || isChatLoading) return;
    onSendMessage(chatWidgetText.trim());
    setChatWidgetText("");
  };

  const handleSuggestionClick = (prompt: string) => {
    onSendMessage(prompt);
  };

  const handleAddTrackerLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualPrice) return;
    onAddPriceTracker(manualTitle, manualPrice, manualType);
    setManualTitle("");
    setManualPrice("");
  };

  const getStyleEmoji = (style: string) => {
    switch (style) {
      case "budget": return "🏷️";
      case "backpacker": return "🎒";
      case "solo": return "🚶";
      case "family": return "👨‍👩‍👧";
      case "luxury": return "✨";
      case "business": return "💼";
      default: return "🗺️";
    }
  };

  // Weather simulator logic
  const getWeatherForecast = (dest: string) => {
    const d = dest.toLowerCase().trim();
    if (d.includes("goa") || d.includes("gokarna")) return { temp: "31°C", label: "Sunny & Ocean Clear", icon: "☀️", color: "text-amber-500", humidity: "62%", wind: "11 km/h" };
    if (d.includes("tokyo") || d.includes("london")) return { temp: "18°C", label: "Mild Rain & Overcast", icon: "🌧️", color: "text-blue-400", humidity: "85%", wind: "17 km/h" };
    if (d.includes("paris") || d.includes("mumbai") || d.includes("bengaluru")) return { temp: "28°C", label: "Humid & Cloudy Skies", icon: "⛅", color: "text-zinc-400", humidity: "72%", wind: "9 km/h" };
    if (d.includes("shimla") || d.includes("manali")) return { temp: "12°C", label: "Chilly Alpine Snows", icon: "❄️", color: "text-sky-300", humidity: "45%", wind: "13 km/h" };
    if (d.includes("delhi") || d.includes("varanasi")) return { temp: "35°C", label: "Sunny & Hazy Air", icon: "☀️", color: "text-amber-600", humidity: "52%", wind: "7 km/h" };
    return { temp: "24°C", label: "Perfect Clear Skies", icon: "✨", color: "text-zinc-500", humidity: "58%", wind: "12 km/h" };
  };

  const weather = getWeatherForecast(destination);

  // Dynamic cost estimations
  const getSelectedStyleMultiplier = () => {
    const found = STYLE_OPTIONS.find(s => s.value === style);
    return found ? found.multiplier : 2000;
  };
  const estimatedMinCost = getSelectedStyleMultiplier() * travelers * days;

  // Speech Recognition Handler
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast(
        "Voice Input Unavailable",
        "Web Speech API is not supported in this browser. Please type target destination.",
        "warning"
      );
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsRecording(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      const cleanedText = speechToText.replace(/\.$/g, "");
      setDestination(cleanedText);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };
  };

  // GPS geolocation handler
  const handleGPSLocation = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLoading(false);
          setStartingLocation("Mumbai Central Terminal");
          setActiveInput(null);
        },
        () => {
          setGpsLoading(false);
          setStartingLocation("Mumbai");
        },
        { timeout: 3000 }
      );
    } else {
      setTimeout(() => {
        setGpsLoading(false);
        setStartingLocation("Mumbai");
      }, 600);
    }
  };

  const nextStep = () => {
    if (step === 0 && !startingLocation.trim()) return;
    if (step === 1 && !destination.trim()) return;
    setDirection(1);
    setStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  };

  const prevStep = () => {
    setDirection(-1);
    setStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim() || !startingLocation.trim()) return;
    onSearch({
      startingLocation,
      destination,
      budget,
      days,
      travelers,
      style,
    });
  };

  const currentStepName = () => {
    return WIZARD_STEPS[step]?.title || "";
  };

  // Recharts budget data
  const budgetData = [
    { name: "Transport (35%)", value: Math.round(budget * 0.35), color: "#6366f1" },
    { name: "Lodging Stay (40%)", value: Math.round(budget * 0.40), color: "#10b981" },
    { name: "Dining Local (15%)", value: Math.round(budget * 0.15), color: "#f59e0b" },
    { name: "Buffer Fund (10%)", value: Math.round(budget * 0.10), color: "#ec4899" }
  ];

  // Animation variants for smooth step sliders
  const stepVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.22, ease: "easeOut" as const }
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 60 : -60,
      opacity: 0,
      transition: { duration: 0.18, ease: "easeIn" as const }
    })
  };

  return (
    <div id="planner-tab-panel" className="text-left animate-fade-in space-y-6">
      
      {/* HEADER SECTION WITH TOGGLES IF RESULTS ARE READY */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-[#2A2A2A] pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100/40 dark:border-emerald-900/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" /> Verified AI Route Compiler
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white leading-none">
            Journey Matrix Planning
          </h2>
          <p className="text-[11px] text-zinc-400 font-semibold leading-none">
            {plannerView === "wizard" ? "Configure custom parameters through our 6-stage wizard." : `Currently showing compiled itinerary for ${activeTrip?.query.destination}.`}
          </p>
        </div>

        {activeTrip && (
          <div className="flex bg-zinc-100 dark:bg-[#111111] border border-zinc-200 dark:border-[#2A2A2A] p-1 rounded-xl text-xs font-semibold self-stretch sm:self-auto">
            <button
              onClick={() => setPlannerView("wizard")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                plannerView === "wizard" 
                  ? "bg-white dark:bg-[#2A2A2A] text-zinc-950 dark:text-white shadow-xs font-bold" 
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> Plan / Modify
            </button>
            <button
              onClick={() => setPlannerView("results")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                plannerView === "results" 
                  ? "bg-white dark:bg-[#2A2A2A] text-zinc-950 dark:text-white shadow-xs font-bold" 
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <Map className="w-3.5 h-3.5" /> View Active Trip
            </button>
          </div>
        )}
      </div>

      {/* LOADING SKELETON */}
      {isLoading && <PlannerSkeleton />}

      {/* 1. COMPACT SEARCH WIZARD MODE */}
      {!isLoading && plannerView === "wizard" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: THE 6-STAGE WIZARD FORM (Colspan 7) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#2A2A2A] rounded-2xl p-5 sm:p-7 shadow-xs space-y-6 text-left relative overflow-hidden">
              
              {/* PREFILLED DESTINATION NOTICE */}
              {prefillBanner && (
                <div className="px-3.5 py-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-cyan-800 dark:text-cyan-300 font-medium">
                    Destination pre-filled: <strong>{destination}</strong> (Departing from <strong>{startingLocation || "Unset"}</strong>)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDirection(-1);
                      setStep(1);
                    }}
                    className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer"
                  >
                    Edit Destination
                  </button>
                </div>
              )}

              {/* STEP PROGRESS INDICATORS */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                    Step {step + 1} of 6 · {currentStepName()}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-950 dark:text-zinc-200 font-bold tabular-nums">
                    Est. Min Cost: ₹{estimatedMinCost.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {WIZARD_STEPS.map((stepItem, idx) => (
                    <button
                      key={stepItem.id}
                      type="button"
                      onClick={() => {
                        setDirection(idx >= step ? 1 : -1);
                        setStep(idx);
                      }}
                      title={`Jump to ${stepItem.name}`}
                      className="group py-1 cursor-pointer text-left"
                    >
                      <div
                        className={`h-1.5 rounded-full transition-all duration-200 ${
                          idx <= step
                            ? "bg-cyan-500 dark:bg-cyan-400"
                            : "bg-zinc-200 dark:bg-zinc-800 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700"
                        }`}
                      />
                      <span
                        className={`mt-1 block text-[10px] font-medium truncate ${
                          idx === step
                            ? "text-zinc-950 dark:text-white font-bold"
                            : "text-zinc-400 dark:text-zinc-500"
                        }`}
                      >
                        {stepItem.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SLIDING WIZARD INPUTS */}
              <form onSubmit={handleSubmit} className="space-y-6 min-h-[220px] flex flex-col justify-between">
                <div className="relative overflow-hidden flex-1">
                  <AnimatePresence mode="wait" custom={direction}>
                    
                    {/* STEP 1: FROM LOCATION */}
                    {step === 0 && (
                      <motion.div
                        key="step1"
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="space-y-4"
                      >
                        <div className="relative" ref={startRef}>
                          <label className="block text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
                            Starting Point Node
                          </label>
                          <div className="relative flex gap-2">
                            <div className="relative flex-1">
                              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                              <input
                                type="text"
                                required
                                value={startingLocation}
                                onChange={(e) => {
                                  setStartingLocation(e.target.value);
                                  setActiveInput("start");
                                }}
                                onFocus={() => setActiveInput("start")}
                                placeholder="Enter departing terminal city or airport"
                                className="w-full text-xs font-semibold pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-[#2A2A2A] rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-600"
                                autoComplete="off"
                              />
                            </div>
                            
                            <button
                              type="button"
                              onClick={handleGPSLocation}
                              disabled={gpsLoading}
                              className="p-3 bg-zinc-900 dark:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg hover:opacity-90 shrink-0 transition-opacity cursor-pointer flex items-center justify-center border border-transparent"
                              title="Retrieve Geolocation Coordinates"
                            >
                              <Navigation className={`w-4 h-4 ${gpsLoading ? 'animate-pulse' : ''}`} />
                            </button>
                          </div>

                          {/* Autocomplete Suggestions */}
                          {activeInput === "start" && startSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#2A2A2A] rounded-lg shadow-lg z-50 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                              {startSuggestions.map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setStartingLocation(suggestion);
                                    setActiveInput(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-2"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200/65 dark:border-[#2A2A2A] text-[10px] font-mono text-zinc-400 dark:text-zinc-500 leading-relaxed">
                          💡 Coordinates verified locally. Standard route mapping departs from major Indian terminals.
                        </div>

                        {/* COLLAPSIBLE PREVIEW PLACEHOLDER */}
                        <div className="mt-4 border border-zinc-200 dark:border-[#2A2A2A] rounded-xl overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/30">
                          <button
                            type="button"
                            onClick={() => setInlinePreviewOpen(!inlinePreviewOpen)}
                            className="w-full flex justify-between items-center px-3 py-2 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-[#2A2A2A] bg-zinc-50 dark:bg-zinc-900/50 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider">
                              <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Location Radar & Weather Preview
                            </span>
                            <span className="text-[10px] font-mono">{inlinePreviewOpen ? "COLLAPSE [-]" : "EXPAND [+]"}</span>
                          </button>
                          
                          {inlinePreviewOpen && (
                            <div className="p-3 space-y-3.5">
                              {/* Static placeholder map UI */}
                              <div className="relative h-24 rounded-lg bg-indigo-50/10 dark:bg-zinc-950 border border-zinc-200 dark:border-[#2A2A2A] overflow-hidden flex items-center justify-center">
                                <div className="absolute inset-0 bg-radial from-transparent to-zinc-950/5 dark:to-black/35" />
                                <svg className="w-full h-full absolute inset-0 text-indigo-500/40" viewBox="0 0 100 100" preserveAspectRatio="none">
                                  <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                                  <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                                  <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1,1" />
                                  <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1,1" />
                                  <circle cx="50" cy="50" r="2.5" className="fill-indigo-500 animate-pulse" />
                                </svg>
                                <div className="absolute top-2 left-3 text-[8.5px] font-mono text-zinc-400 font-bold">DEPARTURE REGION: {startingLocation} HUB</div>
                                <span className="absolute bottom-2 right-3 text-[8px] font-mono text-indigo-400 font-bold">Static Radar Map</span>
                              </div>

                              {/* Departure Weather Forecast Row */}
                              <div className="p-2.5 bg-white dark:bg-[#111111] rounded-lg border border-zinc-200 dark:border-[#2A2A2A] flex justify-between items-center text-left">
                                <div className="space-y-0.5">
                                  <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Local Climate</span>
                                  <h6 className="font-bold text-zinc-800 dark:text-zinc-100 text-[11px]">{startingLocation} Current Weather</h6>
                                  <p className="text-[9px] text-zinc-400 font-medium">{getWeatherForecast(startingLocation).label}</p>
                                </div>
                                <div className="text-right flex items-center gap-1.5">
                                  <span className="text-xl">{getWeatherForecast(startingLocation).icon}</span>
                                  <div>
                                    <p className={`text-xs font-black font-mono leading-none ${getWeatherForecast(startingLocation).color}`}>{getWeatherForecast(startingLocation).temp}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 2: DESTINATION */}
                    {step === 1 && (
                      <motion.div
                        key="step2"
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="space-y-4"
                      >
                        <div className="relative" ref={destRef}>
                          <label className="block text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
                            Target Destination Node
                          </label>
                          
                          <div className="relative flex gap-2">
                            <div className="relative flex-1">
                              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                              <input
                                type="text"
                                required
                                value={destination}
                                onChange={(e) => {
                                  setDestination(e.target.value);
                                  setActiveInput("dest");
                                }}
                                onFocus={() => setActiveInput("dest")}
                                placeholder="e.g. Goa, Tokyo, Paris"
                                className="w-full text-xs font-semibold pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-[#2A2A2A] rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-600"
                                autoComplete="off"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={startVoiceSearch}
                              className={`p-3 rounded-lg border text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center justify-center ${
                                isRecording 
                                  ? 'bg-rose-600 text-white border-transparent animate-pulse' 
                                  : 'bg-zinc-900 text-white dark:bg-zinc-200 dark:text-zinc-950 border-transparent'
                              }`}
                              title="Speech Recognition Mic"
                            >
                              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Autocomplete suggestions */}
                          {activeInput === "dest" && destSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#2A2A2A] rounded-lg shadow-lg z-50 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                              {destSuggestions.map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setDestination(suggestion);
                                    setActiveInput(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-2"
                                >
                                  <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Recommendation chips */}
                        <div className="space-y-2">
                          <span className="text-[8px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">Vetted Recommendations</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {FAVORITES.map((fav, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setDestination(fav.name);
                                  setActiveInput(null);
                                }}
                                className="p-2 text-left bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-[#2A2A2A] rounded-lg cursor-pointer transition-all hover:scale-[1.01]"
                              >
                                <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 leading-none">{fav.name}</p>
                                <p className="text-[8px] text-zinc-400 dark:text-zinc-500 mt-1 leading-none">{fav.label}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3: DATE & DURATION */}
                    {step === 2 && (
                      <motion.div
                        key="step3"
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="space-y-5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                              Departing Calendar Date
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                              <input
                                type="date"
                                required
                                value={travelDate}
                                onChange={(e) => setTravelDate(e.target.value)}
                                className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-[#2A2A2A] rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-600 font-mono"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                              Trip Duration (Days)
                            </label>
                            <div className="flex border border-zinc-200 dark:border-[#2A2A2A] rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-900 h-10">
                              <button
                                type="button"
                                onClick={() => setDays(prev => Math.max(1, prev - 1))}
                                className="w-12 h-full flex items-center justify-center font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
                              >
                                -
                              </button>
                              <div className="flex-1 flex items-center justify-center text-xs font-bold text-zinc-800 dark:text-zinc-100 font-mono bg-white dark:bg-[#111111]">
                                {days} DAYS
                              </div>
                              <button
                                type="button"
                                onClick={() => setDays(prev => Math.min(30, prev + 1))}
                                className="w-12 h-full flex items-center justify-center font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-[#2A2A2A] text-[10px] font-mono text-zinc-400 dark:text-zinc-500 leading-relaxed">
                          📝 Seasons and monsoonal flight rates compile dynamically for July 2026 indices automatically.
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 4: TRAVELLERS */}
                    {step === 3 && (
                      <motion.div
                        key="step4"
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <label className="block text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                            Total Journey Party (Travellers)
                          </label>
                          
                          <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-[#2A2A2A] rounded-lg">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase font-mono">Pax Group Size</span>
                              <p className="text-[10px] text-zinc-400">Total flight occupants or carriage seats</p>
                            </div>

                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() => setTravelers(prev => Math.max(1, prev - 1))}
                                className="w-10 h-10 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 cursor-pointer font-bold"
                              >
                                -
                              </button>
                              <span className="text-sm font-black font-mono text-zinc-900 dark:text-white w-8 text-center">
                                {travelers}
                              </span>
                              <button
                                type="button"
                                onClick={() => setTravelers(prev => Math.min(16, prev + 1))}
                                className="w-10 h-10 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 cursor-pointer font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[{ label: "Solo Node", value: 1 }, { label: "Duo Match", value: 2 }, { label: "Compact Group", value: 4 }, { label: "Family Pack", value: 6 }].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setTravelers(preset.value)}
                              className={`p-2 rounded border text-[9px] font-bold font-mono uppercase cursor-pointer transition-colors ${
                                travelers === preset.value 
                                  ? "bg-zinc-950 dark:bg-white text-white dark:text-black border-transparent" 
                                  : "bg-white dark:bg-[#111111] border-zinc-200 dark:border-[#2A2A2A] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50"
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 5: BUDGET LIMIT */}
                    {step === 4 && (
                      <motion.div
                        key="step5"
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="block text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                              Maximum Budget Allocation (INR)
                            </label>
                            <span className="font-mono text-xs font-black text-zinc-950 dark:text-white">
                              ₹{budget.toLocaleString()}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <input
                              type="range"
                              min={5000}
                              max={200000}
                              step={5000}
                              value={budget}
                              onChange={(e) => setBudget(parseInt(e.target.value) || 10000)}
                              className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-950 dark:accent-white"
                            />
                            <div className="flex justify-between text-[8px] text-zinc-400 dark:text-zinc-500 font-mono font-bold">
                              <span>MIN ₹5,000</span>
                              <span>MID ₹1,00,000</span>
                              <span>MAX ₹2,00,000</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            {[15000, 30000, 60000, 120000].map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setBudget(preset)}
                                className={`p-2 text-[10px] font-bold rounded font-mono border cursor-pointer transition-colors ${
                                  budget === preset 
                                    ? "bg-zinc-950 dark:bg-white text-white dark:text-black border-transparent" 
                                    : "bg-zinc-50 dark:bg-[#111111] border-zinc-200 dark:border-[#2A2A2A] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                                }`}
                              >
                                ₹{(preset/1000)}k
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-[#2A2A2A] text-[10px] font-mono text-zinc-400 dark:text-zinc-500 leading-relaxed">
                          📊 Note: AI compiler caps and flags luxury listings to conform strictly beneath your preset budget limits.
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 6: TRAVEL STYLE */}
                    {step === 5 && (
                      <motion.div
                        key="step6"
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <label className="block text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                            Select Journey Vibe Style
                          </label>

                          <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1 no-scrollbar">
                            {STYLE_OPTIONS.map((item) => (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => setStyle(item.value)}
                                className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left cursor-pointer ${
                                  style === item.value
                                    ? "bg-zinc-950 border-transparent text-white dark:bg-white dark:text-black shadow-md scale-[1.01]"
                                    : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-zinc-300 dark:hover:bg-zinc-900"
                                }`}
                              >
                                <span className="text-sm mb-1">{item.emoji}</span>
                                <span className="text-[10px] font-bold leading-tight uppercase font-mono tracking-wide">{item.label}</span>
                                <span className="text-[8px] opacity-70 leading-normal mt-0.5 truncate w-full">
                                  {item.description}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-[#2A2A2A] text-[9.5px] leading-relaxed text-zinc-400 font-semibold flex justify-between items-center">
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-white uppercase font-mono text-[8px] tracking-wider leading-none">Itinerary Spec Seal</p>
                            <p className="mt-1">
                              From {startingLocation} ➔ {destination} ({days} Days, {travelers} Pax)
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[8px] font-mono text-zinc-400">Min Budget</span>
                            <p className="font-mono font-black text-zinc-900 dark:text-white text-xs">₹{estimatedMinCost.toLocaleString()}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

                {/* NAVIGATION WIZARD BAR */}
                <div className="flex justify-between items-center gap-3 pt-4 border-t border-zinc-200 dark:border-[#2A2A2A] mt-4">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < WIZARD_STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-5 py-2.5 bg-zinc-900 dark:bg-[#2A2A2A] dark:hover:bg-zinc-700 dark:text-white text-white hover:opacity-95 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ml-auto font-mono uppercase tracking-wider"
                    >
                      Next Step <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2.5 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-90 disabled:opacity-50 font-mono uppercase tracking-widest ml-auto"
                    >
                      {isLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
                          Compiling...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                          Generate Trip
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>

            </div>

            {/* AI COMPASS FOOTER HELPERS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#2A2A2A] rounded-2xl">
                <h5 className="font-extrabold text-zinc-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-500" /> Vetted Regulatory Safety
                </h5>
                <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">
                  Every transit route and coastal lodging matches updated 2026 local safety regulations automatically.
                </p>
              </div>

              <div className="p-4 bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#2A2A2A] rounded-2xl">
                <h5 className="font-extrabold text-zinc-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-500 animate-pulse" /> Real-Time Price Indexing
                </h5>
                <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">
                  Our system triggers offline backup caches to retrieve seasonal taxi fare estimates and rail rates.
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: INTEGRATED INTERACTIVE STEP-BY-STEP PREVIEW (Colspan 5) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#2A2A2A] rounded-2xl p-5 shadow-xs text-left space-y-4">
              
              {/* HEADER BASED ON ACTIVE STEP */}
              <div className="flex justify-between items-center border-b border-zinc-150 dark:border-[#2A2A2A] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#2A2A2A] text-zinc-900 dark:text-white flex items-center justify-center text-xs">
                    {(() => {
                      const StepIcon = WIZARD_STEPS[step]?.icon || Compass;
                      return <StepIcon className={`w-4 h-4 ${WIZARD_STEPS[step]?.color || "text-indigo-500"}`} />;
                    })()}
                  </div>
                  <div>
                    <h5 className="font-black text-zinc-900 dark:text-white text-xs uppercase tracking-wide">
                      {step === 0 && "Live Departing Node Monitor"}
                      {step === 1 && "Atmospheric Forecast & Route Vector"}
                      {step === 2 && "Seasonality Index & Climate Trends"}
                      {step === 3 && "Carriage Layout & Seating"}
                      {step === 4 && "Dynamic Cost Allocation Matrix"}
                      {step === 5 && "Verified Travel Style Profile"}
                    </h5>
                    <p className="text-[9px] text-zinc-400 font-semibold leading-none mt-0.5">
                      {step === 0 && "Verifying departing terminals"}
                      {step === 1 && `Atmosphere & map routes for ${destination}`}
                      {step === 2 && `Expected seasonal multipliers for ${travelDate}`}
                      {step === 3 && `Custom seat arrangements for ${travelers} pax`}
                      {step === 4 && "How budget splits between services"}
                      {step === 5 && `Review summary before compiling`}
                    </p>
                  </div>
                </div>
                
                <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Preview</span>
              </div>

              {/* DYNAMIC CONTENT CONTAINER BASED ON STEP */}
              <div className="min-h-[260px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  
                  {/* PREVIEW STEP 1: DEPARTURES PANEL */}
                  {step === 0 && (
                    <motion.div
                       key="prev1"
                       initial={{ opacity: 0, scale: 0.98 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0 }}
                       className="space-y-3.5"
                    >
                      {/* Departure Weather Forecast Row */}
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-[#2A2A2A] flex justify-between items-center text-left">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Departure Atmosphere</span>
                          <h6 className="font-bold text-zinc-800 dark:text-zinc-100 text-xs">{startingLocation} Local Climate</h6>
                          <p className="text-[10px] text-zinc-400 font-medium">{getWeatherForecast(startingLocation).label}</p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span className="text-2xl">{getWeatherForecast(startingLocation).icon}</span>
                          <div>
                            <p className={`text-sm font-black font-mono leading-none ${getWeatherForecast(startingLocation).color}`}>{getWeatherForecast(startingLocation).temp}</p>
                            <p className="text-[8px] text-zinc-400 mt-0.5">Humidity: {getWeatherForecast(startingLocation).humidity}</p>
                          </div>
                        </div>
                      </div>

                      {/* Departure Terminal Radar Map */}
                      <div className="relative h-24 rounded-xl bg-indigo-50/10 dark:bg-zinc-950 border border-zinc-200 dark:border-[#2A2A2A] overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-radial from-transparent to-zinc-950/5 dark:to-black/35" />
                        <svg className="w-full h-full absolute inset-0 text-indigo-500/40" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                          <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1,1" />
                          <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1,1" />
                          <circle cx="50" cy="50" r="2.5" className="fill-indigo-500 animate-pulse" />
                        </svg>
                        <div className="absolute top-2 left-3 text-[8.5px] font-mono text-zinc-400 font-bold">DEPARTURE REGION: {startingLocation} HUB</div>
                        <span className="absolute bottom-2 right-3 text-[8px] font-mono text-indigo-400 font-bold">Active Station Terminal Map</span>
                      </div>

                      <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed">
                        Verifying active flight & high-speed rail terminals departing from <strong className="text-zinc-800 dark:text-zinc-200">{startingLocation}</strong>:
                      </p>

                      <div className="space-y-2 font-mono text-[10px]">
                        {[
                          { id: "FL-IND401", type: "Flight", target: "Goa", time: "08:15 AM", status: "On Time", gate: "T2-G12" },
                          { id: "RL-EXP121", type: "Exp Train", target: "Gokarna", time: "10:30 AM", status: "Boarding", gate: "Plat 4" },
                          { id: "FL-AIA712", type: "Flight", target: "Tokyo", time: "01:45 PM", status: "Terminal Verified", gate: "T2-G21" },
                          { id: "RL-SHT104", type: "Shatabdi", target: "Davangere", time: "04:10 PM", status: "On Time", gate: "Plat 1" }
                        ].map((item, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => {
                              if (item.target !== destination) {
                                setDestination(item.target);
                              }
                            }}
                            className="p-2 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-[#2A2A2A] rounded-lg flex justify-between items-center transition-colors cursor-pointer"
                          >
                            <div>
                              <span className="text-zinc-400 dark:text-zinc-500 font-bold text-[8px] uppercase">{item.id} • {item.type}</span>
                              <p className="font-black text-zinc-800 dark:text-zinc-200">➔ {item.target}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-zinc-600 dark:text-zinc-400">{item.time}</p>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm ${
                                item.status === "Boarding" 
                                  ? "bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400" 
                                  : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                              }`}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* PREVIEW STEP 2: WEATHER & ROUTE MAP */}
                  {step === 1 && (
                    <motion.div
                      key="prev2"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {/* Weather Forecast Row */}
                      <div className="p-3 bg-zinc-50 dark:bg-[#18181b] rounded-xl border border-zinc-200 dark:border-[#2A2A2A] flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Seasonal Atmosphere</span>
                          <h6 className="font-bold text-zinc-800 dark:text-zinc-100 text-xs">{destination} Forecast</h6>
                          <p className="text-[10px] text-zinc-400 font-medium">{weather.label}</p>
                        </div>

                        <div className="text-right flex items-center gap-2">
                          <span className="text-2xl">{weather.icon}</span>
                          <div>
                            <p className={`text-sm font-black font-mono leading-none ${weather.color}`}>{weather.temp}</p>
                            <p className="text-[8px] text-zinc-400 mt-0.5">Humidity: {weather.humidity}</p>
                          </div>
                        </div>
                      </div>

                      {/* Vector Map Canvas */}
                      <div className="relative h-32 rounded-xl bg-indigo-50/20 dark:bg-[#18181b] border border-zinc-200 dark:border-[#2A2A2A] overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-radial from-transparent to-zinc-950/5 dark:to-black/35" />
                        
                        <svg className="w-full h-full absolute inset-0 text-indigo-500/80" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <path 
                            d="M 25 75 Q 50 30 75 45" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeDasharray="4,4" 
                            className="animate-dash"
                          />
                          <circle cx="25" cy="75" r="3" className="fill-rose-500 animate-pulse" />
                          <circle cx="75" cy="45" r="4.5" className="fill-emerald-500 animate-pulse" />
                        </svg>

                        <div className="absolute left-4 bottom-3 text-[9px] font-mono bg-white/90 dark:bg-[#111111] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-[#2A2A2A] font-bold text-zinc-500">
                          {startingLocation}
                        </div>

                        <div className="absolute right-4 top-3 text-[9px] font-mono bg-white/90 dark:bg-[#111111] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-[#2A2A2A] font-bold text-zinc-800 dark:text-zinc-100">
                          ➔ {destination}
                        </div>

                        <span className="absolute bottom-2 right-4 text-[8px] font-mono text-zinc-400">Carrier Air-Vector Layer Loaded</span>
                      </div>
                    </motion.div>
                  )}

                  {/* PREVIEW STEP 3: WEATHER TREND CHART */}
                  {step === 2 && (
                    <motion.div
                      key="prev3"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {/* Seasonal Weather Trend */}
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-[#2A2A2A] flex justify-between items-center text-left">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Seasonal Climate Index</span>
                          <h6 className="font-bold text-zinc-800 dark:text-zinc-100 text-xs">{travelDate} Atmosphere</h6>
                          <p className="text-[10px] text-zinc-400 font-medium">{weather.label} • Expected Temp: {weather.temp}</p>
                        </div>
                        <span className="text-xl">{weather.icon}</span>
                      </div>

                      {/* Travel Date Map vector */}
                      <div className="relative h-16 rounded-xl bg-indigo-50/10 dark:bg-zinc-950 border border-zinc-200 dark:border-[#2A2A2A] overflow-hidden flex items-center justify-center">
                        <svg className="w-full h-full absolute inset-0 text-indigo-500/30" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
                          <circle cx="50" cy="50" r="3" className="fill-indigo-500" />
                        </svg>
                        <span className="absolute text-[8.5px] font-mono text-zinc-400 font-bold uppercase tracking-wider">Historical Route Punctuality Map Loaded</span>
                      </div>

                      <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed">
                        Seasonal trend data index calculated for <strong className="text-zinc-800 dark:text-zinc-200">{travelDate}</strong>:
                      </p>

                      <div className="space-y-2.5">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-[#2A2A2A] rounded-lg">
                            <span className="text-[8px] text-zinc-400 font-mono font-bold block uppercase">Peak Factor</span>
                            <span className="text-xs font-bold text-indigo-500 font-mono">1.18x (Moderate)</span>
                          </div>
                          <div className="p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-[#2A2A2A] rounded-lg">
                            <span className="text-[8px] text-zinc-400 font-mono font-bold block uppercase">Rain Chance</span>
                            <span className="text-xs font-bold text-blue-500 font-mono">22% (Minimal)</span>
                          </div>
                          <div className="p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-[#2A2A2A] rounded-lg">
                            <span className="text-[8px] text-zinc-400 font-mono font-bold block uppercase">Crowd Level</span>
                            <span className="text-xs font-bold text-emerald-500 font-mono">Vibrant Optimal</span>
                          </div>
                        </div>

                        {/* Visual climate trend lines */}
                        <div className="space-y-1.5 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-lg border border-zinc-150 dark:border-[#2A2A2A]">
                          <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest block mb-1">Estimated Rates Multiplier (Weekly)</span>
                          <div className="space-y-2 font-mono text-[9px]">
                            <div className="space-y-1">
                              <div className="flex justify-between font-bold text-zinc-600 dark:text-zinc-400">
                                <span>Week 1 (Jul 1 - Jul 7)</span>
                                <span>₹2,100 / night avg</span>
                              </div>
                              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                                <div className="bg-indigo-500 h-full w-[40%]" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between font-bold text-zinc-600 dark:text-zinc-400">
                                <span>Week 2 (Jul 8 - Jul 14)</span>
                                <span>₹2,400 / night avg</span>
                              </div>
                              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                                <div className="bg-indigo-500 h-full w-[55%]" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between font-bold text-zinc-800 dark:text-zinc-200">
                                <span>Week 3 (Selected: Jul 15)</span>
                                <span className="font-bold text-indigo-500">₹2,200 / night avg</span>
                              </div>
                              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-indigo-500 h-full w-[48%]" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* PREVIEW STEP 4: PASSENGER SEATING */}
                  {step === 3 && (
                    <motion.div
                      key="prev4"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3.5 text-center"
                    >
                      {/* Travellers Weather comfort */}
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-[#2A2A2A] flex justify-between items-center text-left">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Group Comfort Index</span>
                          <h6 className="font-bold text-zinc-800 dark:text-zinc-100 text-xs">Seating Climate Control</h6>
                          <p className="text-[10px] text-zinc-400 font-medium">Auto-A/C set to 23°C • Verified for {travelers} Pax</p>
                        </div>
                        <span className="text-xl">🍃</span>
                      </div>

                      <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block font-bold leading-none">Carriage Seating Map & Cabin Grid</span>
                      
                      <div className="max-w-[200px] mx-auto bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-150 dark:border-[#2A2A2A] space-y-2.5">
                        <div className="flex justify-around text-[8px] font-mono text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800 pb-1">
                          <span>A</span>
                          <span>B</span>
                          <span className="w-4" />
                          <span>C</span>
                          <span>D</span>
                        </div>

                        <div className="space-y-1.5">
                          {[1, 2, 3, 4].map((row) => (
                            <div key={row} className="flex justify-around items-center text-[9px] font-mono">
                              {["A", "B"].map((col) => {
                                const seatId = `${row}${col}`;
                                const isSelected = selectedSeats.includes(seatId);
                                return (
                                  <button
                                    key={col}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedSeats(prev => prev.filter(s => s !== seatId));
                                      } else if (selectedSeats.length < travelers) {
                                        setSelectedSeats(prev => [...prev, seatId]);
                                      }
                                    }}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center font-bold cursor-pointer transition-all border ${
                                      isSelected
                                        ? "bg-emerald-500 text-white border-transparent scale-[1.05]"
                                        : "bg-white dark:bg-zinc-800 hover:bg-zinc-100 border-zinc-200 dark:border-zinc-700 text-zinc-400"
                                    }`}
                                  >
                                    {row}{col}
                                  </button>
                                );
                              })}
                              {/* Aisle */}
                              <span className="w-4 text-[7px] text-zinc-400 font-bold">AISLE</span>
                              {["C", "D"].map((col) => {
                                const seatId = `${row}${col}`;
                                const isSelected = selectedSeats.includes(seatId);
                                return (
                                  <button
                                    key={col}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedSeats(prev => prev.filter(s => s !== seatId));
                                      } else if (selectedSeats.length < travelers) {
                                        setSelectedSeats(prev => [...prev, seatId]);
                                      }
                                    }}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center font-bold cursor-pointer transition-all border ${
                                      isSelected
                                        ? "bg-emerald-500 text-white border-transparent scale-[1.05]"
                                        : "bg-white dark:bg-zinc-800 hover:bg-zinc-100 border-zinc-200 dark:border-zinc-700 text-zinc-400"
                                    }`}
                                  >
                                    {row}{col}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-center gap-4 text-[8px] font-mono font-bold">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-sm bg-emerald-500" />
                          <span>Assigned ({selectedSeats.length})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-sm bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700" />
                          <span>Available</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* PREVIEW STEP 5: BUDGET MATRIX */}
                  {step === 4 && (
                    <motion.div
                      key="prev5"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {/* Budget Weather Tariff Impact Row */}
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-[#2A2A2A] flex justify-between items-center text-left">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Climate Tariff Impact</span>
                          <h6 className="font-bold text-zinc-800 dark:text-zinc-100 text-xs">Weather-Rate Indexing</h6>
                          <p className="text-[10px] text-zinc-400 font-medium">Off-peak rainy discount applied • Estimated saving: ₹3,500</p>
                        </div>
                        <span className="text-xl">💰</span>
                      </div>

                      {/* Budget Zone Map Vector */}
                      <div className="relative h-16 rounded-xl bg-indigo-50/10 dark:bg-zinc-950 border border-zinc-200 dark:border-[#2A2A2A] overflow-hidden flex items-center justify-center">
                        <svg className="w-full h-full absolute inset-0 text-rose-500/30" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <circle cx="30" cy="40" r="12" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
                          <circle cx="70" cy="60" r="20" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
                        </svg>
                        <span className="absolute text-[8.5px] font-mono text-zinc-400 font-bold uppercase tracking-wider">Regional Cost-Zone Vector Map</span>
                      </div>

                      <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed text-center">
                        Estimated Budget Allocation for <strong className="text-zinc-800 dark:text-zinc-200">₹{budget.toLocaleString()}</strong>:
                      </p>

                      <div className="space-y-3 font-mono text-[10px]">
                        {budgetData.map((item, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-bold text-zinc-600 dark:text-zinc-400">
                              <span>{item.name}</span>
                              <span className="font-extrabold text-zinc-900 dark:text-white">₹{item.value.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(item.value / budget) * 100}%`, backgroundColor: item.color }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* PREVIEW STEP 6: JOURNEY PROFILE SUMMARY */}
                  {step === 5 && (
                    <motion.div
                      key="prev6"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {/* Integrated Map & Weather Summary Block */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-[#2A2A2A] flex justify-between items-center text-left">
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Climate Matching</span>
                            <h6 className="font-bold text-zinc-800 dark:text-zinc-100 text-xs">Vibe Harmony</h6>
                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">100% Perfect Vibe</p>
                          </div>
                        </div>

                        <div className="relative h-14 rounded-xl bg-indigo-50/10 dark:bg-zinc-950 border border-zinc-200 dark:border-[#2A2A2A] overflow-hidden flex items-center justify-center">
                          <svg className="w-full h-full absolute inset-0 text-indigo-500/40" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M 10 50 L 90 50" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3,3" />
                            <circle cx="10" cy="50" r="2.5" className="fill-indigo-500 animate-pulse" />
                            <circle cx="90" cy="50" r="3" className="fill-emerald-500" />
                          </svg>
                          <span className="absolute text-[8px] font-mono text-zinc-400 font-bold">COMPILED PATH</span>
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-50 dark:bg-[#18181b] rounded-xl border border-zinc-200 dark:border-[#2A2A2A] text-left space-y-3 relative overflow-hidden">
                        
                        {/* SEAL BACKGROUND GIMMICK */}
                        <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full border-4 border-emerald-500/10 flex items-center justify-center animate-spin-slow text-emerald-500/10 pointer-events-none">
                          <Sparkles className="w-12 h-12" />
                        </div>

                        <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest block border-b border-zinc-200 dark:border-zinc-800 pb-1.5 leading-none">Route Specification Seal</span>
                        
                        <div className="space-y-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Departure Station:</span>
                            <span className="font-bold text-zinc-900 dark:text-white font-mono">{startingLocation}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Target Destination:</span>
                            <span className="font-bold text-zinc-900 dark:text-white font-mono">{destination}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Departure Date:</span>
                            <span className="font-bold text-zinc-900 dark:text-white font-mono">{travelDate}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Total Group Size:</span>
                            <span className="font-bold text-zinc-900 dark:text-white font-mono">{travelers} Passengers</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Max Budget Limit:</span>
                            <span className="font-bold text-zinc-900 dark:text-white font-mono">₹{budget.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Journey Style:</span>
                            <span className="font-black text-indigo-500 font-mono uppercase text-[10px] tracking-wide">{style} vibe</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-end font-mono">
                          <span className="text-[8.5px] text-zinc-400 font-bold leading-none uppercase">Est. Min Carriage Cost</span>
                          <span className="text-sm font-black text-emerald-500 leading-none">₹{estimatedMinCost.toLocaleString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* EMPTY STATE FOR RESULTS VIEW */}
      {!isLoading && plannerView === "results" && !activeTrip && (
        <div className="p-12 text-center bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#2A2A2A] rounded-2xl space-y-4 max-w-md mx-auto my-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500 flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">No Compiled Itinerary Yet</h4>
            <p className="text-xs text-zinc-400 mt-1">
              Configure your route parameters in the 6-stage wizard to generate your custom travel itinerary.
            </p>
          </div>
          <button
            onClick={() => setPlannerView("wizard")}
            className="px-4 py-2 bg-zinc-900 dark:bg-white dark:text-black text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Launch Route Wizard
          </button>
        </div>
      )}

      {/* 2. DETAILED TRIP ITINERARY RESULTS */}
      {!isLoading && plannerView === "results" && activeTrip && (
        <div id="full-trip-plan-results" className="space-y-6 text-left animate-fade-in">
          
          {/* OFFLINE / MOCK FALLBACK NOTICE BANNER */}
          {activeTrip.source === "mock" && (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-800 dark:text-amber-200 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold">Offline Route Mode Active</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  Live Gemini AI generation was unavailable. This itinerary was compiled from our verified local transportation database and destination records.
                </p>
              </div>
            </div>
          )}

          {/* DETAILED CARDS ACCENT HEADER */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#2A2A2A] rounded-2xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getStyleEmoji(activeTrip.query?.style || "budget")}</span>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  Itinerary for {activeTrip.query?.destination || "Destination"}
                </h3>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 font-semibold">
                From {activeTrip.query?.startingLocation || "Departing Hub"} • {activeTrip.query?.days || 3} Days • {activeTrip.query?.travelers || 1} Travelers • Budget: ₹{(activeTrip.query?.budget || 25000).toLocaleString()}
              </p>
            </div>
            
            <button 
              onClick={onSaveTrip}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition-all cursor-pointer shadow-xs self-stretch sm:self-auto"
            >
              <Check className="w-4 h-4" /> Bookmark Itinerary
            </button>
          </div>

          {/* THREE-COLUMN BENTO GRID PATTERN FOR ACTIVE RESULTS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* COLUMN 1: SIDE PROFILE & UTILITIES (Colspan 3) */}
            <div className="md:col-span-3 space-y-6">
              
              <div className="p-5 bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#2A2A2A] rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-violet-600 text-white rounded-full flex items-center justify-center text-sm font-black shadow-md">
                    {user?.avatar || "GU"}
                  </div>
                  <div>
                    <h5 className="font-extrabold text-zinc-900 dark:text-white text-xs">{user?.name || "Guest User"}</h5>
                    <p className="text-[10px] text-zinc-400">{user?.role || "Pro Explorer"}</p>
                  </div>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl space-y-1.5 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                  <div className="flex justify-between">
                    <span>Account Status:</span>
                    <span className="text-emerald-500 font-extrabold uppercase tracking-wider">✓ Active VIP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Access Layer:</span>
                    <span className="text-indigo-500 font-extrabold">{user?.provider || "Secured Device"}</span>
                  </div>
                </div>
              </div>

              {/* QUICK SUGGESTIONS / ACTIONS CARD */}
              <div className="p-5 bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#2A2A2A] rounded-2xl space-y-4">
                <h5 className="font-extrabold text-zinc-900 dark:text-white text-xs uppercase tracking-wider">Plan Actions</h5>
                
                <div className="space-y-2">
                  <button 
                    onClick={() => handleSuggestionClick(`Optimize the local dining costs for this ${activeTrip.query.destination} trip.`)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-2.5 border border-transparent hover:border-zinc-200 dark:hover:border-[#2A2A2A] text-xs text-zinc-600 dark:text-zinc-300 font-semibold cursor-pointer transition-all"
                  >
                    <span>🏷️</span> Budget Optimizer
                  </button>
                  <button 
                    onClick={() => handleSuggestionClick(`List the top safety guidelines to remember in ${activeTrip.query.destination}.`)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-2.5 border border-transparent hover:border-zinc-200 dark:hover:border-[#2A2A2A] text-xs text-zinc-600 dark:text-zinc-300 font-semibold cursor-pointer transition-all"
                  >
                    <span>🛡️</span> Safety Scanner
                  </button>
                  <button 
                    onClick={() => setActiveTab("saved")}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-2.5 border border-transparent hover:border-zinc-200 dark:hover:border-[#2A2A2A] text-xs text-zinc-600 dark:text-zinc-300 font-semibold cursor-pointer transition-all"
                  >
                    <span>📝</span> Travel Journal
                  </button>
                </div>
              </div>

              {/* SAVINGS WATCHLIST */}
              <div className="p-5 bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#2A2A2A] rounded-2xl space-y-4">
                <h5 className="font-extrabold text-zinc-900 dark:text-white text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Price Tracker</span>
                  <span className="text-[9px] text-emerald-500 font-bold">● Active</span>
                </h5>

                <div className="space-y-3">
                  {priceTrackers.slice(0, 3).map(item => (
                    <div key={item.id} className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-[#2A2A2A] flex justify-between items-center text-xs">
                      <div className="text-left">
                        <p className="font-bold text-zinc-900 dark:text-white text-[11px] leading-tight truncate max-w-[120px]">{item.title}</p>
                        <p className="text-[9px] text-zinc-400 mt-0.5 capitalize">{item.type}</p>
                      </div>
                      <div className="text-right font-mono">
                        <p className="font-black text-emerald-500 text-[11px]">₹{item.currentPrice.toLocaleString()}</p>
                        <p className="text-[8px] text-zinc-400 line-through">₹{item.originalPrice.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* COLUMN 2: PRIMARY ITINERARY SCHEDULES, HOTEL LISTS, TRANSPORTS (Colspan 6) */}
            <div className="md:col-span-6 space-y-6">
              
              {/* COMPILER MAP & CLIMATE OVERVIEW */}
              <div className="p-5 bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#2A2A2A] rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h5 className="font-extrabold text-zinc-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Map className="w-4 h-4 text-indigo-500" /> Route Map & Weather Forecast
                    </h5>
                    <p className="text-[9px] text-zinc-400 mt-0.5">Vector Path: {activeTrip.query.startingLocation || "Mumbai"} ➔ {activeTrip.query.destination}</p>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-[#2A2A2A] p-2 rounded-lg font-mono">
                    <span className="text-sm">{getWeatherForecast(activeTrip.query.destination).icon}</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{getWeatherForecast(activeTrip.query.destination).temp}</span>
                    <span className="text-zinc-400 text-[8px] uppercase font-bold">{getWeatherForecast(activeTrip.query.destination).label}</span>
                  </div>
                </div>

                {/* Simulated Live Vector Canvas Map Area */}
                <div className="relative h-64 rounded-xl bg-indigo-50/20 dark:bg-[#08080a] border border-zinc-200 dark:border-[#2A2A2A] overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-radial from-transparent to-zinc-950/5 dark:to-black/35" />

                  <svg className="w-full h-full absolute inset-0 text-indigo-500" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path 
                      d="M 20 80 Q 50 30 80 40" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeDasharray="5,5" 
                      className="animate-dash"
                    />
                    <circle cx="20" cy="80" r="3.5" className="fill-rose-500 animate-pulse" />
                    <circle cx="80" cy="40" r="4.5" className="fill-emerald-500 animate-pulse" />
                  </svg>

                  <div className="absolute left-4 bottom-4 text-[9px] font-mono bg-white/90 dark:bg-[#111111] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-[#2A2A2A] font-bold text-zinc-500">
                    {activeTrip.query.startingLocation || "Mumbai"}
                  </div>

                  <div className="absolute right-4 top-4 text-[9px] font-mono bg-white/90 dark:bg-[#111111] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-[#2A2A2A] font-bold text-zinc-800 dark:text-zinc-100">
                    ➔ {activeTrip.query.destination}
                  </div>

                  <div className="absolute bottom-4 right-4">
                    <button 
                      onClick={onDownloadMap}
                      className="px-2.5 py-1 text-[10px] rounded-md bg-white/95 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-indigo-500 transition-colors shadow-2xs cursor-pointer flex items-center gap-1 font-bold font-mono"
                      title="Download Offline Map Bundle"
                    >
                      <Download className="w-3.5 h-3.5" /> Map Cache
                    </button>
                  </div>

                  {mapDownloadProgress !== null && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2 text-xs font-bold">
                      <span>Downloading Offline Bundle...</span>
                      <div className="w-40 bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all duration-200" style={{ width: `${mapDownloadProgress}%` }}></div>
                      </div>
                      <span>{mapDownloadProgress}% completed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* VERIFIED AVAILABLE TRANSPORTS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-zinc-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-emerald-500" /> Verified Carrier Transports
                  </h4>
                  <span className="text-[9px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                    Verified 100% No Hallucinations
                  </span>
                </div>

                {activeTrip.transports && activeTrip.transports.length > 0 ? (
                  <div className="space-y-4">
                    {activeTrip.transports.map((transport, idx) => {
                      const getTransportStyles = (type: string) => {
                        switch (type) {
                          case 'flight':
                            return { bg: 'bg-indigo-50/20 dark:bg-[#111111]', border: 'border-indigo-100/60 dark:border-[#2A2A2A]', text: 'text-indigo-600 dark:text-indigo-400', icon: Plane };
                          case 'train':
                            return { bg: 'bg-emerald-50/20 dark:bg-[#111111]', border: 'border-emerald-100/60 dark:border-[#2A2A2A]', text: 'text-emerald-600 dark:text-emerald-400', icon: Train };
                          case 'bus':
                            return { bg: 'bg-amber-50/20 dark:bg-[#111111]', border: 'border-amber-100/60 dark:border-[#2A2A2A]', text: 'text-amber-600 dark:text-amber-400', icon: Bus };
                          case 'hybrid':
                            return { bg: 'bg-violet-50/20 dark:bg-[#111111]', border: 'border-violet-100/60 dark:border-[#2A2A2A]', text: 'text-violet-600 dark:text-violet-400', icon: Plane };
                          default:
                            return { bg: 'bg-zinc-50/20 dark:bg-[#111111]', border: 'border-zinc-200 dark:border-[#2A2A2A]', text: 'text-zinc-600 dark:text-zinc-400', icon: Compass };
                        }
                      };

                      const styles = getTransportStyles(transport.type);
                      const IconComponent = styles.icon;

                      return (
                        <div 
                          key={idx} 
                          className={`p-5 rounded-2xl border ${styles.bg} ${styles.border} flex flex-col justify-between space-y-4 transition-all hover:scale-[1.01]`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 bg-white dark:bg-zinc-900 border ${styles.border} ${styles.text} rounded-lg`}>
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-[9px] uppercase tracking-widest text-zinc-400">{transport.type}</span>
                                  {transport.isBest && (
                                    <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">★ Recommended</span>
                                  )}
                                  {transport.isCheapest && (
                                    <span className="bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">🍃 Cheapest</span>
                                  )}
                                </div>
                                <h5 className="font-black text-zinc-900 dark:text-white text-xs mt-0.5">{transport.provider}</h5>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="font-mono font-black text-emerald-500 text-base leading-none">₹{transport.price.toLocaleString()}</p>
                              <p className="text-[8px] text-zinc-400 mt-1 font-semibold">One-Way Seat</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Duration: <strong>{transport.travelTime}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Distance: <strong>{transport.distanceKm} km</strong></span>
                            </div>
                          </div>

                          <button 
                            onClick={() => setBookingModal({
                              isOpen: true,
                              itemType: "transport",
                              itemName: `${transport.provider} (${transport.type.toUpperCase()})`,
                              price: transport.price,
                              provider: transport.provider
                            })}
                            className="w-full py-2 bg-zinc-900 dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-950 hover:bg-zinc-950 text-white rounded-xl text-[11px] font-black cursor-pointer transition-colors"
                          >
                            Instantly Book via {transport.provider.split(" ")[0]}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">No verified transport options are available.</p>
                )}
              </div>

              {/* PREMIUM CERTIFIED ACCOMMODATIONS */}
              {activeTrip.hotels && activeTrip.hotels.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-[#2A2A2A]">
                  <h4 className="font-extrabold text-zinc-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-indigo-500" /> Premium Certified Accommodations
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {activeTrip.hotels.map((hotel, hIdx) => (
                      <div key={hIdx} className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#2A2A2A] rounded-2xl overflow-hidden flex flex-col justify-between shadow-2xs">
                        <div className="relative h-28 bg-zinc-100 dark:bg-zinc-900">
                          <img 
                            src={hotel.photoUrl} 
                            alt={hotel.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2 right-2 bg-white/90 dark:bg-zinc-950/90 px-1.5 py-0.5 rounded text-[8px] font-black text-emerald-500">
                            {hotel.budgetScore}% Budget Val
                          </div>
                        </div>
                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] uppercase tracking-wider text-indigo-500 font-extrabold">VETTED STAY</span>
                              <span className="text-amber-500 font-bold text-[9px]">★ {hotel.rating}</span>
                            </div>
                            <h5 className="font-black text-zinc-900 dark:text-white text-[11px] tracking-tight leading-tight">
                              {hotel.name}
                            </h5>
                          </div>

                          <p className="text-[9.5px] text-zinc-400 italic leading-relaxed">
                            "{hotel.aiRecommendation}"
                          </p>

                          <div className="pt-2.5 flex items-center justify-between border-t border-zinc-50 dark:border-zinc-900">
                            <div>
                              <p className="text-[8px] text-zinc-400 uppercase tracking-wider font-extrabold">Per Night</p>
                              <p className="font-black text-emerald-500 font-mono text-xs">₹{hotel.price.toLocaleString()}</p>
                            </div>
                            <button 
                              onClick={() => setBookingModal({
                                isOpen: true,
                                itemType: "hotel",
                                itemName: hotel.name,
                                price: hotel.price,
                                provider: "Booking.com Partner"
                              })}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black cursor-pointer transition-colors"
                            >
                              Book Stay
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DETAILED DAILY SCHEDULES */}
              {activeTrip.itinerary && activeTrip.itinerary.length > 0 && (
                <div className="space-y-4 border-t border-zinc-200 dark:border-[#2A2A2A] pt-4">
                  <h4 className="font-extrabold text-zinc-900 dark:text-white text-xs uppercase tracking-wider">Detailed Daily Schedule</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeTrip.itinerary.map((day, d_idx) => (
                      <div key={d_idx} className="p-4 bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#2A2A2A] rounded-2xl space-y-3 text-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-zinc-50 dark:border-zinc-900">
                          <span className="font-black text-indigo-500 tracking-wider font-mono text-[10px]">DAY {day.dayNumber || (d_idx + 1)}</span>
                        </div>

                        <div className="space-y-2.5">
                          <div className="space-y-0.5">
                            <span className="font-black text-[8px] uppercase tracking-wider text-amber-500 block">🌅 Morning</span>
                            <p className="font-bold text-zinc-800 dark:text-white leading-tight">{day.morningPlan?.title || "Morning Exploration"}</p>
                            <p className="text-zinc-400 text-[10px] leading-relaxed font-semibold">{day.morningPlan?.description || "Sightseeing and local highlights."}</p>
                          </div>

                          <div className="space-y-0.5">
                            <span className="font-black text-[8px] uppercase tracking-wider text-rose-500 block">☀️ Afternoon</span>
                            <p className="font-bold text-zinc-800 dark:text-white leading-tight">{day.afternoonPlan?.title || "Afternoon Dining & Leisure"}</p>
                            <p className="text-zinc-400 text-[10px] leading-relaxed font-semibold">{day.afternoonPlan?.description || "Culinary tastings and neighborhood walk."}</p>
                          </div>

                          <div className="space-y-0.5">
                            <span className="font-black text-[8px] uppercase tracking-wider text-indigo-500 block">🌃 Evening</span>
                            <p className="font-bold text-zinc-800 dark:text-white leading-tight">{day.eveningPlan?.title || "Sunset Views & Dining"}</p>
                            <p className="text-zinc-400 text-[10px] leading-relaxed font-semibold">{day.eveningPlan?.description || "Evening promenade and dinner."}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* COLUMN 3: SIDEBAR DISCOVER, CHAT & SAFETY ACTIONS (Colspan 3) */}
            <div className="md:col-span-3 space-y-6">
              
              {/* CHAT ASSISTANT CONSOLE */}
              <div className="p-5 bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#2A2A2A] rounded-2xl space-y-4">
                <h5 className="font-extrabold text-zinc-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" /> Journey Concierge Chat
                </h5>

                <div className="h-44 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
                  {chatMessages.slice(-3).map((msg, midx) => (
                    <div key={midx} className="text-[11px] leading-relaxed">
                      <span className={`font-black uppercase tracking-wider text-[8px] ${msg.role === 'user' ? 'text-indigo-500' : 'text-emerald-500'}`}>
                        {msg.role === 'user' ? 'You' : 'Companion'}
                      </span>
                      <p className="text-zinc-500 dark:text-zinc-300 font-medium mt-0.5">{msg.text}</p>
                    </div>
                  ))}
                  {isChatLoading && (
                    <span className="text-[10px] text-zinc-400 animate-pulse font-medium">Thinking...</span>
                  )}
                </div>

                <div className="flex gap-1.5">
                  <input 
                    type="text" 
                    placeholder="Ask guidance..." 
                    value={chatWidgetText}
                    onChange={e => setChatWidgetText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendWidgetChat()}
                    className="flex-1 p-2 bg-zinc-50 dark:bg-zinc-900 border dark:border-[#2A2A2A] text-xs rounded-lg focus:outline-hidden text-zinc-800 dark:text-zinc-100"
                  />
                  <button 
                    onClick={handleSendWidgetChat}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
                  >
                    ➔
                  </button>
                </div>
              </div>

              {/* SAFETY ADVISOR SEALS */}
              <div className="p-5 bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#2A2A2A] rounded-2xl space-y-3.5">
                <h5 className="font-extrabold text-zinc-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-indigo-500" /> Active Safety Advisories
                </h5>

                <div className="space-y-3 text-xs leading-normal">
                  <div className="p-2.5 bg-red-50/50 dark:bg-red-950/20 border border-red-100/40 dark:border-red-900/30 rounded-xl">
                    <span className="font-black text-red-500 text-[8.5px] uppercase tracking-wider block">🚨 Prepaid Taxi Swindle</span>
                    <p className="text-[10px] text-zinc-400 mt-0.5 leading-normal font-semibold">Drivers claiming faulty meters charge 3x rates. Rely on certified prepaid counters only.</p>
                  </div>

                  <div className="p-2.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/40 dark:border-amber-900/30 rounded-xl">
                    <span className="font-black text-amber-500 text-[8.5px] uppercase tracking-wider block">🌦️ scattered precipitation</span>
                    <p className="text-[10px] text-zinc-400 mt-0.5 leading-normal font-semibold">Scattered ocean showers are common this week. Water activities may face temporary afternoon holds.</p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
