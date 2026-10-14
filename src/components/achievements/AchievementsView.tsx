import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Award, Trophy, Lock, CheckCircle2, Zap, Sparkles } from 'lucide-react';
import { getLevelForXp, LEVELS } from '../../utils/calculations';

export const AchievementsView: React.FC = () => {
  const { achievements, profile } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const levelInfo = getLevelForXp(profile.xp);
  const nextLevel = LEVELS.find((l) => l.level === levelInfo.level + 1) || levelInfo;

  const xpProgress = profile.xp - levelInfo.minXp;
  const xpNeeded = levelInfo.nextLevelXp - levelInfo.minXp;
  const levelProgressPct = Math.min(100, Math.round((xpProgress / (xpNeeded || 1)) * 100));

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  const categories = ['All', 'Streaks', 'Milestones', 'Mastery', 'Special'];

  const filteredAchievements = achievements.filter((a) => {
    if (selectedCategory === 'All') return true;
    return a.category === selectedCategory;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Achievements & Mastery
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Unlock badges as you reinforce atomic habits and achieve legendary consistency
        </p>
      </div>

      {/* Gamification Level Progression Card */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-purple-900/10 via-indigo-900/10 to-transparent dark:from-purple-950/40 dark:via-slate-800/60 dark:to-slate-900 border border-purple-500/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-purple-500/20">
            Lv.{levelInfo.level}
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Current Rank
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {levelInfo.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {profile.xp} total XP accumulated • {unlockedCount} of {achievements.length} badges unlocked
            </p>
          </div>
        </div>

        <div className="w-full md:max-w-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-400">Next: {nextLevel.title}</span>
            <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
              {profile.xp} / {levelInfo.nextLevelXp} XP
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${levelProgressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Achievements Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((ach) => {
          const isUnlocked = !!ach.unlockedAt;
          const pct = Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100));

          return (
            <div
              key={ach.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isUnlocked
                  ? 'bg-white dark:bg-slate-900 border-amber-500/30 shadow-xs'
                  : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        isUnlocked
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isUnlocked ? '🏆' : <Lock className="w-5 h-5 text-slate-400" />}
                    </div>

                    <div>
                      <span className="text-3xs font-semibold uppercase tracking-wider text-slate-400">
                        {ach.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {ach.title}
                      </h3>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                    +{ach.xp} XP
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                  {ach.description}
                </p>
              </div>

              {/* Progress and status */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                {isUnlocked ? (
                  <div className="flex items-center justify-between text-2xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Unlocked
                    </span>
                    <span className="text-slate-400 font-mono">
                      {ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString() : 'Active'}
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between text-3xs font-mono text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>
                        {ach.progress} / {ach.maxProgress}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
