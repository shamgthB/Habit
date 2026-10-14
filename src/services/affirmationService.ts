import { getTodayDateString } from '../utils/dateUtils';

export interface Affirmation {
  quote: string;
  author: string;
  theme: string;
  reflectionPrompt?: string;
  date?: string;
  isAiGenerated?: boolean;
  model?: string;
}

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
export async function getDailyAffirmation(options?: {
  category?: string;
  mood?: string;
  forceRefresh?: boolean;
}): Promise<Affirmation> {
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

/**
 * Retrieve saved favorite affirmations
 */
export function getSavedAffirmations(): Affirmation[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Toggle saving an affirmation to favorites
 */
export function toggleSaveAffirmation(affirmation: Affirmation): boolean {
  try {
    const list = getSavedAffirmations();
    const exists = list.some((a) => a.quote === affirmation.quote);
    let updated: Affirmation[];
    if (exists) {
      updated = list.filter((a) => a.quote !== affirmation.quote);
    } else {
      updated = [affirmation, ...list];
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return !exists;
  } catch {
    return false;
  }
}

/**
 * Check if quote is saved
 */
export function isAffirmationSaved(quote: string): boolean {
  try {
    const list = getSavedAffirmations();
    return list.some((a) => a.quote === quote);
  } catch {
    return false;
  }
}
