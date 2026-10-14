export type HabitCategory =
  | 'Health'
  | 'Fitness'
  | 'Study'
  | 'Work'
  | 'Personal'
  | 'Finance'
  | 'Mindfulness'
  | 'Sleep'
  | 'Productivity'
  | 'Other';

export type HabitFrequency =
  | 'daily'
  | 'weekly_days'
  | 'times_per_week'
  | 'times_per_month'
  | 'custom';

export type HabitDifficulty = 'easy' | 'medium' | 'hard';
export type HabitPriority = 'low' | 'medium' | 'high';

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: HabitCategory;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  frequencyDays: number[]; // 0 = Sun, 1 = Mon ... 6 = Sat
  frequencyTargetCount: number; // e.g. 3 times per week
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  targetValue: number; // e.g. 8 (glasses), 45 (minutes), 1 (boolean)
  unit: string; // 'times', 'glasses', 'mins', 'pages', 'hours', 'km'
  reminderTime?: string; // HH:mm
  difficulty: HabitDifficulty;
  priority: HabitPriority;
  notes: string;
  streakGoal?: number; // Target streak in days
  isArchived: boolean;
  isPinned: boolean;
  order: number;
  createdAt: string;
  restDays?: number[]; // days where habit is exempted from breaking streak
  notificationChannel?: NotificationChannel;
  customReminderTimes?: string[]; // e.g. ['08:00', '13:00']
  aiNudgeEnabled?: boolean;
  notificationEmail?: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  value: number; // Current logged value
  targetValue: number;
  completed: boolean;
  notes?: string;
  mood?: 'very_happy' | 'happy' | 'neutral' | 'sad' | 'stressed';
  completedAt?: string;
  isSkipped?: boolean;
  isRestDay?: boolean;
}

export type GoalType = '7_day' | '30_day' | '90_day' | 'yearly' | 'custom';

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: GoalType;
  targetCount: number;
  currentCount: number;
  deadline: string;
  relatedHabitIds: string[];
  completed: boolean;
  createdAt: string;
}

export type ChallengeType = 'weekly' | 'monthly' | 'custom';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  badge: string;
  xpReward: number;
  type: ChallengeType;
  target: number;
  current: number;
  unit: string;
  startDate: string;
  endDate: string;
  completed: boolean;
  joined: boolean;
  relatedHabitId?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'Streaks' | 'Milestones' | 'Mastery' | 'Special';
  xp: number;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  habitIds: string[];
  estimatedMinutes: number;
  reminderTime?: string;
  icon: string;
  color: string;
}

export type MoodType = 'very_happy' | 'happy' | 'neutral' | 'sad' | 'stressed';

export interface DailyMoodEnergy {
  date: string; // YYYY-MM-DD
  mood: MoodType;
  energy: number; // 1 to 10
  note?: string;
  updatedAt: string;
}

export interface WellnessTrackers {
  date: string; // YYYY-MM-DD
  water: {
    current: number;
    target: number;
  };
  sleep: {
    durationHours: number;
    bedtime: string;
    wakeupTime: string;
  };
  exercise: {
    durationMins: number;
    activityType: string;
  };
  study: {
    hours: number;
    subjects: string;
    focusSessions: number;
  };
  screenTime: {
    actualMins: number;
    targetMins: number;
  };
}

export interface FocusSession {
  id: string;
  habitId?: string;
  habitName?: string;
  date: string;
  durationMinutes: number;
  type: 'focus' | 'break';
  completedAt: string;
}

export interface UserSocialLinks {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  fullName?: string;
  username: string;
  bio: string;
  avatar: string;
  avatarUrl?: string;
  joinedDate: string;
  xp: number;
  level: number;
  levelTitle: string;
  email?: string;
  isEmailVerified?: boolean;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Non-Binary' | 'Prefer not to say' | 'Other' | '';
  occupation?: string;
  location?: string;
  socialLinks?: UserSocialLinks;
  googleChatEmail?: string;
  googleChatSpaceUrl?: string;
}

