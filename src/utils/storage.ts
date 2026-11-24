import { z } from "zod";
import {
  TravelPlan,
  BookingItem,
  WalletTransaction,
  CommunityPost,
} from "../types";

// User Schema
const UserSchema = z.object({
  name: z.string().default("Explorer"),
  email: z.string().default(""),
  avatar: z.string().default("EX"),
  role: z.string().default("Explorer"),
  level: z.string().default("Level 1"),
  provider: z.string().optional(),
  isGuest: z.boolean().optional(),
});

// Generic safe storage reader with optional validator
export function safeReadStorage<T>(
  key: string,
  fallback: T,
  validator?: (data: unknown) => { success: boolean; data?: T }
): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined || raw === "") {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    if (validator) {
      const result = validator(parsed);
      return result.success && result.data !== undefined ? result.data : fallback;
    }
    return (parsed as T) ?? fallback;
  } catch (err) {
    console.warn(`[safeReadStorage] Corrupted storage for key "${key}", using fallback:`, err);
    return fallback;
  }
}

// Safe storage writer
export function safeWriteStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[safeWriteStorage] Failed to save key "${key}":`, err);
  }
}

// Specific safe loaders with runtime validation
export function loadSafeUser(fallback: any = null) {
  return safeReadStorage("travelai_user", fallback, (val) => {
    const res = UserSchema.safeParse(val);
    return { success: res.success, data: res.success ? res.data : fallback };
  });
}

export function loadSafeNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const num = Number(raw);
    return Number.isFinite(num) ? num : fallback;
  } catch {
    return fallback;
  }
}

export function loadSafeBoolean(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === "true";
  } catch {
    return fallback;
  }
}

export function loadSafeSavedTrips(fallback: TravelPlan[] = []): TravelPlan[] {
  return safeReadStorage("travelai_saved_trips", fallback, (val) => {
    if (!Array.isArray(val)) return { success: false };
    const validTrips = val.filter((t) => t && typeof t === "object" && t.id && t.query);
    return { success: true, data: validTrips as TravelPlan[] };
  });
}

export function loadSafeActiveTrip(fallback: TravelPlan | null = null): TravelPlan | null {
  return safeReadStorage("travelai_active_trip", fallback, (val) => {
    if (!val || typeof val !== "object" || !(val as any).id || !(val as any).query) {
      return { success: false };
    }
    return { success: true, data: val as TravelPlan };
  });
}

export function loadSafeBookings(fallback: BookingItem[] = []): BookingItem[] {
  return safeReadStorage("travelai_bookings", fallback, (val) => {
    if (!Array.isArray(val)) return { success: false };
    const valid = val.filter((b) => b && typeof b === "object" && b.id && b.name);
    return { success: true, data: valid as BookingItem[] };
  });
}

export function loadSafeTransactions(fallback: WalletTransaction[] = []): WalletTransaction[] {
  return safeReadStorage("travelai_wallet_transactions", fallback, (val) => {
    if (!Array.isArray(val)) return { success: false };
    const valid = val.filter((t) => t && typeof t === "object" && t.id && typeof t.amount === "number");
    return { success: true, data: valid as WalletTransaction[] };
  });
}

export function loadSafeCommunityPosts(fallback: CommunityPost[] = []): CommunityPost[] {
  return safeReadStorage("travelai_community_posts", fallback, (val) => {
    if (!Array.isArray(val)) return { success: false };
    const valid = val.filter((p) => p && typeof p === "object" && p.id && p.destination);
    return { success: true, data: valid as CommunityPost[] };
  });
}

export function loadSafeWishlist(fallback: string[] = []): string[] {
  return safeReadStorage("travelai_wishlist", fallback, (val) => {
    if (!Array.isArray(val)) return { success: false };
    return { success: true, data: val.filter((s) => typeof s === "string") };
  });
}

export function loadSafeJournal(
  fallback: { id: string; title: string; date: string; content: string; image?: string }[] = []
) {
  return safeReadStorage("travelai_journal", fallback, (val) => {
    if (!Array.isArray(val)) return { success: false };
    return {
      success: true,
      data: val.filter((j) => j && typeof j === "object" && j.id && j.title),
    };
  });
}
