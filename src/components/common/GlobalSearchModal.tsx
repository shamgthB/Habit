import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, X, CheckSquare, Target, Trophy, Clock, ArrowRight } from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchModalOpen,
    setIsSearchModalOpen,
    habits,
    goals,
    challenges,
    historyItems,
    setCurrentSection,
  } = useApp();

  const [query, setQuery] = useState('');

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(!isSearchModalOpen);
      }
      if (e.key === 'Escape' && isSearchModalOpen) {
        setIsSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, setIsSearchModalOpen]);

  // Results
  const results = useMemo(() => {
    if (!query.trim()) {
      return {
        habits: habits.slice(0, 4),
        goals: goals.slice(0, 2),
        challenges: challenges.slice(0, 2),
        history: [],
      };
    }
    const q = query.toLowerCase();

    return {
      habits: habits.filter((h) => h.name.toLowerCase().includes(q) || h.category.toLowerCase().includes(q)),
      goals: goals.filter((g) => g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)),
      challenges: challenges.filter((c) => c.title.toLowerCase().includes(q)),
      history: historyItems.filter((h) => h.title.toLowerCase().includes(q) || h.subtitle.toLowerCase().includes(q)).slice(0, 5),
    };
  }, [query, habits, goals, challenges, historyItems]);

  if (!isSearchModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search habits, goals, challenges, logs... (Esc to close)"
            autoFocus
            className="flex-1 bg-transparent border-none outline-hidden text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
            ESC
          </span>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-5">
          {/* Habits */}
          {results.habits.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Habits</span>
              </div>
              <div className="space-y-1">
                {results.habits.map((habit) => (
                  <button
                    key={habit.id}
                    onClick={() => {
                      setCurrentSection('habits');
                      setIsSearchModalOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 transition-colors">
                        {habit.name}
                      </p>
                      <p className="text-xs text-slate-400">{habit.category} • Target: {habit.targetValue} {habit.unit}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Goals */}
          {results.goals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                <Target className="w-3.5 h-3.5" />
                <span>Goals</span>
              </div>
              <div className="space-y-1">
                {results.goals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => {
                      setCurrentSection('goals');
                      setIsSearchModalOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 transition-colors">
                        {goal.title}
                      </p>
                      <p className="text-xs text-slate-400">Progress: {goal.currentCount}/{goal.targetCount}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Challenges */}
          {results.challenges.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                <Trophy className="w-3.5 h-3.5" />
                <span>Challenges</span>
              </div>
              <div className="space-y-1">
                {results.challenges.map((chal) => (
                  <button
                    key={chal.id}
                    onClick={() => {
                      setCurrentSection('challenges');
                      setIsSearchModalOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 transition-colors">
                        {chal.badge} {chal.title}
                      </p>
                      <p className="text-xs text-slate-400">Reward: +{chal.xpReward} XP</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          {results.history.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Recent Activity</span>
              </div>
              <div className="space-y-1">
                {results.history.map((hist) => (
                  <button
                    key={hist.id}
                    onClick={() => {
                      setCurrentSection('history');
                      setIsSearchModalOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {hist.title}
                      </p>
                      <p className="text-xs text-slate-400">{hist.date} • {hist.subtitle}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.habits.length === 0 &&
            results.goals.length === 0 &&
            results.challenges.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">No results found for &ldquo;{query}&rdquo;</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
