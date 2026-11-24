import React, { useState } from "react";
import {
  Compass,
  MapPin,
  Search,
  Plane,
  Star,
  ShieldCheck,
  ShieldAlert,
  X,
  Clock,
  Users,
  Wallet,
  ArrowRight,
  Info,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HotspotItem {
  name: string;
  image: string;
  description: string;
  weather: string;
  flightStart: string;
  flightDrop: string;
  rating: number;
  bestSeason: string;
  crowdLevel: string;
  budget: string;
  budgetTier: "Budget-Friendly" | "Mid-Range" | "Premium";
  distance: string;
  aiSummary: string;
  safetyScore: string;
  safetyNumeric: number;
  bestTime: string;
  estimatedCost: string;
  category: "Beach" | "City" | "Culture";
}

interface PackageItem {
  title: string;
  destination: string;
  price: number;
  rating: number;
  provider: string;
  reviews: number;
  image: string;
  budgetTier: "Budget-Friendly" | "Mid-Range" | "Premium";
  safetyNumeric: number;
  duration: string;
}

interface ExploreTabProps {
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onPlanRoute: (dest: string) => void;
  setBookingModal: (modal: {
    isOpen: boolean;
    itemType: "flight" | "hotel" | "bus" | "train" | "activity";
    itemName: string;
    price: number;
    provider?: string;
  }) => void;
}

const FILTER_OPTIONS = [
  "All",
  "Budget-Friendly",
  "Mid-Range",
  "Premium",
  "High Safety (9.5+)",
] as const;

type FilterOption = (typeof FILTER_OPTIONS)[number];

const TRENDING_PLACES: HotspotItem[] = [
  {
    name: "Goa, India",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&auto=format&fit=crop&q=70",
    description: "Golden sands, coastal curries, and Portuguese quarters.",
    weather: "31°C · Sunny",
    flightStart: "₹4,350",
    flightDrop: "-₹850",
    rating: 4.8,
    bestSeason: "Nov to Feb",
    crowdLevel: "Moderate",
    budget: "Budget-Friendly",
    budgetTier: "Budget-Friendly",
    distance: "540 km",
    aiSummary: "Safe beaches, historical forts, and fresh local coastal cafes.",
    safetyScore: "9.4/10",
    safetyNumeric: 9.4,
    bestTime: "Sunrise walks",
    estimatedCost: "₹12,500",
    category: "Beach",
  },
  {
    name: "Tokyo, Japan",
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=70",
    description: "Ultra-modern skyscrapers paired with serene shrines.",
    weather: "19°C · Light Rain",
    flightStart: "₹38,200",
    flightDrop: "-₹4,100",
    rating: 4.9,
    bestSeason: "Mar to May",
    crowdLevel: "High",
    budget: "Premium",
    budgetTier: "Premium",
    distance: "5,800 km",
    aiSummary: "Pristine subways, high personal safety, and unbeatable local eats.",
    safetyScore: "9.9/10",
    safetyNumeric: 9.9,
    bestTime: "Evening lights",
    estimatedCost: "₹1,20,000",
    category: "City",
  },
  {
    name: "Paris, France",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=70",
    description: "Charming cafes, world-class museums, and river avenues.",
    weather: "22°C · Clear",
    flightStart: "₹42,500",
    flightDrop: "-₹2,300",
    rating: 4.7,
    bestSeason: "Apr to Oct",
    crowdLevel: "Moderate",
    budget: "Premium",
    budgetTier: "Premium",
    distance: "7,300 km",
    aiSummary: "Iconic artistic landmarks, walkable riverside streets, and rich bakeries.",
    safetyScore: "9.1/10",
    safetyNumeric: 9.1,
    bestTime: "Sunset at Seine",
    estimatedCost: "₹1,45,000",
    category: "City",
  },
  {
    name: "Bali, Indonesia",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&auto=format&fit=crop&q=70",
    description: "Ubud rice terraces, spiritual shrines, and warm ocean swells.",
    weather: "28°C · Warm Breeze",
    flightStart: "₹18,400",
    flightDrop: "-₹1,200",
    rating: 4.8,
    bestSeason: "May to Sep",
    crowdLevel: "Moderate",
    budget: "Mid-Range",
    budgetTier: "Mid-Range",
    distance: "4,200 km",
    aiSummary: "Lush volcanic ridges, sacred temples, and serene ocean viewpoints.",
    safetyScore: "9.3/10",
    safetyNumeric: 9.3,
    bestTime: "Early afternoon",
    estimatedCost: "₹45,000",
    category: "Beach",
  },
  {
    name: "Rome, Italy",
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=70",
    description: "Living museum of colosseums, fountains, and trattorias.",
    weather: "25°C · Sunny",
    flightStart: "₹35,100",
    flightDrop: "-₹3,400",
    rating: 4.6,
    bestSeason: "May to Oct",
    crowdLevel: "High",
    budget: "Mid-Range",
    budgetTier: "Mid-Range",
    distance: "6,400 km",
    aiSummary: "Walkable historic ruins, vibrant piazzas, and authentic local dining.",
    safetyScore: "8.9/10",
    safetyNumeric: 8.9,
    bestTime: "Morning tours",
    estimatedCost: "₹1,10,000",
    category: "Culture",
  },
  {
    name: "Maldives",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=70",
    description: "Overwater bungalows, vibrant reefs, and isolated sandbars.",
    weather: "29°C · Clear Skies",
    flightStart: "₹15,200",
    flightDrop: "-₹900",
    rating: 4.9,
    bestSeason: "Dec to Apr",
    crowdLevel: "Low",
    budget: "Premium",
    budgetTier: "Premium",
    distance: "1,500 km",
    aiSummary: "Private overwater reefs, crystal clear waters, and calm island quietude.",
    safetyScore: "9.8/10",
    safetyNumeric: 9.8,
    bestTime: "Full day comfort",
    estimatedCost: "₹85,000",
    category: "Beach",
  },
];

const PACKAGES: PackageItem[] = [
  {
    title: "Goa Watersports & Scuba Expedition",
    destination: "Goa, India",
    price: 3499,
    rating: 4.7,
    provider: "Goa Adventure Corp",
    reviews: 142,
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&auto=format&fit=crop&q=70",
    budgetTier: "Budget-Friendly",
    safetyNumeric: 9.4,
    duration: "5 Hours",
  },
  {
    title: "Shinjuku Izakaya & Food Crawl Tour",
    destination: "Tokyo, Japan",
    price: 4800,
    rating: 4.9,
    provider: "Tokyo Eats Ltd",
    reviews: 382,
    image: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=500&auto=format&fit=crop&q=70",
    budgetTier: "Premium",
    safetyNumeric: 9.9,
    duration: "3.5 Hours",
  },
  {
    title: "Ubud Sunrise & Rice Terrace Trek",
    destination: "Bali, Indonesia",
    price: 2650,
    rating: 4.8,
    provider: "Bali Trail Collective",
    reviews: 275,
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=500&auto=format&fit=crop&q=70",
    budgetTier: "Mid-Range",
    safetyNumeric: 9.3,
    duration: "6 Hours",
  },
  {
    title: "Seine River Twilight Luxury Cruise",
    destination: "Paris, France",
    price: 2900,
    rating: 4.8,
    provider: "Paris Seine Tours",
    reviews: 219,
    image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=500&auto=format&fit=crop&q=70",
    budgetTier: "Premium",
    safetyNumeric: 9.1,
    duration: "2 Hours",
  },
  {
    title: "Colosseum Underground & Forum Pass",
    destination: "Rome, Italy",
    price: 3850,
    rating: 4.7,
    provider: "Roma Heritage Walks",
    reviews: 194,
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500&auto=format&fit=crop&q=70",
    budgetTier: "Mid-Range",
    safetyNumeric: 8.9,
    duration: "3 Hours",
  },
  {
    title: "Maldives Private Reef Snorkel Charter",
    destination: "Maldives",
    price: 6200,
    rating: 4.9,
    provider: "Atoll Marine Guides",
    reviews: 164,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=70",
    budgetTier: "Premium",
    safetyNumeric: 9.8,
    duration: "4 Hours",
  },
];

function ImageWithFallback({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 flex flex-col items-center justify-center p-4 text-center">
        <Compass className="w-7 h-7 text-zinc-400 dark:text-zinc-600 mb-1.5" />
        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 line-clamp-1">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export default function ExploreTab({
  searchQuery,
  onSearchQueryChange,
  onPlanRoute,
  setBookingModal,
}: ExploreTabProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotItem | null>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesFilter = (budgetTier: string, safetyNumeric: number) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "High Safety (9.5+)") return safetyNumeric >= 9.5;
    return budgetTier === activeFilter;
  };

  const filteredHotspots = TRENDING_PLACES.filter((place) => {
    const matchesSearch =
      !normalizedQuery ||
      place.name.toLowerCase().includes(normalizedQuery) ||
      place.description.toLowerCase().includes(normalizedQuery) ||
      place.category.toLowerCase().includes(normalizedQuery) ||
      place.budget.toLowerCase().includes(normalizedQuery);
    return matchesSearch && matchesFilter(place.budgetTier, place.safetyNumeric);
  });

  const filteredPackages = PACKAGES.filter((pkg) => {
    const matchesSearch =
      !normalizedQuery ||
      pkg.title.toLowerCase().includes(normalizedQuery) ||
      pkg.destination.toLowerCase().includes(normalizedQuery) ||
      pkg.provider.toLowerCase().includes(normalizedQuery);
    return matchesSearch && matchesFilter(pkg.budgetTier, pkg.safetyNumeric);
  });

  const hasActiveFilters = normalizedQuery.length > 0 || activeFilter !== "All";

  const resetFilters = () => {
    onSearchQueryChange("");
    setActiveFilter("All");
  };

  return (
    <div id="explore-tab-panel" className="space-y-12 text-left">
      {/* HERO & REAL-TIME SEARCH DISCOVERY BAR */}
      <div className="relative min-h-[420px] overflow-hidden rounded-[28px] bg-zinc-950 text-white">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=88"
          alt="Clear tropical water along a beach"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/45 to-zinc-950/5" />
        <div className="relative flex min-h-[420px] flex-col justify-between p-6 sm:p-10 lg:p-12">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/75">Where do you want to wake up?</span>
            <ShieldCheck className="h-5 w-5 text-white/80" />
          </div>
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold leading-[1.02] tracking-tight font-display sm:text-6xl text-balance">
              Find your way somewhere worth remembering.
            </h2>
            <p className="mt-5 max-w-xl text-base text-white/75">
              Compare routes, stays and local experiences in one beautifully simple plan.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={() => onPlanRoute("Goa, India")}
                className="h-12 rounded-full bg-white px-6 text-sm font-bold text-zinc-950 transition-colors hover:bg-zinc-100"
              >
                Plan a trip
              </button>
              <button
                type="button"
                onClick={() => setBookingModal({ isOpen: true, itemType: "flight", itemName: "Explore flights", price: 4350, provider: "Verified Partner" })}
                className="h-12 rounded-full border border-white/30 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                Explore flights
              </button>
            </div>
          </div>

        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Destination filters">
          {FILTER_OPTIONS.map((option) => {
            const isActive = activeFilter === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setActiveFilter(option)}
                className={`h-10 rounded-full border px-4 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-zinc-600 hover:text-zinc-950"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        )}
      </div>

      {/* VERIFIED GLOBAL HOTSPOTS */}
      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-3xl font-bold tracking-tight font-display text-zinc-950 dark:text-white">
              Places worth going
            </h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {filteredHotspots.length} curated destinations
            </p>
          </div>
        </div>

        {filteredHotspots.length === 0 ? (
          <div className="p-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-center space-y-3">
            <Compass className="w-8 h-8 text-zinc-400 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                No hotspots match "{searchQuery || activeFilter}"
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Try clearing your search term or switching to a broader budget tier.
              </p>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-zinc-950 text-xs font-semibold cursor-pointer transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredHotspots.map((place) => (
              <article
                key={place.name}
                className="group overflow-hidden rounded-[22px] bg-white transition-transform duration-300 hover:-translate-y-1 dark:bg-white/[0.05]"
              >
                <div>
                  <div className="relative h-52 overflow-hidden bg-zinc-900">
                    <ImageWithFallback
                      src={place.image}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white">
                      <span className="inline-flex items-center gap-1 font-semibold tabular-nums">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {place.rating}
                      </span>
                      <span className="text-zinc-200 font-medium">{place.weather}</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xl font-bold text-zinc-950 dark:text-white font-display">
                          {place.name}
                        </h4>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium shrink-0">
                          {place.budgetTier}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {place.description}
                      </p>
                    </div>

                    {/* DECLUTTERED 3-STAT SUMMARY STRIP */}
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-zinc-100 dark:border-white/10">
                      <div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Est. Cost</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums mt-0.5">
                          {place.estimatedCost}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Best Season</p>
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
                          {place.bestSeason}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Safety</p>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          {place.safetyScore}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedHotspot(place)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Info className="w-3.5 h-3.5" />
                    View Details
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onPlanRoute(place.name)}
                      className="h-10 px-4 rounded-full text-sm font-semibold text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Plan Route
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBookingModal({
                          isOpen: true,
                          itemType: "flight",
                          itemName: `Direct Flight to ${place.name}`,
                          price: parseInt(place.flightStart.replace(/[^\d]/g, ""), 10),
                          provider: "Skyscanner Verified Partner",
                        })
                      }
                      className="h-10 px-5 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Book Now
                    </button>
                </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* POPULAR LOCAL EXPERIENCE PACKAGES */}
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-bold tracking-tight font-display text-zinc-900 dark:text-white">
            Top Experience Packages
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Locally organized, pre-vetted experiences ready for instant checkout ({filteredPackages.length} available)
          </p>
        </div>

        {filteredPackages.length === 0 ? (
          <div className="p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-center space-y-2">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              No experience packages match your current filters
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Try adjusting your search or filter selection above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.title}
                className="group bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors text-left flex flex-col justify-between"
              >
                <div>
                  <div className="h-40 relative bg-zinc-900 overflow-hidden">
                    <ImageWithFallback
                      src={pkg.image}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        {pkg.destination}
                      </span>
                      <span className="text-zinc-200 font-mono text-[11px]">{pkg.duration}</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm leading-snug line-clamp-2">
                      {pkg.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{pkg.provider}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 tabular-nums text-zinc-700 dark:text-zinc-300 font-medium">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {pkg.rating} ({pkg.reviews})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-3 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center gap-3">
                  <div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Per person</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums">
                      ₹{pkg.price.toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setBookingModal({
                        isOpen: true,
                        itemType: "activity",
                        itemName: pkg.title,
                        price: pkg.price,
                        provider: pkg.provider,
                      })
                    }
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-zinc-950 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Quick Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* TRAVEL SAFETY & REGULATORY DIRECTIVE */}
      <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-start gap-4 text-left">
        <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h5 className="font-bold text-zinc-900 dark:text-white text-xs uppercase tracking-wider">
            Safety & Regulatory Protocol
          </h5>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Coastal municipal zones require verified helmet rentals and digital transit receipts. Review the{" "}
            <strong className="text-zinc-900 dark:text-zinc-200">Safety Alerts</strong> panel inside the{" "}
            <strong className="text-zinc-900 dark:text-zinc-200">Plan Trip</strong> workspace before locking in ground transfers.
          </p>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      <AnimatePresence>
        {selectedHotspot && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
            onClick={() => setSelectedHotspot(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.16 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-xl overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl text-left"
            >
              <div className="h-48 relative bg-zinc-900">
                <ImageWithFallback
                  src={selectedHotspot.image}
                  alt={selectedHotspot.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <button
                  type="button"
                  onClick={() => setSelectedHotspot(null)}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white cursor-pointer transition-colors"
                  aria-label="Close destination details"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Safety {selectedHotspot.safetyScore}</span>
                      <span aria-hidden="true" className="text-zinc-400">·</span>
                      <span className="text-zinc-200">{selectedHotspot.weather}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white font-display">
                      {selectedHotspot.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-zinc-300 block">Flights from</span>
                    <span className="text-base font-bold text-cyan-300 tabular-nums">
                      {selectedHotspot.flightStart}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {selectedHotspot.aiSummary} {selectedHotspot.description}
                </p>

                {/* FULL DETAILS GRID (MOVED FROM CARD FACE) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-y border-zinc-100 dark:border-zinc-800">
                  <div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Crowd Level
                    </p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white mt-1">
                      {selectedHotspot.crowdLevel}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <Plane className="w-3 h-3" /> Route Distance
                    </p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white tabular-nums mt-1">
                      {selectedHotspot.distance}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Best Arrival
                    </p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white mt-1">
                      {selectedHotspot.bestTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <Wallet className="w-3 h-3" /> Budget Bracket
                    </p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white mt-1">
                      {selectedHotspot.budget}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Best Season</p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white mt-1">
                      {selectedHotspot.bestSeason}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Est. Total Cost</p>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                      {selectedHotspot.estimatedCost}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const dest = selectedHotspot.name;
                      setSelectedHotspot(null);
                      onPlanRoute(dest);
                    }}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Plan Route
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedHotspot;
                      setSelectedHotspot(null);
                      setBookingModal({
                        isOpen: true,
                        itemType: "flight",
                        itemName: `Direct Flight to ${target.name}`,
                        price: parseInt(target.flightStart.replace(/[^\d]/g, ""), 10),
                        provider: "Skyscanner Verified Partner",
                      });
                    }}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-zinc-950 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    Book Now
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
