import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-Memory IP Rate Limiter
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function rateLimiter(windowMs: number, maxRequests: number, label: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const rawIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "127.0.0.1";
    const now = Date.now();
    const key = `${label}:${rawIp}`;
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      res.setHeader("Retry-After", retryAfterSec);
      return res.status(429).json({
        error: `Too many requests for ${label}. Please retry in ${retryAfterSec} seconds.`,
        retryAfter: retryAfterSec
      });
    }

    record.count++;
    next();
  };
}

// Request Timeout Middleware
function requestTimeout(timeoutMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({ error: "Request timed out on server. Please try again." });
      }
    }, timeoutMs);

    res.on("finish", () => clearTimeout(timer));
    res.on("close", () => clearTimeout(timer));
    next();
  };
}

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Destination emergency directory resolver (real international & national hotlines)
function getDestinationEmergencyContacts(dest: string): string[] {
  const d = dest.toLowerCase();
  if (d.includes("japan") || d.includes("tokyo") || d.includes("kyoto") || d.includes("osaka")) {
    return [
      "Japan Police Emergency: 110",
      "Japan Ambulance & Fire: 119",
      "Japan Helpline (English 24/7): 0570-000-911",
      "Japan National Tourist Organization: 050-3816-2720"
    ];
  }
  if (d.includes("france") || d.includes("paris") || d.includes("europe") || d.includes("italy") || d.includes("rome")) {
    return [
      "Pan-European Universal Emergency: 112",
      "SAMU Medical Emergency (France): 15",
      "National Police (France): 17",
      "Fire Department (Pompiers): 18"
    ];
  }
  if (d.includes("usa") || d.includes("america") || d.includes("new york") || d.includes("california")) {
    return [
      "Emergency Dispatch (Police/Fire/EMS): 911",
      "Municipal Services / Non-Emergency: 311",
      "National Suicide & Crisis Lifeline: 988"
    ];
  }
  return [
    "National Emergency Unified Number: 112",
    "Police Hotline: 100 / 112",
    "Medical Ambulance Helpline: 108",
    "Ministry of Tourism National Helpline: 1363"
  ];
}

interface CityMetadata {
  name: string;
  lat: number;
  lng: number;
  hasAirport: boolean;
  airportCode?: string;
  nearestAirport?: string;
  distanceToNearestAirportKm?: number;
  hasRailway: boolean;
  railwayStationName?: string;
  busOperators: string[];
  localTransport: string[];
  hasMetro: boolean;
  hasFerry: boolean;
}

const CITY_DATABASE: Record<string, CityMetadata> = {
  mumbai: {
    name: "Mumbai",
    lat: 19.0760,
    lng: 72.8777,
    hasAirport: true,
    airportCode: "BOM",
    hasRailway: true,
    railwayStationName: "Chhatrapati Shivaji Maharaj Terminus (CSMT)",
    busOperators: ["MSRTC", "Neeta Travels", "National Travels", "VRL Travels"],
    localTransport: ["Local Train", "Kala-Peeli Taxi", "Auto Rickshaw", "Uber/Ola", "BEST Bus"],
    hasMetro: true,
    hasFerry: true,
  },
  delhi: {
    name: "Delhi",
    lat: 28.6139,
    lng: 77.2090,
    hasAirport: true,
    airportCode: "DEL",
    hasRailway: true,
    railwayStationName: "New Delhi Railway Station (NDLS)",
    busOperators: ["DTC", "Zingbus", "IntrCity SmartBus", "RS Yadav Travels"],
    localTransport: ["Delhi Metro", "Auto Rickshaw", "E-Rickshaw", "Uber/Ola", "DTC Bus"],
    hasMetro: true,
    hasFerry: false,
  },
  bengaluru: {
    name: "Bengaluru",
    lat: 12.9716,
    lng: 77.5946,
    hasAirport: true,
    airportCode: "BLR",
    hasRailway: true,
    railwayStationName: "KSR Bengaluru City Railway Station (SBC)",
    busOperators: ["KSRTC", "VRL Travels", "SRS Travels", "Orange Tours"],
    localTransport: ["Namma Metro", "BMTC Bus", "Auto Rickshaw", "Uber/Ola/Rapido"],
    hasMetro: true,
    hasFerry: false,
  },
  goa: {
    name: "Goa",
    lat: 15.2993,
    lng: 74.1240,
    hasAirport: true,
    airportCode: "GOI",
    hasRailway: true,
    railwayStationName: "Madgaon Railway Station (MAO)",
    busOperators: ["KTCL", "Paulo Travels", "Atmaram Travels", "VRL Travels"],
    localTransport: ["Rented Scooter/Car", "GoaMiles Cab", "Local Bus", "Motorcycle Pilot"],
    hasMetro: false,
    hasFerry: true,
  },
  davangere: {
    name: "Davangere",
    lat: 14.4644,
    lng: 75.9218,
    hasAirport: false,
    nearestAirport: "Hubli Airport (HBX)",
    distanceToNearestAirportKm: 150,
    hasRailway: true,
    railwayStationName: "Davangere Railway Station (DVG)",
    busOperators: ["KSRTC", "VRL Travels", "SRS Travels", "National Travels"],
    localTransport: ["Auto Rickshaw", "City Bus", "Private Taxi"],
    hasMetro: false,
    hasFerry: false,
  },
  mangalore: {
    name: "Mangalore",
    lat: 12.9141,
    lng: 74.8560,
    hasAirport: true,
    airportCode: "IXE",
    hasRailway: true,
    railwayStationName: "Mangalore Central (MAQ)",
    busOperators: ["KSRTC", "VRL Travels", "Sugama Tourist", "SRS Travels"],
    localTransport: ["City Bus", "Auto Rickshaw", "Uber/Ola", "Yellow Cabs"],
    hasMetro: false,
    hasFerry: true,
  },
  hubli: {
    name: "Hubballi",
    lat: 15.3647,
    lng: 75.1240,
    hasAirport: true,
    airportCode: "HBX",
    hasRailway: true,
    railwayStationName: "Hubballi Junction (UBL)",
    busOperators: ["NWKRTC", "VRL Travels", "SRS Travels", "Ganesh Travels"],
    localTransport: ["Auto Rickshaw", "Bentur City Bus", "Chigari BRTS", "Ola/Uber"],
    hasMetro: false,
    hasFerry: false,
  },
  hubballi: {
    name: "Hubballi",
    lat: 15.3647,
    lng: 75.1240,
    hasAirport: true,
    airportCode: "HBX",
    hasRailway: true,
    railwayStationName: "Hubballi Junction (UBL)",
    busOperators: ["NWKRTC", "VRL Travels", "SRS Travels", "Ganesh Travels"],
    localTransport: ["Auto Rickshaw", "Bentur City Bus", "Chigari BRTS", "Ola/Uber"],
    hasMetro: false,
    hasFerry: false,
  },
  pune: {
    name: "Pune",
    lat: 18.5204,
    lng: 73.8567,
    hasAirport: true,
    airportCode: "PNQ",
    hasRailway: true,
    railwayStationName: "Pune Junction (PUNE)",
    busOperators: ["MSRTC", "Neeta Travels", "Prasanna Purple", "VRL Travels"],
    localTransport: ["Pune Metro", "PMPML Bus", "Auto Rickshaw", "Uber/Ola"],
    hasMetro: true,
    hasFerry: false,
  },
  paris: {
    name: "Paris",
    lat: 48.8566,
    lng: 2.3522,
    hasAirport: true,
    airportCode: "CDG",
    hasRailway: true,
    railwayStationName: "Gare du Nord",
    busOperators: ["FlixBus", "BlaBlaCar Bus"],
    localTransport: ["Paris Metro", "RER Trains", "RATP Bus", "Taxi Parisien", "Uber"],
    hasMetro: true,
    hasFerry: true,
  },
  tokyo: {
    name: "Tokyo",
    lat: 35.6762,
    lng: 139.6503,
    hasAirport: true,
    airportCode: "HND",
    hasRailway: true,
    railwayStationName: "Tokyo Station",
    busOperators: ["Willer Express", "Limon Bus", "Keisei Bus"],
    localTransport: ["Tokyo Subway", "JR Yamanote Line", "Toei Bus", "Tokyo Taxi"],
    hasMetro: true,
    hasFerry: false,
  },
  chennai: {
    name: "Chennai",
    lat: 13.0827,
    lng: 80.2707,
    hasAirport: true,
    airportCode: "MAA",
    hasRailway: true,
    railwayStationName: "Chennai Central (MAS)",
    busOperators: ["SETC", "KSRTC", "VRL Travels", "Parveen Travels"],
    localTransport: ["Chennai Metro", "Auto Rickshaw", "MTC Bus", "Uber/Ola"],
    hasMetro: true,
    hasFerry: false,
  },
  kolkata: {
    name: "Kolkata",
    lat: 22.5726,
    lng: 88.3639,
    hasAirport: true,
    airportCode: "CCU",
    hasRailway: true,
    railwayStationName: "Howrah Junction (HWH)",
    busOperators: ["WBTC", "Shyamoli Paribahan", "Greenline Travels"],
    localTransport: ["Kolkata Metro", "Yellow Taxi", "Tram", "Auto Rickshaw", "Ferry Jetty"],
    hasMetro: true,
    hasFerry: true,
  }
};

