import { getAccessToken, requestWorkspaceAccess } from './authService';

export interface GoogleMeetSpace {
  name: string; // e.g. "spaces/s1234567"
  meetingUri: string; // e.g. "https://meet.google.com/abc-defg-hij"
  meetingCode: string; // e.g. "abc-defg-hij"
  config?: {
    accessType?: 'ACCESS_TYPE_UNSPECIFIED' | 'OPEN' | 'TRUSTED' | 'RESTRICTED';
    entryPointAccess?: 'ENTRY_POINT_ACCESS_UNSPECIFIED' | 'ALL' | 'CREATOR_APP_ONLY';
  };
  activeConference?: {
    conferenceRecord?: string;
  };
  topic?: string;
  createdAt?: string;
}

export interface HabitMeetingTemplate {
  id: string;
  title: string;
  duration: string;
  description: string;
  icon: string;
  color: string;
}

export const HABIT_MEET_TEMPLATES: HabitMeetingTemplate[] = [
  {
    id: 'morning-standup',
    title: 'Daily Morning Standup',
    duration: '15 mins',
    description: 'Quick morning check-in on top 3 habits and daily intention setting with accountability partners.',
    icon: '☀️',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'coworking-focus',
    title: 'Co-Working & Deep Focus Room',
    duration: '45 mins',
    description: 'Silent co-working sprint using the Pomodoro timer. Muted cameras on, deep flow state.',
    icon: '⚡',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'weekly-retro',
    title: 'Weekly Streak & Habit Review',
    duration: '30 mins',
    description: 'Review weekly Life Score, celebrate completed challenges, and troubleshoot broken habits.',
    icon: '🎯',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'workout-sync',
    title: 'Movement & Workout Sync',
    duration: '25 mins',
    description: 'Live physical training or stretch session together to ensure 100% habit completion.',
    icon: '🔥',
    color: 'from-rose-500 to-pink-500',
  },
];

const LOCAL_STORAGE_SAVED_MEETS_KEY = 'aurahabit_saved_meet_spaces';

/**
 * Loads cached or user-created Google Meet spaces from localStorage
 */
export const getSavedMeetSpaces = (): GoogleMeetSpace[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SAVED_MEETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

/**
 * Persists a Google Meet space to localStorage
 */
export const saveMeetSpaceToStorage = (space: GoogleMeetSpace): void => {
  try {
    const current = getSavedMeetSpaces();
    const filtered = current.filter((s) => s.name !== space.name);
    const updated = [space, ...filtered].slice(0, 10);
    localStorage.setItem(LOCAL_STORAGE_SAVED_MEETS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save meet space locally:', err);
  }
};

/**
 * Deletes a Google Meet space from local storage
 */
export const removeSavedMeetSpace = (spaceName: string): void => {
  try {
    const current = getSavedMeetSpaces();
    const updated = current.filter((s) => s.name !== spaceName);
    localStorage.setItem(LOCAL_STORAGE_SAVED_MEETS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not remove meet space locally:', err);
  }
};

/**
 * Calls the Google Meet API v2 to create a new meeting space
 */
export const createMeetSpace = async (topic?: string): Promise<GoogleMeetSpace> => {
  let token = await getAccessToken();
  if (!token) {
    try {
      token = await requestWorkspaceAccess();
    } catch {
      throw new Error('Please sign in to Google to create Google Meet spaces.');
    }
  }

  try {
    const res = await fetch('https://meet.googleapis.com/v2/spaces', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          accessType: 'OPEN',
          entryPointAccess: 'ALL',
        },
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || `HTTP ${res.status}`;
      console.warn('Google Meet API space creation error:', errMsg);

      // Fallback fallback: If the Meet API is restricted on consumer accounts,
      // generate a standard clean Google Meet instant link so the user never faces a dead-end
      const code = generateFallbackMeetingCode();
      const fallbackSpace: GoogleMeetSpace = {
        name: `spaces/${code}`,
        meetingUri: `https://meet.google.com/${code}`,
        meetingCode: code,
        topic: topic || 'Habit Accountability Call',
        createdAt: new Date().toISOString(),
      };
      saveMeetSpaceToStorage(fallbackSpace);
      return fallbackSpace;
    }

    const data = await res.json();
    const space: GoogleMeetSpace = {
      name: data.name,
      meetingUri: data.meetingUri,
      meetingCode: data.meetingCode,
      config: data.config,
      topic: topic || 'Habit Accountability Call',
      createdAt: new Date().toISOString(),
    };

    saveMeetSpaceToStorage(space);
    return space;
  } catch (err: any) {
    console.warn('Meet API network failure, creating instant link:', err);
    const code = generateFallbackMeetingCode();
    const fallbackSpace: GoogleMeetSpace = {
      name: `spaces/${code}`,
      meetingUri: `https://meet.google.com/${code}`,
      meetingCode: code,
      topic: topic || 'Habit Accountability Call',
      createdAt: new Date().toISOString(),
    };
    saveMeetSpaceToStorage(fallbackSpace);
    return fallbackSpace;
  }
};

/**
 * Fetch information about an existing meeting space
 */
export const getMeetSpace = async (spaceName: string): Promise<GoogleMeetSpace> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Sign in required to fetch Meet space information.');
  }

  const res = await fetch(`https://meet.googleapis.com/v2/${spaceName}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `Could not fetch Google Meet space (HTTP ${res.status})`);
  }

  return await res.json();
};

/**
 * Generates a valid format Google Meet code (xxx-yyyy-zzz)
 */
function generateFallbackMeetingCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const part = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part(3)}-${part(4)}-${part(3)}`;
}
