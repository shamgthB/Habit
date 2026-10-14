import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Flame,
  CheckCircle2,
  Circle,
  Plus,
  Minus,
  Smile,
  Droplets,
  Moon,
  Activity,
  BookOpen,
  Trophy,
  ArrowRight,
  Sparkles,
  Calendar as CalendarIcon,
  Play,
  Clock,
  Check,
  ChevronRight,
  TrendingUp,
  MapPin,
  Mail,
  FileSpreadsheet,
} from 'lucide-react';
import { getGreeting, formatHumanDate, getPastDaysArray, getTodayDateString } from '../../utils/dateUtils';
import { DynamicIcon, CATEGORY_COLORS } from '../common/Icons';
import { calculateHabitStreak } from '../../utils/calculations';
import { MoodType } from '../../types';
import { DailyAffirmationCard } from './DailyAffirmationCard';
import { DailyGoalProgress } from './DailyGoalProgress';
import { DailyJournal } from './DailyJournal';
import { AiHabitInsights } from './AiHabitInsights';

export const DashboardView: React.FC = () => {
  const {
    profile,
    selectedDate,
    setSelectedDate,
    lifeScore,
    globalStreak,
    todayScheduledHabits,
    todayCompletedCount,
    todayCompletionRate,
    todayMood,
    todayWellness,
    toggleHabitCompletion,
    updateHabitLogValue,
    logMoodEnergy,
    updateWellness,
    reminders,
    toggleReminderStatus,
    achievements,
    setCurrentSection,
    setIsAddHabitModalOpen,
    setIsWorkspaceModalOpen,
    setIsSheetsModalOpen,
    setIsAiNotificationModalOpen,
    logs,
  } = useApp();

  const isToday = selectedDate === getTodayDateString();
  const { greeting, icon: greetingIcon } = getGreeting();

  // Motivational Quotes
  const quotes = [
    { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Will Durant' },
    { text: 'Small daily improvements over time lead to stunning results.', author: 'Robin Sharma' },
    { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear' },
    { text: 'Action is the foundational key to all success.', author: 'Pablo Picasso' },
  ];
  const todayQuote = quotes[new Date().getDate() % quotes.length];

  // Past 7 days completion rate mini chart
  const past7Days = getPastDaysArray(7);
  const weeklyMiniData = past7Days.map((date) => {
    const scheduled = todayScheduledHabits.length || 5;
    const completed = logs.filter((l) => l.date === date && l.completed).length;
    const pct = Math.min(100, Math.round((completed / (scheduled || 1)) * 100));
    return { date, pct };
  });

  const moodsList: { id: MoodType; label: string; emoji: string }[] = [
    { id: 'very_happy', label: 'Great', emoji: '😄' },
    { id: 'happy', label: 'Good', emoji: '🙂' },
    { id: 'neutral', label: 'Neutral', emoji: '😐' },
    { id: 'sad', label: 'Down', emoji: '😔' },
    { id: 'stressed', label: 'Stressed', emoji: '😫' },
  ];

  const currentEnergy = todayMood?.energy || 8;
  const currentWater = todayWellness?.water?.current ?? 6;
  const targetWater = todayWellness?.water?.target ?? 8;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Banner: Apple iOS Frosted Glass Hero Banner with Ambient Glow */}
      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 p-6 sm:p-7 rounded-[24px] bg-white/80 dark:bg-gradient-to-br dark:from-[#171B26]/90 dark:via-[#131620]/80 dark:to-[#0E1118]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_10px_35px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.38)]">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#30D158]/10 dark:bg-[#30D158]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-1">
          <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#30D158]">
            <span>{greetingIcon} {greeting}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5 font-mono">
              <CalendarIcon className="w-3.5 h-3.5" />
              {formatHumanDate(selectedDate)}
            </span>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(getTodayDateString())}
                className="ml-2 px-2.5 py-0.5 rounded-full bg-[#30D158] text-black font-extrabold text-[11px] shadow-xs cursor-pointer active:scale-95 transition-transform"
              >
                Today
              </button>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1.5">
            Welcome back, {profile.name}
          </h1>
          <p className="text-[13px] sm:text-[14px] text-slate-600 dark:text-white/60 mt-1 max-w-xl italic">
            &ldquo;{todayQuote.text}&rdquo; <span className="font-semibold not-italic">— {todayQuote.author}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 relative z-1">
          <button
            onClick={() => setCurrentSection('focustimer')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-[13px] shadow-sm hover:opacity-95 active:scale-[0.97] transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Focus</span>
          </button>
          <button
            onClick={() => setIsAddHabitModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#30D158] to-[#28B54C] hover:from-[#35DE60] hover:to-[#2DC252] text-black font-bold text-[13px] shadow-[0_4px_18px_rgba(48,209,88,0.35)] active:scale-[0.97] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid: iOS Squircle Cards with Layered Shadows */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Completion */}
        <div className="p-5 rounded-[20px] bg-white/75 dark:bg-[#141722]/75 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_6px_25px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)] flex flex-col justify-between hover:scale-[1.008] transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-slate-500 dark:text-white/60">
              Today&apos;s Progress
            </span>
            <span className="p-2 rounded-[12px] bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/20">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {todayCompletionRate}%
              </span>
              <span className="text-[12px] text-slate-400 dark:text-white/45">
                ({todayCompletedCount}/{todayScheduledHabits.length} done)
              </span>
            </div>
            {/* Progress Capsule Bar */}
            <div className="mt-3 w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.08] overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#30D158] to-[#28B54C] rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(48,209,88,0.5)]"
                style={{ width: `${todayCompletionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Life Score Card */}
        <div
          onClick={() => setCurrentSection('analytics')}
          className="p-5 rounded-[20px] bg-white/75 dark:bg-[#141722]/75 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_6px_25px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)] flex flex-col justify-between hover:border-[#30D158]/40 hover:scale-[1.008] transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-slate-500 dark:text-white/60">
              Overall Life Score
            </span>
            <span className="p-2 rounded-[12px] bg-[#0A84FF]/15 text-[#0A84FF] border border-[#0A84FF]/20">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {lifeScore.overallScore}
              </span>
              <span className="text-[12px] font-bold text-[#30D158]">
                {lifeScore.overallScore >= 80 ? 'Optimal' : 'Strong'}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400 dark:text-white/45 flex items-center justify-between">
              <span>View full breakdown</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </div>

        {/* Current Total Streak */}
        <div className="p-5 rounded-[20px] bg-white/75 dark:bg-[#141722]/75 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_6px_25px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)] flex flex-col justify-between hover:scale-[1.008] transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-slate-500 dark:text-white/60">
              Current Streak
            </span>
            <span className="p-2 rounded-[12px] bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/20">
              <Flame className="w-4 h-4 fill-[#FF9F0A]" />
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {globalStreak.currentStreak}
              </span>
              <span className="text-[12px] text-slate-400 dark:text-white/45">days active</span>
            </div>
            <p className="mt-2 text-[11px] text-[#FF9F0A] font-semibold">
              Best Record: {globalStreak.bestStreak} days
            </p>
          </div>
        </div>

        {/* Gamification Level & XP */}
        <div
          onClick={() => setCurrentSection('achievements')}
          className="p-5 rounded-[20px] bg-white/75 dark:bg-[#141722]/75 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_6px_25px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)] flex flex-col justify-between hover:border-[#BF5AF2]/40 hover:scale-[1.008] transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-slate-500 dark:text-white/60">
              Mastery Tier
            </span>
            <span className="p-2 rounded-[12px] bg-[#BF5AF2]/15 text-[#BF5AF2] border border-[#BF5AF2]/20">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-[18px] sm:text-[20px] font-extrabold text-slate-900 dark:text-white tracking-tight">
                Lv.{profile.level} {profile.levelTitle}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400 dark:text-white/45 flex items-center justify-between">
              <span>{profile.xp} total XP accumulated</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid: Left (Today's Habits) & Right (Wellness, Mood, Journal, Insights) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Today's Habits Section (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-5 sm:p-6 rounded-[24px] bg-white/75 dark:bg-[#141722]/75 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <h2 className="text-[17px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Today&apos;s Habits</span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#30D158]/15 text-[#30D158] font-bold">
                    {todayCompletedCount}/{todayScheduledHabits.length}
                  </span>
                </h2>
                <p className="text-[12px] text-slate-500 dark:text-white/60 mt-0.5">
                  Check off or log values to extend your active streaks
                </p>
              </div>

              <button
                onClick={() => setCurrentSection('habits')}
                className="text-[12px] font-bold text-[#30D158] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Manage all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Habit Cards List */}
            <div className="mt-4 space-y-3">
              {todayScheduledHabits.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[14px] font-semibold text-slate-600 dark:text-white/60">
                    No habits scheduled for this day
                  </p>
                  <p className="text-[12px] text-slate-400 dark:text-white/40 mt-1">
                    Add new habits or adjust frequency rules.
                  </p>
                </div>
              ) : (
                todayScheduledHabits.map((habit) => {
                  const log = logs.find((l) => l.habitId === habit.id && l.date === selectedDate);
                  const isDone = log?.completed ?? false;
                  const curValue = log?.value ?? (isDone ? habit.targetValue : 0);
                  const streakRes = calculateHabitStreak(habit, logs, selectedDate);
                  const catColor = CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.Other;

                  return (
                    <div
                      key={habit.id}
                      className={`p-4 rounded-[18px] border transition-all duration-200 ${
                        isDone
                          ? 'bg-[#30D158]/[0.06] dark:bg-[#30D158]/[0.08] border-[#30D158]/25 shadow-xs'
                          : 'bg-white/80 dark:bg-white/[0.04] border-slate-200/80 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.14] shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Left: Complete Checkbox + Icon + Title */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <button
                            onClick={() => toggleHabitCompletion(habit.id, selectedDate)}
                            className={`p-1 rounded-full transition-transform active:scale-90 cursor-pointer ${
                              isDone
                                ? 'text-[#30D158]'
                                : 'text-slate-300 dark:text-white/30 hover:text-[#30D158]'
                            }`}
                            aria-label={isDone ? 'Mark incomplete' : 'Mark completed'}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-6 h-6 fill-[#30D158] text-black" />
                            ) : (
                              <Circle className="w-6 h-6 stroke-[1.5]" />
                            )}
                          </button>

                          {/* Habit Icon with Category Tint */}
                          <div
                            className={`p-2.5 rounded-[12px] shrink-0 ${catColor.bg} ${catColor.text} border ${catColor.border}`}
                          >
                            <DynamicIcon name={habit.icon} className="w-4 h-4 stroke-[2.2]" />
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3
                                className={`text-[14px] font-bold truncate transition-colors ${
                                  isDone
                                    ? 'line-through text-slate-400 dark:text-white/40'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {habit.name}
                              </h3>
                              {habit.isPinned && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/25">
                                  Pinned
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 dark:text-white/45">
                              <span className={catColor.text}>{habit.category}</span>
                              <span aria-hidden="true">·</span>
                              <span className="flex items-center gap-1 text-[#FF9F0A] font-semibold">
                                <Flame className="w-3 h-3 fill-[#FF9F0A]" />
                                {streakRes.currentStreak}d streak
                              </span>
                              {habit.reminderTime && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {habit.reminderTime}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Stepper / Numeric Target Log */}
                        <div className="flex items-center gap-2 shrink-0">
                          {habit.targetValue > 1 ? (
                            <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-white/[0.06] px-2.5 py-1 rounded-full border border-slate-200/80 dark:border-white/[0.08]">
                              <button
                                onClick={() =>
                                  updateHabitLogValue(
                                    habit.id,
                                    Math.max(0, curValue - 1),
                                    selectedDate
                                  )
                                }
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer active:scale-90"
                                aria-label="Decrease"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-[12px] font-mono font-bold text-slate-800 dark:text-white min-w-10 text-center">
                                {curValue}/{habit.targetValue}
                              </span>
                              <button
                                onClick={() =>
                                  updateHabitLogValue(
                                    habit.id,
                                    curValue + 1,
                                    selectedDate
                                  )
                                }
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer active:scale-90"
                                aria-label="Increase"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => toggleHabitCompletion(habit.id, selectedDate)}
                              className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all cursor-pointer active:scale-95 ${
                                isDone
                                  ? 'bg-[#30D158] text-black shadow-[0_0_14px_rgba(48,209,88,0.4)]'
                                  : 'bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-white border border-slate-200/80 dark:border-white/[0.08]'
                              }`}
                            >
                              {isDone ? 'Done' : 'Mark Done'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Numeric Target Progress bar */}
                      {habit.targetValue > 1 && (
                        <div className="mt-3 w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.08] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#30D158] to-[#28B54C] rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, Math.round((curValue / habit.targetValue) * 100))}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Weekly Progress Summary Mini Chart with iOS Pills */}
          <div className="p-5 sm:p-6 rounded-[24px] bg-white/75 dark:bg-[#141722]/75 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                Weekly Completion Trajectory
              </h3>
              <button
                onClick={() => setCurrentSection('analytics')}
                className="text-[12px] font-bold text-[#30D158] hover:underline cursor-pointer"
              >
                Deep Analytics →
              </button>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-2 text-center">
              {weeklyMiniData.map((day, idx) => {
                const dayDate = new Date(day.date);
                const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
                const isSelected = day.date === selectedDate;

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day.date)}
                    className={`p-3 rounded-[18px] flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#30D158]/15 border border-[#30D158]/40 font-bold scale-[1.03]'
                        : 'bg-slate-100/70 dark:bg-white/[0.04] hover:bg-slate-200/70 dark:hover:bg-white/[0.08] border border-transparent dark:border-white/[0.04]'
                    }`}
                  >
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-white/50">{dayName}</span>
                    <div className="w-full h-16 bg-slate-200 dark:bg-white/[0.08] rounded-full flex flex-col justify-end p-0.5 overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-[#28B54C] to-[#30D158] rounded-full transition-all duration-500"
                        style={{ height: `${day.pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-white/80">
                      {day.pct}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Habit Insights Widget */}
          <AiHabitInsights />
        </div>

        {/* Right Column: Goal Progress Ring, Affirmation, Daily Journal, Mood, Water & Wellness, Reminders */}
        <div className="lg:col-span-4 space-y-6">
          {/* Daily Goal Progress Percentage Ring Widget */}
          <DailyGoalProgress />

          {/* Daily Affirmation Widget */}
          <DailyAffirmationCard />

          {/* Daily Journal Component */}
          <DailyJournal />

          {/* Daily Mood & Energy Card */}
          <div className="p-5 rounded-[22px] bg-white/75 dark:bg-[#141722]/75 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <span className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-[#30D158]" />
                Mood & Energy
              </span>
              <span className="text-[11px] text-slate-400 dark:text-white/50 font-mono">Energy: {currentEnergy}/10</span>
            </div>

            {/* Mood selector */}
            <div className="mt-4 flex items-center justify-between gap-1">
              {moodsList.map((m) => {
                const isSelected = todayMood?.mood === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => logMoodEnergy(m.id, currentEnergy, todayMood?.note, selectedDate)}
                    className={`flex flex-col items-center p-2 rounded-[14px] text-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#30D158]/15 border border-[#30D158]/30 scale-105 shadow-xs'
                        : 'hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                    }`}
                    title={m.label}
                  >
                    <span>{m.emoji}</span>
                    <span className="text-[10px] text-slate-400 dark:text-white/50 mt-1 font-semibold">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Energy Slider */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-white/60 mb-1.5">
                <span>Energy Battery</span>
                <span className="font-bold text-[#30D158]">{currentEnergy}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={currentEnergy}
                onChange={(e) =>
                  logMoodEnergy(
                    todayMood?.mood || 'happy',
                    Number(e.target.value),
                    todayMood?.note,
                    selectedDate
                  )
                }
                className="w-full accent-[#30D158] cursor-pointer"
              />
            </div>
          </div>

          {/* Quick Water & Sleep Wellness Snapshot */}
          <div className="p-5 rounded-[22px] bg-white/75 dark:bg-[#141722]/75 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)] space-y-3.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
              Daily Wellness Snapshot
            </h3>

            {/* Water Tracker Counter */}
            <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-[#0A84FF]/10 border border-[#0A84FF]/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[10px] bg-[#0A84FF]/20 text-[#0A84FF]">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-900 dark:text-white">Water Intake</p>
                  <p className="text-[11px] text-[#0A84FF] font-mono font-semibold">
                    {currentWater} / {targetWater} glasses
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    updateWellness(
                      { water: { current: Math.max(0, currentWater - 1), target: targetWater } },
                      selectedDate
                    )
                  }
                  className="p-1 rounded-full bg-white dark:bg-white/[0.1] border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-white hover:bg-slate-100 cursor-pointer active:scale-90"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    updateWellness(
                      { water: { current: currentWater + 1, target: targetWater } },
                      selectedDate
                    )
                  }
                  className="p-1 rounded-full bg-[#0A84FF] text-white hover:bg-[#0071E3] cursor-pointer active:scale-90 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Sleep Summary */}
            <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-[#5E5CE6]/10 border border-[#5E5CE6]/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[10px] bg-[#5E5CE6]/20 text-[#7D7AFF]">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-900 dark:text-white">Sleep Duration</p>
                  <p className="text-[11px] text-[#7D7AFF] font-mono font-semibold">
                    {todayWellness?.sleep?.durationHours ?? 7.5} hours
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-white/[0.1] border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-white/70">
                {todayWellness?.sleep?.bedtime || '23:00'} → {todayWellness?.sleep?.wakeupTime || '06:30'}
              </span>
            </div>

            {/* Workout & Deep Study summary */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-[14px] bg-[#FF453A]/10 border border-[#FF453A]/20 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FF453A] shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-white">Workout</span>
                  <p className="text-[#FF453A] font-mono">{todayWellness?.exercise?.durationMins ?? 45} mins</p>
                </div>
              </div>
              <div className="p-2.5 rounded-[14px] bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#FF9F0A] shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-white">Study</span>
                  <p className="text-[#FF9F0A] font-mono">{todayWellness?.study?.hours ?? 2.5} hrs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Reminders Card */}
          <div className="p-5 rounded-[22px] bg-white/75 dark:bg-[#141722]/75 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <h3 className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#30D158]" />
                Scheduled Reminders
              </h3>
              <button
                onClick={() => setIsAiNotificationModalOpen(true)}
                className="text-[11px] font-bold text-[#30D158] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-[#30D158]" />
                <span>AI Alerts Hub</span>
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {reminders.slice(0, 3).map((rem) => {
                const isDone = rem.status === 'completed';
                return (
                  <div
                    key={rem.id}
                    className="flex items-center justify-between p-2.5 rounded-[14px] bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/[0.1] text-slate-700 dark:text-white/80">
                          {rem.time}
                        </span>
                        <p className={`text-[12px] font-semibold truncate ${isDone ? 'line-through text-slate-400 dark:text-white/40' : 'text-slate-800 dark:text-white'}`}>
                          {rem.title}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleReminderStatus(rem.id, isDone ? 'upcoming' : 'completed')}
                      className={`p-1 rounded-full cursor-pointer transition-colors ${
                        isDone ? 'bg-[#30D158] text-black' : 'text-slate-400 hover:text-[#30D158]'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="p-5 rounded-[22px] bg-white/75 dark:bg-[#141722]/75 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <span className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[#FFD60A]" />
                Unlocked Badges
              </span>
              <button
                onClick={() => setCurrentSection('achievements')}
                className="text-[11px] font-bold text-[#FF9F0A] hover:underline cursor-pointer"
              >
                View all ({achievements.filter((a) => a.unlockedAt).length})
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {achievements
                .filter((a) => a.unlockedAt)
                .slice(0, 4)
                .map((ach) => (
                  <div
                    key={ach.id}
                    title={`${ach.title} (+${ach.xp} XP)`}
                    className="flex flex-col items-center p-2.5 rounded-[16px] bg-slate-50 dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/[0.08] shrink-0 w-20 text-center"
                  >
                    <span className="text-xl">🏆</span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-white/80 mt-1 truncate w-full">
                      {ach.title}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Google Ecosystem & Maps Integration Hub */}
          <div className="p-5 rounded-[22px] bg-white/75 dark:bg-[#141722]/75 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.06]">
              <span className="text-[12px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0A84FF] animate-pulse" />
                Google Ecosystem & Maps
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#0A84FF]">
                Connected
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-white/50">
              Sync habits and real-world places across Google Maps, Gmail, Calendar, Tasks, Keep, and Sheets.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setCurrentSection('maps')}
                className="flex items-center gap-2 p-2.5 rounded-[14px] bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.07] hover:border-[#30D158] text-left transition-colors cursor-pointer group active:scale-95"
              >
                <div className="p-1.5 rounded-[10px] bg-[#30D158]/15 text-[#30D158] shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-slate-900 dark:text-white truncate group-hover:text-[#30D158]">
                    Google Maps
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-white/40 truncate">Habit Places</p>
                </div>
              </button>

              <button
                onClick={() => setIsWorkspaceModalOpen(true)}
                className="flex items-center gap-2 p-2.5 rounded-[14px] bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.07] hover:border-[#0A84FF] text-left transition-colors cursor-pointer group active:scale-95"
              >
                <div className="p-1.5 rounded-[10px] bg-[#0A84FF]/15 text-[#0A84FF] shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-slate-900 dark:text-white truncate group-hover:text-[#0A84FF]">
                    Gmail Report
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-white/40 truncate">Send summary</p>
                </div>
              </button>

              <button
                onClick={() => setIsWorkspaceModalOpen(true)}
                className="flex items-center gap-2 p-2.5 rounded-[14px] bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.07] hover:border-[#FF9F0A] text-left transition-colors cursor-pointer group active:scale-95"
              >
                <div className="p-1.5 rounded-[10px] bg-[#FF9F0A]/15 text-[#FF9F0A] shrink-0">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-slate-900 dark:text-white truncate group-hover:text-[#FF9F0A]">
                    Calendar & Tasks
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-white/40 truncate">Schedule & sync</p>
                </div>
              </button>

              <button
                onClick={() => setIsSheetsModalOpen(true)}
                className="flex items-center gap-2 p-2.5 rounded-[14px] bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.07] hover:border-[#30D158] text-left transition-colors cursor-pointer group active:scale-95"
              >
                <div className="p-1.5 rounded-[10px] bg-[#30D158]/15 text-[#30D158] shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-slate-900 dark:text-white truncate group-hover:text-[#30D158]">
                    Google Sheets
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-white/40 truncate">Auto-sync & backup</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
