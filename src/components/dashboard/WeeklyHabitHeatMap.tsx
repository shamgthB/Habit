import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  Flame,
  Calendar,
  Sparkles,
  TrendingUp,
  Award,
  Layers,
  ChevronRight,
  Info,
  CheckCircle2,
  Zap,
  BarChart3,
  Grid3X3,
  Filter,
} from 'lucide-react';
import { Habit, HabitLog, HabitCategory } from '../../types';
import {
  formatISODate,
  getTodayDateString,
  getDayOfWeek,
  formatHumanDate,
} from '../../utils/dateUtils';
import { isHabitScheduledForDate } from '../../utils/calculations';
import { CATEGORY_COLORS, DynamicIcon } from '../common/Icons';

interface WeeklyHabitHeatMapProps {
  habits: Habit[];
  logs: HabitLog[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  className?: string;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WeeklyHabitHeatMap: React.FC<WeeklyHabitHeatMapProps> = ({
  habits,
  logs,
  selectedDate,
  onSelectDate,
  className = '',
}) => {
  const [weeksCount, setWeeksCount] = useState<4 | 8 | 12>(4);
  const [viewMode, setViewMode] = useState<'grid' | 'barchart' | 'habitMatrix'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [hoveredCell, setHoveredCell] = useState<{
    date: string;
    completed: number;
    scheduled: number;
    pct: number;
    dayName: string;
  } | null>(null);

  // Active non-archived habits
  const activeHabits = useMemo(() => {
    let filtered = habits.filter((h) => !h.isArchived);
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((h) => h.category === selectedCategory);
    }
    return filtered;
  }, [habits, selectedCategory]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    habits.filter((h) => !h.isArchived).forEach((h) => set.add(h.category));
    return ['All', ...Array.from(set)];
  }, [habits]);