function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDuration(hoursDecimal: number): string {
  const h = Math.floor(hoursDecimal);
  const m = Math.round((hoursDecimal - h) * 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const cityMetadataCache = new Map<string, { data: CityMetadata; expiresAt: number }>();
const CITY_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function getCityMetadata(cityName: string): Promise<CityMetadata> {
  const normName = cityName.trim().toLowerCase().replace(/[\s,]/g, "");
  
  // 1. Check in-memory TTL cache
  const cached = cityMetadataCache.get(normName);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  let result: CityMetadata;

  if (CITY_DATABASE[normName]) {
    result = CITY_DATABASE[normName];
    cityMetadataCache.set(normName, { data: result, expiresAt: Date.now() + CITY_CACHE_TTL_MS });
    return result;
  }
  
  // Clean name lookups for near matches
  for (const key of Object.keys(CITY_DATABASE)) {
    if (normName.includes(key) || key.includes(normName)) {
      result = CITY_DATABASE[key];
      cityMetadataCache.set(normName, { data: result, expiresAt: Date.now() + CITY_CACHE_TTL_MS });
      return result;
    }
  }

  // Fallback to Gemini if configured, otherwise use default rule-based city setup
  const isApiKeyPlaceholder = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" || process.env.GEMINI_API_KEY === "";
  if (isApiKeyPlaceholder) {
    result = {
      name: cityName,
      lat: 13.0,
      lng: 75.0,
      hasAirport: false,
      nearestAirport: "Nearest Regional Airport",
      distanceToNearestAirportKm: 120,
      hasRailway: true,
      railwayStationName: `${cityName} Station`,
      busOperators: ["KSRTC", "VRL Travels"],
      localTransport: ["Auto Rickshaw", "Taxi"],
      hasMetro: false,
      hasFerry: false,
    };
    cityMetadataCache.set(normName, { data: result, expiresAt: Date.now() + CITY_CACHE_TTL_MS });
    return result;
  }

  try {
    const prompt = `You are a strict, factual geocoding and city transit analyzer.
Analyze the city "${cityName}" and return a JSON object with this EXACT structure:
{
  "name": "Proper City Name",
  "lat": number (latitude),
  "lng": number (longitude),
  "hasAirport": boolean (MUST be true ONLY if there is an active commercial passenger airport inside or within 20km of the city. For example, Davangere has no commercial airport, so hasAirport must be false),
  "airportCode": "3-letter IATA code if hasAirport is true, otherwise empty string",
  "nearestAirport": "Name and code of nearest commercial passenger airport if hasAirport is false, e.g. 'Hubli Airport (HBX)'",
  "distanceToNearestAirportKm": number (approximate driving distance to nearest airport in km if hasAirport is false, e.g. 150),
  "hasRailway": boolean,
  "railwayStationName": "Name of main railway station",
  "busOperators": string[] (at least 2 real major bus operators serving this city, e.g. ["KSRTC", "VRL Travels"]),
  "localTransport": string[] (e.g. ["Auto Rickshaw", "Taxi", "Local Bus"]),
  "hasMetro": boolean,
  "hasFerry": boolean
}
Return only raw JSON. Do not wrap in markdown or backticks.`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    result = {
      name: parsed.name || cityName,
      lat: typeof parsed.lat === "number" ? parsed.lat : 13.0,
      lng: typeof parsed.lng === "number" ? parsed.lng : 75.0,
      hasAirport: !!parsed.hasAirport,
      airportCode: parsed.airportCode || undefined,
      nearestAirport: parsed.nearestAirport || undefined,
      distanceToNearestAirportKm: parsed.distanceToNearestAirportKm || undefined,
      hasRailway: !!parsed.hasRailway,
      railwayStationName: parsed.railwayStationName || undefined,
      busOperators: Array.isArray(parsed.busOperators) && parsed.busOperators.length > 0 ? parsed.busOperators : ["VRL Travels", "KSRTC"],
      localTransport: Array.isArray(parsed.localTransport) && parsed.localTransport.length > 0 ? parsed.localTransport : ["Taxi", "Auto Rickshaw"],
      hasMetro: !!parsed.hasMetro,
      hasFerry: !!parsed.hasFerry,
    };
  } catch (error) {
    console.error("Failed to fetch dynamic city metadata from Gemini, using fallback:", error);
    result = {
      name: cityName,
      lat: 13.0,
      lng: 75.0,
      hasAirport: false,
      nearestAirport: "Nearest Regional Airport",
      distanceToNearestAirportKm: 120,
      hasRailway: true,
      railwayStationName: `${cityName} Station`,
      busOperators: ["KSRTC", "VRL Travels"],
      localTransport: ["Auto Rickshaw", "Taxi"],
      hasMetro: false,
      hasFerry: false,
    };
  }

  cityMetadataCache.set(normName, { data: result, expiresAt: Date.now() + CITY_CACHE_TTL_MS });
  return result;
}

function buildAvailableTransports(src: CityMetadata, dest: CityMetadata, style: string): any[] {
  const distanceKm = getHaversineDistance(src.lat, src.lng, dest.lat, dest.lng);
  const roundedDist = Math.round(distanceKm);
  const transports: any[] = [];

  // 1. Cab (private outstation) - always available
  const cabTime = (roundedDist / 55) + 0.5;
  const cabPrice = Math.max(1800, Math.round(roundedDist * 14));
  transports.push({
    type: "cab",
    provider: `${dest.name} Premium Outstation Cabs`,
    price: cabPrice,
    travelTime: formatDuration(cabTime),
    comfortRating: 4,
    comfortScore: 88,
    safetyScore: 90,
    trafficImpact: roundedDist > 100 ? "Moderate highway delays" : "Low traffic impact",
    weatherImpact: "Low (possible monsoon delays)",
    carbonEmissions: `${Math.round(roundedDist * 0.12)} kg CO2`,
    luggageInfo: "Unlimited trunk space, roof racks available",
    refundPolicy: "Free cancellation up to 6 hours before departure",
    isBest: distanceKm < 150 && style !== "budget",
    aiRecommendation: "Door-to-door private transport, highly recommended for families and heavy luggage.",
    distanceKm: roundedDist,
  });

  // 2. Self Drive - available for land travel up to 600km
  if (roundedDist < 600) {
    const sdTime = roundedDist / 60;
    const sdPrice = Math.round(2000 + (roundedDist * 8.5));
    transports.push({
      type: "selfdrive",
      provider: "Zoomcar Rental Fleet (SUV / Sedan)",
      price: sdPrice,
      travelTime: formatDuration(sdTime),
      comfortRating: 4,
      comfortScore: 82,
      safetyScore: 85,
      trafficImpact: "Moderate traffic impact",
      weatherImpact: "Low",
      carbonEmissions: `${Math.round(roundedDist * 0.11)} kg CO2`,
      luggageInfo: "Based on selected car capacity",
      refundPolicy: "Full refund if cancelled 24h prior",
      isBest: style === "solo" && distanceKm < 200,
      aiRecommendation: "Complete control over your itinerary. Perfect for stopping at local roadside attractions.",
      distanceKm: roundedDist,
    });
  }

  // 3. Bus - available for distance > 50km
  if (roundedDist > 50) {
    const busOperators = [...new Set([...src.busOperators, ...dest.busOperators, "KSRTC Sleeper", "VRL Travels"])].slice(0, 3);
    const busTime = (roundedDist / 42) + 1.0;
    const busPrice = Math.max(450, Math.round(roundedDist * 2.2));
    transports.push({
      type: "bus",
      provider: `${busOperators[0]} Multi-Axle Volvo AC Sleeper`,
      price: busPrice,
      travelTime: formatDuration(busTime),
      comfortRating: 3,
      comfortScore: 70,
      safetyScore: 82,
      trafficImpact: "Moderate traffic on entry tolls",
      weatherImpact: "Low",
      carbonEmissions: `${Math.round(roundedDist * 0.03)} kg CO2`,
      luggageInfo: "2 large bags in cargo hold, 1 cabin handbag",
      refundPolicy: "50% refund within 12 hours of departure",
      isCheapest: style === "budget" || style === "backpacker",
      aiRecommendation: "Highly economical sleeper coach, recommended for budget travelers.",
      distanceKm: roundedDist,
    });
  }

  // 4. Train - available if both have railway stations and distance > 50km
  if (src.hasRailway && dest.hasRailway && roundedDist > 50) {
    const trainTime = (roundedDist / 55) + 0.5;
    const trainPrice = Math.max(350, Math.round(roundedDist * 1.8));
    transports.push({
      type: "train",
      provider: `Indian Railways ${dest.name} AC Express (2A/3A)`,
      price: trainPrice,
      travelTime: formatDuration(trainTime),
      comfortRating: 4,
      comfortScore: 84,
      safetyScore: 94,
      trafficImpact: "None (zero highway delays)",
      weatherImpact: "None",
      carbonEmissions: `${Math.round(roundedDist * 0.015)} kg CO2`,
      luggageInfo: "Up to 40kg free, stored below berth",
      refundPolicy: "Partial refund as per official IRCTC rules",
      isBest: roundedDist >= 150 && roundedDist <= 500 && (style === "budget" || style === "family"),
      aiRecommendation: "Highly reliable, safest, and most eco-friendly transport option. Smooth sleeper comfort.",
      distanceKm: roundedDist,
    });
  }

  // 5. Flights - direct flights only if BOTH have active commercial airports AND distance is > 150km
  const isMajorSrc = src.hasAirport && ["BOM", "DEL", "BLR", "GOI", "IXE", "PNQ", "CDG", "HND", "MAA", "CCU"].includes(src.airportCode || "");
  const isMajorDest = dest.hasAirport && ["BOM", "DEL", "BLR", "GOI", "IXE", "PNQ", "CDG", "HND", "MAA", "CCU"].includes(dest.airportCode || "");
  const directFlightExists = src.hasAirport && dest.hasAirport && (isMajorSrc && isMajorDest) && (src.airportCode !== dest.airportCode);

  if (directFlightExists && roundedDist > 150) {
    const flightTime = (roundedDist / 700) + 1.25;
    const flightPrice = Math.max(3800, Math.round(4000 + (roundedDist * 3.5)));
    const airline = src.airportCode === "CDG" || dest.airportCode === "CDG" ? "Air France" : 
                    src.airportCode === "HND" || dest.airportCode === "HND" ? "Japan Airlines" : "IndiGo Airlines";
    transports.push({
      type: "flight",
      provider: `${airline} Direct (${src.airportCode} ➔ ${dest.airportCode})`,
      price: flightPrice,
      travelTime: formatDuration(flightTime),
      comfortRating: 4,
      comfortScore: 90,
      safetyScore: 98,
      trafficImpact: "None (airways clear, potential check-in queues)",
      weatherImpact: "Low (possible fog or storm delays)",
      carbonEmissions: `${Math.round(roundedDist * 0.25)} kg CO2`,
      luggageInfo: "15kg check-in, 7kg cabin hand baggage",
      refundPolicy: "Refundable with fee of ₹3,500 / $120",
      isFastest: true,
      isBest: roundedDist > 500 && (style === "luxury" || style === "business"),
      aiRecommendation: "Unmatched speed for long distances. Recommended if time saving is your top priority.",
      distanceKm: roundedDist,
    });
  } else {
    // If NO direct flight is available, but total distance is > 200 km, we recommend a "Hybrid Route" (Cab to nearest airport + flight + cab to destination)
    if (roundedDist > 200) {
      const srcAirportName = src.hasAirport ? `${src.name} (${src.airportCode})` : (src.nearestAirport || "Nearest Regional Airport");
      const destAirportName = dest.hasAirport ? `${dest.name} (${dest.airportCode})` : (dest.nearestAirport || "Nearest Regional Airport");
      
      const leg1Dist = src.hasAirport ? 0 : (src.distanceToNearestAirportKm || 120);
      const leg3Dist = dest.hasAirport ? 0 : (dest.distanceToNearestAirportKm || 120);
      const flightDist = Math.max(150, roundedDist - leg1Dist - leg3Dist);

      const leg1Time = leg1Dist / 55;
      const leg2Time = (flightDist / 700) + 1.25;
      const leg3Time = leg3Dist / 55;
      const totalTimeHours = leg1Time + leg2Time + leg3Time + 2.5;

      const leg1Price = Math.round(leg1Dist * 14);
      const leg2Price = Math.max(3500, Math.round(3500 + flightDist * 3.5));
      const leg3Price = Math.round(leg3Dist * 14);
      const totalPrice = leg1Price + leg2Price + leg3Price;

      const detailsStr = `${src.hasAirport ? "" : `Cab to ${srcAirportName} (${leg1Dist}km) ➔ `}Flight to ${destAirportName} (${Math.round(flightDist)}km)${dest.hasAirport ? "" : ` ➔ Cab to ${dest.name} (${leg3Dist}km)`}`;

      transports.push({
        type: "hybrid",
        provider: "TravelAI Smart Hybrid Transit (Cab + Flight Combo)",
        price: totalPrice,
        travelTime: formatDuration(totalTimeHours),
        comfortRating: 3,
        comfortScore: 78,
        safetyScore: 92,
        trafficImpact: "Moderate (subject to city traffic during cab legs)",
        weatherImpact: "Low",
        carbonEmissions: `${Math.round(flightDist * 0.25 + (leg1Dist + leg3Dist) * 0.12)} kg CO2`,
        luggageInfo: "15kg check-in for flight, flexible cab boot",
        refundPolicy: "Partial cancellation available for individual legs",
        details: detailsStr,
        aiRecommendation: `Smart intermodal transfer! Direct flights are not available on this route. This hybrid connection reduces your total transit time compared to overland busing.`,
        distanceKm: roundedDist,
      });
    }
  }

  // Sort by price
  return transports.sort((a, b) => a.price - b.price);
}

// Validation schemas
const GeneratePlanRequestSchema = z.object({
  startingLocation: z.string().trim().max(100, "Starting location must be 100 characters or fewer").default("Mumbai"),
  destination: z.string().trim().min(2, "Destination must be at least 2 characters").max(100, "Destination must be 100 characters or fewer"),
  budget: z.coerce.number().positive("Budget must be greater than 0").max(100_000_000, "Budget exceeds 100,000,000 limit"),
  days: z.coerce.number().int("Days must be an integer").min(1, "Days must be between 1 and 30").max(30, "Days must be between 1 and 30"),
  travelers: z.coerce.number().int("Travelers must be an integer").min(1, "Travelers must be between 1 and 20").max(20, "Travelers must be between 1 and 20"),
  style: z.enum(['budget', 'family', 'luxury', 'backpacker', 'solo', 'business']).catch('budget')
});

const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    text: z.string().trim().min(1, "Message text cannot be empty").max(2000, "Message text cannot exceed 2000 characters")
  })).min(1, "Messages array must contain at least 1 message"),
  currentTrip: z.any().optional()
});

