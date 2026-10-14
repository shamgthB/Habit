import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Sparkles, Check, Plus, Layers, Flame, BookOpen, Heart, Brain, Moon, Shield, Award } from 'lucide-react';
import { Habit } from '../../types';

interface TemplatePack {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  habits: Omit<Habit, 'id' | 'createdAt' | 'order'>[];
}

export const TEMPLATE_PACKS: TemplatePack[] = [
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    description: 'Jumpstart your energy, mental clarity, and focus before the world wakes up.',
    icon: Sparkles,
    color: 'amber',
    habits: [
      {
        name: 'Drink 500ml Water Upon Waking',
        description: 'Rehydrate cells and kickstart metabolism immediately.',
        category: 'Health',
        icon: 'Droplets',
        color: 'emerald',
        frequency: 'daily',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        frequencyTargetCount: 7,
        startDate: new Date().toISOString().split('T')[0],
        targetValue: 1,
        unit: 'times',
        difficulty: 'easy',
        priority: 'high',
        notes: 'Keep a glass by the nightstand',
        streakGoal: 21,
        isArchived: false,
        isPinned: true,
      },
      {
        name: '10-Minute Morning Mindfulness',
        description: 'Breathing exercises or stillness meditation.',
        category: 'Mindfulness',
        icon: 'Sparkles',
        color: 'violet',
        frequency: 'daily',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        frequencyTargetCount: 7,
        startDate: new Date().toISOString().split('T')[0],
        targetValue: 10,
        unit: 'mins',
        difficulty: 'medium',
        priority: 'high',
        notes: 'Focus on abdominal breaths',
        streakGoal: 30,
        isArchived: false,
        isPinned: true,
      },
      {
        name: 'Sunlight & Light Movement',
        description: 'Step outside for natural morning light exposure.',
        category: 'Health',
        icon: 'Sun',
        color: 'amber',
        frequency: 'daily',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        frequencyTargetCount: 7,
        startDate: new Date().toISOString().split('T')[0],
        targetValue: 15,
        unit: 'mins',
        difficulty: 'easy',
        priority: 'medium',
        notes: 'Sets circadian clock',
        streakGoal: 14,
        isArchived: false,
        isPinned: false,
      },
    ],
  },
  {
    id: 'healthy-lifestyle',
    name: 'Healthy Lifestyle',
    description: 'Foundational pillars for vitality, physical stamina, and longevity.',
    icon: Heart,
    color: 'emerald',
    habits: [
      {
        name: 'Drink 8 Glasses of Water',
        description: 'Consistent daily hydration.',
        category: 'Health',
        icon: 'Droplets',
        color: 'emerald',
        frequency: 'daily',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        frequencyTargetCount: 7,
        startDate: new Date().toISOString().split('T')[0],
        targetValue: 8,
        unit: 'glasses',
        difficulty: 'easy',
        priority: 'high',
        notes: 'Track throughout the day',
        streakGoal: 30,
        isArchived: false,
        isPinned: true,
      },
      {
        name: 'Hit 8,000 Daily Steps',
        description: 'Maintain baseline cardiovascular activity.',
        category: 'Fitness',
        icon: 'Activity',
        color: 'rose',
        frequency: 'daily',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        frequencyTargetCount: 7,
        startDate: new Date().toISOString().split('T')[0],
        targetValue: 8000,
        unit: 'steps',
        difficulty: 'medium',
        priority: 'high',
        notes: 'Take stairs and walking breaks',
        streakGoal: 30,
        isArchived: false,
        isPinned: true,
      },
      {
        name: 'Eat Whole Food Veggies & Protein',
        description: 'Eliminate heavy processed snacks.',
        category: 'Health',
        icon: 'Apple',
        color: 'emerald',
        frequency: 'daily',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        frequencyTargetCount: 7,
        startDate: new Date().toISOString().split('T')[0],
        targetValue: 3,
        unit: 'meals',
        difficulty: 'medium',
        priority: 'medium',
        notes: 'Nutrient-dense nutrition',
        streakGoal: 21,
        isArchived: false,
        isPinned: false,
      },
    ],
  },
  {
    id: 'student-routine',
    name: 'Student Routine',
    description: 'Designed for academic excellence, comprehension, and stress-free exams.',
    icon: BookOpen,
    color: 'indigo',
    habits: [
      {
        name: 'Active Recall & Flashcard Review',
        description: 'Spaced repetition study session.',
        category: 'Study',
        icon: 'Layers',
        color: 'indigo',
        frequency: 'daily',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        frequencyTargetCount: 7,
        startDate: new Date().toISOString().split('T')[0],
        targetValue: 30,
        unit: 'mins',
        difficulty: 'medium',
        priority: 'high',
        notes: 'Anki or handwritten cards',
        streakGoal: 30,
        isArchived: false,
        isPinned: true,
      },
      {
        name: 'Complete 2 Deep Study Blocks',
        description: '50-minute focused subject immersion.',
        category: 'Study',
        icon: 'BookOpen',
        color: 'indigo',
        frequency: 'weekly_days',
        frequencyDays: [1, 2, 3, 4, 5],
        frequencyTargetCount: 5,
        startDate: new Date().toISOString().split('T')[0],
        targetValue: 2,
        unit: 'sessions',
        difficulty: 'hard',
        priority: 'high',
        notes: 'No phones or social tabs',
        streakGoal: 14,
        isArchived: false,
        isPinned: true,
      },
    ],
  },
  {
    id: 'fitness-routine',
    name: 'Fitness Routine',
    description: 'Strength, conditioning, recovery, and daily mobility practice.',
    icon: Flame,
    color: 'rose',
    habits: [
      {
        name: '45-Min Workout Training',
        description: 'Progressive strength or HIIT session.',
        category: 'Fitness',
        icon: 'Dumbbell',
        color: 'rose',
        frequency: 'weekly_days',
        frequencyDays: [1, 2, 3, 4, 5],
        frequencyTargetCount: 5,
        startDate: new Date().toISOString().split('T')[0],
        targetValue: 45,
        unit: 'mins',
        difficulty: 'hard',
        priority: 'high',
        notes: 'Warm up thoroughly first',
        streakGoal: 30,
        isArchived: false,
        isPinned: true,
      },
      {
        name: 'Post-Workout Mobility & Foam Rolling',
        description: 'Alleviate muscle tension and prevent injury.',
        category: 'Fitness',
        icon: 'Activity',
        color: 'rose',
        frequency: 'daily',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        frequencyTargetCount: 7,
        startDate: new Date().toISOString().split('T')[0],
        targetValue: 15,
        unit: 'mins',
        difficulty: 'easy',
        priority: 'medium',
        notes: 'Hips and spine mobility',
        streakGoal: 21,
        isArchived: false,
        isPinned: false,
      },
    ],
  },
  {
    id: 'productivity-routine',
    name: 'Productivity Routine',
    description: 'Master time, eliminate procrastination, and protect deep creative flow.',
    icon: Brain,
    color: 'violet',
    habits: [
      {
        name: 'Daily Priority 3 Execution',
        description: 'Define and conquer the top 3 highest leverage tasks.',
        category: 'Productivity',
        icon: 'CheckSquare',
        color: 'violet',
        frequency: 'weekly_days',
        frequencyDays: [1, 2, 3, 4, 5],
        frequencyTargetCount: 5,
        startDate: new Date().toISOString().split('T')[0],
        targetValue: 3,
        unit: 'tasks',
        difficulty: 'medium',
        priority: 'high',
        notes: 'Eat that frog first thing in the morning',
        streakGoal: 20,
        isArchived: false,
        isPinned: true,
      },
      {
        name: 'Zero Inbox & Daily Shutdown',
        description: 'Process messages and clean workspace before stopping.',
        category: 'Productivity',
        icon: 'Mail',
        color: 'blue',
        frequency: 'weekly_days',
        frequencyDays: [1, 2, 3, 4, 5],
        frequencyTargetCount: 5,
        startDate: new Date().toISOString().split('T')[0],
        targetValue: 1,
        unit: 'times',
        difficulty: 'easy',
        priority: 'medium',
        notes: 'Leave clean desk for tomorrow',
        streakGoal: 30,
        isArchived: false,
        isPinned: false,
      },
    ],
  },
  {
    id: 'sleep-improvement',
    name: 'Sleep Improvement',
    description: 'Optimize sleep architecture, deep REM cycles, and nighttime wind-down.',
    icon: Moon,
    color: 'indigo',
    habits: [
      {
        name: 'Screen Off 45 Mins Before Bed',
        description: 'Protect melatonin production against blue light.',
        category: 'Sleep',
        icon: 'Moon',
        color: 'indigo',
        frequency: 'daily',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        frequencyTargetCount: 7,
        startDate: new Date().toISOString().split('T')[0],
        targetValue: 45,
        unit: 'mins',
        difficulty: 'medium',
        priority: 'high',
        notes: 'Read book or listen to calming audio instead',
        streakGoal: 21,
        isArchived: false,
        isPinned: true,
      },
      {
        name: 'Consistent 10:30 PM Sleep Target',
        description: 'Synchronize circadian rhythm with strict sleep schedule.',
        category: 'Sleep',
        icon: 'Clock',
        color: 'indigo',
        frequency: 'daily',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        frequencyTargetCount: 7,
        startDate: new Date().toISOString().split('T')[0],
        targetValue: 8,
        unit: 'hours',
        difficulty: 'medium',
        priority: 'high',
        notes: 'Keep bedroom cool at 67°F (19°C)',
        streakGoal: 30,
        isArchived: false,
        isPinned: true,
      },
    ],
  },
  {
    id: 'digital-detox',
    name: 'Digital Detox',
    description: 'Regain attention span and silence endless social media noise.',
    icon: Shield,
    color: 'cyan',
    habits: [
      {
        name: 'Limit Social Media to 30 Mins',
        description: 'Set screen limit and stay conscious of mindless scrolling.',
        category: 'Personal',
        icon: 'Smartphone',
        color: 'cyan',
        frequency: 'daily',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        frequencyTargetCount: 7,
        startDate: new Date().toISOString().split('T')[0],
        targetValue: 30,
        unit: 'mins',
        difficulty: 'hard',
        priority: 'high',
        notes: 'Keep apps off the home screen',
        streakGoal: 14,
        isArchived: false,
        isPinned: true,
      },
    ],
  },
  {
    id: 'personal-growth',
    name: 'Personal Growth',
    description: 'Lifelong learning, self-reflection, and inner compounding.',
    icon: Award,
    color: 'amber',
    habits: [
      {
        name: 'Read 20 Pages Non-Fiction',
        description: 'Read high-impact philosophy, science, or psychology.',
        category: 'Study',
        icon: 'BookOpen',
        color: 'amber',
        frequency: 'daily',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        frequencyTargetCount: 7,
        startDate: new Date().toISOString().split('T')[0],
        targetValue: 20,
        unit: 'pages',
        difficulty: 'easy',
        priority: 'high',
        notes: 'Highlight and annotate favorite insights',
        streakGoal: 30,
        isArchived: false,
        isPinned: true,
      },
      {
        name: 'Daily Gratitude & Journaling',
        description: 'Write down 3 things grateful for and reflections on the day.',
        category: 'Mindfulness',
        icon: 'Feather',
        color: 'violet',
        frequency: 'daily',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        frequencyTargetCount: 7,
        startDate: new Date().toISOString().split('T')[0],
        targetValue: 1,
        unit: 'times',
        difficulty: 'easy',
        priority: 'medium',
        notes: '5 minutes before sleeping',
        streakGoal: 30,
        isArchived: false,
        isPinned: false,
      },
    ],
  },
];

