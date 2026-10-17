import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Zap,
  Flame,
  TrendingUp,
  Target,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Sliders,
  Award,
  Lightbulb,
  ShieldCheck,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Habit, HabitLog, Goal, GoalType } from '../../types';
import {
  getSmartGoalSuggestions,
  SmartGoalResponse,
  SmartGoalSuggestion,
} from '../../services/smartGoalService';
import { CATEGORY_COLORS, DynamicIcon } from '../common/Icons';

interface SmartGoalAssistantProps {
  habits: Habit[];
  logs: HabitLog[];
  goals: Goal[];
  userName?: string;
  onAdoptGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'completed' | 'currentCount'>) => void;
  onCustomizeGoal: (prefill: {
    title: string;
    description: string;
    type: GoalType;
    targetCount: number;
    deadline: string;
    relatedHabitIds: string[];
  }) => void;
  className?: string;
}

type StrategyFilter = 'all' | 'streak_mastery' | 'momentum_builder' | 'habit_stacking';

export const SmartGoalAssistant: React.FC<SmartGoalAssistantProps> = ({
  habits,
  logs,
  goals,
  userName = 'Builder',
  onAdoptGoal,
  onCustomizeGoal,
  className = '',
}) => {
  const [data, setData] = useState<SmartGoalResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [strategy, setStrategy] = useState<StrategyFilter>('all');
  const [adoptedIds, setAdoptedIds] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load suggestions
  const loadSuggestions = useCallback(
    async (force: boolean = false) => {
      if (habits.length === 0) {
        setIsLoading(false);
        return;
      }

      if (force) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMsg(null);

      try {
        const response = await getSmartGoalSuggestions(
          habits,
          logs,
          goals,
          userName,
          strategy,
          force
        );
        setData(response);
      } catch (err: any) {
        console.error('Failed to load smart goal recommendations:', err);
        setErrorMsg('Unable to retrieve recommendations at this moment.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [habits, logs, goals, userName, strategy]
  );

  useEffect(() => {
    loadSuggestions(false);
  }, [loadSuggestions]);

  const handleAdopt = (suggestion: SmartGoalSuggestion) => {
    onAdoptGoal({
      title: suggestion.title,
      description: `${suggestion.description} • Behavioral rationale: ${suggestion.rationale}`,
      type: suggestion.type,
      targetCount: suggestion.targetCount,
      deadline: suggestion.deadlineDate,
      relatedHabitIds: suggestion.relatedHabitIds,
    });
    setAdoptedIds((prev) => new Set(prev).add(suggestion.id));
  };

  const handleCustomize = (suggestion: SmartGoalSuggestion) => {
    onCustomizeGoal({
      title: suggestion.title,
      description: suggestion.description,
      type: suggestion.type,
      targetCount: suggestion.targetCount,
      deadline: suggestion.deadlineDate,
      relatedHabitIds: suggestion.relatedHabitIds,
    });
  };

  // Filter suggestions
  const displayedSuggestions = useMemo(() => {
    if (!data?.suggestions) return [];
    if (strategy === 'all') return data.suggestions;
    if (strategy === 'streak_mastery') {
      return data.suggestions.filter(
        (s) => s.tier === 'Mastery Challenge' || s.title.toLowerCase().includes('streak')
      );
    }
    if (strategy === 'momentum_builder') {
      return data.suggestions.filter(
        (s) => s.tier === 'Momentum Builder' || s.tier === 'Starter Win'
      );
    }
    if (strategy === 'habit_stacking') {
      return data.suggestions.filter((s) => s.tier === 'Habit Stacking');
    }
    return data.suggestions;
  }, [data?.suggestions, strategy]);

  if (habits.length === 0) {
    return (
      <div className="p-6 rounded-[24px] bg-white/70 dark:bg-[#141722]/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              AI Smart Goal Assistant
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create at least one habit to unlock personalized milestone objectives and behavioral recommendations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[26px] bg-white/80 dark:bg-[#141722]/85 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.4)] transition-all ${className}`}
    >
      {/* Ambient background aura glow */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-indigo-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-72 h-72 rounded-full bg-gradient-to-tr from-cyan-500/10 via-emerald-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 p-5 sm:p-6 border-b border-slate-200/70 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Smart Goal Assistant
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Gemini Powered
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
                Behavioral AI
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Analyzes your historical habit consistency, anchor routines, and suggests high-leverage milestones
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => loadSuggestions(true)}
            disabled={isRefreshing || isLoading}
            title="Refresh AI Goal Suggestions"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/[0.08] transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Analysis</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer"
            aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="relative z-10 p-5 sm:p-6 space-y-6">
          {/* Behavioral Diagnostic Dashboard Strip */}
          {data?.diagnostic && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Anchor Habit */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Anchor Habit
                  </span>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {data.diagnostic.anchorHabit}
                  </div>
                </div>
              </div>

              {/* Growth Vector */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-500 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Growth Vector
                  </span>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {data.diagnostic.growthVector}
                  </div>
                </div>
              </div>

              {/* Overall Consistency */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      30-Day Velocity
                    </span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {data.diagnostic.overallConsistency}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/[0.08] h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, Math.max(10, data.diagnostic.overallConsistency))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coaching rationale banner */}
          {data?.diagnostic?.coachingRationale && (
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200">
              <Lightbulb className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="font-semibold text-emerald-950 dark:text-emerald-100 mr-1">
                  Strategic Rationale:
                </strong>
                {data.diagnostic.coachingRationale}
              </div>
            </div>
          )}

          {/* Strategy selector chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" /> Focus:
            </span>
            {[
              { id: 'all', label: 'All Objectives' },
              { id: 'streak_mastery', label: '🔥 Streak Mastery' },
              { id: 'momentum_builder', label: '🚀 Momentum Boosters' },
              { id: 'habit_stacking', label: '⚡ Habit Stacking' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStrategy(tab.id as StrategyFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  strategy === tab.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100/80 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/[0.1] border border-slate-200/50 dark:border-white/[0.05]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Suggestions Grid or Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-5 rounded-[22px] bg-slate-100/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="w-24 h-5 rounded-lg bg-slate-200 dark:bg-white/[0.08]" />
                    <div className="w-16 h-5 rounded-lg bg-slate-200 dark:bg-white/[0.08]" />
                  </div>
                  <div className="w-3/4 h-5 rounded-lg bg-slate-200 dark:bg-white/[0.08]" />
                  <div className="w-full h-12 rounded-lg bg-slate-200 dark:bg-white/[0.08]" />
                  <div className="w-1/2 h-4 rounded-lg bg-slate-200 dark:bg-white/[0.08]" />
                </div>
              ))}
            </div>
          ) : displayedSuggestions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs">
              No objectives match the selected filter. Try selecting "All Objectives" or refresh.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedSuggestions.map((sugg) => {
                const isAdopted = adoptedIds.has(sugg.id);
                const tierColor =
                  sugg.tier === 'Mastery Challenge'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25'
                    : sugg.tier === 'Habit Stacking'
                    ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25'
                    : sugg.tier === 'Starter Win'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                    : 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/25';

                const matchedHabits = habits.filter((h) => sugg.relatedHabitIds.includes(h.id));

                return (
                  <div
                    key={sugg.id}
                    className={`group relative p-5 rounded-[22px] transition-all flex flex-col justify-between border ${
                      isAdopted
                        ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-slate-50/70 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.05] border-slate-200/70 dark:border-white/[0.07] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tierColor}`}
                        >
                          {sugg.tier}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>+{sugg.estimatedXp} XP</span>
                        </div>
                      </div>

                      {/* Goal Title */}
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {sugg.title}
                      </h4>

                      {/* Goal Description */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                        {sugg.description}
                      </p>

                      {/* Habit Anchors & Metadata Pills */}
                      <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-white/[0.05] space-y-2">
                        {/* Target & Deadline */}
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                            <Target className="w-3.5 h-3.5 text-emerald-500" />
                            {sugg.targetCount} check-ins
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            {sugg.deadlineDays}d deadline ({sugg.deadlineDate})
                          </span>
                        </div>

                        {/* Anchored Habits */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-medium text-slate-400">Anchored to:</span>
                          {matchedHabits.map((habit) => (
                            <span
                              key={habit.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-200/70 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200"
                            >
                              <DynamicIcon name={habit.icon} className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[120px]">{habit.name}</span>
                            </span>
                          ))}
                        </div>

                        {/* Rationale callout */}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-100/60 dark:bg-white/[0.02] p-2 rounded-xl">
                          💡 {sugg.rationale}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-3 flex items-center gap-2 border-t border-slate-200/60 dark:border-white/[0.05]">
                      <button
                        onClick={() => handleAdopt(sugg)}
                        disabled={isAdopted}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isAdopted
                            ? 'bg-emerald-500 text-white shadow-xs cursor-default'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 active:scale-[0.98]'
                        }`}
                      >
                        {isAdopted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Adopted ✓</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>Adopt Objective</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleCustomize(sugg)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] transition-all cursor-pointer"
                        title="Customize before adding"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
