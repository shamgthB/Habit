import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  Brain,
  Award,
  Smile,
  Zap,
  Calendar,
} from 'lucide-react';
import { formatHumanDate } from '../../utils/dateUtils';

export const HistoryView: React.FC = () => {
  const { historyItems } = useApp();

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredHistory = useMemo(() => {
    return historyItems.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSub = item.subtitle.toLowerCase().includes(q);
        if (!matchTitle && !matchSub) return false;
      }
      return true;
    });
  }, [historyItems, typeFilter, query]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Activity History Log
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Chronological audit trail of habit completions, focus blocks, and unlocked badges
        </p>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activity log..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Activities' },
            { id: 'habit', label: 'Habits' },
            { id: 'focus', label: 'Focus Sprints' },
            { id: 'achievement', label: 'Achievements' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                typeFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No activity records found</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 pl-6 space-y-6">
            {filteredHistory.map((item) => {
              const iconMap = {
                habit: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
                focus: <Brain className="w-4 h-4 text-indigo-500" />,
                achievement: <Award className="w-4 h-4 text-amber-500" />,
                mood: <Smile className="w-4 h-4 text-teal-500" />,
                goal: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
                challenge: <Award className="w-4 h-4 text-amber-500" />,
              };

              return (
                <div key={item.id} className="relative group">
                  {/* Dot on the timeline */}
                  <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-500" />

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                        {iconMap[item.type] || <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-slate-400 sm:self-center self-end">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        +{item.xp} XP
                      </span>
                      <span>{formatHumanDate(item.date)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
