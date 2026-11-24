import React, { useState, useRef, useEffect } from "react";
import { 
  Search, MapPin, Calendar, Users, Wallet, Compass, Sparkles, 
  ChevronRight, ChevronLeft, Mic, MicOff, CloudSun, Map, Navigation,
  Check, Play, ArrowRight, Star
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TripQuery } from "../types";
import { showToast } from "../utils/toast";

interface SearchFormProps {
  onSearch: (query: TripQuery) => void;
  isLoading: boolean;
}

const styles: { value: TripQuery['style']; label: string; description: string; emoji: string; multiplier: number }[] = [
  { value: "budget", label: "Budget Style", description: "Smart savings, local transits, homestays", emoji: "🏷️", multiplier: 1500 },
  { value: "backpacker", label: "Backpacker Hub", description: "Hostels, community focus, street food hacks", emoji: "🎒", multiplier: 1200 },
  { value: "solo", label: "Solo Traveler", description: "High flexibility, social spots, safe walks", emoji: "🚶", multiplier: 2200 },
  { value: "family", label: "Family Pacing", description: "Vetted cabs, comfort stays, kids activities", emoji: "👨‍👩‍👧", multiplier: 3500 },
  { value: "luxury", label: "Luxury VIP", description: "Carrier flights, private SUVs, elite stays", emoji: "✨", multiplier: 12000 },
  { value: "business", label: "Business Elite", description: "High comfort, fast commute, premium hotels", emoji: "💼", multiplier: 7500 },
];

const SUGGESTIONS = [
  "Goa",
  "Mumbai",
  "Davangere",
  "Gokarna",
  "Bengaluru",
  "Chikmagalur",
  "Mangalore",
  "Delhi",
  "Varanasi",
  "Tokyo",
  "Paris",
  "London"
];

