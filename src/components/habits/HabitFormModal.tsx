import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Sparkles,
  Droplets,
  Activity,
  BookOpen,
  Brain,
  DollarSign,
  Moon,
  Clock,
  Heart,
  Dumbbell,
  Laptop,
  Check,
  Calendar,
  Flame,
  Bell,
  Mail,
} from 'lucide-react';
import { Habit, HabitCategory, HabitDifficulty, HabitFrequency, HabitPriority, NotificationChannel } from '../../types';
import { getTodayDateString } from '../../utils/dateUtils';

export const HabitFormModal: React.FC = () => {
  const {
    isAddHabitModalOpen,
    setIsAddHabitModalOpen,
    editingHabit,
    setEditingHabit,
    addHabit,
    updateHabit,
  } = useApp();

  const isOpen = isAddHabitModalOpen || editingHabit !== null;

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('Health');
  const [icon, setIcon] = useState('Droplets');
  const [color, setColor] = useState('emerald');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [frequencyDays, setFrequencyDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [frequencyTargetCount, setFrequencyTargetCount] = useState<number>(7);
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState('');
  const [targetValue, setTargetValue] = useState<number>(1);
  const [unit, setUnit] = useState('times');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [difficulty, setDifficulty] = useState<HabitDifficulty>('medium');
  const [priority, setPriority] = useState<HabitPriority>('high');
  const [notes, setNotes] = useState('');
  const [streakGoal, setStreakGoal] = useState<number>(30);
  const [restDays, setRestDays] = useState<number[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [notificationChannel, setNotificationChannel] = useState<NotificationChannel>('push');
  const [aiNudgeEnabled, setAiNudgeEnabled] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState('');

  useEffect(() => {
    if (editingHabit) {
      setName(editingHabit.name);
      setDescription(editingHabit.description || '');
      setCategory(editingHabit.category);
      setIcon(editingHabit.icon);
      setColor(editingHabit.color);
      setFrequency(editingHabit.frequency);
      setFrequencyDays(editingHabit.frequencyDays || [0, 1, 2, 3, 4, 5, 6]);
      setFrequencyTargetCount(editingHabit.frequencyTargetCount || 7);
      setStartDate(editingHabit.startDate);
      setEndDate(editingHabit.endDate || '');
      setTargetValue(editingHabit.targetValue);
      setUnit(editingHabit.unit);
      setReminderTime(editingHabit.reminderTime || '08:00');
      setDifficulty(editingHabit.difficulty);
      setPriority(editingHabit.priority);
      setNotes(editingHabit.notes || '');
      setStreakGoal(editingHabit.streakGoal || 30);
      setRestDays(editingHabit.restDays || []);
      setIsPinned(editingHabit.isPinned);
      setNotificationChannel(editingHabit.notificationChannel || 'push');
      setAiNudgeEnabled(editingHabit.aiNudgeEnabled !== false);
      setNotificationEmail(editingHabit.notificationEmail || '');
    } else {
      // Defaults for new habit
      setName('');
      setDescription('');
      setCategory('Health');
      setIcon('Droplets');
      setColor('emerald');
      setFrequency('daily');
      setFrequencyDays([0, 1, 2, 3, 4, 5, 6]);
      setFrequencyTargetCount(7);
      setStartDate(getTodayDateString());
      setEndDate('');
      setTargetValue(1);
      setUnit('times');
      setReminderTime('08:00');
      setDifficulty('medium');
      setPriority('high');
      setNotes('');
      setStreakGoal(30);
      setRestDays([]);
      setIsPinned(false);
      setNotificationChannel('push');
      setAiNudgeEnabled(true);
      setNotificationEmail('');
    }
  }, [editingHabit, isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsAddHabitModalOpen(false);
    setEditingHabit(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const habitPayload = {
      name: name.trim(),
      description: description.trim(),
      category,
      icon,
      color,
      frequency,
      frequencyDays,
      frequencyTargetCount,
      startDate,
      endDate: endDate || undefined,
      targetValue: Number(targetValue) || 1,
      unit: unit.trim() || 'times',
      reminderTime: reminderTime || undefined,
      difficulty,
      priority,
      notes: notes.trim(),
      streakGoal: Number(streakGoal) || undefined,
      isArchived: false,
      isPinned,
      restDays,
      notificationChannel,
      aiNudgeEnabled,
      notificationEmail: notificationEmail.trim() || undefined,
    };

    if (editingHabit) {
      updateHabit(editingHabit.id, habitPayload);
    } else {
      addHabit(habitPayload);
    }

    handleClose();
  };

  const categories: HabitCategory[] = [
    'Health',
    'Fitness',
    'Study',
    'Work',
    'Personal',
    'Finance',
    'Mindfulness',
    'Sleep',
    'Productivity',
    'Other',
  ];

  const availableIcons = [
    { name: 'Droplets', label: 'Water' },
    { name: 'Sparkles', label: 'Mind' },
    { name: 'Activity', label: 'Movement' },
    { name: 'Dumbbell', label: 'Gym' },
    { name: 'BookOpen', label: 'Read' },
    { name: 'Brain', label: 'Focus' },
    { name: 'DollarSign', label: 'Finance' },
    { name: 'Moon', label: 'Sleep' },
    { name: 'Clock', label: 'Time' },
    { name: 'Heart', label: 'Health' },
    { name: 'Laptop', label: 'Work' },
  ];

  const weekDayLabels = [
    { day: 0, label: 'Sun' },
    { day: 1, label: 'Mon' },
    { day: 2, label: 'Tue' },
    { day: 3, label: 'Wed' },
    { day: 4, label: 'Thu' },
    { day: 5, label: 'Fri' },
    { day: 6, label: 'Sat' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {editingHabit ? 'Edit Habit' : 'Create New Habit'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Set schedules, numeric targets, and streak rules
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Habit Name & Category */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Habit Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Drink 8 Glasses of Water"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-sm focus:border-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Description & Purpose
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why is this habit important to your life?"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-sm focus:border-emerald-500 outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as HabitCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-sm focus:border-emerald-500 outline-hidden cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as HabitPriority)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-sm focus:border-emerald-500 outline-hidden cursor-pointer"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>
          </div>

          {/* Target Value and Unit */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Target & Completion
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Value (Numeric)
                </label>
                <input
                  type="number"
                  min="1"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Unit of Measurement
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="times, glasses, mins, pages"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:border-emerald-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Frequency & Scheduling */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Frequency & Schedule
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'daily' as HabitFrequency, label: 'Every Day' },
                { id: 'weekly_days' as HabitFrequency, label: 'Specific Days' },
                { id: 'times_per_week' as HabitFrequency, label: 'X Times / Wk' },
                { id: 'custom' as HabitFrequency, label: 'Custom' },
              ].map((f) => (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => setFrequency(f.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    frequency === f.id
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Days of week selector if specific days */}
            {(frequency === 'weekly_days' || frequency === 'daily') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Active Days of the Week
                </label>
                <div className="flex items-center gap-1.5">
                  {weekDayLabels.map((wd) => {
                    const isSelected = frequencyDays.includes(wd.day);
                    return (
                      <button
                        type="button"
                        key={wd.day}
                        onClick={() => {
                          if (isSelected) {
                            setFrequencyDays(frequencyDays.filter((d) => d !== wd.day));
                          } else {
                            setFrequencyDays([...frequencyDays, wd.day]);
                          }
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {wd.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rest Days (Streak Protected) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rest Days (Streak is protected on these days)
              </label>
              <div className="flex items-center gap-1.5">
                {weekDayLabels.map((wd) => {
                  const isRest = restDays.includes(wd.day);
                  return (
                    <button
                      type="button"
                      key={wd.day}
                      onClick={() => {
                        if (isRest) {
                          setRestDays(restDays.filter((d) => d !== wd.day));
                        } else {
                          setRestDays([...restDays, wd.day]);
                        }
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isRest
                          ? 'bg-amber-500 text-white font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {wd.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start Date & Reminder Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-sm focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reminder Time
                </label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-sm focus:border-emerald-500 outline-hidden"
                />
              </div>
            </div>

            {/* AI Smart Notification Schedule Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>AI Smart Notification Delivery</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAiNudgeEnabled(!aiNudgeEnabled)}
                  className={`text-2xs font-bold px-2 py-0.5 rounded-full transition-colors ${
                    aiNudgeEnabled
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  AI Nudge {aiNudgeEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-2xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Alert Channel
                  </span>
                  <select
                    value={notificationChannel}
                    onChange={(e) => setNotificationChannel(e.target.value as NotificationChannel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium outline-hidden cursor-pointer"
                  >
                    <option value="push">🔔 Browser Push Notification</option>
                    <option value="email">✉️ Gmail Alert</option>
                    <option value="both">🔔 + ✉️ Push & Email</option>
                    <option value="none">Off (No Alerts)</option>
                  </select>
                </div>

                <div>
                  <span className="block text-2xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Custom Email (Optional)
                  </span>
                  <input
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder="Defaults to profile email"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Difficulty & Streak Goal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as HabitDifficulty)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-sm focus:border-emerald-500 outline-hidden cursor-pointer"
              >
                <option value="easy">Easy (Builds baseline momentum)</option>
                <option value="medium">Medium (Moderate discipline)</option>
                <option value="hard">Hard (Demanding high output)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Streak Milestone Goal (Days)
              </label>
              <input
                type="number"
                min="3"
                value={streakGoal}
                onChange={(e) => setStreakGoal(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-sm focus:border-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Pin toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <input
              type="checkbox"
              id="pin-habit"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
            <label htmlFor="pin-habit" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Pin this habit to the top of your dashboard
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            {editingHabit ? 'Save Changes' : 'Create Habit'}
          </button>
        </div>
      </div>
    </div>
  );
};