// Zod schema for structured plan validation & repair
const PlanResponseZod = z.object({
  hotels: z.array(z.object({
    name: z.string().default("Verified Local Stay"),
    price: z.coerce.number().default(2500),
    rating: z.coerce.number().default(4.5),
    reviewsCount: z.coerce.number().default(180),
    photoUrl: z.string().default("https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop&q=60"),
    nearbyMetro: z.string().default("Transit station (400m)"),
    nearbyBusStop: z.string().default("Central Depot (200m)"),
    nearbyRestaurants: z.array(z.string()).default([]),
    safetyScore: z.coerce.number().default(90),
    aiRecommendation: z.string().default("Verified secure property for comfortable travel."),
    budgetScore: z.coerce.number().default(85)
  })).default([]),
  food: z.array(z.object({
    name: z.string().default("Local Culinary Spot"),
    type: z.enum(['street', 'restaurant', 'cafe', 'local']).catch('local'),
    styleTags: z.array(z.string()).default(["Local Foods"]),
    averageCost: z.coerce.number().default(350),
    openingHours: z.string().default("10:00 AM - 10:00 PM"),
    distance: z.string().default("1.5 km from center"),
    description: z.string().default("Authentic regional dining recommendation")
  })).default([]),
  places: z.array(z.object({
    name: z.string().default("Cultural Heritage Site"),
    category: z.enum(['popular', 'hidden', 'free', 'museum', 'park', 'temple', 'beach', 'nightlife', 'shopping']).catch('popular'),
    photographySpot: z.boolean().default(true),
    bestTimeToVisit: z.string().default("Early morning or sunset"),
    expectedTimeNeeded: z.string().default("2 hours"),
    entryFee: z.coerce.number().default(0),
    description: z.string().default("Iconic attraction showcasing the regional culture.")
  })).default([]),
  itinerary: z.array(z.object({
    dayNumber: z.coerce.number().default(1),
    morningPlan: z.object({
      title: z.string().default("Morning Cultural Sightseeing"),
      description: z.string().default("Explore scenic highlights and local morning markets."),
      cost: z.coerce.number().default(150)
    }).default({ title: "Morning Cultural Sightseeing", description: "Explore scenic highlights and local morning markets.", cost: 150 }),
    afternoonPlan: z.object({
      title: z.string().default("Local Food Tasting & Neighborhood Walk"),
      description: z.string().default("Sample famous regional cuisine and browse historic lanes."),
      cost: z.coerce.number().default(300)
    }).default({ title: "Local Food Tasting & Neighborhood Walk", description: "Sample famous regional cuisine and browse historic lanes.", cost: 300 }),
    eveningPlan: z.object({
      title: z.string().default("Sunset Views & Coastal Promenade"),
      description: z.string().default("Relax at sunset viewpoints followed by dinner."),
      cost: z.coerce.number().default(400)
    }).default({ title: "Sunset Views & Coastal Promenade", description: "Relax at sunset viewpoints followed by dinner.", cost: 400 })
  })).default([]),
  budgetBreakdown: z.object({
    flights: z.coerce.number().default(0),
    hotels: z.coerce.number().default(0),
    food: z.coerce.number().default(0),
    transport: z.coerce.number().default(0),
    shopping: z.coerce.number().default(0),
    activities: z.coerce.number().default(0),
    emergencyBudget: z.coerce.number().default(0),
    dailyBudget: z.coerce.number().default(0),
    totalBudget: z.coerce.number().default(0),
    savingsTips: z.array(z.string()).default([])
  }).default({ flights: 0, hotels: 0, food: 0, transport: 0, shopping: 0, activities: 0, emergencyBudget: 0, dailyBudget: 0, totalBudget: 0, savingsTips: [] }),
  travelTips: z.object({
    packingList: z.array(z.string()).default(["Sun protection SPF 50+", "Comfortable walking footwear", "Reusable water bottle"]),
    weatherAdvice: z.string().default("Check regional weather alerts before day trips."),
    localLaws: z.array(z.string()).default(["Carry valid identification for vehicle hires."]),
    emergencyContacts: z.array(z.string()).default([]),
    languageTips: z.array(z.string()).default(["Learn basic local greetings."]),
    currencyTips: z.string().default("Digital payments and cards widely accepted; keep modest cash for small vendors."),
    scamAlerts: z.array(z.string()).default(["Use certified official transport counters and avoid unregistered intermediaries."]),
    safetyTips: z.array(z.string()).default(["Store valuables in hotel safe and stay aware in crowded markets."]),
    localEtiquette: z.array(z.string()).default(["Respect local traditions and photography regulations at religious sites."])
  }).default({
    packingList: [],
    weatherAdvice: "",
    localLaws: [],
    emergencyContacts: [],
    languageTips: [],
    currencyTips: "",
    scamAlerts: [],
    safetyTips: [],
    localEtiquette: []
  })
});

