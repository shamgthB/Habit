import { Habit, HabitLog, Goal, GoalType } from '../types';
import { getPastDaysArray, getTodayDateString, getDaysAgo } from '../utils/dateUtils';
import { isHabitScheduledForDate, calculateHabitStreak } from '../utils/calculations';

export interface SmartGoalSuggestion {
  id: string;
  title: string;
  description: string;
  type: GoalType;
  targetCount: number;
  deadlineDays: number;
  deadlineDate: string; // YYYY-MM-DD
  relatedHabitIds: string[];
  relatedHabitNames: string[];
  category: string;
  tier: 'Starter Win' | 'Momentum Builder' | 'Mastery Challenge' | 'Habit Stacking';
  difficulty: 'Easy' | 'Moderate' | 'Ambitious';
  estimatedXp: number;
  rationale: string;
}

export interface SmartGoalDiagnostic {
  anchorHabit: string;
  anchorStreak: number;
  growthVector: string;
  growthRate: number;
  coachingRationale: string;
  overallConsistency: number;
  activeGoalsCount: number;
}

export interface SmartGoalResponse {
  diagnostic: SmartGoalDiagnostic;
  suggestions: SmartGoalSuggestion[];
  isAiGenerated: boolean;
  generatedAt: string;
}

const STORAGE_CACHE_KEY_PREFIX = 'aura_smart_goal_suggestions_';

export interface AnalyzedHabitPerformance {
  id: string;
  name: string;
  category: string;
  streak: number;
  completionRate30d: number;
  completionCount30d: number;
  scheduledDaysCount30d: number;
  trend: 'accelerating' | 'steady' | 'lagging';
}

/**
 * Evaluates 30-day historical performance for active habits
 */
export function analyzeHabitPerformance(
  habits: Habit[],
  logs: HabitLog[]
): {
  analyzedHabits: AnalyzedHabitPerformance[];
  anchorHabit?: AnalyzedHabitPerformance;
  laggingHabit?: AnalyzedHabitPerformance;
  overallConsistency: number;
} {
  const activeHabits = habits.filter((h) => !h.isArchived);
  const past30Days = getPastDaysArray(30);

  let totalScheduled = 0;
  let totalCompleted = 0;

  const analyzedHabits: AnalyzedHabitPerformance[] = activeHabits.map((habit) => {
    const habitLogs = logs.filter(
      (l) => l.habitId === habit.id && past30Days.includes(l.date) && l.completed
    );

    const scheduledDays = past30Days.filter((d) => isHabitScheduledForDate(habit, d)).length || 1;
    const rate = Math.min(100, Math.round((habitLogs.length / scheduledDays) * 100));

    totalScheduled += scheduledDays;
    totalCompleted += habitLogs.length;

    // Evaluate recent 7-day trend vs earlier
    const past7Days = past30Days.slice(-7);
    const recentLogs = habitLogs.filter((l) => past7Days.includes(l.date));
    const recentScheduled = past7Days.filter((d) => isHabitScheduledForDate(habit, d)).length || 1;
    const recentRate = Math.round((recentLogs.length / recentScheduled) * 100);

    let trend: 'accelerating' | 'steady' | 'lagging' = 'steady';
    if (recentRate > rate + 10) trend = 'accelerating';
    else if (recentRate < rate - 15) trend = 'lagging';

    const streakRes = calculateHabitStreak(habit, logs);

    return {
      id: habit.id,
      name: habit.name,
      category: habit.category,
      streak: streakRes.currentStreak,
      completionRate30d: rate,
      completionCount30d: habitLogs.length,
      scheduledDaysCount30d: scheduledDays,
      trend,
    };
  });

  analyzedHabits.sort((a, b) => {
    // Primary sort: completion rate, secondary sort: streak
    if (b.completionRate30d !== a.completionRate30d) {
      return b.completionRate30d - a.completionRate30d;
    }
    return b.streak - a.streak;
  });

  const anchorHabit = analyzedHabits[0];
  const laggingHabit = analyzedHabits.length > 1 ? analyzedHabits[analyzedHabits.length - 1] : undefined;
  const overallConsistency = totalScheduled > 0 ? Math.min(100, Math.round((totalCompleted / totalScheduled) * 100)) : 70;

  return {
    analyzedHabits,
    anchorHabit,
    laggingHabit,
    overallConsistency,
  };
}

