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
  AppReminder,
} from '../types';
import { getDaysAgo, getTodayDateString } from '../utils/dateUtils';

export interface AppData {
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
}

const STORAGE_KEY = 'aurahabit_app_data_v1';

export const getInitialData = (): AppData => {
  const today = getTodayDateString();

  const habits: Habit[] = [
    {
      id: 'habit-1',
      name: 'Drink 8 Glasses of Water',
      description: 'Stay hydrated throughout the day with regular water intake.',
      category: 'Health',
      icon: 'Droplets',
      color: 'emerald',
      frequency: 'daily',
      frequencyDays: [0, 1, 2, 3, 4, 5, 6],
      frequencyTargetCount: 7,
      startDate: getDaysAgo(30),
      targetValue: 8,
      unit: 'glasses',
      reminderTime: '08:30',
      difficulty: 'easy',
      priority: 'high',
      notes: 'Add lemon or mint for flavor',
      streakGoal: 30,
      isArchived: false,
      isPinned: true,
      order: 1,
      createdAt: getDaysAgo(30),
    },
    {
      id: 'habit-2',
      name: 'Morning Meditation & Breathwork',
      description: 'Clear mind and center breathing for 15 minutes upon waking up.',
      category: 'Mindfulness',
      icon: 'Sparkles',
      color: 'violet',
      frequency: 'daily',
      frequencyDays: [0, 1, 2, 3, 4, 5, 6],
      frequencyTargetCount: 7,
      startDate: getDaysAgo(25),
      targetValue: 15,
      unit: 'mins',
      reminderTime: '07:00',
      difficulty: 'medium',
      priority: 'high',
      notes: 'Use calm ambient music',
      streakGoal: 21,
      isArchived: false,
      isPinned: true,
      order: 2,
      createdAt: getDaysAgo(25),
    },
    {
      id: 'habit-3',
      name: 'Daily Workout & Movement',
      description: 'Strength training, cardio, or mobility work.',
      category: 'Fitness',
      icon: 'Activity',
      color: 'rose',
      frequency: 'weekly_days',
      frequencyDays: [1, 2, 3, 4, 5, 6], // Mon-Sat (Sunday rest day)
      frequencyTargetCount: 6,
      startDate: getDaysAgo(28),
      targetValue: 45,
      unit: 'mins',
      reminderTime: '17:30',
      difficulty: 'hard',
      priority: 'high',
      notes: 'Mix upper body, lower body, and HIIT',
      streakGoal: 30,
      isArchived: false,
      isPinned: true,
      order: 3,
      createdAt: getDaysAgo(28),
      restDays: [0], // Sunday is rest day
    },
    {
      id: 'habit-4',
      name: 'Deep Work & Focus Session',
      description: 'Uninterrupted creative problem solving without notifications.',
      category: 'Productivity',
      icon: 'Brain',
      color: 'indigo',
      frequency: 'weekly_days',
      frequencyDays: [1, 2, 3, 4, 5],
      frequencyTargetCount: 5,
      startDate: getDaysAgo(22),
      targetValue: 90,
      unit: 'mins',
      reminderTime: '10:00',
      difficulty: 'hard',
      priority: 'high',
      notes: 'Turn phone to Do Not Disturb',
      streakGoal: 14,
      isArchived: false,
      isPinned: false,
      order: 4,
      createdAt: getDaysAgo(22),
      restDays: [0, 6],
    },
    {
      id: 'habit-5',
      name: 'Read Non-Fiction Book',
      description: 'Expand knowledge through books and thoughtful articles.',
      category: 'Study',
      icon: 'BookOpen',
      color: 'amber',
      frequency: 'daily',
      frequencyDays: [0, 1, 2, 3, 4, 5, 6],
      frequencyTargetCount: 7,
      startDate: getDaysAgo(20),
      targetValue: 20,
      unit: 'pages',
      reminderTime: '21:00',
      difficulty: 'easy',
      priority: 'medium',
      notes: 'Currently reading: Atomic Habits',
      streakGoal: 30,
      isArchived: false,
      isPinned: false,
      order: 5,
      createdAt: getDaysAgo(20),
    },
    {
      id: 'habit-6',
      name: 'Track Daily Expenses',
      description: 'Log all spending and review daily budget in ledger.',
      category: 'Finance',
      icon: 'DollarSign',
      color: 'cyan',
      frequency: 'daily',
      frequencyDays: [0, 1, 2, 3, 4, 5, 6],
      frequencyTargetCount: 7,
      startDate: getDaysAgo(18),
      targetValue: 1,
      unit: 'times',
      reminderTime: '21:45',
      difficulty: 'easy',
      priority: 'medium',
      notes: 'Categorize receipts and food orders',
      streakGoal: 30,
      isArchived: false,
      isPinned: false,
      order: 6,
      createdAt: getDaysAgo(18),
    },
    {
      id: 'habit-7',
      name: 'Sleep 8 Hours Rest',
      description: 'In bed before 11:00 PM with screen-free bedtime routine.',
      category: 'Sleep',
      icon: 'Moon',
      color: 'indigo',
      frequency: 'daily',
      frequencyDays: [0, 1, 2, 3, 4, 5, 6],
      frequencyTargetCount: 7,
      startDate: getDaysAgo(24),
      targetValue: 8,
      unit: 'hours',
      reminderTime: '22:30',
      difficulty: 'medium',
      priority: 'high',
      notes: 'Aim for 10:30 PM wind down',
      streakGoal: 21,
      isArchived: false,
      isPinned: false,
      order: 7,
      createdAt: getDaysAgo(24),
    },
  ];

  // Generate 30 days of realistic history
  const logs: HabitLog[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = getDaysAgo(i);
    const dayOfWeek = new Date(date).getDay();

    // Habit 1: Water (90% completion)
    const waterCompleted = i === 12 || i === 23 ? false : true;
    const waterVal = waterCompleted ? 8 : (i % 2 === 0 ? 6 : 5);
    logs.push({
      id: `log-water-${date}`,
      habitId: 'habit-1',
      date,
      value: waterVal,
      targetValue: 8,
      completed: waterCompleted,
      completedAt: `${date}T19:30:00Z`,
    });

    // Habit 2: Meditation (85% completion)
    const medCompleted = i === 4 || i === 18 ? false : true;
    logs.push({
      id: `log-med-${date}`,
      habitId: 'habit-2',
      date,
      value: medCompleted ? 15 : 0,
      targetValue: 15,
      completed: medCompleted,
      completedAt: `${date}T07:15:00Z`,
    });

    // Habit 3: Workout (Mon-Sat, Sunday rest)
    if (dayOfWeek === 0) {
      logs.push({
        id: `log-fit-${date}`,
        habitId: 'habit-3',
        date,
        value: 0,
        targetValue: 45,
        completed: false,
        isRestDay: true,
      });
    } else {
      const fitCompleted = i === 8 ? false : true;
      logs.push({
        id: `log-fit-${date}`,
        habitId: 'habit-3',
        date,
        value: fitCompleted ? 45 : 20,
        targetValue: 45,
        completed: fitCompleted,
        completedAt: `${date}T18:15:00Z`,
      });
    }

    // Habit 4: Deep Work (Weekdays)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const workCompleted = i === 7 ? false : true;
      logs.push({
        id: `log-work-${date}`,
        habitId: 'habit-4',
        date,
        value: workCompleted ? 90 : 45,
        targetValue: 90,
        completed: workCompleted,
        completedAt: `${date}T11:40:00Z`,
      });
    }

    // Habit 5: Reading (Daily, 80% completion)
    const readCompleted = i === 3 || i === 15 ? false : true;
    logs.push({
      id: `log-read-${date}`,
      habitId: 'habit-5',
      date,
      value: readCompleted ? 20 : 10,
      targetValue: 20,
      completed: readCompleted,
      completedAt: `${date}T21:30:00Z`,
    });

    // Habit 6: Expenses
    const expCompleted = i === 10 ? false : true;
    logs.push({
      id: `log-exp-${date}`,
      habitId: 'habit-6',
      date,
      value: expCompleted ? 1 : 0,
      targetValue: 1,
      completed: expCompleted,
      completedAt: `${date}T22:00:00Z`,
    });

    // Habit 7: Sleep
    const sleepCompleted = i === 5 || i === 19 ? false : true;
    logs.push({
      id: `log-sleep-${date}`,
      habitId: 'habit-7',
      date,
      value: sleepCompleted ? 8 : 6.5,
      targetValue: 8,
      completed: sleepCompleted,
      completedAt: `${date}T06:45:00Z`,
    });
  }

  // Pre-configured Goals
  const goals: Goal[] = [
    {
      id: 'goal-1',
      title: 'Maintain 30-Day Hydration Streak',
      description: 'Hit 8 glasses of water daily for an entire month.',
      type: '30_day',
      targetCount: 30,
      currentCount: 26,
      deadline: getDaysAgo(-4),
      relatedHabitIds: ['habit-1'],
      completed: false,
      createdAt: getDaysAgo(26),
    },
    {
      id: 'goal-2',
      title: 'Complete 20 Deep Work Focus Blocks',
      description: 'Reach 20 sessions of 90 minutes deep work sprint.',
      type: '30_day',
      targetCount: 20,
      currentCount: 18,
      deadline: getDaysAgo(-10),
      relatedHabitIds: ['habit-4'],
      completed: false,
      createdAt: getDaysAgo(20),
    },
    {
      id: 'goal-3',
      title: 'Read 2 Full Books This Month',
      description: 'Keep up with 20 pages a day to finish 600 pages.',
      type: '30_day',
      targetCount: 600,
      currentCount: 520,
      deadline: getDaysAgo(-7),
      relatedHabitIds: ['habit-5'],
      completed: false,
      createdAt: getDaysAgo(24),
    },
    {
      id: 'goal-4',
      title: '7-Day Perfect Morning Routine',
      description: 'Complete meditation and water immediately upon waking.',
      type: '7_day',
      targetCount: 7,
      currentCount: 7,
      deadline: getDaysAgo(0),
      relatedHabitIds: ['habit-1', 'habit-2'],
      completed: true,
      createdAt: getDaysAgo(7),
    },
  ];

  // Pre-configured Challenges
  const challenges: Challenge[] = [
    {
      id: 'chal-1',
      title: 'Hydration Hero Sprint',
      description: 'Drink at least 8 glasses of water every day for 7 days.',
      badge: '💧',
      xpReward: 350,
      type: 'weekly',
      target: 7,
      current: 6,
      unit: 'days',
      startDate: getDaysAgo(6),
      endDate: getDaysAgo(-1),
      completed: false,
      joined: true,
      relatedHabitId: 'habit-1',
    },
    {
      id: 'chal-2',
      title: 'Mindful Month Mastery',
      description: 'Meditate for 21 days this month to rewire focus & calm.',
      badge: '🧘',
      xpReward: 600,
      type: 'monthly',
      target: 21,
      current: 19,
      unit: 'days',
      startDate: getDaysAgo(22),
      endDate: getDaysAgo(-8),
      completed: false,
      joined: true,
      relatedHabitId: 'habit-2',
    },
    {
      id: 'chal-3',
      title: 'Fitness Iron Will',
      description: 'Crush 15 workouts in 3 weeks with high intensity.',
      badge: '🔥',
      xpReward: 500,
      type: 'monthly',
      target: 15,
      current: 14,
      unit: 'workouts',
      startDate: getDaysAgo(18),
      endDate: getDaysAgo(-3),
      completed: false,
      joined: true,
      relatedHabitId: 'habit-3',
    },
    {
      id: 'chal-4',
      title: 'Digital Sunset Sprint',
      description: 'Disconnect from screens 45 minutes before sleep for 7 nights.',
      badge: '🌙',
      xpReward: 300,
      type: 'weekly',
      target: 7,
      current: 7,
      unit: 'nights',
      startDate: getDaysAgo(8),
      endDate: getDaysAgo(1),
      completed: true,
      joined: true,
    },
  ];

  // Achievements
  const achievements: Achievement[] = [
    {
      id: 'ach-1',
      title: 'First Step',
      description: 'Complete your first habit check-in.',
      icon: 'Rocket',
      category: 'Milestones',
      xp: 50,
      unlockedAt: getDaysAgo(29),
      progress: 1,
      maxProgress: 1,
    },
    {
      id: 'ach-2',
      title: 'First Full Week',
      description: 'Log habits every day for 7 consecutive days.',
      icon: 'Flame',
      category: 'Streaks',
      xp: 150,
      unlockedAt: getDaysAgo(22),
      progress: 7,
      maxProgress: 7,
    },
    {
      id: 'ach-3',
      title: '7-Day Streak Master',
      description: 'Reach a 7-day streak on any individual habit.',
      icon: 'Zap',
      category: 'Streaks',
      xp: 200,
      unlockedAt: getDaysAgo(20),
      progress: 7,
      maxProgress: 7,
    },
    {
      id: 'ach-4',
      title: 'Centurion Club',
      description: 'Reach 100 total habit completions.',
      icon: 'Trophy',
      category: 'Milestones',
      xp: 400,
      unlockedAt: getDaysAgo(6),
      progress: 100,
      maxProgress: 100,
    },
    {
      id: 'ach-5',
      title: '30-Day Diamond Streak',
      description: 'Reach an uninterrupted 30-day streak.',
      icon: 'Award',
      category: 'Streaks',
      xp: 600,
      progress: 26,
      maxProgress: 30,
    },
    {
      id: 'ach-6',
      title: 'Early Bird',
      description: 'Complete a morning routine before 8:00 AM 5 times.',
      icon: 'Sun',
      category: 'Mastery',
      xp: 250,
      unlockedAt: getDaysAgo(12),
      progress: 5,
      maxProgress: 5,
    },
    {
      id: 'ach-7',
      title: 'Mindfulness Monk',
      description: 'Log 300 minutes of meditation & breathwork.',
      icon: 'Sparkles',
      category: 'Mastery',
      xp: 300,
      unlockedAt: getDaysAgo(5),
      progress: 300,
      maxProgress: 300,
    },
    {
      id: 'ach-8',
      title: 'Fitness Master',
      description: 'Complete 25 workout sessions.',
      icon: 'Dumbbell',
      category: 'Mastery',
      xp: 350,
      unlockedAt: getDaysAgo(2),
      progress: 25,
      maxProgress: 25,
    },
    {
      id: 'ach-9',
      title: 'Perfect Day Champion',
      description: 'Complete 100% of all scheduled habits in a single day.',
      icon: 'Star',
      category: 'Milestones',
      xp: 200,
      unlockedAt: getDaysAgo(14),
      progress: 1,
      maxProgress: 1,
    },
    {
      id: 'ach-10',
      title: 'Consistency King',
      description: 'Achieve a Life Score of 85 or above.',
      icon: 'Crown',
      category: 'Special',
      xp: 500,
      unlockedAt: getDaysAgo(1),
      progress: 88,
      maxProgress: 85,
    },
  ];

  // Routines
  const routines: Routine[] = [
    {
      id: 'routine-morning',
      name: 'Energizing Morning Routine',
      description: 'Hydrate, meditate, and prime your body and mind for high impact.',
      habitIds: ['habit-1', 'habit-2'],
      estimatedMinutes: 20,
      reminderTime: '07:00',
      icon: 'Sun',
      color: 'amber',
    },
    {
      id: 'routine-evening',
      name: 'Restorative Evening Routine',
      description: 'Wind down, read, balance budget, and prepare for deep restorative sleep.',
      habitIds: ['habit-5', 'habit-6', 'habit-7'],
      estimatedMinutes: 45,
      reminderTime: '21:30',
      icon: 'Moon',
      color: 'indigo',
    },
  ];

  // Daily Mood & Energy logs (last 14 days)
  const moodLogs: DailyMoodEnergy[] = [];
  const moods: ('very_happy' | 'happy' | 'neutral' | 'sad' | 'stressed')[] = [
    'very_happy',
    'happy',
    'happy',
    'neutral',
    'happy',
    'very_happy',
    'happy',
    'very_happy',
    'happy',
    'neutral',
    'happy',
    'very_happy',
    'happy',
    'very_happy',
  ];

  for (let i = 13; i >= 0; i--) {
    const date = getDaysAgo(i);
    const m = moods[13 - i] || 'happy';
    const energy = 7 + (i % 3);
    moodLogs.push({
      date,
      mood: m,
      energy: Math.min(10, Math.max(5, energy)),
      note: i === 0 ? 'Felt productive and energized throughout the day!' : undefined,
      updatedAt: `${date}T20:00:00Z`,
    });
  }

  // Wellness logs (last 14 days)
  const wellnessLogs: WellnessTrackers[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = getDaysAgo(i);
    wellnessLogs.push({
      date,
      water: {
        current: i === 0 ? 6 : (i % 3 === 0 ? 7 : 8),
        target: 8,
      },
      sleep: {
        durationHours: 7.5 + (i % 2 === 0 ? 0.5 : -0.3),
        bedtime: '23:00',
        wakeupTime: '06:45',
      },
      exercise: {
        durationMins: i % 7 === 0 ? 0 : 45,
        activityType: i % 2 === 0 ? 'Strength Training' : 'Cardio & Mobility',
      },
      study: {
        hours: 2.5,
        subjects: 'Systems Architecture & TypeScript',
        focusSessions: 3,
      },
      screenTime: {
        actualMins: 210 - (i % 4) * 20,
        targetMins: 240,
      },
    });
  }

  // Focus sessions
  const focusSessions: FocusSession[] = [
    {
      id: 'focus-1',
      habitId: 'habit-4',
      habitName: 'Deep Work & Focus Session',
      date: today,
      durationMinutes: 25,
      type: 'focus',
      completedAt: `${today}T10:25:00Z`,
    },
    {
      id: 'focus-2',
      habitId: 'habit-4',
      habitName: 'Deep Work & Focus Session',
      date: getDaysAgo(1),
      durationMinutes: 50,
      type: 'focus',
      completedAt: `${getDaysAgo(1)}T11:50:00Z`,
    },
    {
      id: 'focus-3',
      habitId: 'habit-5',
      habitName: 'Read Non-Fiction Book',
      date: getDaysAgo(1),
      durationMinutes: 25,
      type: 'focus',
      completedAt: `${getDaysAgo(1)}T21:25:00Z`,
    },
    {
      id: 'focus-4',
      habitId: 'habit-4',
      habitName: 'Deep Work & Focus Session',
      date: getDaysAgo(2),
      durationMinutes: 50,
      type: 'focus',
      completedAt: `${getDaysAgo(2)}T15:50:00Z`,
    },
  ];

  const profile: UserProfile = {
    id: 'usr_alex_rivera_01',
    name: 'Alex Rivera',
    fullName: 'Alex Rivera',
    username: 'alex_rivera',
    bio: 'Product Designer & Habit Architect. Focused on daily deep work and 10k morning steps.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    dob: '1995-04-18',
    gender: 'Male',
    occupation: 'Senior Product Designer',
    location: 'San Francisco, CA',
    socialLinks: {
      instagram: 'https://instagram.com/alexrivera_design',
      twitter: 'https://x.com/alexrivera',
      facebook: '',
      youtube: 'https://youtube.com/@alexriveradesign',
    },
    googleChatEmail: 'alex.rivera@gmail.com',
    joinedDate: today,
    xp: 0,
    level: 1,
    levelTitle: 'Novice',
    email: 'alex.rivera@gmail.com',
    isEmailVerified: true,
  };

  const settings: AppSettings = {
    themeMode: 'dark',
    accentColor: 'emerald',
    weekStartDay: 1, // Monday
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '12h',
    soundEnabled: true,
    browserNotifications: false,
    onboardingCompleted: true,
    googleSheets: {
      autoSync: false,
    },
  };

  const reminders: AppReminder[] = [
    {
      id: 'rem-1',
      title: 'Morning Meditation',
      subtitle: '15 mins breathwork in quiet space',
      time: '07:00',
      habitId: 'habit-2',
      status: 'completed',
      date: today,
    },
    {
      id: 'rem-2',
      title: 'Hydration Check-in',
      subtitle: 'Target: Drink glass #6 of water',
      time: '14:30',
      habitId: 'habit-1',
      status: 'upcoming',
      date: today,
    },
    {
      id: 'rem-3',
      title: 'Evening Workout Session',
      subtitle: '45 mins strength & mobility training',
      time: '17:30',
      habitId: 'habit-3',
      status: 'upcoming',
      date: today,
    },
    {
      id: 'rem-4',
      title: 'Wind-Down & Book Reading',
      subtitle: '20 pages before turning off lights',
      time: '21:00',
      habitId: 'habit-5',
      status: 'upcoming',
      date: today,
    },
  ];

  return {
    habits,
    logs,
    goals,
    challenges,
    achievements,
    routines,
    moodLogs,
    wellnessLogs,
    focusSessions,
    profile,
    settings,
    deletedHabits: [],
    reminders,
  };
};

