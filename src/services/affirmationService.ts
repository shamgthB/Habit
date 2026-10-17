import { getTodayDateString } from '../utils/dateUtils';

export interface Affirmation {
  quote: string;
  author: string;
  theme: string;
  reflectionPrompt?: string;
  date?: string;
  isAiGenerated?: boolean;
  model?: string;
  moraleGoal?: string;
  userName?: string;
}

export interface AffirmationRequestOptions {
  category?: string;
  mood?: string;
  userName?: string;
  streak?: number;
  topHabits?: string[];
  moraleGoal?: string;
  timeOfDay?: string;
  forceRefresh?: boolean;
}

export const MORALE_VIBES = [
  { id: 'morning_momentum', label: 'Morning Momentum', emoji: '🌅', desc: 'Kickstart morning action with enthusiasm' },
  { id: 'beat_resistance', label: 'Beat Resistance', emoji: '⚡', desc: 'Break through hesitation and start effortlessly' },
  { id: 'calm_presence', label: 'Calm & Presence', emoji: '🧘', desc: 'Ground the mind with serene mindfulness' },
  { id: 'deep_focus', label: 'Deep Focus', emoji: '🎯', desc: 'Sharpen clarity and eliminate distractions' },
  { id: 'resilience_grit', label: 'Grit & Courage', emoji: '🛡️', desc: 'Strengthen inner fortitude to conquer hard things' },
  { id: 'gratitude_joy', label: 'Gratitude & Joy', emoji: '💖', desc: 'Celebrate small wins and radiate positivity' },
] as const;

export type MoraleVibe = typeof MORALE_VIBES[number];

const STORAGE_KEY_PREFIX = 'aura_affirmation_';
const FAVORITES_KEY = 'aura_favorite_affirmations';

export const AFFIRMATION_CATEGORIES = [
  'Consistency & Habits',
  'Mindfulness & Peace',
  'Focus & Deep Work',
  'Resilience & Grit',
  'Health & Vitality',
  'Confidence & Gratitude',
] as const;

export type AffirmationCategory = typeof AFFIRMATION_CATEGORIES[number];

const FALLBACK_BANK: Affirmation[] = [
  {
    quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Will Durant",
    theme: "Consistency",
    reflectionPrompt: "What single habit will you protect above all else today?",
  },
  {
    quote: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma",
    theme: "Growth",
    reflectionPrompt: "What 1% improvement can you make before the day ends?",
  },
  {
    quote: "You do not rise to the level of your goals. You fall to the level of your systems.",
    author: "James Clear",
    theme: "Systems",
    reflectionPrompt: "Is your daily routine setting you up for frictionless action?",
  },
  {
    quote: "Action is the foundational key to all success.",
    author: "Pablo Picasso",
    theme: "Action",
    reflectionPrompt: "What task have you delayed that you can start in 2 minutes?",
  },
  {
    quote: "Almost everything will work again if you unplug it for a few minutes, including you.",
    author: "Anne Lamott",
    theme: "Mindfulness",
    reflectionPrompt: "When will you give your mind a quiet 5-minute pause today?",
  },
  {
    quote: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius",
    theme: "Resilience",
    reflectionPrompt: "How can you honor steady progress today rather than perfection?",
  },
  {
    quote: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
    theme: "Momentum",
    reflectionPrompt: "What momentum builder can you check off first this morning?",
  },
];

/**
 * Fetch or retrieve cached daily affirmation
 */
