import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Plus,
  Search,
  Pin,
  Archive,
  Copy,
  Trash2,
  Edit2,
  Flame,
  LayoutGrid,
  List,
  Sparkles,
  Layers,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';
import { Habit } from '../../types';
import { calculateHabitStreak } from '../../utils/calculations';
import { DynamicIcon, CATEGORY_COLORS } from '../common/Icons';
import { ConfirmModal } from '../common/ConfirmModal';

export const HabitsView: React.FC = () => {
  const {
    habits,
    logs,
    setIsAddHabitModalOpen,
    setEditingHabit,
    deleteHabit,
    restoreHabit,
    deletedHabits,
    togglePinHabit,
    toggleArchiveHabit,
    duplicateHabit,
    reorderHabits,
    toggleHabitCompletion,
    setIsTemplatesModalOpen,
    selectedDate,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'pinned'>('active');
  const [sortBy, setSortBy] = useState<'order' | 'name' | 'streak' | 'priority'>('order');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Delete modal state
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  const categories = [
    'All',
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

  // Filtering and Sorting
  const filteredHabits = useMemo(() => {
    return habits
      .filter((h) => {
        // Status
        if (statusFilter === 'active' && h.isArchived) return false;
        if (statusFilter === 'archived' && !h.isArchived) return false;
        if (statusFilter === 'pinned' && (!h.isPinned || h.isArchived)) return false;

        // Category
        if (selectedCategory !== 'All' && h.category !== selectedCategory) return false;

        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = h.name.toLowerCase().includes(q);
          const matchCat = h.category.toLowerCase().includes(q);
          const matchDesc = h.description.toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'priority') {
          const priorityScore = { high: 3, medium: 2, low: 1 };
          return priorityScore[b.priority] - priorityScore[a.priority];
        }
        if (sortBy === 'streak') {
          const sA = calculateHabitStreak(a, logs).currentStreak;
          const sB = calculateHabitStreak(b, logs).currentStreak;
          return sB - sA;
        }
        // default order
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return a.order - b.order;
      });
  }, [habits, logs, statusFilter, selectedCategory, searchQuery, sortBy]);

  // Reorder handlers
  const moveHabit = (index: number, direction: 'up' | 'down') => {
    const newHabits = [...filteredHabits];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newHabits.length) return;

    const temp = newHabits[index];
    newHabits[index] = newHabits[targetIdx];
    newHabits[targetIdx] = temp;
    reorderHabits(newHabits);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header with iOS Bold Typography & Pill CTA Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Habits
          </h1>
          <p className="text-[13px] sm:text-[14px] text-slate-500 dark:text-white/60 font-normal mt-1 max-w-xl">
            Organize, schedule, and track your daily rituals and long-term routines
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTemplatesModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-200/90 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.05] hover:bg-white dark:hover:bg-white/[0.09] text-slate-700 dark:text-white font-semibold text-[13px] shadow-xs active:scale-[0.97] transition-all duration-150 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-[#30D158]" />
            <span className="hidden sm:inline">Templates</span>
          </button>

          <button
            onClick={() => setIsAddHabitModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#30D158] to-[#28B54C] hover:from-[#35DE60] hover:to-[#2DC252] text-black font-bold text-[13px] shadow-[0_4px_18px_rgba(48,209,88,0.35)] hover:shadow-[0_6px_22px_rgba(48,209,88,0.45)] active:scale-[0.97] transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Habit</span>
          </button>
        </div>
      </div>

      {/* Recently Deleted Banner (Undo Support) */}
      {deletedHabits.length > 0 && (
        <div className="p-4 rounded-[20px] bg-[#FF9F0A]/10 dark:bg-[#FF9F0A]/15 border border-[#FF9F0A]/25 backdrop-blur-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 text-[13px] text-[#FF9F0A] font-medium">
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>
              Recently deleted habit: <strong className="font-bold">&ldquo;{deletedHabits[0].habit.name}&rdquo;</strong>
            </span>
          </div>
          <button
            onClick={() => restoreHabit(deletedHabits[0].habit.id)}
            className="text-[12px] font-bold text-[#FF9F0A] hover:underline px-3 py-1 rounded-full bg-[#FF9F0A]/20 transition-all cursor-pointer"
          >
            Undo Restore
          </button>
        </div>
      )}

      {/* iOS Translucent Glass Toolbar: Search, Status Segments, Categories */}
      <div className="p-4 sm:p-5 rounded-[22px] bg-white/70 dark:bg-[#141722]/70 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* iOS Capsule Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 dark:text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search habits by name, category, notes..."
              className="w-full pl-9 pr-8 py-2 rounded-full border border-slate-200/90 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.04] text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:border-[#30D158] focus:bg-white dark:focus:bg-white/[0.07] outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Segmented Control & View Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* iOS Segmented Control */}
            <div className="flex items-center p-1 rounded-full bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.06] backdrop-blur-xl">
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3.5 py-1 rounded-full text-[12px] font-semibold transition-all duration-150 cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-white dark:bg-white/[0.16] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('pinned')}
                className={`px-3.5 py-1 rounded-full text-[12px] font-semibold transition-all duration-150 cursor-pointer ${
                  statusFilter === 'pinned'
                    ? 'bg-white dark:bg-white/[0.16] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Pinned
              </button>
              <button
                onClick={() => setStatusFilter('archived')}
                className={`px-3.5 py-1 rounded-full text-[12px] font-semibold transition-all duration-150 cursor-pointer ${
                  statusFilter === 'archived'
                    ? 'bg-white dark:bg-white/[0.16] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Archived
              </button>
            </div>

            {/* Sort Capsule Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-1.5 rounded-full border border-slate-200/90 dark:border-white/[0.08] bg-slate-100/80 dark:bg-white/[0.05] text-[12px] font-semibold text-slate-700 dark:text-white/80 outline-none cursor-pointer hover:bg-slate-200/80 dark:hover:bg-white/[0.09] transition-all"
            >
              <option value="order" className="dark:bg-[#141722] text-slate-900 dark:text-white">Custom Order</option>
              <option value="name" className="dark:bg-[#141722] text-slate-900 dark:text-white">Name (A-Z)</option>
              <option value="streak" className="dark:bg-[#141722] text-slate-900 dark:text-white">Longest Streak</option>
              <option value="priority" className="dark:bg-[#141722] text-slate-900 dark:text-white">Priority</option>
            </select>

            {/* List vs Grid Segment Toggle */}
            <div className="flex items-center p-1 rounded-full bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.06]">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full transition-all duration-150 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-white/[0.16] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white'
                }`}
                aria-label="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-all duration-150 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-white/[0.16] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white'
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Capsule Chips with High Active Contrast */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#30D158] to-[#28B54C] text-black font-bold shadow-[0_2px_12px_rgba(48,209,88,0.35)]'
                    : 'bg-slate-100/80 dark:bg-white/[0.05] text-slate-600 dark:text-white/70 border border-slate-200/60 dark:border-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.09] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Habits List / Grid with iOS Glassmorphic Cards */}
      {filteredHabits.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white/70 dark:bg-[#141722]/60 rounded-[24px] border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <Sparkles className="w-10 h-10 text-[#30D158]/50 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No habits match your filters</h3>
          <p className="text-[13px] text-slate-500 dark:text-white/60 mt-1">Try switching categories or clear search</p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setStatusFilter('active');
            }}
            className="mt-4 px-5 py-2 rounded-full bg-gradient-to-r from-[#30D158] to-[#28B54C] text-black text-[13px] font-bold shadow-[0_4px_16px_rgba(48,209,88,0.3)] cursor-pointer active:scale-95 transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredHabits.map((habit, index) => {
            const streakRes = calculateHabitStreak(habit, logs, selectedDate);
            const isCompletedToday = logs.some(
              (l) => l.habitId === habit.id && l.date === selectedDate && l.completed
            );
            const catColor = CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.Other;

            return (
              <div
                key={habit.id}
                className="p-4 sm:p-4.5 rounded-[20px] bg-white/80 dark:bg-[#141722]/75 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.44)] hover:scale-[1.004] transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Left side: Reorder + Icon + Info */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Reorder Arrows */}
                  {sortBy === 'order' && (
                    <div className="flex flex-col gap-0.5 text-slate-300 dark:text-white/30 hover:text-slate-600 dark:hover:text-white">
                      <button
                        onClick={() => moveHabit(index, 'up')}
                        disabled={index === 0}
                        className="disabled:opacity-20 cursor-pointer p-0.5 hover:scale-110 active:scale-90 transition-transform"
                        title="Move up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveHabit(index, 'down')}
                        disabled={index === filteredHabits.length - 1}
                        className="disabled:opacity-20 cursor-pointer p-0.5 hover:scale-110 active:scale-90 transition-transform"
                        title="Move down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* iOS Category Icon Badge */}
                  <div
                    className={`p-3 rounded-[14px] shrink-0 ${catColor.bg} ${catColor.text} border ${catColor.border} flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105`}
                  >
                    <DynamicIcon name={habit.icon} className="w-5 h-5 stroke-[2.2]" />
                  </div>

                  {/* Habit Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900 dark:text-white tracking-tight truncate">
                        {habit.name}
                      </h3>
                      {habit.isPinned && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/25">
                          Pinned
                        </span>
                      )}
                      {habit.isArchived && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/[0.08] text-slate-500 dark:text-white/50">
                          Archived
                        </span>
                      )}
                    </div>
                    {habit.description && (
                      <p className="text-[12px] sm:text-[13px] text-slate-500 dark:text-white/60 truncate mt-0.5">
                        {habit.description}
                      </p>
                    )}

                    {/* Unboxed Metadata with Typographic Separators */}
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] sm:text-[12px] text-slate-400 dark:text-white/45">
                      <span className={`font-semibold ${catColor.text}`}>{habit.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>Target: {habit.targetValue} {habit.unit}</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 font-semibold text-[#FF9F0A]">
                        <Flame className="w-3.5 h-3.5 fill-[#FF9F0A]" />
                        {streakRes.currentStreak}d streak
                        {streakRes.longestStreak > streakRes.currentStreak && (
                          <span className="text-slate-400 dark:text-white/40 font-normal">
                            (Best {streakRes.longestStreak}d)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Mark Done CTA + Actions Toolbar */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/[0.06]">
                  {/* Mark Done / Completed iOS Button */}
                  <button
                    onClick={() => toggleHabitCompletion(habit.id, selectedDate)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all duration-150 cursor-pointer active:scale-95 ${
                      isCompletedToday
                        ? 'bg-gradient-to-r from-[#30D158] to-[#28B54C] text-black shadow-[0_0_20px_rgba(48,209,88,0.45)]'
                        : 'bg-slate-100/90 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-white border border-slate-200/80 dark:border-white/[0.08]'
                    }`}
                  >
                    {isCompletedToday ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <span>Mark Done</span>
                    )}
                  </button>

                  {/* Actions Toolbar with Sleek iOS Circular Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => togglePinHabit(habit.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                        habit.isPinned
                          ? 'text-[#FF9F0A] bg-[#FF9F0A]/15 border border-[#FF9F0A]/30'
                          : 'text-slate-400 dark:text-white/45 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08]'
                      }`}
                      title={habit.isPinned ? 'Unpin habit' : 'Pin habit to top'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => duplicateHabit(habit.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 dark:text-white/45 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer active:scale-90"
                      title="Duplicate habit"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => toggleArchiveHabit(habit.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 dark:text-white/45 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer active:scale-90"
                      title={habit.isArchived ? 'Unarchive' : 'Archive habit'}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setEditingHabit(habit)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 dark:text-white/45 hover:text-[#30D158] hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer active:scale-90"
                      title="Edit habit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setHabitToDelete(habit)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 dark:text-white/45 hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-all cursor-pointer active:scale-90"
                      title="Delete habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* iOS Glassmorphic Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredHabits.map((habit) => {
            const streakRes = calculateHabitStreak(habit, logs, selectedDate);
            const isCompletedToday = logs.some(
              (l) => l.habitId === habit.id && l.date === selectedDate && l.completed
            );
            const catColor = CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.Other;

            return (
              <div
                key={habit.id}
                className="p-5 rounded-[22px] bg-white/80 dark:bg-[#141722]/75 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.44)] hover:scale-[1.006] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`p-3 rounded-[14px] shrink-0 ${catColor.bg} ${catColor.text} border ${catColor.border} flex items-center justify-center shadow-xs`}
                    >
                      <DynamicIcon name={habit.icon} className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePinHabit(habit.id)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                          habit.isPinned
                            ? 'text-[#FF9F0A] bg-[#FF9F0A]/15'
                            : 'text-slate-300 dark:text-white/30 hover:text-slate-600 dark:hover:text-white'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingHabit(habit)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 dark:text-white/30 hover:text-[#30D158] transition-all cursor-pointer active:scale-90"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setHabitToDelete(habit)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 dark:text-white/30 hover:text-[#FF453A] transition-all cursor-pointer active:scale-90"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mt-3.5 truncate">
                    {habit.name}
                  </h3>
                  <p className="text-[12px] text-slate-500 dark:text-white/60 mt-1 line-clamp-2">
                    {habit.description || 'Daily ritual tracked with AuraHabit.'}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#FF9F0A]">
                    <Flame className="w-4 h-4 fill-[#FF9F0A]" />
                    <span>{streakRes.currentStreak}d</span>
                  </div>

                  <button
                    onClick={() => toggleHabitCompletion(habit.id, selectedDate)}
                    className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all duration-150 cursor-pointer active:scale-95 ${
                      isCompletedToday
                        ? 'bg-gradient-to-r from-[#30D158] to-[#28B54C] text-black shadow-[0_0_16px_rgba(48,209,88,0.4)]'
                        : 'bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-white border border-slate-200/80 dark:border-white/[0.08]'
                    }`}
                  >
                    {isCompletedToday ? 'Done' : 'Complete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={habitToDelete !== null}
        title="Delete Habit?"
        message={`Are you sure you want to delete "${habitToDelete?.name}"? You can restore recently deleted habits anytime from the top banner.`}
        confirmText="Delete Habit"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={() => {
          if (habitToDelete) {
            deleteHabit(habitToDelete.id);
            setHabitToDelete(null);
          }
        }}
        onCancel={() => setHabitToDelete(null)}
      />
    </div>
  );
};