export interface QrProfilePayload {
  app: string;
  type: 'USER_PROFILE';
  userId: string;
  username: string;
  gChatId: string;
  checksum: string;
}

export interface ScannedUserProfile {
  id: string;
  username: string;
  fullName: string;
  bio: string;
  avatarUrl: string;
  occupation?: string;
  location?: string;
  socialLinks?: UserSocialLinks;
  googleChatEmail?: string;
  googleChatSpaceUrl?: string;
  isEmailVerified?: boolean;
  createdAt?: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'emerald' | 'indigo' | 'violet' | 'amber' | 'rose' | 'cyan';

export interface AppSettings {
  themeMode: ThemeMode;
  accentColor: AccentColor;
  weekStartDay: 0 | 1; // 0 = Sunday, 1 = Monday
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  timeFormat: '12h' | '24h';
  soundEnabled: boolean;
  browserNotifications: boolean;
  onboardingCompleted: boolean;
  googleSheets: {
    autoSync: boolean;
    spreadsheetId?: string;
    spreadsheetUrl?: string;
    lastSyncedAt?: string;
  };
  aiNotifications?: {
    enabled: boolean;
    pushEnabled: boolean;
    emailEnabled: boolean;
    targetEmail?: string;
    tone: NotificationTone;
    autoSchedulerActive: boolean;
    lastTriggeredAt?: string;
    streakProtectionAlerts: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  };
}

export interface LifeScoreBreakdown {
  overallScore: number; // 0 - 100
  habitConsistencyScore: number;
  goalProgressScore: number;
  streakScore: number;
  wellnessScore: number;
  focusScore: number;
  details: string[];
}

export interface AppReminder {
  id: string;
  title: string;
  subtitle: string;
  time: string; // HH:mm
  habitId?: string;
  routineId?: string;
  goalId?: string;
  status: 'upcoming' | 'completed' | 'missed';
  date: string;
}

export interface HistoryItem {
  id: string;
  date: string;
  time: string;
  type: 'habit' | 'focus' | 'mood' | 'goal' | 'challenge' | 'achievement';
  title: string;
  subtitle: string;
  xp: number;
  status: 'completed' | 'in_progress' | 'unlocked';
  icon?: string;
  color?: string;
}

export type EmotionTag =
  | 'grateful'
  | 'calm'
  | 'inspired'
  | 'energized'
  | 'thoughtful'
  | 'anxious'
  | 'exhausted'
  | 'victorious';

export interface DailyJournalEntry {
  id: string;
  userId?: string;
  userEmail?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  content: string;
  emotion: EmotionTag;
  title?: string;
  tags?: string[];
  createdAt: number;
  updatedAt?: number;
}

export interface AiAdviceCard {
  title: string;
  action: string;
  rationale: string;
  impactCategory: string;
  effortLevel: 'Quick Win (2 mins)' | 'Moderate' | 'Routine Shift';
}

export interface AiHabitInsight {
  headline: string;
  trendAnalysis: string;
  consistencyScore: number;
  trendStatus: 'accelerating' | 'steady' | 'needs_focus';
  topStrength: string;
  growthOpportunity: string;
  adviceCard: AiAdviceCard;
  generatedAt?: string;
  isAiGenerated?: boolean;
}

export type NotificationChannel = 'push' | 'email' | 'both' | 'none';
export type NotificationTone = 'motivational' | 'gentle' | 'behavioral' | 'urgent';

export interface AiNotificationAlert {
  id: string;
  habitId?: string;
  habitName: string;
  habitCategory?: string;
  title: string;
  body: string;
  callToAction: string;
  scienceTip?: string;
  channel: 'push' | 'email' | 'both';
  status: 'sent' | 'pending' | 'failed';
  scheduledTime: string;
  sentAt: string;
  urgencyLevel: 'normal' | 'streak_risk' | 'celebration' | 'milestone';
  streakDays: number;
  emailSentTo?: string;
  isAiGenerated: boolean;
}

export interface ScheduleRecommendation {
  habitId: string;
  habitName: string;
  category: string;
  currentReminderTime?: string;
  recommendedTime: string;
  rationale: string;
}