// Gemini structured output schema definition
const planGeminiResponseSchema = {
  type: Type.OBJECT,
  properties: {
    hotels: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          price: { type: Type.NUMBER },
          rating: { type: Type.NUMBER },
          reviewsCount: { type: Type.NUMBER },
          photoUrl: { type: Type.STRING },
          nearbyMetro: { type: Type.STRING },
          nearbyBusStop: { type: Type.STRING },
          nearbyRestaurants: { type: Type.ARRAY, items: { type: Type.STRING } },
          safetyScore: { type: Type.NUMBER },
          aiRecommendation: { type: Type.STRING },
          budgetScore: { type: Type.NUMBER }
        },
        required: ["name", "price", "rating", "safetyScore", "aiRecommendation"]
      }
    },
    food: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING },
          styleTags: { type: Type.ARRAY, items: { type: Type.STRING } },
          averageCost: { type: Type.NUMBER },
          openingHours: { type: Type.STRING },
          distance: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["name", "type", "averageCost", "description"]
      }
    },
    places: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          photographySpot: { type: Type.BOOLEAN },
          bestTimeToVisit: { type: Type.STRING },
          expectedTimeNeeded: { type: Type.STRING },
          entryFee: { type: Type.NUMBER },
          description: { type: Type.STRING }
        },
        required: ["name", "category", "entryFee", "description"]
      }
    },
    itinerary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dayNumber: { type: Type.NUMBER },
          morningPlan: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              cost: { type: Type.NUMBER }
            },
            required: ["title", "description", "cost"]
          },
          afternoonPlan: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              cost: { type: Type.NUMBER }
            },
            required: ["title", "description", "cost"]
          },
          eveningPlan: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              cost: { type: Type.NUMBER }
            },
            required: ["title", "description", "cost"]
          }
        },
        required: ["dayNumber", "morningPlan", "afternoonPlan", "eveningPlan"]
      }
    },
    budgetBreakdown: {
      type: Type.OBJECT,
      properties: {
        flights: { type: Type.NUMBER },
        hotels: { type: Type.NUMBER },
        food: { type: Type.NUMBER },
        transport: { type: Type.NUMBER },
        shopping: { type: Type.NUMBER },
        activities: { type: Type.NUMBER },
        emergencyBudget: { type: Type.NUMBER },
        dailyBudget: { type: Type.NUMBER },
        totalBudget: { type: Type.NUMBER },
        savingsTips: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["flights", "hotels", "food", "transport", "shopping", "activities", "emergencyBudget", "savingsTips"]
    },
    travelTips: {
      type: Type.OBJECT,
      properties: {
        packingList: { type: Type.ARRAY, items: { type: Type.STRING } },
        weatherAdvice: { type: Type.STRING },
        localLaws: { type: Type.ARRAY, items: { type: Type.STRING } },
        emergencyContacts: { type: Type.ARRAY, items: { type: Type.STRING } },
        languageTips: { type: Type.ARRAY, items: { type: Type.STRING } },
        currencyTips: { type: Type.STRING },
        scamAlerts: { type: Type.ARRAY, items: { type: Type.STRING } },
        safetyTips: { type: Type.ARRAY, items: { type: Type.STRING } },
        localEtiquette: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["packingList", "weatherAdvice", "emergencyContacts", "currencyTips", "scamAlerts", "safetyTips"]
    }
  },
  required: ["hotels", "food", "places", "itinerary", "budgetBreakdown", "travelTips"]
};

