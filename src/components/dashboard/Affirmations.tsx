import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Heart,
  Quote,
  Lightbulb,
  Volume2,
  VolumeX,
  Share2,
  Trash2,
  Search,
  Sunrise,
  CheckCircle2,
  ExternalLink,
  Flame,
  Zap,
  SlidersHorizontal,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  Affirmation,
  LikedAffirmation,
  getDailyAffirmation,
  getLikedAffirmations,
  toggleLikeAffirmation,
  isAffirmationLiked,
  removeLikedAffirmation,
  AFFIRMATION_CATEGORIES,
  AffirmationCategory,
  MORALE_VIBES,
} from '../../services/affirmationService';
import { useApp } from '../../context/AppContext';
import { getTodayDateString, formatHumanDate } from '../../utils/dateUtils';

interface AffirmationsProps {
  className?: string;
  onAffirmationChange?: (affirmation: Affirmation) => void;
  defaultTab?: 'daily' | 'liked';
}

const THEME_ACCENTS: Record<
  string,
  { bgGlow: string; text: string; border: string; badge: string; emoji: string }
> = {
  'Consistency & Habits': {
    bgGlow: 'from-[#30D158]/15 via-[#30D158]/5 to-transparent',
    text: 'text-[#30D158]',
    border: 'border-[#30D158]/30',
    badge: 'bg-[#30D158]/15 text-[#30D158]',
    emoji: '🌿',
  },
  'Mindfulness & Peace': {
    bgGlow: 'from-[#BF5AF2]/15 via-[#BF5AF2]/5 to-transparent',
    text: 'text-[#BF5AF2]',
    border: 'border-[#BF5AF2]/30',
    badge: 'bg-[#BF5AF2]/15 text-[#BF5AF2]',
    emoji: '🧘',
  },
  'Focus & Deep Work': {
    bgGlow: 'from-[#0A84FF]/15 via-[#0A84FF]/5 to-transparent',
    text: 'text-[#0A84FF]',
    border: 'border-[#0A84FF]/30',
    badge: 'bg-[#0A84FF]/15 text-[#0A84FF]',
    emoji: '⚡',
  },
  'Resilience & Grit': {
    bgGlow: 'from-[#FF453A]/15 via-[#FF453A]/5 to-transparent',
    text: 'text-[#FF453A]',
    border: 'border-[#FF453A]/30',
    badge: 'bg-[#FF453A]/15 text-[#FF453A]',
    emoji: '🛡️',
  },
  'Health & Vitality': {
    bgGlow: 'from-[#30D158]/15 via-[#64D2FF]/5 to-transparent',
    text: 'text-[#30D158]',
    border: 'border-[#30D158]/30',
    badge: 'bg-[#30D158]/15 text-[#30D158]',
    emoji: '🍎',
  },
  'Confidence & Gratitude': {
    bgGlow: 'from-[#FFD60A]/15 via-[#FFD60A]/5 to-transparent',
    text: 'text-[#FFD60A]',
    border: 'border-[#FFD60A]/30',
    badge: 'bg-[#FFD60A]/15 text-[#FFD60A]',
    emoji: '✨',
  },
};

const MORALE_CHECKIN_KEY = 'aura_morning_morale_internalized_';

