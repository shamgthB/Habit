import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { app, auth, db } from './authService';
import { DailyJournalEntry, EmotionTag } from '../types';

export { db };

const LOCAL_STORAGE_JOURNAL_KEY = 'aurahabit_daily_journal_v1';

// Emotional tags configuration with colors, emojis, and styling
export const EMOTION_TAG_CONFIG: Record<
  EmotionTag,
  {
    label: string;
    emoji: string;
    badgeBg: string;
    badgeText: string;
    border: string;
    accent: string;
  }
> = {
  grateful: {
    label: 'Grateful',
    emoji: '🙏',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    accent: '#10b981',
  },
  calm: {
    label: 'Peaceful',
    emoji: '🌿',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/40',
    badgeText: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
    accent: '#14b8a6',
  },
  inspired: {
    label: 'Inspired',
    emoji: '✨',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    accent: '#f59e0b',
  },
  energized: {
    label: 'Energized',
    emoji: '⚡',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/40',
    badgeText: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
    accent: '#f97316',
  },
  thoughtful: {
    label: 'Reflective',
    emoji: '💭',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    accent: '#6366f1',
  },
  victorious: {
    label: 'Victorious',
    emoji: '🏆',
    badgeBg: 'bg-yellow-50 dark:bg-yellow-950/40',
    badgeText: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
    accent: '#eab308',
  },
  anxious: {
    label: 'Overwhelmed',
    emoji: '🌪️',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    accent: '#f43f5e',
  },
  exhausted: {
    label: 'Drained',
    emoji: '🌙',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-600 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    accent: '#64748b',
  },
};

// Local storage backup helpers
export const getLocalJournalEntries = (): DailyJournalEntry[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_JOURNAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalJournalEntries = (entries: DailyJournalEntry[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_JOURNAL_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Could not save journal to localStorage:', err);
  }
};

/**
 * Saves or updates a journal entry to Firebase Firestore with localStorage fallback.
 */
export const saveJournalEntry = async (
  entry: Omit<DailyJournalEntry, 'id' | 'createdAt'> & { id?: string }
): Promise<DailyJournalEntry> => {
  const currentUser = auth.currentUser;
  const now = Date.now();
  const id = entry.id || `journal-${now}-${Math.random().toString(36).substring(2, 7)}`;

  const fullEntry: DailyJournalEntry = {
    id,
    userId: currentUser?.uid || 'guest-user',
    userEmail: currentUser?.email || undefined,
    date: entry.date,
    time: entry.time,
    content: entry.content.trim(),
    emotion: entry.emotion,
    title: entry.title?.trim() || undefined,
    tags: entry.tags || [],
    createdAt: now,
    updatedAt: now,
  };

  // 1. Immediately cache locally for offline/instant UI responsiveness
  const existingLocal = getLocalJournalEntries();
  const updatedLocal = [fullEntry, ...existingLocal.filter((e) => e.id !== id)];
  saveLocalJournalEntries(updatedLocal);

  // 2. Persist to Firestore if user is authenticated or guest collection
  try {
    const targetUserId = currentUser?.uid || 'guest';
    const entryDocRef = doc(db, 'users', targetUserId, 'journalEntries', id);
    await setDoc(entryDocRef, fullEntry, { merge: true });
    console.log(`[Firestore] Journal entry ${id} saved successfully to Firestore`);
  } catch (firestoreError) {
    console.warn('[Firestore] Notice: Firestore write failed, cached locally:', firestoreError);
    // Keep local entry as fallback so user never loses their thoughts
  }

  return fullEntry;
};

/**
 * Loads recent journal entries from Firebase Firestore (falls back to localStorage).
 */
export const loadJournalEntries = async (): Promise<DailyJournalEntry[]> => {
  const currentUser = auth.currentUser;
  const localEntries = getLocalJournalEntries();

  if (!currentUser) {
    return localEntries;
  }

  try {
    const targetUserId = currentUser.uid;
    const entriesColRef = collection(db, 'users', targetUserId, 'journalEntries');
    const q = query(entriesColRef, orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const remoteEntries: DailyJournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as DailyJournalEntry;
        remoteEntries.push({ ...data, id: docSnap.id });
      });

      // Merge remote with any un-synced local entries
      const mergedMap = new Map<string, DailyJournalEntry>();
      localEntries.forEach((e) => mergedMap.set(e.id, e));
      remoteEntries.forEach((e) => mergedMap.set(e.id, e));

      const merged = Array.from(mergedMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      saveLocalJournalEntries(merged);
      return merged;
    }
  } catch (error) {
    console.warn('[Firestore] Could not load entries from Firestore, using local cache:', error);
  }

  return localEntries;
};

/**
 * Deletes a journal entry from Firestore and localStorage.
 */
export const deleteJournalEntry = async (entryId: string): Promise<void> => {
  // Remove locally
  const remaining = getLocalJournalEntries().filter((e) => e.id !== entryId);
  saveLocalJournalEntries(remaining);

  // Remove from Firestore
  try {
    const currentUser = auth.currentUser;
    const targetUserId = currentUser?.uid || 'guest';
    const entryDocRef = doc(db, 'users', targetUserId, 'journalEntries', entryId);
    await deleteDoc(entryDocRef);
  } catch (err) {
    console.warn('[Firestore] Failed to delete entry from Firestore:', err);
  }
};