  // Compute weeks array (Mon -> Sun) going back `weeksCount` weeks
  const heatmapWeeks = useMemo(() => {
    const today = new Date();
    // Normalize to today's midnight
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Day of week: 0 = Sun, 1 = Mon ... 6 = Sat
    // Convert so Monday = 0, Sunday = 6
    const todayDayIndex = (todayMidnight.getDay() + 6) % 7;

    // Find the Monday of current week
    const currentWeekMonday = new Date(todayMidnight);
    currentWeekMonday.setDate(todayMidnight.getDate() - todayDayIndex);

    const weeks: {
      weekIndex: number;
      weekLabel: string;
      days: {
        date: string;
        dayName: string;
        dayNum: number;
        completed: number;
        scheduled: number;
        pct: number;
        isToday: boolean;
        isFuture: boolean;
        isSelected: boolean;
      }[];
    }[] = [];

    const todayStr = getTodayDateString();

    for (let w = weeksCount - 1; w >= 0; w--) {
      const weekMonday = new Date(currentWeekMonday);
      weekMonday.setDate(currentWeekMonday.getDate() - w * 7);

      const days = [];
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(weekMonday);
        cellDate.setDate(weekMonday.getDate() + d);
        const dateStr = formatISODate(cellDate);

        const isFuture = dateStr > todayStr;
        const isToday = dateStr === todayStr;
        const isSelected = dateStr === selectedDate;

        let scheduled = 0;
        let completed = 0;

        if (!isFuture) {
          activeHabits.forEach((h) => {
            if (isHabitScheduledForDate(h, dateStr)) {
              scheduled++;
              const matchLog = logs.find((l) => l.habitId === h.id && l.date === dateStr);
              if (matchLog && matchLog.completed) {
                completed++;
              }
            }
          });
        }

        const pct = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;

        days.push({
          date: dateStr,
          dayName: DAY_LABELS[d],
          dayNum: cellDate.getDate(),
          completed,
          scheduled,
          pct,
          isToday,
          isFuture,
          isSelected,
        });
      }

      const weekLabel =
        w === 0
          ? 'This Week'
          : w === 1
          ? 'Last Week'
          : `${w} Wks Ago`;

      weeks.push({
        weekIndex: w,
        weekLabel,
        days,
      });
    }

    return weeks;
  }, [weeksCount, activeHabits, logs, selectedDate]);

  // Aggregate completion stats by Day of the Week (Mon -> Sun) for Recharts & Peak Day analysis
  const dayOfWeekStats = useMemo(() => {
    const dayTotals = DAY_LABELS.map((dayName, idx) => ({
      dayIndex: idx,
      dayName,
      fullName: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ][idx],
      completed: 0,
      scheduled: 0,
      occurrences: 0,
    }));

    heatmapWeeks.forEach((week) => {
      week.days.forEach((day, dIdx) => {
        if (!day.isFuture && day.scheduled > 0) {
          dayTotals[dIdx].completed += day.completed;
          dayTotals[dIdx].scheduled += day.scheduled;
          dayTotals[dIdx].occurrences += 1;
        }
      });
    });

    return dayTotals.map((item) => {
      const avgPct =
        item.scheduled > 0 ? Math.round((item.completed / item.scheduled) * 100) : 0;
      return {
        ...item,
        avgPct,
      };
    });
  }, [heatmapWeeks]);

  // Peak day and slump day analysis
  const { peakDay, slumpDay, overallAvg, weekdayAvg, weekendAvg, totalLogged } =
    useMemo(() => {
      const validDays = dayOfWeekStats.filter((d) => d.scheduled > 0);
      if (validDays.length === 0) {
        return {
          peakDay: { dayName: 'Mon', avgPct: 0, fullName: 'Monday' },
          slumpDay: { dayName: 'Sun', avgPct: 0, fullName: 'Sunday' },
          overallAvg: 0,
          weekdayAvg: 0,
          weekendAvg: 0,
          totalLogged: 0,
        };
      }

      const sorted = [...validDays].sort((a, b) => b.avgPct - a.avgPct);
      const peak = sorted[0];
      const slump = sorted[sorted.length - 1];

      const totalCompleted = validDays.reduce((acc, d) => acc + d.completed, 0);
      const totalScheduled = validDays.reduce((acc, d) => acc + d.scheduled, 0);
      const overall = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

      // Weekdays (Mon-Fri) vs Weekends (Sat-Sun)
      const weekdays = validDays.filter((d) => d.dayIndex < 5);
      const weekends = validDays.filter((d) => d.dayIndex >= 5);

      const wdSched = weekdays.reduce((acc, d) => acc + d.scheduled, 0);
      const wdDone = weekdays.reduce((acc, d) => acc + d.completed, 0);
      const wdAvg = wdSched > 0 ? Math.round((wdDone / wdSched) * 100) : 0;

      const weSched = weekends.reduce((acc, d) => acc + d.scheduled, 0);
      const weDone = weekends.reduce((acc, d) => acc + d.completed, 0);
      const weAvg = weSched > 0 ? Math.round((weDone / weSched) * 100) : 0;

      return {
        peakDay: peak,
        slumpDay: slump,
        overallAvg: overall,
        weekdayAvg: wdAvg,
        weekendAvg: weAvg,
        totalLogged: totalCompleted,
      };
    }, [dayOfWeekStats]);

  // Habit Matrix: Completion % of each habit across each Day of Week
  const habitMatrixData = useMemo(() => {
    return activeHabits.map((habit) => {
      const daysStats = DAY_LABELS.map((dayName, dIdx) => {
        let scheduled = 0;
        let completed = 0;

        heatmapWeeks.forEach((week) => {
          const day = week.days[dIdx];
          if (!day.isFuture && isHabitScheduledForDate(habit, day.date)) {
            scheduled++;
            const log = logs.find((l) => l.habitId === habit.id && l.date === day.date);
            if (log && log.completed) completed++;
          }
        });

        const pct = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
        return {
          dayName,
          scheduled,
          completed,
          pct,
        };
      });

      const totalSched = daysStats.reduce((acc, d) => acc + d.scheduled, 0);
      const totalDone = daysStats.reduce((acc, d) => acc + d.completed, 0);
      const habitAvg = totalSched > 0 ? Math.round((totalDone / totalSched) * 100) : 0;

      return {
        habit,
        daysStats,
        habitAvg,
      };
    });
  }, [activeHabits, heatmapWeeks, logs]);

  // Color intensity helper for heat map cells
  const getCellIntensityClass = (pct: number, isFuture: boolean) => {
    if (isFuture) {
      return 'bg-slate-100/50 dark:bg-white/[0.02] border-dashed border-slate-200 dark:border-white/[0.05] opacity-40 cursor-not-allowed';
    }
    if (pct === 0) {
      return 'bg-slate-100 dark:bg-white/[0.04] border-slate-200/80 dark:border-white/[0.06] text-slate-400 dark:text-white/40';
    }
    if (pct < 35) {
      return 'bg-[#30D158]/20 border-[#30D158]/30 text-[#30D158] hover:bg-[#30D158]/30';
    }
    if (pct < 65) {
      return 'bg-[#30D158]/45 border-[#30D158]/55 text-black dark:text-white font-bold hover:bg-[#30D158]/55';
    }
    if (pct < 90) {
      return 'bg-[#30D158]/75 border-[#30D158]/85 text-black font-extrabold shadow-sm hover:bg-[#30D158]/85';
    }
    // 90-100%
    return 'bg-[#30D158] border-[#30D158] text-black font-extrabold shadow-[0_0_12px_rgba(48,209,88,0.45)] hover:shadow-[0_0_16px_rgba(48,209,88,0.6)]';
  };

  // Custom Recharts Tooltip for Day-of-Week chart
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-2xl bg-white/95 dark:bg-[#1C202F]/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/15 p-3.5 shadow-xl text-xs space-y-1 min-w-[170px] pointer-events-none">
          <div className="flex items-center justify-between gap-2 font-bold text-slate-900 dark:text-white">
            <span>{data.fullName}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-3xs font-mono font-bold ${
                data.avgPct >= 85
                  ? 'bg-[#30D158]/20 text-[#30D158]'
                  : data.avgPct >= 70
                  ? 'bg-[#64D2FF]/20 text-[#64D2FF]'
                  : 'bg-amber-500/20 text-amber-500'
              }`}
            >
              {data.avgPct}% avg
            </span>
          </div>
          <p className="text-3xs text-slate-500 dark:text-white/60 font-mono">
            {data.completed} of {data.scheduled} check-ins completed
          </p>
          {data.dayName === peakDay.dayName && (
            <p className="text-3xs text-[#30D158] font-bold flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-white/10">
              <Sparkles className="w-3 h-3" />
              <span>Your #1 Peak Consistency Day!</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`rounded-[24px] bg-white/75 dark:bg-[#141722]/75 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)] p-5 sm:p-6 transition-all ${className}`}
    >
      {/* Header bar: Title, View Switcher & Weeks Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/25">
              <Flame className="w-4 h-4 fill-current" />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Weekly Habit Completion Heat Map
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-[#30D158]/15 text-[#30D158] text-3xs font-mono font-bold">
              Peak Performance
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
            Analyze velocity patterns, peak consistency days, and weekly completion cadence
          </p>
        </div>

        {/* View Mode & Timeframe Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Segmented Control */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08]">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-2xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#1E2333] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Heat Grid</span>
            </button>
            <button
              onClick={() => setViewMode('barchart')}
              className={`px-2.5 py-1 rounded-lg text-2xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'barchart'
                  ? 'bg-white dark:bg-[#1E2333] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Peak Days</span>
            </button>
            <button
              onClick={() => setViewMode('habitMatrix')}
              className={`px-2.5 py-1 rounded-lg text-2xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'habitMatrix'
                  ? 'bg-white dark:bg-[#1E2333] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Habit Matrix</span>
            </button>
          </div>

          {/* Weeks Count Selector */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08]">
            {([4, 8, 12] as const).map((count) => (
              <button
                key={count}
                onClick={() => setWeeksCount(count)}
                className={`px-2.5 py-1 rounded-lg text-2xs font-semibold transition-all cursor-pointer font-mono ${
                  weeksCount === count
                    ? 'bg-white dark:bg-[#1E2333] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white'
                }`}
              >
                {count}W
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Performance Highlights Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
        {/* Peak Day Banner */}
        <div className="p-3.5 rounded-2xl bg-[#30D158]/10 dark:bg-[#30D158]/15 border border-[#30D158]/25 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#30D158] text-black font-extrabold shrink-0 shadow-sm">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-3xs uppercase tracking-wider font-semibold text-slate-500 dark:text-white/50">
              Peak Day
            </p>
            <p className="text-xs sm:text-sm font-extrabold text-[#30D158] truncate">
              {peakDay.fullName}
            </p>
            <p className="text-3xs text-slate-500 dark:text-white/60 font-mono">
              {peakDay.avgPct}% completion avg
            </p>
          </div>
        </div>

        {/* Opportunity / Slump Day */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500 text-black font-extrabold shrink-0 shadow-sm">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-3xs uppercase tracking-wider font-semibold text-slate-500 dark:text-white/50">
              Growth Day
            </p>
            <p className="text-xs sm:text-sm font-extrabold text-amber-500 truncate">
              {slumpDay.fullName}
            </p>
            <p className="text-3xs text-slate-500 dark:text-white/60 font-mono">
              {slumpDay.avgPct}% completion avg
            </p>
          </div>
        </div>

        {/* Weekday vs Weekend Comparison */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#0A84FF]/20 text-[#0A84FF] shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-3xs uppercase tracking-wider font-semibold text-slate-400 dark:text-white/50">
              Weekday vs Weekend
            </p>
            <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-mono">
              {weekdayAvg}% <span className="text-3xs text-slate-400">vs</span> {weekendAvg}%
            </p>
            <p className="text-3xs text-slate-400 dark:text-white/50">
              {weekdayAvg >= weekendAvg ? 'Stronger mid-week' : 'Stronger weekends'}
            </p>
          </div>
        </div>

        {/* Total Check-ins Recorded */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#BF5AF2]/20 text-[#BF5AF2] shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-3xs uppercase tracking-wider font-semibold text-slate-400 dark:text-white/50">
              {weeksCount}W Overall Avg
            </p>
            <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-mono">
              {overallAvg}%
            </p>
            <p className="text-3xs text-slate-400 dark:text-white/50">
              {totalLogged} logged habits
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      {allCategories.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
          <span className="text-3xs font-semibold text-slate-400 dark:text-white/40 flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3 h-3" />
            <span>Category:</span>
          </span>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-3xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                selectedCategory === cat
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-black font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/[0.09]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* VIEW MODE 1: Multi-Week Heat Grid */}
      {viewMode === 'grid' && (
        <div className="space-y-2">
          {/* Day of Week Column Headers */}
          <div className="grid grid-cols-8 gap-1.5 sm:gap-2 text-center text-3xs font-bold text-slate-400 dark:text-white/50">
            <div className="text-left pl-1">Week</div>
            {DAY_LABELS.map((d, idx) => (
              <div
                key={d}
                className={`py-1 rounded-lg ${
                  d === peakDay.dayName
                    ? 'text-[#30D158] font-extrabold bg-[#30D158]/10'
                    : ''
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Heat Map Rows */}
          <div className="space-y-1.5">
            {heatmapWeeks.map((week) => (
              <div key={week.weekIndex} className="grid grid-cols-8 gap-1.5 sm:gap-2 items-center">
                {/* Week Label */}
                <div className="text-3xs font-semibold text-slate-400 dark:text-white/50 truncate pl-1">
                  {week.weekLabel}
                </div>

                {/* 7 Days of the Week */}
                {week.days.map((day) => {
                  const intensityClass = getCellIntensityClass(day.pct, day.isFuture);
                  const isSelected = day.isSelected;
                  const isToday = day.isToday;

                  return (
                    <div
                      key={day.date}
                      className="relative group"
                      onMouseEnter={() =>
                        !day.isFuture &&
                        setHoveredCell({
                          date: day.date,
                          completed: day.completed,
                          scheduled: day.scheduled,
                          pct: day.pct,
                          dayName: day.dayName,
                        })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <button
                        disabled={day.isFuture}
                        onClick={() => onSelectDate(day.date)}
                        className={`w-full aspect-square rounded-[12px] sm:rounded-[14px] flex flex-col items-center justify-center p-1 border transition-all cursor-pointer relative ${intensityClass} ${
                          isSelected
                            ? 'ring-2 ring-[#30D158] scale-[1.06] z-10'
                            : 'hover:scale-[1.05]'
                        }`}
                        title={
                          day.isFuture
                            ? 'Future day'
                            : `${day.date}: ${day.completed}/${day.scheduled} habits completed (${day.pct}%)`
                        }
                      >
                        <span className="text-3xs font-mono font-medium opacity-75">
                          {day.dayNum}
                        </span>
                        {!day.isFuture && day.scheduled > 0 && (
                          <span className="text-[10px] sm:text-2xs font-extrabold font-mono">
                            {day.pct}%
                          </span>
                        )}

                        {/* Today Indicator Dot */}
                        {isToday && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#0A84FF] shadow-[0_0_6px_#0A84FF]" />
                        )}

                        {/* 100% Star Icon */}
                        {!day.isFuture && day.pct === 100 && (
                          <span className="absolute bottom-0.5 right-0.5 text-[8px] leading-none">
                            ✨
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Hover Status or Guide bar */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-2xs text-slate-500 dark:text-white/60 flex-wrap gap-2">
            <div>
              {hoveredCell ? (
                <span className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
                  <span className="font-bold text-[#30D158]">{formatHumanDate(hoveredCell.date)}:</span>
                  <span>
                    {hoveredCell.completed}/{hoveredCell.scheduled} completed ({hoveredCell.pct}%)
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Click any day cell to inspect habits for that date</span>
                </span>
              )}
            </div>

            {/* Intensity Scale Legend */}
            <div className="flex items-center gap-1 text-3xs font-mono">
              <span>0%</span>
              <span className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-white/[0.05] border border-slate-300 dark:border-white/10" />
              <span className="w-3.5 h-3.5 rounded bg-[#30D158]/25 border border-[#30D158]/35" />
              <span className="w-3.5 h-3.5 rounded bg-[#30D158]/55 border border-[#30D158]/65" />
              <span className="w-3.5 h-3.5 rounded bg-[#30D158]/80 border border-[#30D158]" />
              <span className="w-3.5 h-3.5 rounded bg-[#30D158] shadow-[0_0_8px_#30D158]" />
              <span className="font-bold text-[#30D158]">100%</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Recharts Day-of-Week Peak Performance Bar Chart */}
      {viewMode === 'barchart' && (
        <div className="pt-2 pb-1 space-y-4">
          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dayOfWeekStats}
                margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
              >
                <XAxis
                  dataKey="dayName"
                  stroke="currentColor"
                  className="text-slate-500 dark:text-white/60 text-2xs"
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="currentColor"
                  className="text-slate-400 dark:text-white/40 text-3xs font-mono"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomBarTooltip />} />

                {/* Overall Average Reference Line */}
                <ReferenceLine
                  y={overallAvg}
                  stroke="#64D2FF"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Avg: ${overallAvg}%`,
                    fill: '#64D2FF',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />

                <Bar dataKey="avgPct" radius={[8, 8, 4, 4]}>
                  {dayOfWeekStats.map((entry, index) => {
                    const isPeak = entry.dayName === peakDay.dayName;
                    const isSlump = entry.dayName === slumpDay.dayName && entry.avgPct < 70;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          isPeak
                            ? '#30D158'
                            : isSlump
                            ? '#FF9F0A'
                            : 'rgba(48, 209, 88, 0.45)'
                        }
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
              <span className="font-semibold text-slate-900 dark:text-white">
                Peak Day: {peakDay.fullName} ({peakDay.avgPct}%)
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-white/60 text-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#64D2FF]" />
              <span>Dashed line: Weekly Benchmark ({overallAvg}%)</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: Habit Matrix (Habits × Day of Week) */}
      {viewMode === 'habitMatrix' && (
        <div className="space-y-3 pt-1">
          <div className="overflow-x-auto pr-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.08] text-slate-400 dark:text-white/50 text-3xs font-semibold">
                  <th className="pb-2 font-medium">Habit</th>
                  {DAY_LABELS.map((d) => (
                    <th
                      key={d}
                      className={`pb-2 text-center ${
                        d === peakDay.dayName ? 'text-[#30D158] font-bold' : ''
                      }`}
                    >
                      {d}
                    </th>
                  ))}
                  <th className="pb-2 text-right">Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {habitMatrixData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-400">
                      No habits found in selected category
                    </td>
                  </tr>
                ) : (
                  habitMatrixData.map(({ habit, daysStats, habitAvg }) => {
                    const catColor =
                      CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.Other;

                    return (
                      <tr key={habit.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 pr-2">
                          <div className="flex items-center gap-2 min-w-[130px]">
                            <span
                              className={`p-1 rounded-lg ${catColor.bg} ${catColor.text}`}
                            >
                              <DynamicIcon name={habit.icon} className="w-3.5 h-3.5" />
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">
                              {habit.name}
                            </span>
                          </div>
                        </td>

                        {daysStats.map((ds, dIdx) => {
                          const intensityClass = getCellIntensityClass(ds.pct, false);
                          return (
                            <td key={dIdx} className="p-1 text-center">
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] text-3xs font-mono font-bold transition-all ${intensityClass}`}
                                title={`${habit.name} on ${ds.dayName}: ${ds.completed}/${ds.scheduled} (${ds.pct}%)`}
                              >
                                {ds.scheduled > 0 ? `${ds.pct}%` : '—'}
                              </span>
                            </td>
                          );
                        })}

                        <td className="py-2.5 pl-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                          <span
                            className={`px-2 py-0.5 rounded-full text-3xs ${
                              habitAvg >= 80
                                ? 'bg-[#30D158]/15 text-[#30D158]'
                                : habitAvg >= 60
                                ? 'bg-[#64D2FF]/15 text-[#64D2FF]'
                                : 'bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-white/60'
                            }`}
                          >
                            {habitAvg}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