export async function getDailyAffirmation(
  options?: AffirmationRequestOptions
): Promise<Affirmation> {
  const today = getTodayDateString();
  const cacheKey = `${STORAGE_KEY_PREFIX}${today}`;

  // If not forced refresh, check localStorage for today's affirmation
  if (!options?.forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as Affirmation;
        return parsed;
      }
    } catch {
      // Ignore cache errors
    }
  }

  // Attempt to fetch from Gemini-powered backend API endpoint
  try {
    const res = await fetch('/api/affirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: options?.category || 'Consistency & Habits',
        mood: options?.mood || 'focused',
        userName: options?.userName || 'User',
        streak: options?.streak ?? 0,
        topHabits: options?.topHabits || [],
        moraleGoal: options?.moraleGoal || 'Morning Momentum',
        timeOfDay: options?.timeOfDay || 'morning',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.affirmation?.quote) {
        const result: Affirmation = {
          quote: data.affirmation.quote,
          author: data.affirmation.author || 'Aura Wisdom',
          theme: data.affirmation.theme || options?.category || 'Consistency',
          reflectionPrompt: data.affirmation.reflectionPrompt,
          date: today,
          isAiGenerated: data.isAiGenerated !== false,
          model: data.model || 'Gemini 3.8 Flash',
          moraleGoal: options?.moraleGoal,
          userName: options?.userName,
        };

        // Cache for today
        try {
          localStorage.setItem(cacheKey, JSON.stringify(result));
        } catch {
          // Ignore storage quotas
        }

        return result;
      }
    }
  } catch (err) {
    console.warn('Backend affirmation API request failed, falling back to curated bank:', err);
  }

  // Graceful fallback to rich local bank
  const dayIndex = new Date().getDate() % FALLBACK_BANK.length;
  const fallback = {
    ...FALLBACK_BANK[dayIndex],
    date: today,
    isAiGenerated: false,
  };

  try {
    localStorage.setItem(cacheKey, JSON.stringify(fallback));
  } catch {
    // Ignore storage quotas
  }

  return fallback;
}

export interface LikedAffirmation extends Affirmation {
  id: string;
  likedAt: string;
  notes?: string;
}

const LIKED_STORAGE_KEY = 'aura_liked_affirmations';

/**
 * Retrieve saved / liked affirmations from local storage
 */
export function getLikedAffirmations(): LikedAffirmation[] {
  try {
    const raw = localStorage.getItem(LIKED_STORAGE_KEY) || localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any, idx: number) => ({
      ...item,
      id: item.id || `liked-${idx}-${item.quote?.slice(0, 15).replace(/\s+/g, '-')}`,
      likedAt: item.likedAt || item.date || getTodayDateString(),
    }));
  } catch {
    return [];
  }
}

/**
 * Toggle liking / saving an affirmation in local storage
 */
export function toggleLikeAffirmation(affirmation: Affirmation): boolean {
  try {
    const current = getLikedAffirmations();
    const existingIndex = current.findIndex(
      (a) => a.quote.trim().toLowerCase() === affirmation.quote.trim().toLowerCase()
    );

    let updated: LikedAffirmation[];
    let isNowLiked = false;

    if (existingIndex >= 0) {
      updated = current.filter((_, idx) => idx !== existingIndex);
      isNowLiked = false;
    } else {
      const newLiked: LikedAffirmation = {
        ...affirmation,
        id: `liked-${Date.now()}`,
        likedAt: new Date().toISOString(),
      };
      updated = [newLiked, ...current];
      isNowLiked = true;
    }

    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));

    // Dispatch event for instant reactive updates across components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aura_liked_affirmations_updated', { detail: updated }));
    }

    return isNowLiked;
  } catch (err) {
    console.error('Error toggling liked affirmation in local storage:', err);
    return false;
  }
}

/**
 * Check if a quote is currently in the local storage liked list
 */
export function isAffirmationLiked(quote: string): boolean {
  if (!quote) return false;
  try {
    const current = getLikedAffirmations();
    return current.some(
      (a) => a.quote.trim().toLowerCase() === quote.trim().toLowerCase()
    );
  } catch {
    return false;
  }
}

/**
 * Remove an affirmation from the liked list by quote or ID
 */
export function removeLikedAffirmation(identifier: string): LikedAffirmation[] {
  try {
    const current = getLikedAffirmations();
    const updated = current.filter(
      (a) => a.id !== identifier && a.quote.trim().toLowerCase() !== identifier.trim().toLowerCase()
    );
    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aura_liked_affirmations_updated', { detail: updated }));
    }
    return updated;
  } catch (err) {
    console.error('Error removing liked affirmation from local storage:', err);
    return getLikedAffirmations();
  }
}

/**
 * Backwards compatibility aliases
 */
export const getSavedAffirmations = getLikedAffirmations;
export const toggleSaveAffirmation = toggleLikeAffirmation;
export const isAffirmationSaved = isAffirmationLiked;