export const Affirmations: React.FC<AffirmationsProps> = ({
  className = '',
  onAffirmationChange,
  defaultTab = 'daily',
}) => {
  const { addToast, todayMood, profile, globalStreak, habits, awardXp } = useApp();

  const [activeTab, setActiveTab] = useState<'daily' | 'liked'>(defaultTab);
  const [affirmation, setAffirmation] = useState<Affirmation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<AffirmationCategory>('Consistency & Habits');
  const [selectedVibe, setSelectedVibe] = useState<string>('morning_momentum');
  const [likedList, setLikedList] = useState<LikedAffirmation[]>([]);
  const [searchLikedQuery, setSearchLikedQuery] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [hasInternalizedToday, setHasInternalizedToday] = useState<boolean>(false);
  const [showVibeSelector, setShowVibeSelector] = useState<boolean>(false);

  // Load liked list from localStorage
  const refreshLikedList = useCallback(() => {
    const list = getLikedAffirmations();
    setLikedList(list);
  }, []);

  // Sync liked list on mount and listen to window events
  useEffect(() => {
    refreshLikedList();

    const handleSync = (e: any) => {
      if (e?.detail) {
        setLikedList(e.detail);
      } else {
        refreshLikedList();
      }
    };

    window.addEventListener('aura_liked_affirmations_updated', handleSync);
    window.addEventListener('storage', refreshLikedList);

    return () => {
      window.removeEventListener('aura_liked_affirmations_updated', handleSync);
      window.removeEventListener('storage', refreshLikedList);
    };
  }, [refreshLikedList]);

  // Check if internalized today
  useEffect(() => {
    const today = getTodayDateString();
    const stored = localStorage.getItem(`${MORALE_CHECKIN_KEY}${today}`);
    setHasInternalizedToday(Boolean(stored));
  }, []);

  // Update liked heart status whenever affirmation or likedList changes
  useEffect(() => {
    if (affirmation?.quote) {
      setIsLiked(isAffirmationLiked(affirmation.quote));
    }
  }, [affirmation, likedList]);

  // Fetch daily affirmation
  const fetchAffirmation = useCallback(
    async (force: boolean = false, overrideCategory?: AffirmationCategory, overrideVibe?: string) => {
      setLoading(true);
      try {
        const cat = overrideCategory || selectedCategory;
        const vibe = overrideVibe || selectedVibe;
        const topHabitNames = habits.slice(0, 3).map((h) => h.name);

        const data = await getDailyAffirmation({
          category: cat,
          mood: todayMood?.mood || 'focused',
          userName: profile.name || 'Habit Builder',
          streak: globalStreak?.currentStreak || 0,
          topHabits: topHabitNames,
          moraleGoal: vibe,
          forceRefresh: force,
        });

        setAffirmation(data);
        setIsLiked(isAffirmationLiked(data.quote));
        if (onAffirmationChange) {
          onAffirmationChange(data);
        }
      } catch (err) {
        console.error('Failed to load affirmation:', err);
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory, selectedVibe, todayMood, profile.name, globalStreak, habits, onAffirmationChange]
  );

  useEffect(() => {
    fetchAffirmation(false);
  }, [fetchAffirmation]);

  // Handle Like Toggle
  const handleToggleLike = (targetAffirmation?: Affirmation) => {
    const aff = targetAffirmation || affirmation;
    if (!aff) return;

    const nextLiked = toggleLikeAffirmation(aff);
    if (!targetAffirmation || targetAffirmation.quote === affirmation?.quote) {
      setIsLiked(nextLiked);
    }
    refreshLikedList();

    if (nextLiked) {
      // Trigger heart celebratory burst
      try {
        confetti({
          particleCount: 28,
          spread: 45,
          origin: { y: 0.65 },
          colors: ['#FF2D55', '#FF375F', '#FF6482', '#FFD60A'],
        });
      } catch {
        // Ignore confetti errors
      }

      addToast({
        type: 'success',
        title: 'Saved to Liked Quotes ❤️',
        message: `"${aff.author}" quote added to your personal liked collection.`,
      });
    } else {
      addToast({
        type: 'info',
        title: 'Removed from Liked Quotes',
        message: 'Quote unhearted from your liked list.',
      });
    }
  };

  // Handle Unlike from list
  const handleRemoveLiked = (identifier: string) => {
    const updated = removeLikedAffirmation(identifier);
    setLikedList(updated);
    if (affirmation && (affirmation.quote === identifier || !isAffirmationLiked(affirmation.quote))) {
      setIsLiked(false);
    }
    addToast({
      type: 'info',
      title: 'Removed from Liked Quotes',
    });
  };

  // Set liked quote as current daily quote
  const handleApplyAsCurrent = (liked: LikedAffirmation) => {
    setAffirmation(liked);
    setIsLiked(true);
    if (onAffirmationChange) {
      onAffirmationChange(liked);
    }
    setActiveTab('daily');
    addToast({
      type: 'success',
      title: 'Applied to Dashboard',
      message: 'This quote is now your primary inspiration for the day.',
    });
  };

  // Copy quote text
  const handleCopy = (textToCopy?: string, authorToCopy?: string) => {
    const text = textToCopy || affirmation?.quote;
    const author = authorToCopy || affirmation?.author;
    if (!text) return;

    navigator.clipboard.writeText(`"${text}" — ${author}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    addToast({
      type: 'info',
      title: 'Quote Copied to Clipboard',
      message: 'Ready to paste into your notes or share.',
    });
  };

  // Audio Speech synthesis
  const handlePlayAudio = (quoteText?: string, authorText?: string) => {
    const q = quoteText || affirmation?.quote;
    const a = authorText || affirmation?.author;
    if (!q) return;

    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`"${q}" by ${a}`);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
    } else {
      addToast({
        type: 'warning',
        title: 'Audio Not Supported',
        message: 'Speech synthesis is not available on this browser.',
      });
    }
  };

  // Internalize daily affirmation
  const handleInternalizeMorale = () => {
    if (hasInternalizedToday || !affirmation) return;

    const today = getTodayDateString();
    localStorage.setItem(`${MORALE_CHECKIN_KEY}${today}`, 'true');
    setHasInternalizedToday(true);

    awardXp(20, `Daily Affirmation Internalized: "${affirmation.theme || 'Consistency'}"`);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#30D158', '#0A84FF', '#FFD60A', '#BF5AF2'],
      });
    } catch {
      // Ignore
    }

    addToast({
      type: 'success',
      title: 'Morale Boost Internalized! +20 XP ✨',
      message: 'Mindset locked in. Have an extraordinary, disciplined day ahead!',
    });
  };

  const currentTheme =
    THEME_ACCENTS[affirmation?.theme || selectedCategory] ||
    THEME_ACCENTS['Consistency & Habits'];

  // Filtered liked quotes for search
  const filteredLiked = useMemo(() => {
    if (!searchLikedQuery.trim()) return likedList;
    const q = searchLikedQuery.toLowerCase();
    return likedList.filter(
      (item) =>
        item.quote.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.theme?.toLowerCase().includes(q)
    );
  }, [likedList, searchLikedQuery]);

  return (
    <div
      className={`relative overflow-hidden rounded-[26px] bg-white/80 dark:bg-[#141722]/85 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.4)] transition-all ${className}`}
    >
      {/* Ambient background glow according to active theme */}
      <div
        className={`absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-gradient-to-br ${currentTheme.bgGlow} blur-3xl pointer-events-none transition-all duration-700`}
      />

      {/* Top Segmented Navigation Tabs */}
      <div className="relative z-10 px-5 pt-5 pb-3 border-b border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between gap-3">
        {/* Segmented Control */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100/80 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.05]">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-white dark:bg-[#1C2030] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sunrise className="w-3.5 h-3.5 text-amber-500" />
            <span>Daily Affirmation</span>
          </button>

          <button
            onClick={() => setActiveTab('liked')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'liked'
                ? 'bg-white dark:bg-[#1C2030] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                likedList.length > 0 ? 'text-[#FF2D55] fill-[#FF2D55]' : 'text-slate-400'
              }`}
            />
            <span>Liked</span>
            {likedList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FF2D55]/15 text-[#FF2D55] dark:text-[#FF375F]">
                {likedList.length}
              </span>
            )}
          </button>
        </div>

        {/* Right side controls */}
        {activeTab === 'daily' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowVibeSelector(!showVibeSelector)}
              title="Change vibe or category"
              className={`p-2 rounded-xl text-xs transition-all cursor-pointer border ${
                showVibeSelector
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-100/70 dark:bg-white/[0.06] hover:bg-slate-200/70 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 border-transparent'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => fetchAffirmation(true)}
              disabled={loading}
              title="Generate new affirmation"
              className="p-2 rounded-xl text-xs bg-slate-100/70 dark:bg-white/[0.06] hover:bg-slate-200/70 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: DAILY AFFIRMATION VIEW */}
      {activeTab === 'daily' && (
        <div className="relative z-10 p-5 sm:p-6 space-y-5">
          {/* Vibe / Category Selector Drawer */}
          {showVibeSelector && (
            <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Select Intention & Vibe
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Gemini Prompt Calibrator
                </span>
              </div>

              {/* Morale Vibe Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {MORALE_VIBES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVibe(v.id);
                      fetchAffirmation(true, undefined, v.id);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedVibe === v.id
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                        : 'bg-white dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200/60 dark:border-white/[0.06]'
                    }`}
                  >
                    <span>{v.emoji}</span>
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>

              {/* Theme Categories */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {AFFIRMATION_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      fetchAffirmation(true, cat);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200/60 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quote Body */}
          {loading ? (
            <div className="py-8 space-y-4 animate-pulse">
              <div className="w-12 h-4 rounded-md bg-slate-200 dark:bg-white/[0.08]" />
              <div className="w-full h-16 rounded-xl bg-slate-200 dark:bg-white/[0.08]" />
              <div className="w-1/3 h-4 rounded-md bg-slate-200 dark:bg-white/[0.08]" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category & Status Pill */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentTheme.badge} ${currentTheme.border}`}
                >
                  <span>{currentTheme.emoji}</span>
                  <span>{affirmation?.theme || selectedCategory}</span>
                </span>

                <div className="flex items-center gap-2">
                  {affirmation?.isAiGenerated ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                      Gemini Morning AI
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400">
                      Curated Wisdom
                    </span>
                  )}
                </div>
              </div>

              {/* Quote text */}
              <div className="relative pl-6 pr-2">
                <Quote className="absolute left-0 top-0 w-5 h-5 text-slate-300 dark:text-white/20 rotate-180" />
                <p className="text-base sm:text-lg font-serif italic text-slate-800 dark:text-slate-100 leading-relaxed tracking-tight">
                  {affirmation?.quote}
                </p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold not-italic text-slate-900 dark:text-white tracking-wide">
                    — {affirmation?.author}
                  </span>
                </div>
              </div>

              {/* Daily Reflection Prompt Box */}
              {affirmation?.reflectionPrompt && (
                <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
                    <span className="font-semibold text-amber-950 dark:text-amber-100 mr-1">
                      Today&apos;s Reflection:
                    </span>
                    {affirmation.reflectionPrompt}
                  </div>
                </div>
              )}

              {/* Bottom Interactive Action Toolbar */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                {/* Heart / Like Button (Primary Feature) */}
                <button
                  onClick={() => handleToggleLike()}
                  title={isLiked ? 'Remove from Liked Quotes' : 'Save to Liked Quotes'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isLiked
                      ? 'bg-[#FF2D55]/15 text-[#FF2D55] dark:text-[#FF375F] border border-[#FF2D55]/30 shadow-xs'
                      : 'bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.08]'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 transition-transform ${
                      isLiked ? 'fill-[#FF2D55] text-[#FF2D55] scale-110' : 'text-slate-500 hover:scale-105'
                    }`}
                  />
                  <span>{isLiked ? 'Liked' : 'Like Quote'}</span>
                </button>

                {/* Secondary Actions: Recite, Copy, Internalize */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePlayAudio()}
                    title={isPlayingAudio ? 'Stop Recitation' : 'Listen with Speech'}
                    className={`p-2 rounded-xl text-xs transition-all cursor-pointer border ${
                      isPlayingAudio
                        ? 'bg-[#0A84FF]/20 text-[#0A84FF] border-[#0A84FF]/40 animate-pulse'
                        : 'bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-white/[0.08]'
                    }`}
                  >
                    {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleCopy()}
                    title="Copy Quote"
                    className="p-2 rounded-xl text-xs bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.08] transition-all cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={handleInternalizeMorale}
                    disabled={hasInternalizedToday}
                    title="Internalize and earn +20 XP"
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      hasInternalizedToday
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-[0.98]'
                    }`}
                  >
                    {hasInternalizedToday ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Internalized</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Internalize (+20 XP)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LOCAL STORAGE-BACKED LIKED QUOTES LIST */}
      {activeTab === 'liked' && (
        <div className="relative z-10 p-5 sm:p-6 space-y-4">
          {/* Header & Search */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-[#FF2D55] fill-[#FF2D55]" />
                <span>Liked Affirmations</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                ({likedList.length} saved)
              </span>
            </div>

            {likedList.length > 0 && (
              <button
                onClick={() => {
                  const allText = likedList
                    .map((item, idx) => `${idx + 1}. "${item.quote}" — ${item.author}`)
                    .join('\n\n');
                  navigator.clipboard.writeText(allText);
                  addToast({
                    type: 'success',
                    title: 'All Liked Quotes Copied',
                    message: 'Exported your complete liked collection.',
                  });
                }}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Copy All Quotes
              </button>
            )}
          </div>

          {/* Search bar if there are 2 or more liked quotes */}
          {likedList.length >= 2 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search your liked quotes or authors..."
                value={searchLikedQuery}
                onChange={(e) => setSearchLikedQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.08] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Liked List Content */}
          {likedList.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FF2D55]/10 text-[#FF2D55] flex items-center justify-center">
                <Heart className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div className="max-w-xs mx-auto">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  No liked quotes yet
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Whenever an inspiring quote resonates with you, tap the heart button to save it to your personal library.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('daily')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
              >
                <span>Read Today&apos;s Affirmation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : filteredLiked.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No quotes match &ldquo;{searchLikedQuery}&rdquo;.
            </div>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {filteredLiked.map((item) => {
                const themePill =
                  THEME_ACCENTS[item.theme || 'Consistency & Habits'] ||
                  THEME_ACCENTS['Consistency & Habits'];

                return (
                  <div
                    key={item.id}
                    className="group relative p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.06] transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${themePill.badge} ${themePill.border}`}
                      >
                        <span>{themePill.emoji}</span>
                        <span>{item.theme || 'Inspiration'}</span>
                      </span>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handlePlayAudio(item.quote, item.author)}
                          title="Listen"
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleCopy(item.quote, item.author)}
                          title="Copy Quote"
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleRemoveLiked(item.id)}
                          title="Unlike quote"
                          className="p-1 rounded-lg text-slate-400 hover:text-[#FF2D55] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm font-serif italic text-slate-800 dark:text-slate-100 leading-relaxed">
                      &ldquo;{item.quote}&rdquo;
                    </p>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        — {item.author}
                      </span>

                      <button
                        onClick={() => handleApplyAsCurrent(item)}
                        title="Display as active dashboard quote"
                        className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Set as Today&apos;s</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Also export as DailyAffirmationCard for backwards compatibility
export const DailyAffirmationCard = Affirmations;
export default Affirmations;
