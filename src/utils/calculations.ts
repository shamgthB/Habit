import { Habit, HabitLog, LifeScoreBreakdown, WellnessTrackers, FocusSession, Goal } from '../types';
import { getDayOfWeek, getDaysAgo, getTodayDateString, addDays } from './dateUtils';

// Check if a habit is scheduled for a specific date
export const isHabitScheduledForDate = (habit: Habit, dateString: string): boolean => {
  // If habit was created after this date, not scheduled
  if (habit.startDate && habit.startDate > dateString) {
    return false;
  }
  // If habit has an end date and this date is after, not scheduled
  if (habit.endDate && habit.endDate < dateString) {
    return false;
  }

  const dayOfWeek = getDayOfWeek(dateString);

  switch (habit.frequency) {
    case 'daily':
      return true;
    case 'weekly_days':
      return habit.frequencyDays ? habit.frequencyDays.includes(dayOfWeek) : true;
    case 'times_per_week':
    case 'times_per_month':
    case 'custom':
      // For flexible frequency, it's active unless explicitly marked as a scheduled rest day
      return true;
    default:
      return true;
  }
};

// Check if a specific date is a rest day for a habit
export const isHabitRestDay = (habit: Habit, dateString: string): boolean => {
  const dayOfWeek = getDayOfWeek(dateString);
  return !!(habit.restDays && habit.restDays.includes(dayOfWeek));
};

// Calculate streak for a single habit
export interface HabitStreakResult {
  currentStreak: number;
  longestStreak: number;
  completedDates: Set<string>;
  totalCompletions: number;
}

export const calculateHabitStreak = (
  habit: Habit,
  logs: HabitLog[],
  today: string = getTodayDateString()
): HabitStreakResult => {
  // Create a fast lookup for habit logs by date
  const logMap = new Map<string, HabitLog>();
  logs.forEach((l) => {
    if (l.habitId === habit.id) {
      logMap.set(l.date, l);
    }
  });

  const completedDates = new Set<string>();
  let totalCompletions = 0;

  logMap.forEach((l) => {
    if (l.completed) {
      completedDates.add(l.date);
      totalCompletions++;
    }
  });

  // Calculate current streak backward from today (or yesterday if today is not yet completed)
  let currentStreak = 0;
  let currentDate = today;

  const todayLog = logMap.get(today);
  const todayScheduled = isHabitScheduledForDate(habit, today);
  const todayRest = isHabitRestDay(habit, today);

  // If today is completed, count it
  if (todayLog && todayLog.completed) {
    currentStreak++;
    currentDate = getDaysAgo(1);
  } else if (!todayScheduled || todayRest || (todayLog && todayLog.isSkipped)) {
    // Today is a rest/skip day or not scheduled, start checking from yesterday without breaking
    currentDate = getDaysAgo(1);
  } else {
    // Today is not yet completed, but let's check yesterday to see if streak is still active
    currentDate = getDaysAgo(1);
  }

  // Walk backwards up to 365 days
  let consecutiveCheck = true;
  let iterDate = currentDate;

  for (let i = 0; i < 365 && consecutiveCheck; i++) {
    // If before start date, stop
    if (habit.startDate && iterDate < habit.startDate) {
      break;
    }

    const log = logMap.get(iterDate);
    const scheduled = isHabitScheduledForDate(habit, iterDate);
    const rest = isHabitRestDay(habit, iterDate);

    if (log && log.completed) {
      currentStreak++;
    } else if (rest || (log && log.isSkipped) || (log && log.isRestDay) || !scheduled) {
      // Protected day: streak does not increment, but does not break
    } else {
      // Missed a scheduled day
      consecutiveCheck = false;
    }

    iterDate = addDays(iterDate, -1);
  }

  // Calculate longest streak across history
  // Sort all unique logged dates
  const sortedDates = Array.from(
    new Set([...Array.from(logMap.keys()), habit.startDate || today])
  ).sort();

  let longestStreak = currentStreak;
  let runningStreak = 0;

  if (sortedDates.length > 0) {
    let checkDate = sortedDates[0];
    const endDate = today;

    while (checkDate <= endDate) {
      const scheduled = isHabitScheduledForDate(habit, checkDate);
      const rest = isHabitRestDay(habit, checkDate);
      const log = logMap.get(checkDate);

      if (log && log.completed) {
        runningStreak++;
        if (runningStreak > longestStreak) {
          longestStreak = runningStreak;
        }
      } else if (rest || (log && log.isSkipped) || (log && log.isRestDay) || !scheduled) {
        // Protected day
      } else {
        runningStreak = 0;
      }

      checkDate = addDays(checkDate, 1);
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    completedDates,
    totalCompletions,
  };
};

// Calculate Global Streaks across all active habits
export const calculateGlobalStreak = (
  habits: Habit[],
  logs: HabitLog[],
  today: string = getTodayDateString()
): { currentStreak: number; bestStreak: number } => {
  const activeHabits = habits.filter((h) => !h.isArchived);
  if (activeHabits.length === 0) return { currentStreak: 0, bestStreak: 0 };

  let currentStreak = 0;
  let bestStreak = 0;
  let running = 0;

  // Check last 60 days
  for (let i = 0; i < 60; i++) {
    const date = getDaysAgo(i);
    const scheduledHabits = activeHabits.filter((h) => isHabitScheduledForDate(h, date) && !isHabitRestDay(h, date));
    if (scheduledHabits.length === 0) continue;

    const completedCount = scheduledHabits.filter((h) => {
      const log = logs.find((l) => l.habitId === h.id && l.date === date);
      return log && log.completed;
    }).length;

    // A successful day has at least 70% of scheduled habits completed
    const dayRatio = completedCount / scheduledHabits.length;
    if (dayRatio >= 0.7) {
      if (i === currentStreak) {
        currentStreak++;
      }
      running++;
      if (running > bestStreak) bestStreak = running;
    } else {
      if (i === 0) {
        // Today might still be in progress
      } else {
        running = 0;
      }
    }
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak, 14), // baseline realistic minimum
  };
};

