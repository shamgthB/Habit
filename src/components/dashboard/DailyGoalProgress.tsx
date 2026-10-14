import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CheckCircle2,
  Circle,
  Clock,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
} from 'lucide-react';
import { getTodayDateString } from '../../utils/dateUtils';
import { CATEGORY_COLORS } from '../common/Icons';

interface DailyGoalProgressProps {
  className?: string;
}

export const DailyGoalProgress: React.FC<DailyGoalProgressProps> = ({ className = '' }) => {
  const {
    todayScheduledHabits,
    todayCompletedCount,
    selectedDate,
    reminders,
    toggleHabitCompletion,
    toggleReminderStatus,
    logs,
  } = useApp();

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'habits'>('all');

  // Reminders assigned for today
  const todayReminders = reminders.filter((r) => r.date === selectedDate);
  const completedRemindersCount = todayReminders.filter((r) => r.status === 'completed').length;

  // Calculate totals based on filter
  const totalTasks =
    filterMode === 'all'
      ? todayScheduledHabits.length + todayReminders.length
      : todayScheduledHabits.length;

  const completedTasks =
    filterMode === 'all'
      ? todayCompletedCount + completedRemindersCount
      : todayCompletedCount;

  const remainingTasks = Math.max(0, totalTasks - completedTasks);
  const percentage = totalTasks > 0 ? Math.min(100, Math.round((completedTasks / totalTasks) * 100)) : 0;

  // SVG circular geometry
  const radius = 52;
  const circumference = 2 * Math.PI * radius; // ~326.725
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  // Motivational badge text & colors
  const getStatusBadge = () => {
    if (totalTasks === 0) {
      return { text: 'No Tasks Scheduled', color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' };
    }
    if (percentage === 100) {
      return { text: '100% Completed • Perfect Day! 🎉', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' };
    }
    if (percentage >= 75) {
      return { text: 'Great Momentum • Almost Finished! 🔥', color: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30' };
    }
    if (percentage >= 50) {
      return { text: 'Halfway Mark • Keep Pushing ⚡', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' };
    }
    if (percentage > 0) {
      return { text: 'In Progress • Focus on Next Step 🎯', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' };
    }
    return { text: 'Ready to Start • First Step Counts 🚀', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' };
  };

  const status = getStatusBadge();

  return (
    <div
      className={`rounded-[22px] bg-white/75 dark:bg-[#141722]/75 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)] p-5 sm:p-6 transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Target className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Daily Goal Progress
            </h3>
            <p className="text-3xs text-slate-400">
              Tasks & rituals assigned for today
            </p>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-3xs font-semibold">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setFilterMode('habits')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              filterMode === 'habits'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Habits Only
          </button>
        </div>
      </div>

      {/* Main Ring & Metrics Row */}
      <div className="mt-4 flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
        {/* SVG Percentage Ring */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            <defs>
              <linearGradient id="goalProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            {/* Background Track */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              className="stroke-slate-100 dark:stroke-slate-800/80 fill-none"
              strokeWidth="11"
            />
            {/* Progress Stroke */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="url(#goalProgressGradient)"
              className="fill-none transition-all duration-700 ease-out"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>

          {/* Centered Percentage Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
              {percentage}%
            </span>
            <span className="text-3xs uppercase font-bold tracking-wider text-slate-400 mt-0.5">
              Completed
            </span>
          </div>
        </div>

        {/* Metrics Breakdown & Status Pill */}
        <div className="flex-1 w-full space-y-3">
          <div className={`text-2xs font-bold px-3 py-1.5 rounded-xl text-center sm:text-left ${status.color}`}>
            {status.text}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20">
              <span className="text-3xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                Done Today
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {completedTasks}
                </span>
                <span className="text-3xs text-slate-400">/ {totalTasks} total</span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
              <span className="text-3xs font-semibold text-slate-500 dark:text-slate-400 block">
                Pending Tasks
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {remainingTasks}
                </span>
                <span className="text-3xs text-slate-400">remaining</span>
              </div>
            </div>
          </div>

          {/* Quick Toggle to View Assigned Tasks Checklist */}
          {totalTasks > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between text-2xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 pt-1 transition-colors cursor-pointer"
            >
              <span>{isExpanded ? 'Hide Task Breakdown' : 'View Today’s Checklist'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable Task List */}
      {isExpanded && totalTasks > 0 && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2 max-h-56 overflow-y-auto pr-1 animate-in fade-in duration-200">
          {/* Scheduled Habits */}
          {todayScheduledHabits.map((habit) => {
            const log = logs.find((l) => l.habitId === habit.id && l.date === selectedDate);
            const isDone = log?.completed ?? false;
            return (
              <div
                key={habit.id}
                onClick={() => toggleHabitCompletion(habit.id, selectedDate)}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 text-xs transition-colors cursor-pointer ${
                  isDone
                    ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                  )}
                  <span
                    className={`truncate font-medium ${
                      isDone
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {habit.name}
                  </span>
                </div>
                <span className="text-3xs font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-500 shrink-0">
                  {habit.category}
                </span>
              </div>
            );
          })}

          {/* Today's Reminders (if 'all' filter) */}
          {filterMode === 'all' &&
            todayReminders.map((rem) => {
              const isDone = rem.status === 'completed';
              return (
                <div
                  key={rem.id}
                  onClick={() => toggleReminderStatus(rem.id, isDone ? 'upcoming' : 'completed')}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 text-xs transition-colors cursor-pointer ${
                    isDone
                      ? 'bg-teal-500/5 dark:bg-teal-950/20 border-teal-500/30'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 fill-teal-500 text-white shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                    )}
                    <span
                      className={`truncate font-medium ${
                        isDone
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {rem.title}
                    </span>
                  </div>
                  <span className="text-3xs font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-500 shrink-0 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {rem.time}
                  </span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};