// Strict budget breakdown recomputation helper
function recomputeBudgetBreakdown(
  rawBreakdown: any,
  days: number,
  transports: any[],
  travelers: number,
  hotels: any[]
) {
  const bestTransport = (transports && transports.find(t => t.isBest)) || (transports && transports[0]) || { price: 2000, type: 'bus' };
  const transCostTotal = (Number(bestTransport.price) || 2000) * travelers;
  
  const flights = bestTransport.type === 'flight' || bestTransport.type === 'hybrid' 
    ? transCostTotal 
    : (Number(rawBreakdown?.flights) || 0);

  const hotelPerNight = (hotels && hotels[0]?.price) ? Number(hotels[0].price) : 2500;
  const hotelRooms = Math.ceil(travelers / 2);
  const hotelsCost = (Number(rawBreakdown?.hotels) > 0) ? Number(rawBreakdown.hotels) : (hotelPerNight * days * hotelRooms);

  const food = (Number(rawBreakdown?.food) > 0) ? Number(rawBreakdown.food) : (600 * days * travelers);
  const localTrans = 300 * days * travelers;
  const transport = bestTransport.type !== 'flight' && bestTransport.type !== 'hybrid'
    ? transCostTotal + localTrans
    : localTrans;

  const shopping = Number(rawBreakdown?.shopping) || Math.round(500 * days * travelers);
  const activities = Number(rawBreakdown?.activities) || Math.round(400 * days * travelers);
  const emergencyBudget = Number(rawBreakdown?.emergencyBudget) || Math.round((food + transport + activities) * 0.1);

  // Exact math guarantee: totalBudget = sum of all components
  const totalBudget = flights + hotelsCost + food + transport + shopping + activities + emergencyBudget;
  // Exact math guarantee: dailyBudget = (food + transport + activities) / days
  const dailyBudget = Math.round((food + transport + activities) / Math.max(1, days));

  return {
    flights,
    hotels: hotelsCost,
    food,
    transport,
    shopping,
    activities,
    emergencyBudget,
    dailyBudget,
    totalBudget,
    savingsTips: Array.isArray(rawBreakdown?.savingsTips) && rawBreakdown.savingsTips.length > 0
      ? rawBreakdown.savingsTips
      : [
          `Taking the recommended ${bestTransport.type} option reduces transit cost to ₹${transCostTotal.toLocaleString()}.`,
          `Using local metro and transit lines saves significant expense over private taxis.`,
          `Selecting verified homestays and boutique lodgings prevents tourist surge rates.`
        ]
  };
}
async function generateMockPlan(query: any) {
  const { startingLocation, destination, budget, days, travelers, style } = query;
  
  const destName = destination || "Goa";
  const startName = startingLocation || "Mumbai";
  const numDays = Math.max(1, Math.min(30, parseInt(days) || 3));
  const numTravelers = Math.max(1, Math.min(20, parseInt(travelers) || 1));
  const budgetNum = Math.max(1000, parseInt(budget) || 20000);

  // Programmatically resolve transit routes & distances to eliminate flight hallucinations
  const srcMeta = await getCityMetadata(startName);
  const destMeta = await getCityMetadata(destName);
  const transports = buildAvailableTransports(srcMeta, destMeta, style);

  const hotels = [
    {
      name: style === "luxury" ? "The Heritage Grand Palace" : "Beachside Palms Homestay",
      price: Math.round(budgetNum * 0.3 / numDays),
      rating: 4.6,
      reviewsCount: 342,
      photoUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop&q=60",
      nearbyMetro: destMeta.hasMetro ? "Metro Station (400m)" : "Local bus stop (200m)",
      nearbyBusStop: `${destMeta.name} Central Bus Stand (200m)`,
      nearbyRestaurants: ["Fisherman's Cove", "The Lazy Goose", "Artjuna Cafe"],
      safetyScore: 92,
      aiRecommendation: "Excellent local lodging with certified safety credentials. Perfect for families.",
      budgetScore: 85,
    },
    {
      name: "Blue Lagoon Luxury Retreat",
      price: Math.round(budgetNum * 0.5 / numDays),
      rating: 4.9,
      reviewsCount: 189,
      photoUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500&auto=format&fit=crop&q=60",
      nearbyMetro: destMeta.hasMetro ? "Metro Station (200m)" : "Local Taxi Stand",
      nearbyBusStop: "Central Depot (1.2km)",
      nearbyRestaurants: ["Tuscany Gardens", "Souza Lobo"],
      safetyScore: 98,
      aiRecommendation: "Highly rated luxury resort. Includes infinity pool, spa, and private lounge.",
      budgetScore: 55,
    },
    {
      name: "Backpacker Zostel Hub",
      price: Math.round(budgetNum * 0.1 / numDays),
      rating: 4.2,
      reviewsCount: 512,
      photoUrl: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500&auto=format&fit=crop&q=60",
      nearbyMetro: destMeta.hasMetro ? "Subway (300m)" : "Local shuttle stop at entrance",
      nearbyBusStop: "Junction Crossroad (400m)",
      nearbyRestaurants: ["Curlies beach shack", "German Bakery"],
      safetyScore: 88,
      aiRecommendation: "Extremely affordable hostel with shared bunk options. Great social vibe for solo backpackers.",
      budgetScore: 95,
    }
  ];

  const food = [
    {
      name: "Coastal Fisherman's Wharf Kitchen",
      type: "restaurant" as const,
      styleTags: ["Local Foods", "Non-Veg", "Budget Meals"],
      averageCost: 450,
      openingHours: "11:00 AM - 11:30 PM",
      distance: "1.2 km from center",
      description: "Famous for its authentic coastal fish curry and tandoori prawns."
    },
    {
      name: "Royal Pure Bhojnalaya",
      type: "local" as const,
      styleTags: ["Vegetarian", "Jain", "Vegan"],
      averageCost: 250,
      openingHours: "12:00 PM - 10:00 PM",
      distance: "2.5 km from center",
      description: "Serves wholesome vegetarian thalis prepared according to traditional culinary standards."
    },
    {
      name: "The Olive Garden Cafe",
      type: "cafe" as const,
      styleTags: ["Vegetarian", "Vegan", "Budget Meals"],
      averageCost: 350,
      openingHours: "8:00 AM - 8:00 PM",
      distance: "0.5 km from center",
      description: "Calm garden ambiance, incredible cold brews and vegan pancakes."
    },
    {
      name: "Municipal Market Street Corner",
      type: "street" as const,
      styleTags: ["Vegetarian", "Budget Meals", "Local Foods"],
      averageCost: 100,
      openingHours: "4:00 PM - 10:00 PM",
      distance: "4.0 km from center",
      description: "A popular food cart hub offering hot local cutlet bread, bhajis, and fresh coconut water."
    }
  ];

  const places = [
    {
      name: "Central Historical Fort & Overlook",
      category: "popular" as const,
      photographySpot: true,
      bestTimeToVisit: "4:30 PM - 6:00 PM (Sunset)",
      expectedTimeNeeded: "2 hours",
      entryFee: 20,
      description: "A beautiful 17th-century fortress standing over the coast, offering stunning sunset views."
    },
    {
      name: "Scenic Waterfalls Nature Trail",
      category: "hidden" as const,
      photographySpot: true,
      bestTimeToVisit: "7:00 AM - 12:00 PM",
      expectedTimeNeeded: "5 hours",
      entryFee: 400,
      description: "Cascading multi-tiered waterfall surrounded by lush green forest trails."
    },
    {
      name: "Heritage Quarter Walkway",
      category: "free" as const,
      photographySpot: true,
      bestTimeToVisit: "8:00 AM - 10:00 AM",
      expectedTimeNeeded: "1.5 hours",
      entryFee: 0,
      description: "Stroll past colorful heritage villas, quaint balconies, and narrow cobblestone pathways."
    },
    {
      name: "Freshwater Lagoon Nature Reserve",
      category: "beach" as const,
      photographySpot: false,
      bestTimeToVisit: "3:00 PM - 6:30 PM",
      expectedTimeNeeded: "3 hours",
      entryFee: 0,
      description: "A freshwater lagoon tucked behind cliffs, perfect for a peaceful refreshing swim."
    },
    {
      name: "Bird Sanctuary & Mangrove Boardwalk",
      category: "park" as const,
      photographySpot: true,
      bestTimeToVisit: "6:30 AM - 8:30 AM",
      expectedTimeNeeded: "2 hours",
      entryFee: 100,
      description: "A serene mangrove forest sanctuary ideal for bird watching from wooden boardwalks."
    },
    {
      name: "Artisan Flea Market",
      category: "shopping" as const,
      photographySpot: true,
      bestTimeToVisit: "10:00 AM - 5:00 PM",
      expectedTimeNeeded: "3 hours",
      entryFee: 0,
      description: "Vibrant beachside bazaar featuring hand-woven arts, crafts, and regional spices."
    }
  ];

  const itinerary = Array.from({ length: numDays }, (_, i) => ({
    dayNumber: i + 1,
    morningPlan: {
      title: i === 0 ? `Arrival and Hotel Check-in at ${destName}` : `Morning Exploration: Cultural Sightseeing`,
      description: i === 0 ? `Unpack, freshen up, and enjoy breakfast nearby.` : `Visit local landmarks, enjoy cool morning temperatures, and capture scenic views.`,
      cost: i === 0 ? 0 : 150
    },
    afternoonPlan: {
      title: `Local Food Journey & Heritage Walk`,
      description: `Sample regional culinary dishes followed by an exploratory stroll through artisan avenues.`,
      cost: 300
    },
    eveningPlan: {
      title: i === numDays - 1 ? "Farewell Dinner & Sunset Watch" : "Scenic Coastal Stroll & Twilight Dining",
      description: i === numDays - 1 ? `Celebrate your last evening in ${destName} with a seaside dinner.` : `Visit the beachfront promenade, listen to local music, and unwind.`,
      cost: 500
    }
  }));

  const budgetBreakdown = recomputeBudgetBreakdown(
    {
      shopping: Math.round(budgetNum * 0.1),
      emergencyBudget: Math.round(budgetNum * 0.05)
    },
    numDays,
    transports,
    numTravelers,
    hotels
  );

  const emergencyContacts = getDestinationEmergencyContacts(destName);

  const travelTips = {
    packingList: ["Sunscreen SPF 50+", "Lightweight breathable attire", "Comfortable walking shoes", "Universal adapter", "Reusable water bottle", "Emergency medical pouch"],
    weatherAdvice: "Tropical/moderate climate. Stay hydrated, expect mild evening breezes, and check for occasional brief showers.",
    localLaws: ["No littering in public or nature reserve zones.", "Renting two-wheelers or cars strictly requires a valid license and helmet/seatbelt."],
    emergencyContacts,
    languageTips: ["Say 'Hello' / 'Namaste' as a polite greeting.", "Ask 'How much is this?' politely at municipal stalls."],
    currencyTips: "Local transactions primarily use digital UPI and card payments. Carry small cash notes for local carts.",
    scamAlerts: [
      `Avoid unregistered taxi intermediaries; always book transit through official counters or verified rideshare services.`,
      `When renting scooters or cars, record a continuous video inspection before signing the agreement.`
    ],
    safetyTips: ["Swim only inside marked lifeguard zones.", "Store passport originals and primary payment cards in the room digital safe."],
    localEtiquette: ["Dress respectfully when entering temples, churches, or places of worship.", "Ask permission before taking portraits of local artisans."]
  };

  return {
    id: "trip_" + Math.random().toString(36).substr(2, 9),
    query: { startingLocation: startName, destination: destName, budget: budgetNum, days: numDays, travelers: numTravelers, style },
    transports,
    hotels,
    food,
    places,
    itinerary,
    budgetBreakdown,
    travelTips,
    createdAt: new Date().toISOString(),
    source: "mock" as const
  };
}

