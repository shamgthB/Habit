import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, ArrowRight, ArrowLeft, Check, Sun, Moon, Laptop, Droplets, BookOpen, Brain, Activity, Heart, Shield } from 'lucide-react';
import { ThemeMode } from '../../types';

export const OnboardingModal: React.FC = () => {
  const {
    isOnboardingOpen,
    setIsOnboardingOpen,
    profile,
    updateProfile,
    settings,
    updateSettings,
    addHabit,
    addToast,
  } = useApp();

  const [step, setStep] = useState<number>(1);
  const [userName, setUserName] = useState<string>(profile.name || '');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'Build unstoppable daily consistency',
    'Boost physical fitness and energy',
  ]);
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(settings.themeMode || 'dark');
  const [selectedTemplateHabits, setSelectedTemplateHabits] = useState<string[]>([
    'Drink 8 Glasses of Water',
    'Morning Meditation & Breathwork',
    'Daily Workout & Movement',
  ]);

  if (!isOnboardingOpen) return null;

  const goalOptions = [
    { id: 'consistency', label: 'Build unstoppable daily consistency', icon: '🎯' },
    { id: 'fitness', label: 'Boost physical fitness and energy', icon: '⚡' },
    { id: 'focus', label: 'Master deep focus & productivity', icon: '🧠' },
    { id: 'mindfulness', label: 'Cultivate inner calm & mindfulness', icon: '🌿' },
    { id: 'sleep', label: 'Optimize sleep & morning routine', icon: '🌙' },
    { id: 'learning', label: 'Read more books & learn new skills', icon: '📚' },
  ];

  const suggestedHabits = [
    {
      name: 'Drink 8 Glasses of Water',
      category: 'Health' as const,
      icon: 'Droplets',
      color: 'emerald',
      targetValue: 8,
      unit: 'glasses',
      frequency: 'daily' as const,
    },
    {
      name: 'Morning Meditation & Breathwork',
      category: 'Mindfulness' as const,
      icon: 'Sparkles',
      color: 'violet',
      targetValue: 15,
      unit: 'mins',
      frequency: 'daily' as const,
    },
    {
      name: 'Daily Workout & Movement',
      category: 'Fitness' as const,
      icon: 'Activity',
      color: 'rose',
      targetValue: 45,
      unit: 'mins',
      frequency: 'daily' as const,
    },
    {
      name: 'Read 20 Pages Non-Fiction',
      category: 'Study' as const,
      icon: 'BookOpen',
      color: 'amber',
      targetValue: 20,
      unit: 'pages',
      frequency: 'daily' as const,
    },
    {
      name: 'Deep Work 90 Mins',
      category: 'Productivity' as const,
      icon: 'Brain',
      color: 'indigo',
      targetValue: 90,
      unit: 'mins',
      frequency: 'daily' as const,
    },
  ];

  const handleFinish = () => {
    updateProfile({ name: userName || 'Habit Builder' });
    updateSettings({
      themeMode: selectedTheme,
      onboardingCompleted: true,
    });
    setIsOnboardingOpen(false);
    addToast({
      type: 'success',
      title: `Welcome, ${userName || 'Friend'}!`,
      message: 'Your personal dashboard is primed and ready.',
      duration: 5000,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Progress Dots */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-6 bg-emerald-500'
                    : s < step
                    ? 'w-2 bg-emerald-500/50'
                    : 'w-2 bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleFinish}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            Skip to Dashboard
          </button>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center py-6 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 mb-5">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Welcome to AuraHabit
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Your intelligent system for lasting daily consistency, holistic life score tracking, and automated Google Sheets sync.
            </p>
          </div>
        )}

        {/* Step 2: Name */}
        {step === 2 && (
          <div className="py-4 animate-in fade-in">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Step 2 of 7</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              What should we call you?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Personalize your daily dashboard greeting and milestone certificates.
            </p>

            <div className="mt-6">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Your Name / Preferred Nickname
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-base focus:border-emerald-500 outline-hidden transition-all"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 3: Main Goals */}
        {step === 3 && (
          <div className="py-4 animate-in fade-in">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Step 3 of 7</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              What are your primary goals?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select what matters most to you right now.
            </p>

            <div className="mt-5 space-y-2 max-h-64 overflow-y-auto">
              {goalOptions.map((g) => {
                const isSelected = selectedGoals.includes(g.label);
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedGoals(selectedGoals.filter((item) => item !== g.label));
                      } else {
                        setSelectedGoals([...selectedGoals, g.label]);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{g.icon}</span>
                      <span className="text-sm font-semibold">{g.label}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Theme */}
        {step === 4 && (
          <div className="py-4 animate-in fade-in">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Step 4 of 7</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              Choose your visual theme
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              You can toggle between Dark, Light, or System appearance anytime.
            </p>

            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { id: 'dark' as ThemeMode, label: 'Dark Mode', icon: Moon, desc: 'Easy on eyes' },
                { id: 'light' as ThemeMode, label: 'Light Mode', icon: Sun, desc: 'Crisp & clean' },
                { id: 'system' as ThemeMode, label: 'System', icon: Laptop, desc: 'Match OS' },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = selectedTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTheme(t.id);
                      updateSettings({ themeMode: t.id });
                    }}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm font-bold">{t.label}</p>
                    <p className="text-2xs opacity-75 mt-0.5">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: Templates Suggestion */}
        {step === 5 && (
          <div className="py-4 animate-in fade-in">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Step 5 of 7</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              Curated Habit Templates
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              We selected top high-impact foundational habits based on your goals.
            </p>

            <div className="mt-5 space-y-2 max-h-64 overflow-y-auto">
              {suggestedHabits.map((sh, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{sh.name}</p>
                    <p className="text-xs text-slate-400">{sh.category} • Target: {sh.targetValue} {sh.unit}</p>
                  </div>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Recommended
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Select Habits to Activate */}
        {step === 6 && (
          <div className="py-4 animate-in fade-in">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Step 6 of 7</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              Select habits to activate
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Check which habits you want live on your board right now.
            </p>

            <div className="mt-5 space-y-2 max-h-64 overflow-y-auto">
              {suggestedHabits.map((sh, idx) => {
                const isSelected = selectedTemplateHabits.includes(sh.name);
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTemplateHabits(selectedTemplateHabits.filter((n) => n !== sh.name));
                      } else {
                        setSelectedTemplateHabits([...selectedTemplateHabits, sh.name]);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold">{sh.name}</p>
                      <p className="text-xs opacity-75">{sh.category} • {sh.targetValue} {sh.unit}</p>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-emerald-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 7: Ready */}
        {step === 7 && (
          <div className="text-center py-6 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              You are all set, {userName}!
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Your personalized daily tracker, analytics dashboard, routines, and life score are configured and ready.
            </p>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 7 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              Enter Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
