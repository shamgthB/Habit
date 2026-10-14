import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Calendar,
  Sparkles,
  Layers,
  X,
  Edit2,
} from 'lucide-react';
import { Goal, GoalType } from '../../types';
import { getDaysAgo, formatHumanDate } from '../../utils/dateUtils';
import { ConfirmModal } from '../common/ConfirmModal';

export const GoalsView: React.FC = () => {
  const { goals, habits, addGoal, updateGoal, deleteGoal } = useApp();

  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<GoalType>('30_day');
  const [targetCount, setTargetCount] = useState<number>(30);
  const [deadline, setDeadline] = useState(getDaysAgo(-30));
  const [relatedHabitIds, setRelatedHabitIds] = useState<string[]>([]);

  const filteredGoals = goals.filter((g) => {
    if (filterType === 'all') return true;
    if (filterType === 'active') return !g.completed;
    if (filterType === 'completed') return g.completed;
    return g.type === filterType;
  });

  const openAddModal = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setType('30_day');
    setTargetCount(30);
    setDeadline(getDaysAgo(-30));
    setRelatedHabitIds(habits.slice(0, 1).map((h) => h.id));
    setIsModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description);
    setType(goal.type);
    setTargetCount(goal.targetCount);
    setDeadline(goal.deadline);
    setRelatedHabitIds(goal.relatedHabitIds);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingGoal) {
      updateGoal(editingGoal.id, {
        title: title.trim(),
        description: description.trim(),
        type,
        targetCount: Number(targetCount),
        deadline,
        relatedHabitIds,
      });
    } else {
      addGoal({
        title: title.trim(),
        description: description.trim(),
        type,
        targetCount: Number(targetCount),
        deadline,
        relatedHabitIds,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Goals & Milestones
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Target high-impact milestones tied directly to your daily habit completions
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Goals' },
          { id: 'active', label: 'In Progress' },
          { id: 'completed', label: 'Completed' },
          { id: '7_day', label: '7-Day' },
          { id: '30_day', label: '30-Day' },
          { id: '90_day', label: '90-Day' },
          { id: 'yearly', label: 'Yearly' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterType === tab.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredGoals.map((goal) => {
          const pct = goal.targetCount > 0 ? Math.min(100, Math.round((goal.currentCount / goal.targetCount) * 100)) : 0;
          const relatedHabits = habits.filter((h) => goal.relatedHabitIds.includes(h.id));

          return (
            <div
              key={goal.id}
              className={`p-6 rounded-3xl border transition-all ${
                goal.completed
                  ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2.5 rounded-xl ${
                      goal.completed
                        ? 'bg-emerald-500 text-white'
                        : 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                    }`}
                  >
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-3xs font-bold uppercase tracking-wider font-mono text-emerald-600 dark:text-emerald-400">
                      {goal.type.replace('_', ' ')}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {goal.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(goal)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setGoalToDelete(goal)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {goal.description}
              </p>

              {/* Progress Bar & Value */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Progress</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {goal.currentCount} / {goal.targetCount} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Linked Habits & Deadline */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-2xs text-slate-400">
                <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {relatedHabits.length > 0
                      ? relatedHabits.map((h) => h.name).join(', ')
                      : 'All habits linked'}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Target: {goal.deadline}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Read 2 Full Books"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why is this milestone important?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Goal Duration Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as GoalType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-hidden cursor-pointer"
                  >
                    <option value="7_day">7-Day Sprint</option>
                    <option value="30_day">30-Day Goal</option>
                    <option value="90_day">90-Day Quarter</option>
                    <option value="yearly">Yearly Milestone</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Check-ins
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetCount}
                    onChange={(e) => setTargetCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deadline Date
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-hidden"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  {editingGoal ? 'Save Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={goalToDelete !== null}
        title="Delete Goal?"
        message={`Are you sure you want to delete "${goalToDelete?.title}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={() => {
          if (goalToDelete) {
            deleteGoal(goalToDelete.id);
            setGoalToDelete(null);
          }
        }}
        onCancel={() => setGoalToDelete(null)}
      />
    </div>
  );
};
