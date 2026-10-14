import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Smile,
  Zap,
  TrendingUp,
  Droplets,
  Moon,
  Activity,
  BookOpen,
  Smartphone,
  Save,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { MoodType } from '../../types';
import { formatHumanDate, getTodayDateString } from '../../utils/dateUtils';

export const MoodView: React.FC = () => {
  const {
    todayMood,
    todayWellness,
    logMoodEnergy,
    updateWellness,
    moodLogs,
    selectedDate,
    setSelectedDate,
    addToast,
  } = useApp();

  const [mood, setMood] = useState<MoodType>(todayMood?.mood || 'happy');
  const [energy, setEnergy] = useState<number>(todayMood?.energy || 8);
  const [note, setNote] = useState<string>(todayMood?.note || '');

  // Wellness form inputs
  const [waterCurrent, setWaterCurrent] = useState<number>(todayWellness?.water?.current ?? 6);
  const [waterTarget, setWaterTarget] = useState<number>(todayWellness?.water?.target ?? 8);
  const [sleepHours, setSleepHours] = useState<number>(todayWellness?.sleep?.durationHours ?? 7.5);
  const [exerciseMins, setExerciseMins] = useState<number>(todayWellness?.exercise?.durationMins ?? 45);
  const [studyHours, setStudyHours] = useState<number>(todayWellness?.study?.hours ?? 2.5);
  const [screenMins, setScreenMins] = useState<number>(todayWellness?.screenTime?.actualMins ?? 180);

  const moods: { id: MoodType; label: string; emoji: string }[] = [
    { id: 'very_happy', label: 'Very Happy', emoji: '😄' },
    { id: 'happy', label: 'Happy', emoji: '🙂' },
    { id: 'neutral', label: 'Neutral', emoji: '😐' },
    { id: 'sad', label: 'Sad', emoji: '😔' },
    { id: 'stressed', label: 'Stressed', emoji: '😫' },
  ];

  const handleSaveAll = () => {
    logMoodEnergy(mood, energy, note.trim() || undefined, selectedDate);
    updateWellness(
      {
        water: { current: waterCurrent, target: waterTarget },
        sleep: { durationHours: sleepHours, bedtime: '23:00', wakeupTime: '06:30' },
        exercise: { durationMins: exerciseMins, activityType: 'Workout' },
        study: { hours: studyHours, subjects: 'Deep Learning', focusSessions: 3 },
        screenTime: { actualMins: screenMins, targetMins: 240 },
      },
      selectedDate
    );
    addToast({
      type: 'success',
      title: 'Wellness & Mood Saved',
      message: `Updated metrics for ${formatHumanDate(selectedDate)}`,
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Mood & Wellness Trackers
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor your mental equilibrium, physical battery, hydration, and sleep quality
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mood & Energy Primary Logger (6 cols) */}
        <div className="lg:col-span-6 p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Smile className="w-5 h-5 text-emerald-500" />
              <span>Today&apos;s Emotional State</span>
            </h2>
            <span className="text-xs font-mono font-semibold text-slate-400">
              {formatHumanDate(selectedDate)}
            </span>
          </div>

          {/* Mood selection buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              How are you feeling overall today?
            </label>
            <div className="grid grid-cols-5 gap-2">
              {moods.map((m) => {
                const isSelected = mood === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMood(m.id)}
                    className={`flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/15 scale-105 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-3xs font-semibold text-slate-600 dark:text-slate-300 mt-1.5 text-center">
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Energy Slider 1-10 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Physical Energy Level
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                {energy} / 10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-3xs font-mono text-slate-400">
              <span>Exhausted (1)</span>
              <span>Moderate (5)</span>
              <span>Peak Energy (10)</span>
            </div>
          </div>

          {/* Journal Note */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Daily Reflection Note (Optional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What factors influenced your energy and mood today?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-hidden"
            />
          </div>

          <button
            onClick={handleSaveAll}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Mood & Wellness Entry</span>
          </button>
        </div>

        {/* Wellness Metrics Multi-form (6 cols) */}
        <div className="lg:col-span-6 p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-500" />
              <span>Wellness Metrics</span>
            </h2>
            <span className="text-xs text-slate-400">Customizable</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Water */}
            <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 space-y-2">
              <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Droplets className="w-4 h-4" />
                Water Hydration
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={waterCurrent}
                  onChange={(e) => setWaterCurrent(Number(e.target.value))}
                  className="w-16 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border text-center font-mono font-bold"
                />
                <span className="text-slate-500">of {waterTarget} glasses</span>
              </div>
            </div>

            {/* Sleep */}
            <div className="p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 space-y-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Moon className="w-4 h-4" />
                Sleep Duration
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-16 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border text-center font-mono font-bold"
                />
                <span className="text-slate-500">hours slept</span>
              </div>
            </div>

            {/* Exercise */}
            <div className="p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 space-y-2">
              <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                Exercise & Sports
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={exerciseMins}
                  onChange={(e) => setExerciseMins(Number(e.target.value))}
                  className="w-16 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border text-center font-mono font-bold"
                />
                <span className="text-slate-500">minutes active</span>
              </div>
            </div>

            {/* Study */}
            <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-2">
              <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                Study & Deep Work
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={studyHours}
                  onChange={(e) => setStudyHours(Number(e.target.value))}
                  className="w-16 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border text-center font-mono font-bold"
                />
                <span className="text-slate-500">hours studied</span>
              </div>
            </div>

            {/* Screen Time */}
            <div className="p-4 rounded-2xl bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20 space-y-2 col-span-1 sm:col-span-2">
              <span className="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                Screen Time Usage
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={screenMins}
                  onChange={(e) => setScreenMins(Number(e.target.value))}
                  className="w-20 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border text-center font-mono font-bold"
                />
                <span className="text-slate-500">minutes (Target &lt; 240 mins)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 14-Day Mood & Energy History Timeline */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>Recent Mood & Energy Log History</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {moodLogs.slice(0, 14).map((entry) => (
            <div
              key={entry.date}
              onClick={() => setSelectedDate(entry.date)}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center cursor-pointer hover:border-emerald-500 transition-colors"
            >
              <span className="text-3xs font-mono font-semibold text-slate-400">
                {entry.date.slice(5)}
              </span>
              <span className="text-2xl my-1">
                {moods.find((m) => m.id === entry.mood)?.emoji || '🙂'}
              </span>
              <span className="text-2xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {entry.energy}/10
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
