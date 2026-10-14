import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  BarChart3,
  Flame,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  PieChart,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  FileSpreadsheet,
  Download,
  ExternalLink,
  HardDrive,
} from 'lucide-react';
import { getDaysAgo, getTodayDateString } from '../../utils/dateUtils';
import { calculateHabitStreak, isHabitScheduledForDate } from '../../utils/calculations';
import { CATEGORY_COLORS, DynamicIcon } from '../common/Icons';
import { LifeScoreRadarChart } from './LifeScoreRadarChart';

export const AnalyticsView: React.FC = () => {
  const {
    habits,
    logs,
    lifeScore,
    globalStreak,
    setIsSheetsModalOpen,
    syncWithGoogleSheets,
    isSyncingSheets,
    exportDataCSV,
    isGoogleAuthenticated,
    handleGoogleLogin,
    addToast,
  } = useApp();

  const [dateRangeFilter, setDateRangeFilter] = useState<'7' | '30' | '90' | '365'>('30');

  const daysCount = Number(dateRangeFilter);
  const cutoffDate = getDaysAgo(daysCount);

  // Filter logs for selected date range
  const rangeLogs = useMemo(() => {
    return logs.filter((l) => l.date >= cutoffDate);
  }, [logs, cutoffDate]);

  // Total completed vs missed
  const stats = useMemo(() => {
    const activeHabits = habits.filter((h) => !h.isArchived);

    let totalScheduled = 0;
    let totalCompleted = 0;

    for (let i = 0; i < daysCount; i++) {
      const date = getDaysAgo(i);
      activeHabits.forEach((h) => {
        if (isHabitScheduledForDate(h, date)) {
          totalScheduled++;
          const matchLog = rangeLogs.find((l) => l.habitId === h.id && l.date === date);
          if (matchLog && matchLog.completed) {
            totalCompleted++;
          }
        }
      });
    }

    const totalMissed = Math.max(0, totalScheduled - totalCompleted);
    const avgRate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

    // Per habit performance ranking
    const habitStats = activeHabits.map((h) => {
      let hSched = 0;
      let hDone = 0;
      for (let i = 0; i < daysCount; i++) {
        const date = getDaysAgo(i);
        if (isHabitScheduledForDate(h, date)) {
          hSched++;
          const match = rangeLogs.find((l) => l.habitId === h.id && l.date === date);
          if (match && match.completed) hDone++;
        }
      }
      const pct = hSched > 0 ? Math.round((hDone / hSched) * 100) : 0;
      const streakRes = calculateHabitStreak(h, logs);
      return {
        habit: h,
        scheduled: hSched,
        completed: hDone,
        pct,
        currentStreak: streakRes.currentStreak,
        longestStreak: streakRes.longestStreak,
      };
    });

    habitStats.sort((a, b) => b.pct - a.pct);

    const bestPerforming = habitStats.slice(0, 3);
    const needsImprovement = habitStats.slice(-3).reverse();

    // Category performance
    const categoryMap = new Map<string, { scheduled: number; completed: number }>();
    habitStats.forEach((hs) => {
      const cat = hs.habit.category;
      const cur = categoryMap.get(cat) || { scheduled: 0, completed: 0 };
      categoryMap.set(cat, {
        scheduled: cur.scheduled + hs.scheduled,
        completed: cur.completed + hs.completed,
      });
    });

    const categoryPerformance = Array.from(categoryMap.entries()).map(([cat, val]) => ({
      category: cat,
      scheduled: val.scheduled,
      completed: val.completed,
      pct: val.scheduled > 0 ? Math.round((val.completed / val.scheduled) * 100) : 0,
    }));

    // Daily completion points for line chart
    const dailyPoints: { date: string; label: string; pct: number }[] = [];
    const step = daysCount <= 14 ? 1 : daysCount <= 30 ? 2 : 5;
    for (let i = daysCount - 1; i >= 0; i -= step) {
      const d = getDaysAgo(i);
      const dayLogs = rangeLogs.filter((l) => l.date === d);
      const dayDone = dayLogs.filter((l) => l.completed).length;
      const daySched = activeHabits.filter((h) => isHabitScheduledForDate(h, d)).length || 1;
      const pct = Math.min(100, Math.round((dayDone / daySched) * 100));
      dailyPoints.push({
        date: d,
        label: new Date(d).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        pct,
      });
    }

    return {
      totalScheduled,
      totalCompleted,
      totalMissed,
      avgRate,
      bestPerforming,
      needsImprovement,
      categoryPerformance,
      dailyPoints,
    };
  }, [habits, rangeLogs, daysCount, logs]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Analytics & Consistency
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Data-driven insights across habits, streaks, and category mastery
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
          {[
            { id: '7', label: '7 Days' },
            { id: '30', label: '30 Days' },
            { id: '90', label: '90 Days' },
            { id: '365', label: '1 Year' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateRangeFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                dateRangeFilter === tab.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-[22px] bg-white/75 dark:bg-[#141722]/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.32)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-white/60">Average Completion</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.avgRate}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              In past {daysCount} days
            </span>
          </div>
        </div>

        <div className="p-5 rounded-[22px] bg-white/75 dark:bg-[#141722]/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.32)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-white/60">Total Check-ins</span>
            <span className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.totalCompleted}
            </span>
            <span className="text-xs text-slate-400 dark:text-white/50">of {stats.totalScheduled} total</span>
          </div>
        </div>

        <div className="p-5 rounded-[22px] bg-white/75 dark:bg-[#141722]/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.32)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-white/60">Streak Records</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {globalStreak.currentStreak}d
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
              Best: {globalStreak.bestStreak}d
            </span>
          </div>
        </div>

        <div className="p-5 rounded-[22px] bg-white/75 dark:bg-[#141722]/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.32)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-white/60">Life Score Index</span>
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {lifeScore.overallScore}/100
            </span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Balanced</span>
          </div>
        </div>
      </div>

      {/* Progress Export & Google Sheets Integration Card */}
      <div className="p-5 rounded-3xl bg-linear-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Progress & Data Export Hub
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-3xs font-bold">
                Google Sheets & Drive
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Export completed habits, category trends, streaks, and monthly statistics directly into Google Sheets
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsSheetsModalOpen(true)}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Sync to Google Sheets</span>
          </button>

          <button
            onClick={exportDataCSV}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Radar Chart: Life Score Balance Across Spheres (Health, Career, Social, Mindfulness, Finance, Growth) */}
      <LifeScoreRadarChart daysRange={daysCount} />

      {/* Main Trend Line Chart Simulation */}
      <div className="p-6 rounded-[24px] bg-white/75 dark:bg-[#141722]/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.32)] space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Consistency Curve ({daysCount} Days)
            </h3>
            <p className="text-xs text-slate-500 dark:text-white/60 mt-0.5">
              Daily completion rate percentage over time
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-white/50 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
            <span>Success Rate</span>
          </div>
        </div>

        {/* CSS Scaled Bar/Area Curve */}
        <div className="pt-6 pb-2">
          <div className="h-44 w-full flex items-end gap-1.5 sm:gap-3 px-2">
            {stats.dailyPoints.map((pt, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div
                  className="w-full bg-linear-to-t from-[#30D158] to-[#64D2FF] rounded-t-lg transition-all duration-300 group-hover:from-[#30D158]/90 group-hover:to-[#64D2FF]/90 relative"
                  style={{ height: `${Math.max(8, pt.pct)}%` }}
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-[#1E2333] text-white text-3xs font-mono py-1 px-1.5 rounded pointer-events-none whitespace-nowrap z-10 shadow-md">
                    {pt.pct}% on {pt.label}
                  </div>
                </div>
                <span className="text-3xs text-slate-400 dark:text-white/40 font-mono truncate w-full text-center">
                  {pt.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Top Performing Habits vs Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Best Habits & Improvement (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Best Performing */}
          <div className="p-6 rounded-[24px] bg-white/75 dark:bg-[#141722]/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.32)]">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-[#30D158]" />
              <span>Highest Consistency Habits</span>
            </h3>

            <div className="mt-4 space-y-3">
              {stats.bestPerforming.map((item) => (
                <div
                  key={item.habit.id}
                  className="p-3.5 rounded-2xl bg-[#30D158]/5 dark:bg-[#30D158]/10 border border-[#30D158]/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔥</span>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.habit.name}
                      </p>
                      <p className="text-2xs text-slate-500 dark:text-white/50">
                        {item.completed}/{item.scheduled} completed • {item.currentStreak}d streak
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-bold text-[#30D158]">
                    {item.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Needs Improvement */}
          <div className="p-6 rounded-[24px] bg-white/75 dark:bg-[#141722]/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.32)]">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-[#FF9F0A]" />
              <span>Habits Needing Focus</span>
            </h3>

            <div className="mt-4 space-y-3">
              {stats.needsImprovement.map((item) => (
                <div
                  key={item.habit.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎯</span>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.habit.name}
                      </p>
                      <p className="text-2xs text-slate-500 dark:text-white/50">
                        {item.completed}/{item.scheduled} logged in this window
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-bold text-[#FF9F0A]">
                    {item.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Performance & Life Score Factors (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Category Performance */}
          <div className="p-6 rounded-[24px] bg-white/75 dark:bg-[#141722]/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.32)]">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#64D2FF]" />
              <span>Performance by Category</span>
            </h3>

            <div className="mt-4 space-y-3">
              {stats.categoryPerformance.map((cp) => (
                <div key={cp.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-white/90">{cp.category}</span>
                    <span className="font-mono text-slate-600 dark:text-white/60">
                      {cp.pct}% ({cp.completed}/{cp.scheduled})
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#30D158] to-[#64D2FF] rounded-full transition-all duration-500"
                      style={{ width: `${cp.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Life Score Breakdown Explanation */}
          <div className="p-6 rounded-[24px] bg-gradient-to-tr from-[#30D158]/12 via-[#0A84FF]/6 to-transparent border border-[#30D158]/25 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.32)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#30D158]" />
                <span>Life Score Calculation Logic</span>
              </h3>
              <span className="text-sm font-extrabold font-mono text-[#30D158]">
                {lifeScore.overallScore}/100
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-white/80">
              {lifeScore.details.map((detail, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#30D158] font-bold">•</span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