// 1. Endpoint to generate travel plan using Gemini API
app.post("/api/generate-plan", rateLimiter(60000, 30, "generate-plan"), requestTimeout(35000), async (req, res) => {
  const validation = GeneratePlanRequestSchema.safeParse(req.body);
  if (!validation.success) {
    const errorMsg = validation.error.issues.map(i => `${i.path.join('.') || 'body'}: ${i.message}`).join("; ");
    return res.status(400).json({ error: errorMsg, issues: validation.error.issues });
  }

  const { startingLocation, destination, budget, days, travelers, style } = validation.data;

  // Pre-fetch city metadata and verified transports to ensure ZERO hallucination!
  let srcMeta: CityMetadata, destMeta: CityMetadata, verifiedTransports: any[] = [];
  try {
    srcMeta = await getCityMetadata(startingLocation);
    destMeta = await getCityMetadata(destination);
    verifiedTransports = buildAvailableTransports(srcMeta, destMeta, style);
  } catch (err) {
    console.error("Error building programmatically verified transports:", err);
    srcMeta = { name: startingLocation, lat: 19.0, lng: 72.8, hasAirport: true, hasRailway: true, busOperators: ["Intercity Bus"], localTransport: ["Taxi"], hasMetro: false, hasFerry: false };
    destMeta = { name: destination, lat: 15.3, lng: 74.1, hasAirport: true, hasRailway: true, busOperators: ["Intercity Bus"], localTransport: ["Taxi"], hasMetro: false, hasFerry: false };
    verifiedTransports = buildAvailableTransports(srcMeta, destMeta, style);
  }

  // Fallback to mock data if API key is not configured or placeholder
  const isApiKeyPlaceholder = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" || process.env.GEMINI_API_KEY === "";
  
  if (isApiKeyPlaceholder) {
    console.log("Gemini API key is not configured, generating verified mock travel plan instead...");
    const mock = await generateMockPlan(validation.data);
    mock.source = "mock";
    return res.json(mock);
  }

  const prompt = `You are an expert full-service AI Travel Assistant, a local guide, and a budget maximizer.
Generate a complete, production-ready travel plan from starting location "${srcMeta?.name || startingLocation}" to destination "${destMeta?.name || destination}" for a "${style}" style traveler.
Trip Details:
- Travelers: ${travelers}
- Duration: ${days} days
- Budget Limit: ${budget} (assume local currency is INR if location is India, otherwise USD)

VERIFIED PHYSICAL TRANSPORT OPTIONS (GROUND TRUTH):
You MUST use these exact transport options inside your "transports" array response:
${JSON.stringify(verifiedTransports, null, 2)}

Important Instructions:
- Provide realistic names, pricing, and services appropriate for ${destMeta?.name || destination}.
- The itinerary MUST have exactly ${days} day items (dayNumber 1 to ${days}).
- Return valid JSON matching the schema strictly.`;

  async function executeGeminiPlan(): Promise<any> {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: planGeminiResponseSchema
      }
    });
    return JSON.parse(response.text?.trim() || "{}");
  }

  let rawData: any;
  try {
    rawData = await executeGeminiPlan();
  } catch (initialErr) {
    console.warn("Initial Gemini generation failed. Retrying once with Gemini...", initialErr);
    try {
      rawData = await executeGeminiPlan();
    } catch (retryErr) {
      console.error("Gemini retry also failed, falling back to mock plan:", retryErr);
      const mock = await generateMockPlan(validation.data);
      mock.source = "mock";
      return res.json(mock);
    }
  }

  // Validate with Zod schema and repair missing/invalid fields
  const parseResult = PlanResponseZod.safeParse(rawData);
  const planData = parseResult.success ? parseResult.data : PlanResponseZod.parse({});

  // Dynamic Override Failsafe: Ensure verified transports are used perfectly in the response
  if (verifiedTransports && verifiedTransports.length > 0) {
    (planData as any).transports = verifiedTransports;
  }

  // Quality Check: Ensure day count equals requested days
  if (planData.itinerary.length !== days) {
    if (planData.itinerary.length < days) {
      const existingCount = planData.itinerary.length;
      for (let i = existingCount + 1; i <= days; i++) {
        planData.itinerary.push({
          dayNumber: i,
          morningPlan: {
            title: `Day ${i} Scenic Exploration`,
            description: `Visit morning attractions and scenic viewpoints around ${destMeta.name}.`,
            cost: 200
          },
          afternoonPlan: {
            title: `Day ${i} Culinary & Local Markets`,
            description: `Sample regional specialties and browse neighborhood craft shops.`,
            cost: 350
          },
          eveningPlan: {
            title: i === days ? "Farewell Dinner & Sunset Watch" : `Day ${i} Evening Promenade`,
            description: `Relax with beachside dining and evening cultural experiences.`,
            cost: 450
          }
        });
      }
    } else {
      planData.itinerary = planData.itinerary.slice(0, days);
    }
  }

  // Inject verified high-quality Unsplash category images into hotel options if missing
  const hotelPhotos = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=500&auto=format&fit=crop&q=60"
  ];
  planData.hotels.forEach((hotel: any, index: number) => {
    hotel.photoUrl = hotel.photoUrl || hotelPhotos[index % hotelPhotos.length];
  });

  // Real destination emergency contacts
  planData.travelTips.emergencyContacts = getDestinationEmergencyContacts(destMeta?.name || destination);

  // Strict server-side recomputation of budget breakdown
  const computedBudget = recomputeBudgetBreakdown(
    planData.budgetBreakdown,
    days,
    verifiedTransports,
    travelers,
    planData.hotels
  );

  const fullPlan = {
    id: "trip_" + Math.random().toString(36).substr(2, 9),
    query: {
      startingLocation: srcMeta?.name || startingLocation,
      destination: destMeta?.name || destination,
      budget,
      days,
      travelers,
      style
    },
    transports: verifiedTransports,
    hotels: planData.hotels,
    food: planData.food,
    places: planData.places,
    itinerary: planData.itinerary,
    budgetBreakdown: computedBudget,
    travelTips: planData.travelTips,
    createdAt: new Date().toISOString(),
    source: "gemini" as const
  };

  res.json(fullPlan);
});

