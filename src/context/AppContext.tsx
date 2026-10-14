import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Habit,
  HabitLog,
  Goal,
  Challenge,
  Achievement,
  Routine,
  DailyMoodEnergy,
  WellnessTrackers,
  FocusSession,
  UserProfile,
  AppSettings,
  LifeScoreBreakdown,
  AppReminder,
  HistoryItem,
  MoodType,
  HabitCategory,
  AiNotificationAlert,
  ScheduleRecommendation,
  NotificationTone,
  NotificationChannel,
} from '../types';
import {
  generateAiHabitNudge,
  optimizeScheduleWithAi,
  sendPushNotification,
  sendHabitAiAlertEmail,
  checkPushPermission,
  requestPushPermission,
  playNotificationSound,
} from '../services/notificationService';
import {
  AppData,
  loadAppData,
  saveAppData,
  getInitialData,
  exportJSON,
  importJSON,
  exportCSV,
  resetAppData,
} from '../services/storage';
import {
  calculateHabitStreak,
  calculateGlobalStreak,
  calculateLifeScore,
  getLevelForXp,
  isHabitScheduledForDate,
  HabitStreakResult,
} from '../utils/calculations';
import { getTodayDateString } from '../utils/dateUtils';
import {
  initAuth,
  googleSignIn,
  logout as authLogout,
  getAccessToken,
  requestWorkspaceAccess,
  parseAuthError,
  ParsedAuthError,
  getCachedAuthUser,
  isCachedAuthActive,
  syncUserProfileToFirestore,
} from '../services/authService';
import { createOrSyncHabitSheet } from '../services/sheetsService';
import { User } from 'firebase/auth';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AppContextType {
  // Navigation & View
  currentSection: string;
  setCurrentSection: (section: string) => void;
  selectedDate: string; // for Calendar and Dashboard inspection
  setSelectedDate: (date: string) => void;

  // Data
  data: AppData;
  habits: Habit[];
  logs: HabitLog[];
  goals: Goal[];
  challenges: Challenge[];
  achievements: Achievement[];
  routines: Routine[];
  moodLogs: DailyMoodEnergy[];
  wellnessLogs: WellnessTrackers[];
  focusSessions: FocusSession[];
  profile: UserProfile;
  settings: AppSettings;
  deletedHabits: { habit: Habit; deletedAt: string }[];
  reminders: AppReminder[];

  // Computed
  lifeScore: LifeScoreBreakdown;
  globalStreak: { currentStreak: number; bestStreak: number };
  todayScheduledHabits: Habit[];
  todayCompletedCount: number;
  todayCompletionRate: number;
  todayMood?: DailyMoodEnergy;
  todayWellness?: WellnessTrackers;
  historyItems: HistoryItem[];

  // Habit Actions
  addHabit: (habitData: Omit<Habit, 'id' | 'createdAt' | 'order'>) => void;
  updateHabit: (id: string, habitData: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  restoreHabit: (id: string) => void;
  togglePinHabit: (id: string) => void;
  toggleArchiveHabit: (id: string) => void;
  duplicateHabit: (id: string) => void;
  reorderHabits: (reordered: Habit[]) => void;

  // Habit Logging Actions
  toggleHabitCompletion: (habitId: string, date?: string) => void;
  updateHabitLogValue: (habitId: string, value: number, date?: string, notes?: string, mood?: MoodType) => void;
  skipHabitForDay: (habitId: string, date?: string) => void;

  // Goals & Challenges
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'completed' | 'currentCount'>) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  joinChallenge: (id: string) => void;
  updateChallengeProgress: (id: string, increment: number) => void;

  // Routines
  addRoutine: (routine: Omit<Routine, 'id'>) => void;
  updateRoutine: (id: string, routine: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  completeRoutineAction: (routineId: string) => void;

  // Mood & Wellness
  logMoodEnergy: (mood: MoodType, energy: number, note?: string, date?: string) => void;
  updateWellness: (wellness: Partial<WellnessTrackers>, date?: string) => void;

  // Focus Timer
  logFocusSession: (session: Omit<FocusSession, 'id' | 'completedAt'>) => void;

  // Gamification & User
  awardXp: (amount: number, reason: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Reminders
  addReminder: (reminder: Omit<AppReminder, 'id'>) => void;
  toggleReminderStatus: (id: string, status: 'upcoming' | 'completed' | 'missed') => void;

  // Import / Export / Backup
  exportDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;
  exportDataCSV: () => void;
  resetAllData: () => void;

  // Google Sheets & Authentication
  googleUser: User | null;
  isGoogleAuthenticated: boolean;
  isAuthLoading: boolean;
  isGuestMode: boolean;
  continueAsGuest: () => void;
  isSyncingSheets: boolean;
  syncWithGoogleSheets: (existingSheetId?: string) => Promise<string | undefined>;
  authError: ParsedAuthError | null;
  clearAuthError: () => void;
  handleGoogleLogin: (options?: unknown) => Promise<boolean>;
  handleGoogleLogout: () => Promise<void>;
  handleOtpAuthSuccess: (user: any) => void;

  // Templates
  applyHabitTemplate: (categoryName: string, habitTemplates: Omit<Habit, 'id' | 'createdAt' | 'order'>[]) => void;

  // Modals & UI Controls
  isAddHabitModalOpen: boolean;
  setIsAddHabitModalOpen: (open: boolean) => void;
  editingHabit: Habit | null;
  setEditingHabit: (habit: Habit | null) => void;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;
  isNotificationDrawerOpen: boolean;
  setIsNotificationDrawerOpen: (open: boolean) => void;
  isSheetsModalOpen: boolean;
  setIsSheetsModalOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  isTemplatesModalOpen: boolean;
  setIsTemplatesModalOpen: (open: boolean) => void;
  isWorkspaceModalOpen: boolean;
  setIsWorkspaceModalOpen: (open: boolean) => void;
  isAiNotificationModalOpen: boolean;
  setIsAiNotificationModalOpen: (open: boolean) => void;
  isProfileQrModalOpen: boolean;
  setIsProfileQrModalOpen: (open: boolean) => void;
  isQrScannerModalOpen: boolean;
  setIsQrScannerModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  // AI Notifications
  aiAlertHistory: AiNotificationAlert[];
  isAiGeneratingAlert: boolean;
  triggerHabitAlertNow: (habitId: string, channelOverride?: 'push' | 'email' | 'both') => Promise<AiNotificationAlert | null>;
  testPushNotification: () => Promise<boolean>;
  testEmailAlert: (targetEmail?: string) => Promise<boolean>;
  optimizeHabitSchedulesWithAi: () => Promise<ScheduleRecommendation[]>;
  clearAlertHistory: () => void;
  calculateHabitStreak: (habit: Habit, logs: HabitLog[], forDate?: string) => HabitStreakResult;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [currentSection, setCurrentSection] = useState<string>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // UI States
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(!data.settings.onboardingCompleted);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isAiNotificationModalOpen, setIsAiNotificationModalOpen] = useState(false);
  const [isProfileQrModalOpen, setIsProfileQrModalOpen] = useState(false);
  const [isQrScannerModalOpen, setIsQrScannerModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // AI Alert History & Generation State
  const [aiAlertHistory, setAiAlertHistory] = useState<AiNotificationAlert[]>(() => {
    try {
      const stored = localStorage.getItem('aurahabit_ai_alert_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isAiGeneratingAlert, setIsAiGeneratingAlert] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('aurahabit_ai_alert_history', JSON.stringify(aiAlertHistory));
    } catch {}
  }, [aiAlertHistory]);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Google Auth with local session persistence
  const [googleUser, setGoogleUser] = useState<User | null>(() => {
    const cached = getCachedAuthUser();
    return cached as any;
  });
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState<boolean>(() => isCachedAuthActive());
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('aurahabit_guest_mode') === 'true' ||
        sessionStorage.getItem('aurahabit_guest_mode') === 'true'
      );
    } catch {
      return false;
    }
  });
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [authError, setAuthError] = useState<ParsedAuthError | null>(null);
  const clearAuthError = useCallback(() => setAuthError(null), []);

  // Sync to localStorage
  useEffect(() => {
    saveAppData(data);
  }, [data]);

  // Handle Theme & Accent classes on <html>
  useEffect(() => {
    const root = document.documentElement;
    // Dark mode
    if (data.settings.themeMode === 'dark') {
      root.classList.add('dark');
    } else if (data.settings.themeMode === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [data.settings.themeMode, data.settings.accentColor]);

  // Setup Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth((user, _token) => {
      setIsAuthLoading(false);
      if (user) {
        setGoogleUser(user);
        setIsGoogleAuthenticated(true);
        // Dynamically capture user info from Google Account
        setData((prev) => {
          const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80';
          return {
            ...prev,
            profile: {
              ...prev.profile,
              name: prev.profile.name || user.displayName || user.email?.split('@')[0] || 'Habit Builder',
              username: prev.profile.username || `@${(user.email || 'user').split('@')[0]}`,
              avatar: user.photoURL || prev.profile.avatar || defaultAvatar,
              email: user.email || '',
            },
          };
        });
        syncUserProfileToFirestore(user);
      } else {
        setGoogleUser(null);
        setIsGoogleAuthenticated(false);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Award XP and check for Level Up
  const awardXp = useCallback(
    (amount: number, reason: string) => {
      setData((prev) => {
        const newXp = prev.profile.xp + amount;
        const currentLevelInfo = getLevelForXp(prev.profile.xp);
        const newLevelInfo = getLevelForXp(newXp);

        let leveledUp = false;
        if (newLevelInfo.level > currentLevelInfo.level) {
          leveledUp = true;
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {
            // ignore
          }
          addToast({
            type: 'success',
            title: `Level Up! Level ${newLevelInfo.level} — ${newLevelInfo.title}`,
            message: `Congratulations! You unlocked new consistency mastery!`,
            duration: 6000,
          });
        } else {
          addToast({
            type: 'info',
            title: `+${amount} XP`,
            message: reason,
            duration: 2500,
          });
        }

        return {
          ...prev,
          profile: {
            ...prev.profile,
            xp: newXp,
            level: newLevelInfo.level,
            levelTitle: newLevelInfo.title,
          },
        };
      });
    },
    [addToast]
  );

  // Check and unlock achievements
  const checkAchievements = useCallback(() => {
    setData((prev) => {
      const today = getTodayDateString();
      const completedLogs = prev.logs.filter((l) => l.completed);
      const activeHabits = prev.habits.filter((h) => !h.isArchived);

      let maxIndividualStreak = 0;
      activeHabits.forEach((h) => {
        const s = calculateHabitStreak(h, prev.logs, today);
        if (s.currentStreak > maxIndividualStreak) maxIndividualStreak = s.currentStreak;
      });

      const updatedAchievements = prev.achievements.map((ach) => {
        if (ach.unlockedAt) return ach; // already unlocked

        let newProgress = ach.progress;
        let shouldUnlock = false;

        if (ach.id === 'ach-1') {
          // First Step: 1 completion
          newProgress = Math.min(1, completedLogs.length);
          shouldUnlock = newProgress >= 1;
        } else if (ach.id === 'ach-2') {
          // First Week: 7 completions
          newProgress = Math.min(7, completedLogs.length);
          shouldUnlock = newProgress >= 7;
        } else if (ach.id === 'ach-3') {
          // 7-day streak
          newProgress = Math.min(7, maxIndividualStreak);
          shouldUnlock = maxIndividualStreak >= 7;
        } else if (ach.id === 'ach-4') {
          // 100 completions
          newProgress = Math.min(100, completedLogs.length);
          shouldUnlock = completedLogs.length >= 100;
        } else if (ach.id === 'ach-5') {
          // 30-day streak
          newProgress = Math.min(30, maxIndividualStreak);
          shouldUnlock = maxIndividualStreak >= 30;
        }

        if (shouldUnlock) {
          try {
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
          } catch {}
          addToast({
            type: 'success',
            title: `Achievement Unlocked: ${ach.title}!`,
            message: `Earned +${ach.xp} XP! ${ach.description}`,
            duration: 6000,
          });
          return {
            ...ach,
            progress: ach.maxProgress,
            unlockedAt: new Date().toISOString(),
          };
        }

        return { ...ach, progress: newProgress };
      });

      return {
        ...prev,
        achievements: updatedAchievements,
      };
    });
  }, [addToast]);

  // Habit operations
  const addHabit = useCallback(
    (habitData: Omit<Habit, 'id' | 'createdAt' | 'order'>) => {
      const id = `habit-${Date.now()}`;
      const newHabit: Habit = {
        ...habitData,
        id,
        order: data.habits.length + 1,
        createdAt: new Date().toISOString(),
        isArchived: false,
        isPinned: habitData.isPinned ?? false,
      };

      setData((prev) => ({
        ...prev,
        habits: [...prev.habits, newHabit],
      }));

      awardXp(25, `Created habit: ${newHabit.name}`);
      addToast({
        type: 'success',
        title: 'Habit Created',
        message: `"${newHabit.name}" is now ready to track!`,
      });
      setIsAddHabitModalOpen(false);
    },
    [data.habits.length, awardXp, addToast]
  );

  const updateHabit = useCallback(
    (id: string, habitData: Partial<Habit>) => {
      setData((prev) => ({
        ...prev,
        habits: prev.habits.map((h) => (h.id === id ? { ...h, ...habitData } : h)),
      }));
      addToast({
        type: 'info',
        title: 'Habit Updated',
        message: 'Changes saved successfully.',
      });
      setEditingHabit(null);
    },
    [addToast]
  );

  const deleteHabit = useCallback(
    (id: string) => {
      const target = data.habits.find((h) => h.id === id);
      if (!target) return;

      setData((prev) => ({
        ...prev,
        habits: prev.habits.filter((h) => h.id !== id),
        deletedHabits: [{ habit: target, deletedAt: new Date().toISOString() }, ...prev.deletedHabits.slice(0, 9)],
      }));

      addToast({
        type: 'warning',
        title: 'Habit Deleted',
        message: `"${target.name}" moved to recently deleted.`,
        action: {
          label: 'Undo',
          onClick: () => restoreHabit(id),
        },
      });
    },
    [data.habits, addToast]
  );

  const restoreHabit = useCallback(
    (id: string) => {
      const deletedEntry = data.deletedHabits.find((d) => d.habit.id === id);
      if (!deletedEntry) return;

      setData((prev) => ({
        ...prev,
        habits: [...prev.habits, deletedEntry.habit],
        deletedHabits: prev.deletedHabits.filter((d) => d.habit.id !== id),
      }));

      addToast({
        type: 'success',
        title: 'Habit Restored',
        message: `"${deletedEntry.habit.name}" has been restored.`,
      });
    },
    [data.deletedHabits, addToast]
  );

  const togglePinHabit = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === id ? { ...h, isPinned: !h.isPinned } : h)),
    }));
  }, []);

  const toggleArchiveHabit = useCallback(
    (id: string) => {
      setData((prev) => {
        const habit = prev.habits.find((h) => h.id === id);
        const newArchived = habit ? !habit.isArchived : false;
        return {
          ...prev,
          habits: prev.habits.map((h) => (h.id === id ? { ...h, isArchived: newArchived } : h)),
        };
      });
      addToast({
        type: 'info',
        title: 'Status Updated',
        message: 'Habit archive status toggled.',
      });
    },
    [addToast]
  );

  const duplicateHabit = useCallback(
    (id: string) => {
      const target = data.habits.find((h) => h.id === id);
      if (!target) return;

      const dupId = `habit-${Date.now()}`;
      const duplicated: Habit = {
        ...target,
        id: dupId,
        name: `${target.name} (Copy)`,
        order: data.habits.length + 1,
        createdAt: new Date().toISOString(),
      };

      setData((prev) => ({
        ...prev,
        habits: [...prev.habits, duplicated],
      }));

      addToast({
        type: 'success',
        title: 'Habit Duplicated',
        message: `Created copy of "${target.name}".`,
      });
    },
    [data.habits, addToast]
  );

  const reorderHabits = useCallback((reordered: Habit[]) => {
    setData((prev) => ({
      ...prev,
      habits: reordered.map((h, idx) => ({ ...h, order: idx + 1 })),
    }));
  }, []);

  // Habit completion actions
  const toggleHabitCompletion = useCallback(
    (habitId: string, targetDate?: string) => {
      const date = targetDate || getTodayDateString();
      const habit = data.habits.find((h) => h.id === habitId);
      if (!habit) return;

      const existingLog = data.logs.find((l) => l.habitId === habitId && l.date === date);
      const isCurrentlyCompleted = existingLog?.completed ?? false;
      const nextCompleted = !isCurrentlyCompleted;
      const nextValue = nextCompleted ? habit.targetValue : 0;

      setData((prev) => {
        let updatedLogs: HabitLog[];
        if (existingLog) {
          updatedLogs = prev.logs.map((l) =>
            l.habitId === habitId && l.date === date
              ? {
                  ...l,
                  completed: nextCompleted,
                  value: nextValue,
                  completedAt: nextCompleted ? new Date().toISOString() : undefined,
                }
              : l
          );
        } else {
          const newLog: HabitLog = {
            id: `log-${habitId}-${date}-${Date.now()}`,
            habitId,
            date,
            value: nextValue,
            targetValue: habit.targetValue,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
          updatedLogs = [...prev.logs, newLog];
        }

        // Auto-update goals linked to this habit
        const updatedGoals = prev.goals.map((g) => {
          if (g.relatedHabitIds.includes(habitId)) {
            const increment = nextCompleted ? 1 : -1;
            const newCount = Math.max(0, g.currentCount + increment);
            const isGoalDone = newCount >= g.targetCount;
            return {
              ...g,
              currentCount: newCount,
              completed: isGoalDone,
            };
          }
          return g;
        });

        return {
          ...prev,
          logs: updatedLogs,
          goals: updatedGoals,
        };
      });

      if (nextCompleted) {
        awardXp(15, `Completed: ${habit.name}`);
        checkAchievements();
      } else {
        addToast({
          type: 'info',
          title: 'Marked Incomplete',
          message: `Unchecked "${habit.name}".`,
          duration: 2000,
        });
      }
    },
    [data.habits, data.logs, awardXp, checkAchievements, addToast]
  );

  const updateHabitLogValue = useCallback(
    (habitId: string, value: number, targetDate?: string, notes?: string, mood?: MoodType) => {
      const date = targetDate || getTodayDateString();
      const habit = data.habits.find((h) => h.id === habitId);
      if (!habit) return;

      const isCompleted = value >= habit.targetValue;

      setData((prev) => {
        const existing = prev.logs.find((l) => l.habitId === habitId && l.date === date);
        let updatedLogs: HabitLog[];

        if (existing) {
          updatedLogs = prev.logs.map((l) =>
            l.habitId === habitId && l.date === date
              ? {
                  ...l,
                  value,
                  completed: isCompleted,
                  notes: notes !== undefined ? notes : l.notes,
                  mood: mood !== undefined ? mood : l.mood,
                  completedAt: isCompleted ? new Date().toISOString() : l.completedAt,
                }
              : l
          );
        } else {
          const newLog: HabitLog = {
            id: `log-${habitId}-${date}-${Date.now()}`,
            habitId,
            date,
            value,
            targetValue: habit.targetValue,
            completed: isCompleted,
            notes,
            mood,
            completedAt: isCompleted ? new Date().toISOString() : undefined,
          };
          updatedLogs = [...prev.logs, newLog];
        }

        return {
          ...prev,
          logs: updatedLogs,
        };
      });

      if (isCompleted) {
        awardXp(15, `Reached target on ${habit.name}`);
        checkAchievements();
      }
    },
    [data.habits, awardXp, checkAchievements]
  );

  const skipHabitForDay = useCallback(
    (habitId: string, targetDate?: string) => {
      const date = targetDate || getTodayDateString();
      const habit = data.habits.find((h) => h.id === habitId);
      if (!habit) return;

      setData((prev) => {
        const existing = prev.logs.find((l) => l.habitId === habitId && l.date === date);
        let updatedLogs: HabitLog[];

        if (existing) {
          updatedLogs = prev.logs.map((l) =>
            l.habitId === habitId && l.date === date
              ? { ...l, isSkipped: true, completed: false }
              : l
          );
        } else {
          const newLog: HabitLog = {
            id: `log-${habitId}-${date}-${Date.now()}`,
            habitId,
            date,
            value: 0,
            targetValue: habit.targetValue,
            completed: false,
            isSkipped: true,
          };
          updatedLogs = [...prev.logs, newLog];
        }

        return {
          ...prev,
          logs: updatedLogs,
        };
      });

      addToast({
        type: 'info',
        title: 'Habit Skipped',
        message: `Streak is protected for "${habit.name}" today.`,
      });
    },
    [data.habits, addToast]
  );

  // Goals
  const addGoal = useCallback(
    (goal: Omit<Goal, 'id' | 'createdAt' | 'completed' | 'currentCount'>) => {
      const newGoal: Goal = {
        ...goal,
        id: `goal-${Date.now()}`,
        currentCount: 0,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setData((prev) => ({
        ...prev,
        goals: [...prev.goals, newGoal],
      }));
      awardXp(30, `Added new goal: ${newGoal.title}`);
      addToast({
        type: 'success',
        title: 'Goal Created',
        message: `Target: ${newGoal.targetCount} check-ins.`,
      });
    },
    [awardXp, addToast]
  );

  const updateGoal = useCallback(
    (id: string, goal: Partial<Goal>) => {
      setData((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => (g.id === id ? { ...g, ...goal } : g)),
      }));
      addToast({
        type: 'info',
        title: 'Goal Updated',
      });
    },
    [addToast]
  );

  const deleteGoal = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        goals: prev.goals.filter((g) => g.id !== id),
      }));
      addToast({
        type: 'warning',
        title: 'Goal Removed',
      });
    },
    [addToast]
  );

  // Challenges
  const joinChallenge = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        challenges: prev.challenges.map((c) => (c.id === id ? { ...c, joined: true } : c)),
      }));
      awardXp(20, 'Joined new challenge!');
      addToast({
        type: 'success',
        title: 'Challenge Joined!',
        message: 'Push your daily limits to earn bonus badges & XP.',
      });
    },
    [awardXp, addToast]
  );

  const updateChallengeProgress = useCallback(
    (id: string, increment: number) => {
      setData((prev) => ({
        ...prev,
        challenges: prev.challenges.map((c) => {
          if (c.id === id) {
            const nextCur = Math.min(c.target, c.current + increment);
            const isCompleted = nextCur >= c.target;
            if (isCompleted && !c.completed) {
              awardXp(c.xpReward, `Completed challenge: ${c.title}!`);
            }
            return {
              ...c,
              current: nextCur,
              completed: isCompleted,
            };
          }
          return c;
        }),
      }));
    },
    [awardXp]
  );

  // Routines
  const addRoutine = useCallback(
    (routine: Omit<Routine, 'id'>) => {
      const newRoutine: Routine = {
        ...routine,
        id: `routine-${Date.now()}`,
      };
      setData((prev) => ({
        ...prev,
        routines: [...prev.routines, newRoutine],
      }));
      awardXp(30, `Created routine: ${newRoutine.name}`);
      addToast({
        type: 'success',
        title: 'Routine Created',
        message: `Added "${newRoutine.name}".`,
      });
    },
    [awardXp, addToast]
  );

  const updateRoutine = useCallback(
    (id: string, routine: Partial<Routine>) => {
      setData((prev) => ({
        ...prev,
        routines: prev.routines.map((r) => (r.id === id ? { ...r, ...routine } : r)),
      }));
      addToast({
        type: 'info',
        title: 'Routine Updated',
      });
    },
    [addToast]
  );

  const deleteRoutine = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        routines: prev.routines.filter((r) => r.id !== id),
      }));
      addToast({
        type: 'warning',
        title: 'Routine Removed',
      });
    },
    [addToast]
  );

  const completeRoutineAction = useCallback(
    (routineId: string) => {
      const routine = data.routines.find((r) => r.id === routineId);
      if (!routine) return;

      const today = getTodayDateString();
      // Mark all habits in routine as completed
      routine.habitIds.forEach((hId) => {
        toggleHabitCompletion(hId, today);
      });

      try {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.6 },
        });
      } catch {}

      awardXp(50, `Completed ${routine.name}!`);
      addToast({
        type: 'success',
        title: `${routine.name} Completed!`,
        message: `All ${routine.habitIds.length} habits checked off in order!`,
        duration: 5000,
      });
    },
    [data.routines, toggleHabitCompletion, awardXp, addToast]
  );

  // Mood & Wellness
  const logMoodEnergy = useCallback(
    (mood: MoodType, energy: number, note?: string, targetDate?: string) => {
      const date = targetDate || getTodayDateString();
      setData((prev) => {
        const existingIdx = prev.moodLogs.findIndex((m) => m.date === date);
        const newEntry: DailyMoodEnergy = {
          date,
          mood,
          energy,
          note,
          updatedAt: new Date().toISOString(),
        };

        let updatedMoods: DailyMoodEnergy[];
        if (existingIdx >= 0) {
          updatedMoods = [...prev.moodLogs];
          updatedMoods[existingIdx] = newEntry;
        } else {
          updatedMoods = [newEntry, ...prev.moodLogs];
        }

        return {
          ...prev,
          moodLogs: updatedMoods,
        };
      });

      awardXp(10, 'Logged daily mood & energy');
      addToast({
        type: 'success',
        title: 'Mood & Energy Recorded',
        message: `Energy: ${energy}/10`,
      });
    },
    [awardXp, addToast]
  );

  const updateWellness = useCallback(
    (wellnessUpdate: Partial<WellnessTrackers>, targetDate?: string) => {
      const date = targetDate || getTodayDateString();
      setData((prev) => {
        const existing = prev.wellnessLogs.find((w) => w.date === date) || {
          date,
          water: { current: 0, target: 8 },
          sleep: { durationHours: 7.5, bedtime: '23:00', wakeupTime: '06:30' },
          exercise: { durationMins: 0, activityType: 'Workout' },
          study: { hours: 0, subjects: '', focusSessions: 0 },
          screenTime: { actualMins: 0, targetMins: 240 },
        };

        const updated: WellnessTrackers = {
          ...existing,
          ...wellnessUpdate,
          water: wellnessUpdate.water ? { ...existing.water, ...wellnessUpdate.water } : existing.water,
          sleep: wellnessUpdate.sleep ? { ...existing.sleep, ...wellnessUpdate.sleep } : existing.sleep,
          exercise: wellnessUpdate.exercise ? { ...existing.exercise, ...wellnessUpdate.exercise } : existing.exercise,
          study: wellnessUpdate.study ? { ...existing.study, ...wellnessUpdate.study } : existing.study,
          screenTime: wellnessUpdate.screenTime ? { ...existing.screenTime, ...wellnessUpdate.screenTime } : existing.screenTime,
        };

        const updatedList = prev.wellnessLogs.filter((w) => w.date !== date);
        return {
          ...prev,
          wellnessLogs: [updated, ...updatedList],
        };
      });
    },
    []
  );

  // Focus Sessions
  const logFocusSession = useCallback(
    (session: Omit<FocusSession, 'id' | 'completedAt'>) => {
      const newSession: FocusSession = {
        ...session,
        id: `focus-${Date.now()}`,
        completedAt: new Date().toISOString(),
      };

      setData((prev) => ({
        ...prev,
        focusSessions: [newSession, ...prev.focusSessions],
      }));

      const earnedXp = Math.round(session.durationMinutes * 1.5);
      awardXp(earnedXp, `Completed ${session.durationMinutes}m focus session`);
      addToast({
        type: 'success',
        title: 'Focus Session Completed!',
        message: `Great focus! Earned +${earnedXp} XP.`,
      });
    },
    [awardXp, addToast]
  );

  // Profile & Settings
  const updateProfile = useCallback(
    (profile: Partial<UserProfile>) => {
      setData((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...profile },
      }));
      addToast({
        type: 'success',
        title: 'Profile Updated',
      });
    },
    [addToast]
  );

  const updateSettings = useCallback(
    (settings: Partial<AppSettings>) => {
      setData((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...settings },
      }));
      addToast({
        type: 'info',
        title: 'Settings Saved',
      });
    },
    [addToast]
  );

  // Reminders
  const addReminder = useCallback(
    (reminder: Omit<AppReminder, 'id'>) => {
      const newRem: AppReminder = {
        ...reminder,
        id: `rem-${Date.now()}`,
      };
      setData((prev) => ({
        ...prev,
        reminders: [newRem, ...prev.reminders],
      }));
      addToast({
        type: 'success',
        title: 'Reminder Added',
        message: `${newRem.title} at ${newRem.time}`,
      });
    },
    [addToast]
  );

  const toggleReminderStatus = useCallback(
    (id: string, status: 'upcoming' | 'completed' | 'missed') => {
      setData((prev) => ({
        ...prev,
        reminders: prev.reminders.map((r) => (r.id === id ? { ...r, status } : r)),
      }));
    },
    []
  );

  // Export & Import
  const exportDataJSON = useCallback(() => {
    const json = exportJSON(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aurahabit-backup-${getTodayDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({
      type: 'success',
      title: 'Data Exported',
      message: 'Full backup saved as JSON file.',
    });
  }, [data, addToast]);

  const importDataJSON = useCallback(
    (jsonString: string): boolean => {
      try {
        const imported = importJSON(jsonString);
        setData(imported);
        addToast({
          type: 'success',
          title: 'Data Restored Successfully',
          message: `Restored ${imported.habits.length} habits and ${imported.logs.length} logs.`,
        });
        return true;
      } catch (err: any) {
        addToast({
          type: 'error',
          title: 'Import Failed',
          message: err.message || 'Invalid JSON format.',
        });
        return false;
      }
    },
    [addToast]
  );

  const exportDataCSV = useCallback(() => {
    const csv = exportCSV(data.habits, data.logs);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aurahabit-logs-${getTodayDateString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({
      type: 'success',
      title: 'CSV Exported',
      message: 'Detailed logs downloaded.',
    });
  }, [data.habits, data.logs, addToast]);

  const resetAllData = useCallback(() => {
    const reset = resetAppData();
    setData(reset);
    addToast({
      type: 'warning',
      title: 'Data Reset',
      message: 'Restored initial sample data.',
    });
  }, [addToast]);

  // Google Authentication & Integration
  const handleGoogleLogin = useCallback(async (arg?: unknown): Promise<boolean> => {
    const requestWorkspaceScopes =
      typeof arg === 'boolean'
        ? arg
        : typeof arg === 'object' && arg !== null && 'withWorkspaceScopes' in arg
        ? !!(arg as any).withWorkspaceScopes
        : false;

    setAuthError(null);

    try {
      const res = await googleSignIn({ withWorkspaceScopes: requestWorkspaceScopes });
      if (res?.isCancelled || !res?.user) {
        // User closed or dismissed popup without completing authentication
        console.info('Google sign-in popup closed by user.');
        return false;
      }

      const authUser = res.user;

      setGoogleUser(authUser);
      setIsGoogleAuthenticated(true);
      setIsGuestMode(false);
      try {
        sessionStorage.removeItem('aurahabit_guest_mode');
      } catch {}

      const userDisplayName = authUser.displayName || authUser.email?.split('@')[0] || 'Habit Builder';
      const userHandle = `@${(authUser.email || 'user').split('@')[0]}`;
      const userAvatar = authUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80';

      setData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          name: userDisplayName,
          username: userHandle,
          avatar: userAvatar,
          email: authUser.email || '',
        },
      }));

      // Persist user to Firestore directory for contact & friend matching
      syncUserProfileToFirestore(authUser);

      addToast({
        type: 'success',
        title: 'Connected to Google',
        message: `Signed in as ${authUser.displayName || authUser.email}`,
      });
      return true;
    } catch (err: any) {
      const parsed: ParsedAuthError = err?.isAccessDenied !== undefined ? err : parseAuthError(err);

      if (parsed.isPopupClosed) {
        console.info('Google sign-in popup closed by user.');
        return false;
      }

      console.warn('Google Sign-in notice:', parsed.title || parsed.message);
      setAuthError(parsed);

      if (parsed.isAccessDenied) {
        addToast({
          type: 'error',
          title: 'Google OAuth 403: Access Denied',
          message:
            'Google blocked the popup because your Google Cloud project is in "Testing" mode. Add your email under "Test users" in Google Cloud Console > OAuth consent screen, or switch to "In production".',
          duration: 10000,
        });
      } else if (parsed.isUnauthorizedDomain) {
        addToast({
          type: 'error',
          title: 'Firebase Unauthorized Domain',
          message:
            'Please add your deployed domain in Firebase Console > Authentication > Settings > Authorized Domains.',
          duration: 9000,
        });
      } else if (parsed.isPopupBlocked) {
        addToast({
          type: 'warning',
          title: 'Popup Blocked',
          message: 'Please allow popups for this site in your browser to sign in with Google.',
          duration: 6000,
        });
      } else {
        addToast({
          type: 'error',
          title: parsed.title || 'Sign In Failed',
          message: parsed.message || 'Could not complete Google sign in.',
          duration: 7000,
        });
      }

      return false;
    }
  }, [addToast]);

  const handleGoogleLogout = useCallback(async () => {
    try {
      await authLogout();
      setGoogleUser(null);
      setIsGoogleAuthenticated(false);
      setIsGuestMode(false);
      setAuthError(null);
      try {
        localStorage.removeItem('aurahabit_guest_mode');
        sessionStorage.removeItem('aurahabit_guest_mode');
        localStorage.removeItem('aurahabit_auth_active');
        localStorage.removeItem('aurahabit_auth_user');
      } catch {}
      addToast({
        type: 'info',
        title: 'Signed Out',
        message: 'Disconnected from your account.',
      });
    } catch (err: any) {
      console.warn('Logout notice:', err);
    }
  }, [addToast]);

  const handleOtpAuthSuccess = useCallback((authUser: any) => {
    setIsGoogleAuthenticated(true);
    setIsGuestMode(false);
    setAuthError(null);
    setIsAuthModalOpen(false);

    if (authUser) {
      const email = authUser.email || '';
      const name = authUser.fullName || authUser.name || authUser.username || email.split('@')[0] || 'Habit Builder';
      const username = authUser.username
        ? (authUser.username.startsWith('@') ? authUser.username : `@${authUser.username}`)
        : `@${email.split('@')[0] || 'user'}`;
      const avatar =
        authUser.avatarUrl ||
        authUser.avatar ||
        `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80`;

      setData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          name,
          fullName: authUser.fullName || authUser.name || prev.profile.fullName || name,
          username,
          avatar,
          avatarUrl: avatar,
          email,
          bio: authUser.bio || prev.profile.bio || 'Building mindful daily habits with AuraHabit.',
          isEmailVerified: true,
          dob: authUser.dob || prev.profile.dob,
          gender: authUser.gender || prev.profile.gender,
          occupation: authUser.occupation || prev.profile.occupation,
          location: authUser.location || prev.profile.location,
          socialLinks: authUser.socialLinks || prev.profile.socialLinks,
          googleChatEmail: authUser.googleChatEmail || email,
        },
      }));

      try {
        localStorage.setItem('aurahabit_auth_active', 'true');
        localStorage.setItem(
          'aurahabit_auth_user',
          JSON.stringify({
            uid: authUser.id || email,
            email,
            displayName: name,
            photoURL: avatar,
          })
        );
        localStorage.removeItem('aurahabit_guest_mode');
        sessionStorage.removeItem('aurahabit_guest_mode');
      } catch {}
    }

    addToast({
      type: 'success',
      title: 'Authenticated Successfully',
      message: `Signed in as ${authUser.email || authUser.username || 'user'}.`,
      duration: 4000,
    });
  }, [addToast]);

  const continueAsGuest = useCallback(() => {
    setIsGuestMode(true);
    setAuthError(null);
    try {
      localStorage.setItem('aurahabit_guest_mode', 'true');
      sessionStorage.setItem('aurahabit_guest_mode', 'true');
    } catch {}
    addToast({
      type: 'info',
      title: 'Guest Mode Active',
      message: 'Exploring offline. Sign in with Google anytime to sync data.',
      duration: 4000,
    });
  }, [addToast]);

  const syncWithGoogleSheets = useCallback(
    async (existingSheetId?: string) => {
      setIsSyncingSheets(true);
      try {
        let token = await getAccessToken();
        if (!token) {
          const loggedIn = await handleGoogleLogin(true);
          if (!loggedIn) {
            setIsSyncingSheets(false);
            return;
          }
          token = await getAccessToken();
        }

        const calculatedScore = calculateLifeScore(
          data.habits,
          data.logs,
          data.goals,
          data.wellnessLogs,
          data.focusSessions,
          getTodayDateString()
        );

        const targetSheetId = existingSheetId || data.settings.googleSheets.spreadsheetId;

        const res = await createOrSyncHabitSheet(
          data.profile.name,
          data.habits,
          data.logs,
          data.wellnessLogs,
          calculatedScore,
          targetSheetId
        );

        setData((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            googleSheets: {
              ...prev.settings.googleSheets,
              spreadsheetId: res.spreadsheetId,
              spreadsheetUrl: res.spreadsheetUrl,
              lastSyncedAt: res.syncedAt,
            },
          },
        }));

        awardXp(50, 'Synced data to Google Sheets');
        addToast({
          type: 'success',
          title: 'Google Sheets Synchronized!',
          message: `Updated tabs with ${res.totalLogsSynced} logs.`,
          duration: 6000,
        });

        return res.spreadsheetUrl;
      } catch (err: any) {
        const parsed = err.isAccessDenied !== undefined ? err : parseAuthError(err);
        let errorMsg = err.message || 'Failed to sync data.';
        if (parsed.isAccessDenied) {
          errorMsg = 'Google Sheets Access Denied (403): App is in Testing mode. Add your email to "Test users" in Google Cloud Console > OAuth consent screen to enable Sheets sync.';
        }
        addToast({
          type: 'error',
          title: 'Google Sheets Sync Failed',
          message: errorMsg,
          duration: 9000,
        });
        throw err;
      } finally {
        setIsSyncingSheets(false);
      }
    },
    [data, handleGoogleLogin, awardXp, addToast]
  );

  // Pre-made template applicator
  const applyHabitTemplate = useCallback(
    (_categoryName: string, habitTemplates: Omit<Habit, 'id' | 'createdAt' | 'order'>[]) => {
      const addedHabits: Habit[] = habitTemplates.map((t, idx) => ({
        ...t,
        id: `habit-${Date.now()}-${idx}`,
        order: data.habits.length + idx + 1,
        createdAt: new Date().toISOString(),
        isArchived: false,
        isPinned: false,
      }));

      setData((prev) => ({
        ...prev,
        habits: [...prev.habits, ...addedHabits],
      }));

      awardXp(50, `Added ${addedHabits.length} habits from template`);
      addToast({
        type: 'success',
        title: 'Template Activated',
        message: `Added ${addedHabits.length} new habits to your tracker.`,
      });
      setIsTemplatesModalOpen(false);
    },
    [data.habits.length, awardXp, addToast]
  );

  // Computations
  const lifeScore = useMemo(
    () =>
      calculateLifeScore(
        data.habits,
        data.logs,
        data.goals,
        data.wellnessLogs,
        data.focusSessions,
        selectedDate
      ),
    [data.habits, data.logs, data.goals, data.wellnessLogs, data.focusSessions, selectedDate]
  );

  const globalStreak = useMemo(
    () => calculateGlobalStreak(data.habits, data.logs, getTodayDateString()),
    [data.habits, data.logs]
  );

  const todayScheduledHabits = useMemo(() => {
    return data.habits
      .filter((h) => !h.isArchived && isHabitScheduledForDate(h, selectedDate))
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return a.order - b.order;
      });
  }, [data.habits, selectedDate]);

  const todayCompletedCount = useMemo(() => {
    return todayScheduledHabits.filter((h) => {
      const log = data.logs.find((l) => l.habitId === h.id && l.date === selectedDate);
      return log && log.completed;
    }).length;
  }, [todayScheduledHabits, data.logs, selectedDate]);

  const todayCompletionRate = useMemo(() => {
    if (todayScheduledHabits.length === 0) return 0;
    return Math.round((todayCompletedCount / todayScheduledHabits.length) * 100);
  }, [todayScheduledHabits.length, todayCompletedCount]);

  const todayMood = useMemo(() => {
    return data.moodLogs.find((m) => m.date === selectedDate);
  }, [data.moodLogs, selectedDate]);

  const todayWellness = useMemo(() => {
    return data.wellnessLogs.find((w) => w.date === selectedDate);
  }, [data.wellnessLogs, selectedDate]);

  // Unified History items
  const historyItems = useMemo((): HistoryItem[] => {
    const habitMap = new Map(data.habits.map((h) => [h.id, h]));
    const items: HistoryItem[] = [];

    // Habit completion logs
    data.logs.forEach((log) => {
      if (!log.completed) return;
      const habit = habitMap.get(log.habitId);
      if (!habit) return;

      const timeStr = log.completedAt
        ? new Date(log.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Completed';

      items.push({
        id: `hist-log-${log.id}`,
        date: log.date,
        time: timeStr,
        type: 'habit',
        title: habit.name,
        subtitle: `${log.value} ${habit.unit} logged (${habit.category})`,
        xp: 15,
        status: 'completed',
        icon: habit.icon,
        color: habit.color,
      });
    });

    // Focus Sessions
    data.focusSessions.forEach((f) => {
      const timeStr = f.completedAt
        ? new Date(f.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Completed';
      items.push({
        id: `hist-focus-${f.id}`,
        date: f.date,
        time: timeStr,
        type: 'focus',
        title: `${f.durationMinutes}m Focus Session`,
        subtitle: f.habitName || 'Deep Work Timer',
        xp: Math.round(f.durationMinutes * 1.5),
        status: 'completed',
        icon: 'Clock',
        color: 'indigo',
      });
    });

    // Unlocked Achievements
    data.achievements.forEach((ach) => {
      if (!ach.unlockedAt) return;
      const dateStr = ach.unlockedAt.split('T')[0];
      const timeStr = new Date(ach.unlockedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      items.push({
        id: `hist-ach-${ach.id}`,
        date: dateStr,
        time: timeStr,
        type: 'achievement',
        title: `Achievement: ${ach.title}`,
        subtitle: ach.description,
        xp: ach.xp,
        status: 'unlocked',
        icon: ach.icon,
        color: 'amber',
      });
    });

    // Sort descending by date and time
    items.sort((a, b) => {
      const dateComp = b.date.localeCompare(a.date);
      if (dateComp !== 0) return dateComp;
      return b.time.localeCompare(a.time);
    });

    return items;
  }, [data.habits, data.logs, data.focusSessions, data.achievements]);

  // ==========================================
  // AI NOTIFICATION SYSTEM ACTIONS
  // ==========================================

  const triggerHabitAlertNow = useCallback(
    async (habitId: string, channelOverride?: 'push' | 'email' | 'both') => {
      const habit = data.habits.find((h) => h.id === habitId);
      if (!habit) return null;

      setIsAiGeneratingAlert(true);
      try {
        const today = getTodayDateString();
        const streakInfo = calculateHabitStreak(habit, data.logs, today);
        const streak = streakInfo.currentStreak;
        const scheduledToday = data.habits.filter((h) => isHabitScheduledForDate(h, today));
        const todayLogs = data.logs.filter((l) => l.date === today && l.completed);

        const userTone = data.settings.aiNotifications?.tone || 'motivational';
        const nudge = await generateAiHabitNudge({
          habit: {
            id: habit.id,
            name: habit.name,
            category: habit.category,
            targetValue: habit.targetValue,
            unit: habit.unit,
            reminderTime: habit.reminderTime,
            streak,
            priority: habit.priority,
            difficulty: habit.difficulty,
          },
          userName: data.profile.name || googleUser?.displayName || 'Friend',
          tone: userTone,
        });

        const channel = channelOverride || habit.notificationChannel || 'push';
        let pushSuccess = false;
        let emailSuccess = false;

        // Push Alert
        if (channel === 'push' || channel === 'both') {
          pushSuccess = sendPushNotification(nudge.title, {
            body: nudge.body,
            onClick: () => {
              window.focus();
              toggleHabitCompletion(habit.id);
            },
          });
          if (data.settings.soundEnabled !== false) {
            playNotificationSound();
          }
        }

        // Email Alert
        const targetEmail =
          habit.notificationEmail ||
          data.settings.aiNotifications?.targetEmail ||
          googleUser?.email ||
          data.profile.email;

        if ((channel === 'email' || channel === 'both') && targetEmail) {
          try {
            await sendHabitAiAlertEmail({
              recipientEmail: targetEmail,
              userName: data.profile.name || googleUser?.displayName || 'Friend',
              nudge,
              habit,
              todayCompletedCount: todayLogs.length,
              totalScheduledCount: Math.max(scheduledToday.length, 1),
              lifeScore: lifeScore.overallScore,
            });
            emailSuccess = true;
          } catch (mailErr: any) {
            console.warn('Failed to send email alert:', mailErr);
          }
        }

        const newAlert: AiNotificationAlert = {
          id: `alert-${Date.now()}`,
          habitId: habit.id,
          habitName: habit.name,
          habitCategory: habit.category,
          title: nudge.title,
          body: nudge.body,
          callToAction: nudge.callToAction,
          scienceTip: nudge.scienceTip,
          channel: channel as any,
          status: 'sent',
          scheduledTime: habit.reminderTime || 'Now',
          sentAt: new Date().toISOString(),
          urgencyLevel: nudge.urgencyLevel,
          streakDays: streak,
          emailSentTo: (channel === 'email' || channel === 'both') ? targetEmail : undefined,
          isAiGenerated: nudge.isAiGenerated,
        };

        setAiAlertHistory((prev) => [newAlert, ...prev.slice(0, 49)]);

        addToast({
          type: 'success',
          title: nudge.title,
          message: `${nudge.body} [Channel: ${channel.toUpperCase()}]`,
          duration: 6000,
          action: {
            label: 'Check Off',
            onClick: () => toggleHabitCompletion(habit.id),
          },
        });

        return newAlert;
      } catch (err: any) {
        addToast({
          type: 'error',
          title: 'Notification Trigger Failed',
          message: err.message || 'Could not dispatch habit alert.',
        });
        return null;
      } finally {
        setIsAiGeneratingAlert(false);
      }
    },
    [
      data.habits,
      data.logs,
      data.profile,
      data.settings,
      googleUser,
      lifeScore,
      addToast,
      toggleHabitCompletion,
    ]
  );

  const testPushNotification = useCallback(async (): Promise<boolean> => {
    const perm = await requestPushPermission();
    if (perm !== 'granted') {
      addToast({
        type: 'warning',
        title: 'Push Permission Denied',
        message: 'Please allow notifications in your browser address bar.',
      });
      return false;
    }
    playNotificationSound();
    const success = sendPushNotification('⚡ AuraHabit Smart Alert (Test)', {
      body: 'Your AI notification pipeline is working! Custom habit schedules will trigger automatically.',
    });
    addToast({
      type: 'success',
      title: 'Push Notification Sent',
      message: 'Browser alert fired successfully.',
    });
    return success;
  }, [addToast]);

  const testEmailAlert = useCallback(
    async (targetEmailOverride?: string): Promise<boolean> => {
      const targetEmail =
        targetEmailOverride ||
        data.settings.aiNotifications?.targetEmail ||
        googleUser?.email ||
        data.profile.email;

      if (!targetEmail) {
        addToast({
          type: 'error',
          title: 'Recipient Email Required',
          message: 'Please connect Google Account or specify a target email address in settings.',
        });
        return false;
      }

      const sampleHabit = data.habits[0] || {
        id: 'sample',
        name: 'Consistent Daily Reps',
        category: 'Productivity',
        targetValue: 1,
        unit: 'session',
        reminderTime: '08:00',
      };

      try {
        await sendHabitAiAlertEmail({
          recipientEmail: targetEmail,
          userName: data.profile.name || googleUser?.displayName || 'Builder',
          nudge: {
            title: '⚡ Test Alert: Daily Habit Momentum',
            body: 'This is a test AI notification delivered securely via Gmail API based on your custom habit schedule.',
            callToAction: 'Check Off In AuraHabit',
            scienceTip: 'Consistency is built by never missing twice.',
            urgencyLevel: 'normal',
            habitName: sampleHabit.name,
            streakDays: 14,
            isAiGenerated: true,
            generatedAt: new Date().toISOString(),
          },
          habit: sampleHabit,
          todayCompletedCount: 3,
          totalScheduledCount: 5,
          lifeScore: lifeScore.overallScore,
        });

        addToast({
          type: 'success',
          title: 'Email Alert Sent via Gmail',
          message: `Sent test alert to ${targetEmail}`,
        });
        return true;
      } catch (err: any) {
        addToast({
          type: 'error',
          title: 'Failed to Send Email',
          message: err.message,
        });
        return false;
      }
    },
    [data.habits, data.settings, data.profile, googleUser, lifeScore, addToast]
  );

  const optimizeHabitSchedulesWithAi = useCallback(async (): Promise<ScheduleRecommendation[]> => {
    return await optimizeScheduleWithAi(data.habits, data.routines);
  }, [data.habits, data.routines]);

  const clearAlertHistory = useCallback(() => {
    setAiAlertHistory([]);
    try {
      localStorage.removeItem('aurahabit_ai_alert_history');
    } catch {}
    addToast({ type: 'info', title: 'Alert History Cleared' });
  }, [addToast]);

  // Automated background scheduler effect
  useEffect(() => {
    if (data.settings.aiNotifications?.autoSchedulerActive === false) return;

    let lastCheckedMinute = '';
    const interval = setInterval(() => {
      const now = new Date();
      const currentMinute = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      if (currentMinute === lastCheckedMinute) return;
      lastCheckedMinute = currentMinute;

      const today = getTodayDateString();
      const activeHabits = data.habits.filter(
        (h) => !h.isArchived && isHabitScheduledForDate(h, today)
      );

      activeHabits.forEach((habit) => {
        // If already completed today, don't trigger reminder
        const isDone = data.logs.some(
          (l) => l.habitId === habit.id && l.date === today && l.completed
        );
        if (isDone) return;

        const matchesPrimary = habit.reminderTime === currentMinute;
        const matchesCustom = habit.customReminderTimes?.includes(currentMinute);

        if (matchesPrimary || matchesCustom) {
          triggerHabitAlertNow(habit.id);
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [
    data.habits,
    data.logs,
    data.settings.aiNotifications?.autoSchedulerActive,
    triggerHabitAlertNow,
  ]);

  return (
    <AppContext.Provider
      value={{
        currentSection,
        setCurrentSection,
        selectedDate,
        setSelectedDate,
        data,
        habits: data.habits,
        logs: data.logs,
        goals: data.goals,
        challenges: data.challenges,
        achievements: data.achievements,
        routines: data.routines,
        moodLogs: data.moodLogs,
        wellnessLogs: data.wellnessLogs,
        focusSessions: data.focusSessions,
        profile: data.profile,
        settings: data.settings,
        deletedHabits: data.deletedHabits,
        reminders: data.reminders,
        lifeScore,
        globalStreak,
        todayScheduledHabits,
        todayCompletedCount,
        todayCompletionRate,
        todayMood,
        todayWellness,
        historyItems,
        addHabit,
        updateHabit,
        deleteHabit,
        restoreHabit,
        togglePinHabit,
        toggleArchiveHabit,
        duplicateHabit,
        reorderHabits,
        toggleHabitCompletion,
        updateHabitLogValue,
        skipHabitForDay,
        addGoal,
        updateGoal,
        deleteGoal,
        joinChallenge,
        updateChallengeProgress,
        addRoutine,
        updateRoutine,
        deleteRoutine,
        completeRoutineAction,
        logMoodEnergy,
        updateWellness,
        logFocusSession,
        awardXp,
        updateProfile,
        updateSettings,
        addReminder,
        toggleReminderStatus,
        exportDataJSON,
        importDataJSON,
        exportDataCSV,
        resetAllData,
        googleUser,
        isGoogleAuthenticated,
        isAuthLoading,
        isGuestMode,
        continueAsGuest,
        isSyncingSheets,
        syncWithGoogleSheets,
        authError,
        clearAuthError,
        handleGoogleLogin,
        handleGoogleLogout,
        handleOtpAuthSuccess,
        applyHabitTemplate,
        isAddHabitModalOpen,
        setIsAddHabitModalOpen,
        editingHabit,
        setEditingHabit,
        isSearchModalOpen,
        setIsSearchModalOpen,
        isNotificationDrawerOpen,
        setIsNotificationDrawerOpen,
        isSheetsModalOpen,
        setIsSheetsModalOpen,
        isOnboardingOpen,
        setIsOnboardingOpen,
        isTemplatesModalOpen,
        setIsTemplatesModalOpen,
        isWorkspaceModalOpen,
        setIsWorkspaceModalOpen,
        isAiNotificationModalOpen,
        setIsAiNotificationModalOpen,
        isProfileQrModalOpen,
        setIsProfileQrModalOpen,
        isQrScannerModalOpen,
        setIsQrScannerModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        aiAlertHistory,
        isAiGeneratingAlert,
        triggerHabitAlertNow,
        testPushNotification,
        testEmailAlert,
        optimizeHabitSchedulesWithAi,
        clearAlertHistory,
        calculateHabitStreak,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
