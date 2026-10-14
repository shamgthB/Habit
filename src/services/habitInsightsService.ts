import { Habit, HabitLog, AiHabitInsight } from '../types';
import { getTodayDateString, getPastDaysArray } from '../utils/dateUtils';
import { isHabitScheduledForDate } from '../utils/calculations';

const STORAGE_CACHE_KEY_PREFIX = 'aura_ai_habit_insights_';

export interface Habit7DaySummary {
  days: {
    date: string;
    dayName: string;
    completedCount: number;
    totalScheduled: number;
    completionRate: number;
    completedHabits: string[];
  }[];
  habits: {
    id: string;
    name: string;
    category: string;
    completedDaysCount: number;
    completionRate: number;
    targetValue: number;
    unit: string;
  }[];
  summary: {
    overallCompletionRate: number;
    totalCompletedLogs: number;
    activeHabitsCount: number;
    bestDay: string;
    lowestDay: string;
  };
}

/**
 * Aggregates user's completed habit trends over the past 7 days
 */
export function calculate7DayHabitTrends(habits: Habit[], logs: HabitLog[]): Habit7DaySummary {
  const activeHabits = habits.filter((h) => !h.isArchived);
  const past7Days = getPastDaysArray(7);

  let totalScheduledCount = 0;
  let totalCompletedCount = 0;

  const days = past7Days.map((dateStr) => {
    const dateObj = new Date(dateStr);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

    // Scheduled habits for this day
    const scheduledForDay = activeHabits.filter((h) => isHabitScheduledForDate(h, dateStr));
    const scheduledCount = Math.max(scheduledForDay.length, 1);

    // Completed logs for this day
    const completedForDay = logs.filter((l) => l.date === dateStr && l.completed);
    const completedHabitNames = completedForDay
      .map((l) => activeHabits.find((h) => h.id === l.habitId)?.name)
      .filter((n): n is string => Boolean(n));

    const completionRate = Math.min(100, Math.round((completedForDay.length / scheduledCount) * 100));

    totalScheduledCount += scheduledCount;
    totalCompletedCount += completedForDay.length;

    return {
      date: dateStr,
      dayName,
      completedCount: completedForDay.length,
      totalScheduled: scheduledCount,
      completionRate,
      completedHabits: completedHabitNames,
    };
  });

  const habitsPerformance = activeHabits.map((habit) => {
    const habitCompletedLogs = logs.filter(
      (l) => l.habitId === habit.id && past7Days.includes(l.date) && l.completed
    );
    const scheduledDaysCount = past7Days.filter((d) => isHabitScheduledForDate(habit, d)).length || 1;
    const rate = Math.min(100, Math.round((habitCompletedLogs.length / scheduledDaysCount) * 100));

    return {
      id: habit.id,
      name: habit.name,
      category: habit.category,
      completedDaysCount: habitCompletedLogs.length,
      completionRate: rate,
      targetValue: habit.targetValue,
      unit: habit.unit,
    };
  });

  // Sort habits by completion rate descending
  habitsPerformance.sort((a, b) => b.completionRate - a.completionRate);

  // Best & lowest day
  const sortedDays = [...days].sort((a, b) => b.completionRate - a.completionRate);
  const bestDay = sortedDays[0] ? `${sortedDays[0].dayName} (${sortedDays[0].completionRate}%)` : 'N/A';
  const lowestDay = sortedDays[sortedDays.length - 1]
    ? `${sortedDays[sortedDays.length - 1].dayName} (${sortedDays[sortedDays.length - 1].completionRate}%)`
    : 'N/A';

  const overallCompletionRate = totalScheduledCount > 0
    ? Math.min(100, Math.round((totalCompletedCount / totalScheduledCount) * 100))
    : 0;

  return {
    days,
    habits: habitsPerformance,
    summary: {
      overallCompletionRate,
      totalCompletedLogs: totalCompletedCount,
      activeHabitsCount: activeHabits.length,
      bestDay,
      lowestDay,
    },
  };
}