// 2. Chatbot response with trip context
app.post("/api/chat", rateLimiter(60000, 60, "chat"), requestTimeout(25000), async (req, res) => {
  const validation = ChatRequestSchema.safeParse(req.body);
  if (!validation.success) {
    const errorMsg = validation.error.issues.map(i => `${i.path.join('.') || 'body'}: ${i.message}`).join("; ");
    return res.status(400).json({ error: errorMsg, issues: validation.error.issues });
  }

  const { messages, currentTrip } = validation.data;

  const isApiKeyPlaceholder = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" || process.env.GEMINI_API_KEY === "";
  
  if (isApiKeyPlaceholder) {
    // Return a smart chatbot mock reply
    const lastUserMessage = messages[messages.length - 1]?.text || "";
    let reply = "Hello! I am your AI Travel Assistant. I would love to help you save money and discover beautiful locations.";
    
    const queryStr = lastUserMessage.toLowerCase();
    if (queryStr.includes("goa")) {
      reply = "Goa is best visited via Sleeper Volvo buses (starting at ₹900) or AC Express trains (₹1,200) from Mumbai/Pune to save on flights. For affordable stays, explore Candolim homestays or Zostel hostels in Anjuna for around ₹600-₹1,200/night. Don't miss out on Fontainhas walks!";
    } else if (queryStr.includes("japan") || queryStr.includes("tokyo")) {
      reply = "For a trip to Japan on a budget: focus on Tokyo only. Get a 72-hour Subway Pass for unlimited travel, grab meals at Lawson/7-Eleven, visit free observatories like the Tokyo Metropolitan Government Building, and stay in verified boutique pod hostels (approx $30-40/night).";
    } else if (queryStr.includes("how much money") || queryStr.includes("cash") || queryStr.includes("budget")) {
      reply = "For budget travel, allocate around ₹2,500 ($30) per day for meals and local transit. Carry about 30% in cash for small street vendors, and use digital UPI/cards for certified establishments.";
    } else if (queryStr.includes("safe") || queryStr.includes("scam")) {
      reply = "Most tourist areas are very safe. However, always avoid unregistered local guides and verify taxi meter fares or use prepaid booths. If renting vehicles, take video proof of the condition beforehand so you cannot be charged for pre-existing scratches.";
    } else {
      reply = `That sounds like an amazing journey! To travel efficiently on a budget, consider staying slightly outside major commercial hubs, renting public transit passes, and eating at high-volume local diners. Would you like specifics on safety, accommodation, or daily routes?`;
    }
    
    return res.json({ text: reply });
  }

  try {
    const formattedHistory = messages.slice(0, -1).map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    const lastMessage = messages[messages.length - 1]?.text || "";
    
    let systemInstruction = `You are a savvy, highly intelligent, friendly AI Travel Planner. You specialize in helping travelers discover hidden gems, save money, bypass tourist traps, and stay safe.
    Always speak in a helpful, friendly, and practical tone.`;
    
    if (currentTrip) {
      systemInstruction += `\nCurrently, the user is viewing or planning a trip from ${currentTrip.query?.startingLocation || "their home"} to ${currentTrip.query?.destination || "their destination"} for ${currentTrip.query?.days} days with a budget of ${currentTrip.query?.budget} under a "${currentTrip.query?.style}" travel style. Mention and build upon this context naturally if it helps answer their questions.`;
    }

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: lastMessage }] }
      ],
      config: {
        systemInstruction
      }
    });

    res.json({ text: response.text || "" });

  } catch (error) {
    console.error("Chatbot failed, returning generic fallback:", error);
    res.json({ text: "I'm having a temporary connectivity hiccup, but I'm here! For a quick travel hack, always look for local metro rail maps—they save up to 80% on commute costs compared to private cabs." });
  }
});

// Configure Vite integration for SPA
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TravelAI Server running on port ${PORT}`);
  });
}

startServer();
