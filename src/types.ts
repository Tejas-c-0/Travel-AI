export interface TripQuery {
  startingLocation: string;
  destination: string;
  budget: number; // in local currency (e.g., INR or USD)
  days: number;
  travelers: number;
  style: 'budget' | 'family' | 'luxury' | 'backpacker' | 'solo' | 'business';
}

export interface TransportOption {
  type: 'flight' | 'train' | 'bus' | 'cab' | 'hybrid' | 'selfdrive' | 'local';
  provider: string;
  price: number;
  travelTime: string;
  comfortRating: number; // 1-5 stars
  luggageInfo: string;
  refundPolicy: string;
  isBest?: boolean;
  isCheapest?: boolean;
  isFastest?: boolean;
  distanceKm?: number;
  comfortScore?: number;
  safetyScore?: number;
  trafficImpact?: string;
  weatherImpact?: string;
  carbonEmissions?: string;
  aiRecommendation?: string;
  details?: string;
}

export interface HotelOption {
  name: string;
  price: number; // per night
  rating: number; // e.g., 4.5
  reviewsCount: number;
  photoUrl: string;
  nearbyMetro: string;
  nearbyBusStop: string;
  nearbyRestaurants: string[];
  safetyScore: number; // 1-100
  aiRecommendation: string;
  budgetScore: number; // 1-100
  reviews?: { author: string; rating: number; text: string; date: string }[];
}

export interface FoodOption {
  name: string;
  type: 'street' | 'restaurant' | 'cafe' | 'local';
  styleTags: string[]; // ['Vegetarian', 'Vegan', 'Halal', 'Jain', 'Budget Meals']
  averageCost: number; // per meal
  openingHours: string;
  distance: string; // distance from center
  description: string;
}

export interface PlaceToVisit {
  name: string;
  category: 'popular' | 'hidden' | 'free' | 'museum' | 'park' | 'temple' | 'beach' | 'nightlife' | 'shopping';
  photographySpot: boolean;
  bestTimeToVisit: string;
  expectedTimeNeeded: string;
  entryFee: number;
  description: string;
}

export interface ItinerarySlot {
  title: string;
  description: string;
  cost: number;
}

export interface ItineraryDay {
  dayNumber: number;
  morningPlan: ItinerarySlot;
  afternoonPlan: ItinerarySlot;
  eveningPlan: ItinerarySlot;
}

export interface BudgetBreakdown {
  flights: number;
  hotels: number;
  food: number;
  transport: number;
  shopping: number;
  activities: number;
  emergencyBudget: number;
  dailyBudget: number;
  totalBudget: number;
  savingsTips: string[];
}

export interface TravelTips {
  packingList: string[];
  weatherAdvice: string;
  localLaws: string[];
  emergencyContacts: string[];
  languageTips: string[];
  currencyTips: string;
  scamAlerts: string[];
  safetyTips: string[];
  localEtiquette: string[];
}

export interface TravelPlan {
  id: string;
  query: TripQuery;
  transports: TransportOption[];
  hotels: HotelOption[];
  food: FoodOption[];
  places: PlaceToVisit[];
  itinerary: ItineraryDay[];
  budgetBreakdown: BudgetBreakdown;
  travelTips: TravelTips;
  createdAt: string;
  source?: "gemini" | "mock";
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  destination: string;
  rating: number;
  tips: string;
  story: string;
  itinerarySummary?: string;
  days?: number;
  estimatedBudget?: string;
  likes: number;
  hasLiked?: boolean;
  comments: { author: string; text: string; time: string }[];
  createdAt: string;
}

export interface PriceTrackItem {
  id: string;
  type: 'flight' | 'hotel' | 'bus';
  title: string; // e.g. "Delhi (DEL) to Goa (GOI)"
  originalPrice: number;
  currentPrice: number;
  history: { date: string; price: number }[];
  notifyOnDrop: boolean;
  status: 'stable' | 'down' | 'up';
}

export interface BookingItem {
  id: string;
  name: string;
  type: 'flight' | 'hotel' | 'train' | 'bus' | 'food' | 'insurance' | 'activity';
  price: number;
  provider: string;
  date: string;
  pax: number;
  pnr: string;
  status: 'Confirmed' | 'Cancelled';
  paidWithWallet: number;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  title: string;
  type: 'debit' | 'credit' | 'cashback';
  amount: number;
  date: string;
  reference?: string;
}