/**
 * Intelligent behavioral heuristics engine for local instant fallback suggestions
 */
export function generateLocalSmartGoalSuggestions(
  habits: Habit[],
  logs: HabitLog[],
  goals: Goal[],
  strategy: string = 'all'
): SmartGoalResponse {
  const { analyzedHabits, anchorHabit, laggingHabit, overallConsistency } = analyzeHabitPerformance(habits, logs);
  const activeHabitIdsWithGoals = new Set<string>();
  goals.filter((g) => !g.completed).forEach((g) => g.relatedHabitIds.forEach((id) => activeHabitIdsWithGoals.add(id)));

  const suggestions: SmartGoalSuggestion[] = [];

  // 1. High momentum streak anchor goal
  if (anchorHabit) {
    const nextMilestone = anchorHabit.streak >= 25 ? 50 : anchorHabit.streak >= 14 ? 30 : anchorHabit.streak >= 7 ? 21 : 14;
    suggestions.push({
      id: `sugg-anchor-${anchorHabit.id}`,
      title: `${anchorHabit.name}: ${nextMilestone}-Day Streak Lock`,
      description: `Capitalize on your proven momentum in ${anchorHabit.name}. Research shows reaching ${nextMilestone} consecutive days establishes deep neuroplastic automaticity.`,
      type: nextMilestone <= 7 ? '7_day' : nextMilestone <= 30 ? '30_day' : '90_day',
      targetCount: nextMilestone,
      deadlineDays: nextMilestone + 5,
      deadlineDate: getDaysAgo(-(nextMilestone + 5)),
      relatedHabitIds: [anchorHabit.id],
      relatedHabitNames: [anchorHabit.name],
      category: anchorHabit.category,
      tier: 'Mastery Challenge',
      difficulty: nextMilestone > 21 ? 'Ambitious' : 'Moderate',
      estimatedXp: 120,
      rationale: `Historical anchor: ${anchorHabit.name} has your highest 30-day reliability (${anchorHabit.completionRate30d}%). Expanding this target cements life mastery.`,
    });
  }

  // 2. Habit Stacking or Recovery Goal for developing habit
  if (laggingHabit && laggingHabit.id !== anchorHabit?.id) {
    const targetRepetitions = 10;
    const deadlineDays = 14;
    suggestions.push({
      id: `sugg-stack-${laggingHabit.id}`,
      title: `Stack ${laggingHabit.name} After ${anchorHabit?.name || 'Morning Win'}`,
      description: `Anchor your ${laggingHabit.name} directly behind ${anchorHabit?.name || 'your top habit'}. Complete 10 check-ins over the next 2 weeks to eliminate resistance.`,
      type: '7_day',
      targetCount: targetRepetitions,
      deadlineDays: deadlineDays,
      deadlineDate: getDaysAgo(-deadlineDays),
      relatedHabitIds: [laggingHabit.id, ...(anchorHabit ? [anchorHabit.id] : [])],
      relatedHabitNames: [laggingHabit.name, ...(anchorHabit ? [anchorHabit.name] : [])],
      category: laggingHabit.category,
      tier: 'Habit Stacking',
      difficulty: 'Easy',
      estimatedXp: 80,
      rationale: `${laggingHabit.name} has shown friction (${laggingHabit.completionRate30d}% rate). Stacking it behind an automated routine reduces decision fatigue by over 70%.`,
    });
  }

  // 3. Category Expansion or Multi-Habit Sprint
  const habitsNeedingGoals = analyzedHabits.filter((h) => !activeHabitIdsWithGoals.has(h.id));
  const focusHabit = habitsNeedingGoals[0] || analyzedHabits[1] || analyzedHabits[0];

  if (focusHabit) {
    suggestions.push({
      id: `sugg-sprint-${focusHabit.id}`,
      title: `21-Day ${focusHabit.category} Discipline Sprint`,
      description: `Focus on consistent daily check-ins for ${focusHabit.name}. 21 repetitions build subconscious identity change and protect your weekend baseline.`,
      type: '30_day',
      targetCount: 21,
      deadlineDays: 25,
      deadlineDate: getDaysAgo(-25),
      relatedHabitIds: [focusHabit.id],
      relatedHabitNames: [focusHabit.name],
      category: focusHabit.category,
      tier: 'Momentum Builder',
      difficulty: 'Moderate',
      estimatedXp: 90,
      rationale: `Targeting 21 completions over 25 days provides buffer for unpredictable schedules while preserving habit integrity.`,
    });
  }

  // 4. All-Rounder Peak Consistency Objective
  if (analyzedHabits.length >= 2) {
    const topTwo = analyzedHabits.slice(0, 2);
    suggestions.push({
      id: `sugg-mastery-duo`,
      title: `Core Foundation 30-Check-in Milestone`,
      description: `Target 30 combined check-ins between ${topTwo.map((h) => h.name).join(' and ')} to cement a dual-pillar daily routine.`,
      type: '30_day',
      targetCount: 30,
      deadlineDays: 30,
      deadlineDate: getDaysAgo(-30),
      relatedHabitIds: topTwo.map((h) => h.id),
      relatedHabitNames: topTwo.map((h) => h.name),
      category: topTwo[0].category,
      tier: 'Starter Win',
      difficulty: 'Moderate',
      estimatedXp: 100,
      rationale: `Combining your two primary habits creates synergistic momentum across both morning and evening routines.`,
    });
  }

  // Filter by strategy if needed
  let filteredSuggestions = suggestions;
  if (strategy === 'streak_mastery') {
    filteredSuggestions = suggestions.filter((s) => s.tier === 'Mastery Challenge' || s.title.includes('Streak'));
  } else if (strategy === 'habit_stacking') {
    filteredSuggestions = suggestions.filter((s) => s.tier === 'Habit Stacking');
  } else if (strategy === 'momentum_builder') {
    filteredSuggestions = suggestions.filter((s) => s.tier === 'Momentum Builder' || s.tier === 'Starter Win');
  }

  if (filteredSuggestions.length === 0) {
    filteredSuggestions = suggestions;
  }

  return {
    diagnostic: {
      anchorHabit: anchorHabit ? `${anchorHabit.name} (${anchorHabit.streak}d streak)` : 'Daily Routines',
      anchorStreak: anchorHabit ? anchorHabit.streak : 0,
      growthVector: laggingHabit ? `${laggingHabit.name} (${laggingHabit.completionRate30d}% completion)` : 'Daily Consistency',
      growthRate: laggingHabit ? laggingHabit.completionRate30d : overallConsistency,
      coachingRationale: anchorHabit
        ? `Anchor goals to "${anchorHabit.name}" to leverage existing neural pathways while systematically leveling up consistency.`
        : 'Establish initial micro-milestones to build execution consistency across your daily routines.',
      overallConsistency,
      activeGoalsCount: goals.filter((g) => !g.completed).length,
    },
    suggestions: filteredSuggestions,
    isAiGenerated: false,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Fetch AI-powered Smart Goal recommendations from the backend route with caching and fallback
 */
export async function getSmartGoalSuggestions(
  habits: Habit[],
  logs: HabitLog[],
  goals: Goal[],
  userName?: string,
  strategy: string = 'all',
  forceRefresh: boolean = false
): Promise<SmartGoalResponse> {
  const today = getTodayDateString();
  const cacheKey = `${STORAGE_CACHE_KEY_PREFIX}${today}_${strategy}`;

  // 1. Check local cache
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as SmartGoalResponse;
        if (parsed.suggestions && parsed.suggestions.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore cache errors
    }
  }

  const { analyzedHabits, anchorHabit, laggingHabit, overallConsistency } = analyzeHabitPerformance(habits, logs);
  const activeGoals = goals.filter((g) => !g.completed);

  // 2. Call backend Gemini API endpoint
  try {
    const res = await fetch('/api/smart-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: userName || 'Builder',
        habits: analyzedHabits,
        anchorHabit,
        laggingHabit,
        overallConsistency,
        activeGoals: activeGoals.map((g) => ({
          id: g.id,
          title: g.title,
          type: g.type,
          targetCount: g.targetCount,
          currentCount: g.currentCount,
          deadline: g.deadline,
          relatedHabitIds: g.relatedHabitIds,
        })),
        strategy,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.suggestions?.length > 0) {
        // Hydrate suggestions with deadlineDate and habit names
        const enrichedSuggestions: SmartGoalSuggestion[] = data.suggestions.map((s: any, idx: number) => {
          const matchedHabits = habits.filter((h) => s.relatedHabitIds?.includes(h.id));
          const deadlineDays = s.deadlineDays || (s.type === '7_day' ? 7 : s.type === '30_day' ? 30 : s.type === '90_day' ? 90 : 365);
          return {
            id: s.id || `smart-goal-${Date.now()}-${idx}`,
            title: s.title,
            description: s.description,
            type: s.type || '30_day',
            targetCount: Number(s.targetCount) || (s.type === '7_day' ? 7 : 30),
            deadlineDays,
            deadlineDate: s.deadlineDate || getDaysAgo(-deadlineDays),
            relatedHabitIds: s.relatedHabitIds?.length ? s.relatedHabitIds : habits.slice(0, 1).map((h) => h.id),
            relatedHabitNames: matchedHabits.length ? matchedHabits.map((h) => h.name) : [habits[0]?.name || 'Habit'],
            category: s.category || matchedHabits[0]?.category || 'Personal',
            tier: s.tier || 'Momentum Builder',
            difficulty: s.difficulty || 'Moderate',
            estimatedXp: s.estimatedXp || (s.targetCount > 30 ? 150 : 80),
            rationale: s.rationale || 'Suggested based on your historical consistency and streak momentum.',
          };
        });

        const result: SmartGoalResponse = {
          diagnostic: data.diagnostic || {
            anchorHabit: anchorHabit ? `${anchorHabit.name} (${anchorHabit.streak}d streak)` : 'Daily Routines',
            anchorStreak: anchorHabit ? anchorHabit.streak : 0,
            growthVector: laggingHabit ? `${laggingHabit.name} (${laggingHabit.completionRate30d}%)` : 'Consistency',
            growthRate: laggingHabit ? laggingHabit.completionRate30d : overallConsistency,
            coachingRationale: 'Personalized objectives calibrated to your historical completion velocity.',
            overallConsistency,
            activeGoalsCount: activeGoals.length,
          },
          suggestions: enrichedSuggestions,
          isAiGenerated: true,
          generatedAt: new Date().toISOString(),
        };

        try {
          localStorage.setItem(cacheKey, JSON.stringify(result));
        } catch {
          // Ignore storage quota
        }

        return result;
      }
    }
  } catch (err) {
    console.warn('Smart Goal Assistant API call failed, falling back to local behavioral engine:', err);
  }

  // 3. Fallback to behavioral engine
  const fallback = generateLocalSmartGoalSuggestions(habits, logs, goals, strategy);
  try {
    localStorage.setItem(cacheKey, JSON.stringify(fallback));
  } catch {
    // Ignore storage quota
  }
  return fallback;
}