/**
 * Intelligent behavioral science fallback advice generator based on actual user metrics
 */
function generateFallbackInsight(stats: Habit7DaySummary, userName?: string): AiHabitInsight {
  const { summary, habits } = stats;
  const topHabit = habits[0];
  const laggingHabit = habits.length > 1 ? habits[habits.length - 1] : habits[0];

  const rate = summary.overallCompletionRate;
  let headline = 'Solid Habit Foundation Built Over 7 Days';
  let trendStatus: 'accelerating' | 'steady' | 'needs_focus' = 'steady';

  if (rate >= 80) {
    headline = 'High Momentum: Peak 7-Day Performance';
    trendStatus = 'accelerating';
  } else if (rate < 60) {
    headline = 'Friction Detected: Time to Reset System Baseline';
    trendStatus = 'needs_focus';
  }

  const strengthName = topHabit ? `${topHabit.name} (${topHabit.completionRate}% completion)` : 'Daily Routines';
  const growthName = laggingHabit && laggingHabit.completionRate < 100
    ? `${laggingHabit.name} (${laggingHabit.completionRate}% completion)`
    : 'Weekend Execution';

  return {
    headline,
    trendAnalysis: `Over the past 7 days, you reached a ${rate}% completion rate across ${summary.activeHabitsCount} tracked habits. Your strongest momentum occurred on ${summary.bestDay}, while ${summary.lowestDay} presented noticeable friction.`,
    consistencyScore: Math.min(100, Math.max(30, rate)),
    trendStatus,
    topStrength: strengthName,
    growthOpportunity: growthName,
    adviceCard: {
      title: laggingHabit
        ? `Stack "${laggingHabit.name}" Immediately After Your Morning Win`
        : 'Protect Your Peak Flow Block',
      action: laggingHabit
        ? `Execute a 2-minute starter version of "${laggingHabit.name}" directly following ${topHabit ? topHabit.name : 'your morning coffee'}.`
        : 'Block 15 uninterrupted minutes right after waking up to secure your most important habit before reactive work begins.',
      rationale: 'Habit stacking exploits established neurological cues (the anchor habit) to bypass activation energy and decision fatigue.',
      impactCategory: 'Habit Stacking',
      effortLevel: 'Quick Win (2 mins)',
    },
    generatedAt: new Date().toISOString(),
    isAiGenerated: true,
  };
}

/**
 * Fetch AI Habit Insights using the Gemini API backend route with smart local caching and fallback
 */
export async function getAiHabitInsights(
  habits: Habit[],
  logs: HabitLog[],
  userName?: string,
  forceRefresh: boolean = false
): Promise<AiHabitInsight> {
  const today = getTodayDateString();
  const cacheKey = `${STORAGE_CACHE_KEY_PREFIX}${today}`;

  // 1. Check local cache if not forcing refresh
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as AiHabitInsight;
        return parsed;
      }
    } catch {
      // Ignore cache read errors
    }
  }

  // 2. Compute 7-day stats
  const stats = calculate7DayHabitTrends(habits, logs);

  // 3. Attempt Gemini API backend route
  try {
    const res = await fetch('/api/habit-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        days: stats.days,
        habits: stats.habits,
        summary: stats.summary,
        userName: userName || 'Builder',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.insight?.headline && data?.insight?.adviceCard) {
        const insight: AiHabitInsight = {
          ...data.insight,
          isAiGenerated: true,
          generatedAt: new Date().toISOString(),
        };

        // Cache for today
        try {
          localStorage.setItem(cacheKey, JSON.stringify(insight));
        } catch {
          // Ignore storage quotas
        }

        return insight;
      }
    }
  } catch (error) {
    console.warn('Backend Gemini API endpoint failed, generating local behavioral insight:', error);
  }

  // 4. Fallback generation
  const fallback = generateFallbackInsight(stats, userName);
  try {
    localStorage.setItem(cacheKey, JSON.stringify(fallback));
  } catch {
    // Ignore cache error
  }
  return fallback;
}