export const loadAppData = (): AppData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialData();
      saveAppData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    // Ensure all critical fields exist
    if (!parsed.habits || !Array.isArray(parsed.habits)) {
      const initial = getInitialData();
      saveAppData(initial);
      return initial;
    }

    // Sanitize any stale demo profile or pre-filled dummy data from prior versions
    if (parsed.profile) {
      if (parsed.profile.xp === 2850 && parsed.profile.name === 'Alex Vance') {
        parsed.profile.name = '';
        parsed.profile.username = '';
        parsed.profile.xp = 0;
        parsed.profile.level = 1;
        parsed.profile.levelTitle = 'Novice';
        parsed.profile.email = '';
      }
    }

    return {
      ...getInitialData(),
      ...parsed,
    };
  } catch (err) {
    console.error('Error loading app data, resetting to defaults:', err);
    const initial = getInitialData();
    saveAppData(initial);
    return initial;
  }
};

export const saveAppData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving app data to localStorage:', err);
  }
};

export const exportJSON = (data: AppData): string => {
  return JSON.stringify(data, null, 2);
};

export const importJSON = (jsonString: string): AppData => {
  const parsed = JSON.parse(jsonString);
  if (!parsed.habits || !Array.isArray(parsed.habits)) {
    throw new Error('Invalid backup file: missing habits array');
  }
  // Merge safely with initial schema
  const merged: AppData = {
    ...getInitialData(),
    ...parsed,
  };
  saveAppData(merged);
  return merged;
};

export const exportCSV = (habits: Habit[], logs: HabitLog[]): string => {
  const habitMap = new Map(habits.map((h) => [h.id, h.name]));
  const headers = ['Date', 'Habit ID', 'Habit Name', 'Logged Value', 'Target Value', 'Completed', 'Completed At', 'Notes'];
  const rows = logs.map((l) => [
    `"${l.date}"`,
    `"${l.habitId}"`,
    `"${habitMap.get(l.habitId) || 'Unknown'}"`,
    l.value,
    l.targetValue,
    l.completed ? 'TRUE' : 'FALSE',
    `"${l.completedAt || ''}"`,
    `"${(l.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
};

export const resetAppData = (): AppData => {
  localStorage.removeItem(STORAGE_KEY);
  const initial = getInitialData();
  saveAppData(initial);
  return initial;
};