// Calculate Overall Life Score (0 - 100)
export const calculateLifeScore = (
  habits: Habit[],
  logs: HabitLog[],
  goals: Goal[],
  wellnessList: WellnessTrackers[],
  focusSessions: FocusSession[],
  today: string = getTodayDateString()
): LifeScoreBreakdown => {
  const activeHabits = habits.filter((h) => !h.isArchived);

  // 1. Habit Consistency Score (0-35 points)
  // Look at last 14 days
  let totalScheduled = 0;
  let totalCompleted = 0;
  for (let i = 0; i < 14; i++) {
    const date = getDaysAgo(i);
    activeHabits.forEach((h) => {
      if (isHabitScheduledForDate(h, date) && !isHabitRestDay(h, date)) {
        totalScheduled++;
        const log = logs.find((l) => l.habitId === h.id && l.date === date);
        if (log && log.completed) totalCompleted++;
      }
    });
  }
  const habitRate = totalScheduled > 0 ? totalCompleted / totalScheduled : 0.8;
  const habitScore = Math.round(habitRate * 35);

  // 2. Streak Consistency Score (0-20 points)
  let maxPossibleStreakPoints = 0;
  activeHabits.forEach((h) => {
    const streakRes = calculateHabitStreak(h, logs, today);
    if (streakRes.currentStreak >= 14) maxPossibleStreakPoints += 20;
    else if (streakRes.currentStreak >= 7) maxPossibleStreakPoints += 15;
    else if (streakRes.currentStreak >= 3) maxPossibleStreakPoints += 10;
    else maxPossibleStreakPoints += 5;
  });
  const avgStreakScore = activeHabits.length > 0
    ? Math.min(20, Math.round(maxPossibleStreakPoints / activeHabits.length))
    : 16;

  // 3. Goal Progress Score (0-15 points)
  let goalScore = 12;
  if (goals.length > 0) {
    const totalGoalPercent = goals.reduce((acc, g) => {
      const pct = g.targetCount > 0 ? Math.min(1, g.currentCount / g.targetCount) : 1;
      return acc + pct;
    }, 0);
    goalScore = Math.round((totalGoalPercent / goals.length) * 15);
  }

  // 4. Wellness Score (0-15 points)
  // Check water and sleep for recent entries
  const recentWellness = wellnessList.slice(0, 7);
  let wellnessPoints = 12;
  if (recentWellness.length > 0) {
    let earned = 0;
    recentWellness.forEach((w) => {
      if (w.water && w.water.current >= w.water.target * 0.75) earned += 1;
      if (w.sleep && w.sleep.durationHours >= 7 && w.sleep.durationHours <= 9) earned += 1;
    });
    wellnessPoints = Math.round((earned / (recentWellness.length * 2)) * 15);
  }

  // 5. Focus Score (0-15 points)
  // Weekly focus minutes (ideal: 150+ minutes per week)
  const recentFocus = focusSessions.filter((s) => s.date >= getDaysAgo(7));
  const totalFocusMins = recentFocus.reduce((acc, s) => acc + s.durationMinutes, 0);
  const focusScore = Math.min(15, Math.round((totalFocusMins / 150) * 15));

  const overallScore = Math.min(
    100,
    Math.max(20, habitScore + avgStreakScore + goalScore + wellnessPoints + focusScore)
  );

  return {
    overallScore,
    habitConsistencyScore: habitScore,
    streakScore: avgStreakScore,
    goalProgressScore: goalScore,
    wellnessScore: wellnessPoints,
    focusScore,
    details: [
      `Habit Completion: ${Math.round(habitRate * 100)}% consistency over past 14 days (+${habitScore}/35 pts)`,
      `Streak Health: Active consecutive habit streaks (+${avgStreakScore}/20 pts)`,
      `Goal Trajectory: Milestone progression across active goals (+${goalScore}/15 pts)`,
      `Wellness Balance: Hydration & sleep restoration balance (+${wellnessPoints}/15 pts)`,
      `Deep Focus: ${totalFocusMins} mins focused deep work logged this week (+${focusScore}/15 pts)`,
    ],
  };
};

// Level and XP progression definitions
export interface LevelInfo {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  nextLevelXp: number;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, title: 'Beginner', minXp: 0, maxXp: 250, nextLevelXp: 250 },
  { level: 2, title: 'Starter', minXp: 250, maxXp: 750, nextLevelXp: 750 },
  { level: 3, title: 'Consistent', minXp: 750, maxXp: 1500, nextLevelXp: 1500 },
  { level: 4, title: 'Disciplined', minXp: 1500, maxXp: 3000, nextLevelXp: 3000 },
  { level: 5, title: 'Pro', minXp: 3000, maxXp: 5000, nextLevelXp: 5000 },
  { level: 6, title: 'Master', minXp: 5000, maxXp: 8000, nextLevelXp: 8000 },
  { level: 7, title: 'Habit Legend', minXp: 8000, maxXp: 15000, nextLevelXp: 15000 },
];

export const getLevelForXp = (xp: number): LevelInfo => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
};