const FAVORITES = [
  { name: "Goa", label: "Beach Paradise 🏖️" },
  { name: "Tokyo", label: "Cyber Neon Vibe 🗼" },
  { name: "Shimla", label: "Himalayan Snow 🏔️" },
  { name: "Paris", label: "Art & Romance 🍷" }
];

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  // Wizard states
  const [step, setStep] = useState(1);

  // Form value states
  const [startingLocation, setStartingLocation] = useState("Mumbai");
  const [destination, setDestination] = useState("Goa");
  const [travelDate, setTravelDate] = useState("2026-07-15");
  const [days, setDays] = useState(4);
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState(25000);
  const [style, setStyle] = useState<TripQuery['style']>("budget");

  // Autocomplete suggestions states
  const [startSuggestions, setStartSuggestions] = useState<string[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<string[]>([]);
  const [activeInput, setActiveInput] = useState<"start" | "dest" | null>(null);

  // Micro features states
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem("travelai_recent_searches");
    return saved ? JSON.parse(saved) : ["Goa", "Gokarna", "Tokyo"];
  });
  const [isRecording, setIsRecording] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const startRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  // Filter starting location suggestions
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

  // Filter destination suggestions
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

  // Click outside suggestions
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

  // Weather simulator logic
  const getWeatherForecast = (dest: string) => {
    const d = dest.toLowerCase().trim();
    if (d.includes("goa") || d.includes("gokarna")) return { temp: "31°C", label: "Sunny & Ocean Clear", icon: "☀️", color: "text-amber-500" };
    if (d.includes("tokyo") || d.includes("london")) return { temp: "18°C", label: "Mild Rain & Overcast", icon: "🌧️", color: "text-blue-400" };
    if (d.includes("paris") || d.includes("mumbai") || d.includes("bengaluru")) return { temp: "28°C", label: "Humid & Cloudy Skies", icon: "⛅", color: "text-zinc-400" };
    if (d.includes("shimla") || d.includes("manali")) return { temp: "12°C", label: "Chilly Alpine Snows", icon: "❄️", color: "text-sky-300" };
    if (d.includes("delhi") || d.includes("varanasi")) return { temp: "35°C", label: "Sunny & Hazy Air", icon: "☀️", color: "text-amber-600" };
    return { temp: "24°C", label: "Perfect Clear Skies", icon: "✨", color: "text-zinc-500" };
  };

  const weather = getWeatherForecast(destination);

  // Dynamic cost estimation logic
  const getSelectedStyleMultiplier = () => {
    const found = styles.find(s => s.value === style);
    return found ? found.multiplier : 2000;
  };
  const estimatedMinCost = getSelectedStyleMultiplier() * travelers * days;

  // Speech Recognition API Handler
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast(
        "Voice Input Unavailable",
        "Web Speech API is not supported in this browser environment. Please type destination.",
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
      // Strip trailing periods if any
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

  // GPS Current Location simulator
  const handleGPSLocation = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLoading(false);
          setStartingLocation("My Location (Mumbai)");
          setActiveInput(null);
        },
        () => {
          setGpsLoading(false);
          setStartingLocation("Mumbai Central");
        },
        { timeout: 3000 }
      );
    } else {
      setTimeout(() => {
        setGpsLoading(false);
        setStartingLocation("Mumbai Terminal");
      }, 800);
    }
  };

  // Handle step-by-step progress
  const nextStep = () => {
    if (step === 1 && !startingLocation.trim()) return;
    if (step === 2 && !destination.trim()) return;
    
    // Save destination to recent searches on next step
    if (step === 2) {
      const updated = [destination, ...recentSearches.filter(s => s !== destination)].slice(0, 4);
      setRecentSearches(updated);
      localStorage.setItem("travelai_recent_searches", JSON.stringify(updated));
    }

    setStep(prev => Math.min(prev + 1, 6));
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
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
    switch (step) {
      case 1: return "Starting Location";
      case 2: return "Target Destination";
      case 3: return "Journey Schedules";
      case 4: return "Travelers Pax Count";
      case 5: return "Target Budget Cap";
      case 6: return "Travel Style & Vibe";
      default: return "";
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg p-5 sm:p-7 shadow-xs space-y-6 text-left relative overflow-hidden">
      
      {/* HEADER WIZARD STEP INDICATORS */}
      <div className="space-y-3.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
            Step {step} of 6 • {currentStepName()}
          </span>
          <span className="font-mono text-[10px] text-zinc-950 dark:text-zinc-300 font-bold">
            Estimated Cost: ₹{estimatedMinCost.toLocaleString()}
          </span>
        </div>

        {/* STEP PROGRESS NODE METRICS */}
        <div className="grid grid-cols-6 gap-1.5 h-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i} 
              className={`h-full rounded-xs transition-all duration-300 ${
                i <= step ? "bg-zinc-950 dark:bg-white" : "bg-zinc-100 dark:bg-zinc-900"
              }`} 
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: FROM (Starting Location) */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="relative" ref={startRef}>
                <label className="block text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-2.5">
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
                      className="w-full text-xs font-semibold pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-900 rounded-md text-zinc-800 dark:text-zinc-100 focus:outline-hidden focus:border-zinc-500"
                      autoComplete="off"
                    />
                  </div>
                  
                  {/* Current Location button */}
                  <button
                    type="button"
                    onClick={handleGPSLocation}
                    disabled={gpsLoading}
                    className="p-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-md hover:opacity-90 shrink-0 transition-opacity cursor-pointer flex items-center justify-center border border-transparent"
                    title="Retrieve Geolocation Coordinates"
                  >
                    <Navigation className={`w-4 h-4 ${gpsLoading ? 'animate-pulse' : ''}`} />
                  </button>
                </div>

                {/* Suggestions list */}
                {activeInput === "start" && startSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md shadow-lg z-50 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-900">
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

              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/65 rounded border border-zinc-150 dark:border-zinc-900 text-[10px] font-mono text-zinc-500 leading-normal">
                💡 Coordinates verified locally. Standard route mapping departs from major Indian terminals.
              </div>
            </motion.div>
          )}

          {/* STEP 2: DESTINATION (Destination & Previews) */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="relative" ref={destRef}>
                <label className="block text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-2.5">
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
                      className="w-full text-xs font-semibold pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-900 rounded-md text-zinc-800 dark:text-zinc-100 focus:outline-hidden focus:border-zinc-500"
                      autoComplete="off"
                    />
                  </div>

                  {/* VOICE SEARCH MIC */}
                  <button
                    type="button"
                    onClick={startVoiceSearch}
                    className={`p-3 rounded-md border text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center justify-center ${
                      isRecording 
                        ? 'bg-rose-600 text-white border-transparent animate-pulse' 
                        : 'bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent'
                    }`}
                    title="Activate Web Voice Speech Transcriber"
                  >
                    {isRecording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>

                {/* Suggestions List */}
                {activeInput === "dest" && destSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md shadow-lg z-50 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-900">
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

              {/* RECENT SEARCHES */}
              {recentSearches.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Recent Inquiries</span>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setDestination(s);
                          setActiveInput(null);
                        }}
                        className="px-2.5 py-1 text-[10px] font-semibold bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-900 rounded-md text-zinc-600 dark:text-zinc-400 cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* FAVORITE DESTINATIONS CHIPS */}
              <div className="space-y-1.5">
                <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Vetted Recommendations</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FAVORITES.map((fav, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDestination(fav.name);
                        setActiveInput(null);
                      }}
                      className="p-2 text-left bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-900 rounded-md cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 leading-none">{fav.name}</p>
                      <p className="text-[8px] text-zinc-400 mt-1 leading-none">{fav.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* WEATHER PREVIEW & ESTIMATED SEGMENTS MAP */}
              {destination.trim() && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  {/* Weather */}
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-900 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">Weather Forecast</p>
                      <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-100">{destination} Atmosphere</p>
                      <p className="text-[10px] text-zinc-500 leading-none font-medium">{weather.label}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl leading-none">{weather.icon}</span>
                      <p className={`text-xs font-mono font-black mt-1 ${weather.color}`}>{weather.temp}</p>
                    </div>
                  </div>

                  {/* Micro route preview */}
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-900 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">Micro Map Link</p>
                      <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-100">{startingLocation} ➔ {destination}</p>
                      <p className="text-[10px] text-zinc-500 leading-none font-semibold">Direct carrier air-vectors loaded</p>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0">
                      <Map className="w-4 h-4 text-zinc-400" />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: SCHEDULES & TRAVEL DATE */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* DATE SELECTOR */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                    Departing Calendar Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="date"
                      required
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-900 rounded-md text-zinc-800 dark:text-zinc-100 focus:outline-hidden focus:border-zinc-500 font-mono"
                    />
                  </div>
                </div>

                {/* TRIP DURATION (Days) with adjustments */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                    Trip Duration (Days)
                  </label>
                  <div className="flex border border-zinc-200 dark:border-zinc-900 rounded-md overflow-hidden bg-zinc-50 dark:bg-zinc-900 h-10">
                    <button
                      type="button"
                      onClick={() => setDays(prev => Math.max(1, prev - 1))}
                      className="w-12 h-full flex items-center justify-center font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
                    >
                      -
                    </button>
                    <div className="flex-1 flex items-center justify-center text-xs font-bold text-zinc-800 dark:text-zinc-100 font-mono bg-white dark:bg-zinc-950">
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

              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/65 rounded border border-zinc-150 dark:border-zinc-900 text-[10px] font-mono text-zinc-500 leading-normal">
                📝 Dynamic routing compiles transport indices for July 2026 scheduling criteria automatically.
              </div>
            </motion.div>
          )}

          {/* STEP 4: TRAVELLERS */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label className="block text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                  Total Journey Party (Travellers)
                </label>
                
                <div className="flex items-center justify-between max-w-sm mx-auto p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-900 rounded-md">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase font-mono">Pax Group Size</span>
                    <p className="text-[10px] text-zinc-400">Total occupants per carriage / flight seats</p>
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
                      onClick={() => setTravelers(prev => Math.min(20, prev + 1))}
                      className="w-10 h-10 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 cursor-pointer font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                {[{ label: "Solo Node", value: 1 }, { label: "Duo Match", value: 2 }, { label: "Compact Group", value: 4 }, { label: "Family Pack", value: 6 }].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTravelers(preset.value)}
                    className={`p-2.5 rounded border text-[10px] font-bold font-mono uppercase cursor-pointer transition-colors ${
                      travelers === preset.value 
                        ? "bg-zinc-950 dark:bg-white text-white dark:text-black border-transparent" 
                        : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 5: BUDGET */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-5"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
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
                    className="w-full h-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-zinc-950 dark:accent-white"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-400 font-mono font-bold">
                    <span>MIN ₹5,000</span>
                    <span>MID ₹1,00,000</span>
                    <span>MAX ₹2,00,000</span>
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-4 gap-2">
                  {[15000, 30000, 60000, 120000].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setBudget(preset)}
                      className={`p-2.5 text-[10px] font-bold rounded font-mono border cursor-pointer transition-colors ${
                        budget === preset 
                          ? "bg-zinc-950 dark:bg-white text-white dark:text-black border-transparent" 
                          : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                      }`}
                    >
                      ₹{preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/65 rounded border border-zinc-150 dark:border-zinc-900 text-[10px] font-mono text-zinc-500 leading-normal">
                📊 Note: AI compiler flags and replaces luxury options to conform strictly beneath your preset budget limits.
              </div>
            </motion.div>
          )}

          {/* STEP 6: TRAVEL STYLE */}
          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="space-y-2.5">
                <label className="block text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                  Select Custom Travel Style
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-h-64 overflow-y-auto pr-1 no-scrollbar">
                  {styles.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setStyle(item.value)}
                      className={`flex flex-col items-start p-3 rounded-lg border transition-all text-left cursor-pointer ${
                        style === item.value
                          ? "bg-zinc-950 border-transparent text-white dark:bg-white dark:text-black shadow-lg scale-[1.01]"
                          : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      }`}
                    >
                      <span className="text-base mb-1">{item.emoji}</span>
                      <span className="text-[10px] font-bold leading-tight uppercase font-mono tracking-wide">{item.label}</span>
                      <span className="text-[9px] opacity-70 leading-normal mt-1 leading-snug">
                        {item.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SUMMARY HIGHLIGHT PRE-FLIGHT */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-900 text-xs text-zinc-500 leading-normal font-medium flex justify-between items-center">
                <div className="space-y-0.5">
                  <p className="font-bold text-zinc-900 dark:text-white uppercase font-mono text-[9px] tracking-wider">Itinerary Specifications</p>
                  <p className="text-[10px]">
                    From {startingLocation} Departing to {destination} ({days} Days, {travelers} Pax, {style} Vibe)
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-zinc-400">Est. Min Cost</span>
                  <p className="font-mono font-black text-zinc-900 dark:text-white">₹{estimatedMinCost.toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* WIZARD NAVIGATION FOOTER BUTTONS */}
        <div className="flex justify-between items-center gap-3 pt-2.5 border-t border-zinc-150 dark:border-zinc-900">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-black dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-white rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-5 py-2.5 bg-zinc-900 dark:bg-white dark:text-black text-white hover:opacity-90 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ml-auto font-mono uppercase tracking-wider"
            >
              Next Step <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            /* Submit Button (Generate Trip) */
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-zinc-950 dark:bg-white text-white dark:text-black rounded-md text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-90 disabled:opacity-50 font-mono uppercase tracking-widest ml-auto"
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></span>
                  Compiling...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Generate Trip
                </>
              )}
            </button>
          )}
        </div>

      </form>
    </div>
  );
}
