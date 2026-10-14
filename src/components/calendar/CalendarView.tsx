import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Flame,
  Smile,
  Zap,
  Info,
} from 'lucide-react';
import { getMonthDays, formatHumanDate, formatISODate, getTodayDateString } from '../../utils/dateUtils';
import { isHabitScheduledForDate } from '../../utils/calculations';

export const CalendarView: React.FC = () => {
  const {
    habits,
    logs,
    moodLogs,
    wellnessLogs,
    selectedDate,
    setSelectedDate,
    toggleHabitCompletion,
    setIsWorkspaceModalOpen,
  } = useApp();

  const todayStr = getTodayDateString();
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // 0-indexed
  const [calendarTab, setCalendarTab] = useState<'month' | 'year'>('month');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(todayStr);
  };

  const monthDays = useMemo(() => {
    return getMonthDays(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Inspection data for the selected date
  const dayActivity = useMemo(() => {
    const scheduled = habits.filter((h) => !h.isArchived && isHabitScheduledForDate(h, selectedDate));
    const dayLogs = logs.filter((l) => l.date === selectedDate);
    const completedHabits = scheduled.filter((h) => {
      const l = dayLogs.find((log) => log.habitId === h.id);
      return l && l.completed;
    });
    const moodEntry = moodLogs.find((m) => m.date === selectedDate);
    const wellnessEntry = wellnessLogs.find((w) => w.date === selectedDate);

    const pct = scheduled.length > 0 ? Math.round((completedHabits.length / scheduled.length) * 100) : 0;

    return {
      scheduled,
      dayLogs,
      completedHabits,
      pct,
      moodEntry,
      wellnessEntry,
    };
  }, [habits, logs, moodLogs, wellnessLogs, selectedDate]);

  // Generate Year Heatmap (all days of currentYear)
  const yearDays = useMemo(() => {
    const days: { date: string; pct: number }[] = [];
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    const cur = new Date(startDate);
    while (cur <= endDate) {
      const dateStr = formatISODate(cur);
      const scheduled = habits.filter((h) => !h.isArchived && isHabitScheduledForDate(h, dateStr));
      const completed = logs.filter((l) => l.date === dateStr && l.completed).length;
      const pct = scheduled.length > 0 ? Math.round((completed / scheduled.length) * 100) : 0;
      days.push({ date: dateStr, pct });
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }, [currentYear, habits, logs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Calendar & Heatmap
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review historical habit performance, streaks, and day-by-day logs
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => setCalendarTab('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                calendarTab === 'month'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setCalendarTab('year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                calendarTab === 'year'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Year Heatmap
            </button>
          </div>

          <button
            onClick={handleGoToday}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Today
          </button>

          <button
            onClick={() => setIsWorkspaceModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer shadow-xs"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Calendar Sync</span>
          </button>
        </div>
      </div>

      {calendarTab === 'month' ? (
        /* Month View Grid & Side Inspection Pane */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interactive Month Grid (8 cols) */}
          <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            {/* Month Nav Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {monthNames[currentMonth]} {currentYear}
              </h2>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Day Slots */}
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((daySlot, idx) => {
                const isSelected = daySlot.date === selectedDate;
                const isCurrentToday = daySlot.date === todayStr;

                const scheduledCount = habits.filter((h) => !h.isArchived && isHabitScheduledForDate(h, daySlot.date)).length;
                const completedCount = logs.filter((l) => l.date === daySlot.date && l.completed).length;
                const pct = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0;

                // Color tint based on completion
                let tintClass = 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300';
                if (pct === 100) {
                  tintClass = 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/30';
                } else if (pct >= 60) {
                  tintClass = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
                } else if (pct > 0) {
                  tintClass = 'bg-teal-500/10 text-teal-700 dark:text-teal-300';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(daySlot.date)}
                    className={`min-h-20 sm:min-h-24 p-2 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-md'
                        : 'border-slate-200/60 dark:border-slate-800 hover:border-slate-300'
                    } ${tintClass} ${!daySlot.isCurrentMonth ? 'opacity-30' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold font-mono ${
                          isCurrentToday
                            ? 'w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center'
                            : ''
                        }`}
                      >
                        {Number(daySlot.date.split('-')[2])}
                      </span>
                      {pct === 100 && <span className="text-2xs">⭐</span>}
                    </div>

                    {scheduledCount > 0 && (
                      <div className="mt-2">
                        <span className="text-3xs font-mono font-semibold opacity-75">
                          {completedCount}/{scheduledCount} done
                        </span>
                        <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-slate-700 mt-1 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Date Inspection Details (4 cols) */}
          <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-2xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Day Activity Inspector
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                  {formatHumanDate(selectedDate)}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Overall Completion: <strong className="text-emerald-600 dark:text-emerald-400">{dayActivity.pct}%</strong> ({dayActivity.completedHabits.length}/{dayActivity.scheduled.length} habits)
                </p>
              </div>

              {/* Mood & Energy of this day */}
              {dayActivity.moodEntry && (
                <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Smile className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Mood: {dayActivity.moodEntry.mood.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    Energy: {dayActivity.moodEntry.energy}/10
                  </span>
                </div>
              )}

              {/* Habit list on this day with live check buttons */}
              <div className="mt-5 space-y-2">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                  Scheduled Habits ({dayActivity.scheduled.length})
                </span>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {dayActivity.scheduled.map((habit) => {
                    const isDone = dayActivity.completedHabits.some((h) => h.id === habit.id);
                    return (
                      <div
                        key={habit.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                      >
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {habit.name}
                          </p>
                          <span className="text-3xs text-slate-400">{habit.targetValue} {habit.unit}</span>
                        </div>
                        <button
                          onClick={() => toggleHabitCompletion(habit.id, selectedDate)}
                          className={`p-1 rounded-lg cursor-pointer ${
                            isDone ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-500'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white dark:text-slate-900" />
                          ) : (
                            <Circle className="w-5 h-5 stroke-[1.5]" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-2xs text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Click any date on the calendar to inspect or backfill activities.</span>
            </div>
          </div>
        </div>
      ) : (
        /* Year Heatmap View (365 Days Grid) */
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {currentYear} Habit Consistency Heatmap
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Full 365-day grid tracking daily completion density
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentYear((y) => y - 1)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold font-mono px-2">{currentYear}</span>
              <button
                onClick={() => setCurrentYear((y) => y + 1)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid of days */}
          <div className="overflow-x-auto pb-4">
            <div className="flex flex-wrap gap-1.5 max-w-4xl">
              {yearDays.map((d, idx) => {
                let cellColor = 'bg-slate-100 dark:bg-slate-800';
                if (d.pct === 100) cellColor = 'bg-emerald-500';
                else if (d.pct >= 75) cellColor = 'bg-emerald-400';
                else if (d.pct >= 50) cellColor = 'bg-emerald-300 dark:bg-emerald-600';
                else if (d.pct > 0) cellColor = 'bg-emerald-200 dark:bg-emerald-800';

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDate(d.date);
                      setCalendarTab('month');
                    }}
                    title={`${d.date}: ${d.pct}% completed`}
                    className={`w-3.5 h-3.5 rounded-xs transition-transform hover:scale-125 cursor-pointer ${cellColor}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 text-2xs text-slate-400">
            <span>Less</span>
            <div className="w-3 h-3 rounded-xs bg-slate-100 dark:bg-slate-800" />
            <div className="w-3 h-3 rounded-xs bg-emerald-200 dark:bg-emerald-800" />
            <div className="w-3 h-3 rounded-xs bg-emerald-300 dark:bg-emerald-600" />
            <div className="w-3 h-3 rounded-xs bg-emerald-400" />
            <div className="w-3 h-3 rounded-xs bg-emerald-500" />
            <span>More</span>
          </div>
        </div>
      )}
    </div>
  );
};