export const HabitTemplatesModal: React.FC = () => {
  const { isTemplatesModalOpen, setIsTemplatesModalOpen, applyHabitTemplate } = useApp();
  const [selectedPack, setSelectedPack] = useState<string>(TEMPLATE_PACKS[0].id);

  if (!isTemplatesModalOpen) return null;

  const currentPack = TEMPLATE_PACKS.find((p) => p.id === selectedPack) || TEMPLATE_PACKS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Pre-Made Habit Templates
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Activate research-backed habit routines in one click
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsTemplatesModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Two columns */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
          {/* Packs List */}
          <div className="md:col-span-5 p-4 space-y-2 max-h-80 md:max-h-none overflow-y-auto">
            {TEMPLATE_PACKS.map((pack) => {
              const Icon = pack.icon;
              const isSelected = pack.id === selectedPack;
              return (
                <button
                  key={pack.id}
                  onClick={() => setSelectedPack(pack.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{pack.name}</p>
                    <p className="text-xs text-slate-400 truncate">{pack.habits.length} habits included</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pack Details */}
          <div className="md:col-span-7 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {currentPack.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {currentPack.description}
                  </p>
                </div>
              </div>

              {/* Habits in this template */}
              <div className="mt-5 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Included Habits ({currentPack.habits.length})
                </span>
                {currentPack.habits.map((habit, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {habit.name}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-slate-600 dark:text-slate-300">
                        {habit.targetValue} {habit.unit}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{habit.description}</p>
                    <div className="mt-2 flex items-center gap-2 text-2xs text-slate-400">
                      <span>Category: {habit.category}</span>
                      <span>•</span>
                      <span>Frequency: {habit.frequency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                You can edit or customize these anytime after adding.
              </span>
              <button
                onClick={() => applyHabitTemplate(currentPack.name, currentPack.habits)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Pack
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
