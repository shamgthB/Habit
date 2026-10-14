import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  Award,
  AlertCircle,
  Lightbulb,
  Check,
  Copy,
  ChevronRight,
  Zap,
  Target,
  BrainCircuit,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAiHabitInsights, Habit7DaySummary, calculate7DayHabitTrends } from '../../services/habitInsightsService';
import { AiHabitInsight } from '../../types';

export const AiHabitInsights: React.FC = () => {
  const { habits, logs, profile, addToast, setCurrentSection } = useApp();
  const [insight, setInsight] = useState<AiHabitInsight | null>(null);
  const [stats, setStats] = useState<Habit7DaySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedAction, setCopiedAction] = useState<boolean>(false);

  const fetchInsights = async (force: boolean = false) => {
    setLoading(true);
    try {
      const summaryStats = calculate7DayHabitTrends(habits, logs);
      setStats(summaryStats);
      const data = await getAiHabitInsights(habits, logs, profile.name, force);
      setInsight(data);
    } catch (err) {
      console.error('Failed to load AI habit insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights(false);
  }, [habits.length, logs.length]);

  const handleRefresh = () => {
    fetchInsights(true);
    addToast({
      type: 'info',
      title: 'Analyzing 7-Day Trends',
      message: 'Consulting Gemini API for updated habit behavioral patterns...',
    });
  };

  const handleCopyAction = () => {
    if (!insight?.adviceCard.action) return;
    navigator.clipboard.writeText(insight.adviceCard.action);
    setCopiedAction(true);
    addToast({
      type: 'success',
      title: 'Advice Action Copied',
      message: 'Keep this focus in mind as you execute your habits today!',
    });
    setTimeout(() => setCopiedAction(false), 2500);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'accelerating':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            <TrendingUp className="w-3 h-3" />
            Accelerating Momentum
          </span>
        );
      case 'needs_focus':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3 h-3" />
            Friction Detected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30">
            <Zap className="w-3 h-3" />
            Steady Consistency
          </span>
        );
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-[24px] bg-white/75 dark:bg-[#141722]/75 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)] relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-bl from-teal-500/10 via-emerald-500/5 to-transparent rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-500/20">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                AI Habit Insights
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-3xs font-extrabold uppercase tracking-wider bg-linear-to-r from-teal-500/15 to-emerald-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                <Sparkles className="w-2.5 h-2.5 text-teal-500 fill-teal-500" />
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Behavioral analysis of your completed habits over the past 7 days
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            title="Re-run Gemini trend analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
            <span>{loading ? 'Analyzing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {loading && !insight ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Synthesizing 7-day completion logs & identifying behavioral patterns...
          </p>
        </div>
      ) : insight ? (
        <div className="mt-5 space-y-5 relative z-10">
          {/* Top Performance Metric & Trend Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <div className="sm:col-span-3 flex sm:flex-col items-center sm:items-start justify-between sm:justify-center border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700/60 pb-3 sm:pb-0 sm:pr-4">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                7-Day Consistency
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {insight.consistencyScore}%
                </span>
                <span className="text-2xs font-semibold text-slate-400">score</span>
              </div>
              <div className="mt-1">{getStatusBadge(insight.trendStatus)}</div>
            </div>

            <div className="sm:col-span-9 pl-0 sm:pl-2 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>{insight.headline}</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {insight.trendAnalysis}
              </p>
            </div>
          </div>

          {/* Key Trend Signals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Top Strength & Momentum
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {insight.topStrength}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Growth Opportunity
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {insight.growthOpportunity}
                </p>
              </div>
            </div>
          </div>

          {/* THE ACTIONABLE ADVICE CARD */}
          <div className="p-5 rounded-2xl bg-linear-to-br from-amber-500/10 via-emerald-500/5 to-teal-500/5 dark:from-amber-500/15 dark:via-slate-800/80 dark:to-slate-900 border border-amber-500/30 dark:border-amber-500/25 shadow-xs relative">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-xs">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Actionable Advice
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-3xs font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  {insight.adviceCard.impactCategory}
                </span>
                <span className="px-2 py-0.5 rounded-md text-3xs font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                  {insight.adviceCard.effortLevel}
                </span>
              </div>
            </div>

            <div className="mt-3.5 space-y-3">
              <h5 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {insight.adviceCard.title}
              </h5>

              <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-500/20 shadow-2xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="p-1 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
                      <Zap className="w-3.5 h-3.5" />
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                      {insight.adviceCard.action}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyAction}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                    title="Copy advice action"
                  >
                    {copiedAction ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-2xs text-slate-500 dark:text-slate-400 italic">
                <span className="font-semibold not-italic text-slate-700 dark:text-slate-300">
                  Why this works:
                </span>{' '}
                {insight.adviceCard.rationale}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-amber-500/15 flex items-center justify-between text-2xs">
              <span className="text-slate-400 font-medium">
                Analysis grounded in your actual 7-day habit completions
              </span>
              <button
                onClick={() => setCurrentSection('analytics')}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Habit Trends</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-slate-500">
          No habit data available to analyze yet. Start completing daily habits to unlock Gemini insights.
        </div>
      )}
    </div>
  );
};
