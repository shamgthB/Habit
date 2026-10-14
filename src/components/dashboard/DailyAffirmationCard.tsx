import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Quote,
  Lightbulb,
  SlidersHorizontal,
  Heart,
  Volume2,
  VolumeX,
  Share2,
  X,
  BrainCircuit,
  MessageSquareHeart,
} from 'lucide-react';
import {
  Affirmation,
  getDailyAffirmation,
  toggleSaveAffirmation,
  isAffirmationSaved,
  AFFIRMATION_CATEGORIES,
  AffirmationCategory,
  getSavedAffirmations,
} from '../../services/affirmationService';
import { useApp } from '../../context/AppContext';

interface DailyAffirmationCardProps {
  className?: string;
  onSelectCategory?: (category: string) => void;
}

const THEME_ACCENTS: Record<string, { bgGlow: string; text: string; border: string; badge: string; emoji: string }> = {
  'Consistency & Habits': {
    bgGlow: 'from-[#30D158]/12 via-[#30D158]/5 to-transparent',
    text: 'text-[#30D158]',
    border: 'border-[#30D158]/30',
    badge: 'bg-[#30D158]/15 text-[#30D158]',
    emoji: '🌿',
  },
  'Mindfulness & Peace': {
    bgGlow: 'from-[#BF5AF2]/12 via-[#BF5AF2]/5 to-transparent',
    text: 'text-[#BF5AF2]',
    border: 'border-[#BF5AF2]/30',
    badge: 'bg-[#BF5AF2]/15 text-[#BF5AF2]',
    emoji: '🧘',
  },
  'Focus & Deep Work': {
    bgGlow: 'from-[#0A84FF]/12 via-[#0A84FF]/5 to-transparent',
    text: 'text-[#0A84FF]',
    border: 'border-[#0A84FF]/30',
    badge: 'bg-[#0A84FF]/15 text-[#0A84FF]',
    emoji: '⚡',
  },
  'Resilience & Grit': {
    bgGlow: 'from-[#FF453A]/12 via-[#FF453A]/5 to-transparent',
    text: 'text-[#FF453A]',
    border: 'border-[#FF453A]/30',
    badge: 'bg-[#FF453A]/15 text-[#FF453A]',
    emoji: '🛡️',
  },
  'Health & Vitality': {
    bgGlow: 'from-[#30D158]/12 via-[#64D2FF]/5 to-transparent',
    text: 'text-[#30D158]',
    border: 'border-[#30D158]/30',
    badge: 'bg-[#30D158]/15 text-[#30D158]',
    emoji: '🍎',
  },
  'Confidence & Gratitude': {
    bgGlow: 'from-[#FFD60A]/12 via-[#FFD60A]/5 to-transparent',
    text: 'text-[#FFD60A]',
    border: 'border-[#FFD60A]/30',
    badge: 'bg-[#FFD60A]/15 text-[#FFD60A]',
    emoji: '✨',
  },
};

export const DailyAffirmationCard: React.FC<DailyAffirmationCardProps> = ({ className = '' }) => {
  const { addToast, todayMood } = useApp();

  const [affirmation, setAffirmation] = useState<Affirmation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<AffirmationCategory>('Consistency & Habits');
  const [showCategoryMenu, setShowCategoryMenu] = useState<boolean>(false);
  const [showSavedModal, setShowSavedModal] = useState<boolean>(false);
  const [savedList, setSavedList] = useState<Affirmation[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const categoryMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setShowCategoryMenu(false);
      }
    };
    if (showCategoryMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showCategoryMenu]);

  // Load daily affirmation from Gemini API
  const loadAffirmation = useCallback(
    async (force = false, categoryOverride?: string) => {
      setLoading(true);
      // Stop ongoing speech if any
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      }

      try {
        const cat = categoryOverride || selectedCategory;
        const mood = todayMood?.mood || 'focused';
        const data = await getDailyAffirmation({
          category: cat,
          mood,
          forceRefresh: force,
        });
        setAffirmation(data);
        setIsSaved(isAffirmationSaved(data.quote));
      } catch (err) {
        console.error('Failed to load affirmation:', err);
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory, todayMood?.mood]
  );

  useEffect(() => {
    loadAffirmation(false);
    setSavedList(getSavedAffirmations());
  }, [loadAffirmation]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleRefresh = async () => {
    await loadAffirmation(true);
    addToast({
      type: 'success',
      title: 'Fresh Gemini AI Inspiration',
      message: 'Generated a personalized daily affirmation for your mindset.',
    });
  };

  const handleCopy = async () => {
    if (!affirmation) return;
    try {
      const fullText = `"${affirmation.quote}" — ${affirmation.author || 'Aura Wisdom'}\n\nMindset Question: ${affirmation.reflectionPrompt || 'What small habit will you protect today?'}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      addToast({
        type: 'info',
        title: 'Copied to Clipboard',
        message: 'Affirmation and reflection question ready to share or journal.',
      });
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleShare = async () => {
    if (!affirmation) return;
    const shareText = `"${affirmation.quote}" — ${affirmation.author}\n\nTrack your habits on AuraHabit`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Daily Affirmation · AuraHabit',
          text: shareText,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    handleCopy();
  };

  const handleToggleFavorite = () => {
    if (!affirmation) return;
    const nowSaved = toggleSaveAffirmation(affirmation);
    setIsSaved(nowSaved);
    setSavedList(getSavedAffirmations());
    addToast({
      type: nowSaved ? 'success' : 'info',
      title: nowSaved ? 'Saved to Favorites' : 'Removed from Favorites',
      message: nowSaved
        ? 'Affirmation saved to your personal inspiration collection.'
        : 'Affirmation removed from saved list.',
    });
  };

  const handleSelectCategory = (cat: AffirmationCategory) => {
    setSelectedCategory(cat);
    setShowCategoryMenu(false);
    loadAffirmation(true, cat);
  };

  // Text to Speech using Web Speech API
  const handleToggleAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !affirmation) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = `${affirmation.quote}. Attributed to ${affirmation.author || 'Aura Wisdom'}. Today's reflection question: ${affirmation.reflectionPrompt || ''}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const currentAccent = THEME_ACCENTS[selectedCategory] || THEME_ACCENTS['Consistency & Habits'];

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] bg-white/75 dark:bg-[#141722]/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.35)] hover:border-slate-300 dark:hover:border-white/[0.14] transition-all duration-200 ${className}`}
    >
      {/* Decorative ambient glassmorphic color aura */}
      <div
        className={`absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br ${currentAccent.bgGlow} blur-3xl pointer-events-none opacity-80`}
      />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-gradient-to-tr from-white/5 to-transparent blur-2xl pointer-events-none" />

      {/* Decorative watermark quotation mark glyph */}
      <div className="absolute -bottom-2 right-4 text-slate-200/50 dark:text-white/[0.03] pointer-events-none select-none">
        <Quote className="w-24 h-24 -rotate-12 stroke-[1]" />
      </div>

      <div className="p-5 sm:p-6 relative z-10 flex flex-col justify-between h-full">
        {/* Card Header: Pill Badges & Sleek iOS Controls */}
        <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Main Title Badge */}
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#30D158]/15 to-[#34C759]/10 text-[#30D158] border border-[#30D158]/25 text-[11px] font-bold tracking-tight shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#30D158] animate-pulse" />
              <span>Daily Affirmation</span>
            </span>

            {/* AI Powered by Gemini Indicator */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.06] text-slate-600 dark:text-white/70 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] shadow-[0_0_8px_rgba(48,209,88,0.9)] animate-ping" />
              <span>Gemini Flash</span>
            </span>

            {/* Current Focus Tag */}
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${currentAccent.badge}`}>
              {currentAccent.emoji} {affirmation?.theme || selectedCategory.split(' ')[0]}
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Category Selector Dropdown */}
            <div className="relative" ref={categoryMenuRef}>
              <button
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  showCategoryMenu
                    ? 'bg-slate-200 dark:bg-white/[0.12] text-slate-900 dark:text-white'
                    : 'text-slate-400 dark:text-white/50 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                }`}
                title="Change Focus Theme"
                aria-label="Change Focus Theme"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              {/* iOS Glass Dropdown Menu */}
              {showCategoryMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-[20px] bg-white/95 dark:bg-[#181C26]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.12] shadow-2xl py-2 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                    Select Mindset Theme
                  </div>
                  {AFFIRMATION_CATEGORIES.map((cat) => {
                    const cfg = THEME_ACCENTS[cat];
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => handleSelectCategory(cat)}
                        className={`w-full text-left px-3.5 py-2 text-[12px] font-semibold transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#30D158]/12 text-[#30D158] font-bold'
                            : 'text-slate-700 dark:text-white/80 hover:bg-slate-100/80 dark:hover:bg-white/[0.06]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{cfg?.emoji}</span>
                          <span>{cat}</span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#30D158] stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Audio Voice Speech Playback */}
            <button
              onClick={handleToggleAudio}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                isPlayingAudio
                  ? 'bg-[#30D158] text-black shadow-[0_0_12px_rgba(48,209,88,0.5)]'
                  : 'text-slate-400 dark:text-white/50 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
              }`}
              title={isPlayingAudio ? 'Stop audio voice' : 'Listen aloud (Text-to-Speech)'}
              aria-label="Listen Aloud"
            >
              {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5 stroke-[2.5]" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Favorite / Bookmark */}
            <button
              onClick={handleToggleFavorite}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                isSaved
                  ? 'text-[#FF9F0A] bg-[#FF9F0A]/15 border border-[#FF9F0A]/25'
                  : 'text-slate-400 dark:text-white/50 hover:text-[#FF9F0A] hover:bg-slate-100 dark:hover:bg-white/[0.06]'
              }`}
              title={isSaved ? 'Saved to favorites' : 'Save to favorites'}
              aria-label="Save Affirmation"
            >
              {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 fill-[#FF9F0A]" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>

            {/* Copy Quote */}
            <button
              onClick={handleCopy}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 dark:text-white/50 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer active:scale-95"
              title="Copy quote"
              aria-label="Copy Quote"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#30D158] stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Share Quote */}
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 dark:text-white/50 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer active:scale-95"
              title="Share affirmation"
              aria-label="Share Affirmation"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* Refresh from Gemini API */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 dark:text-white/50 hover:text-[#30D158] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer active:scale-95 disabled:opacity-40"
              title="Generate new quote with Gemini API"
              aria-label="Refresh Affirmation"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#30D158]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Affirmation Body */}
        <div className="my-4 min-h-[92px] flex flex-col justify-center">
          {loading ? (
            <div className="space-y-3 py-2">
              <div className="h-4 bg-slate-200/80 dark:bg-white/[0.08] rounded-full w-11/12 animate-pulse" />
              <div className="h-4 bg-slate-200/80 dark:bg-white/[0.08] rounded-full w-4/5 animate-pulse" />
              <div className="h-3 bg-slate-200/80 dark:bg-white/[0.08] rounded-full w-1/3 animate-pulse mt-2" />
            </div>
          ) : affirmation ? (
            <div>
              {/* Quote text */}
              <blockquote className="text-[15px] sm:text-[16px] font-semibold text-slate-900 dark:text-white leading-relaxed tracking-tight italic">
                &ldquo;{affirmation.quote}&rdquo;
              </blockquote>

              {/* Attribution and Saved collection link */}
              <div className="flex items-center justify-between mt-3 text-[12px]">
                <span className="font-bold text-[#30D158] not-italic tracking-tight">
                  — {affirmation.author || 'Aura Wisdom'}
                </span>

                <div className="flex items-center gap-3">
                  {isPlayingAudio && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-[#30D158] animate-pulse">
                      <span className="w-1 h-3 bg-[#30D158] rounded-full animate-bounce" />
                      <span className="w-1 h-2 bg-[#30D158] rounded-full animate-bounce delay-75" />
                      <span className="w-1 h-4 bg-[#30D158] rounded-full animate-bounce delay-150" />
                      <span>Speaking...</span>
                    </span>
                  )}

                  {savedList.length > 0 && (
                    <button
                      onClick={() => setShowSavedModal(true)}
                      className="text-[11px] text-slate-400 dark:text-white/50 hover:text-slate-600 dark:hover:text-white flex items-center gap-1 cursor-pointer font-medium hover:underline"
                    >
                      <Heart className="w-3 h-3 text-[#FF453A] fill-[#FF453A]" />
                      <span>{savedList.length} saved</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Mindset Reflection Prompt Box */}
              {affirmation.reflectionPrompt && (
                <div className="mt-4 p-3 rounded-[16px] bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.06] backdrop-blur-md flex items-start gap-2.5 text-[11px] sm:text-[12px] text-slate-600 dark:text-white/70">
                  <div className="p-1 rounded-full bg-[#FFD60A]/15 text-[#FFD60A] shrink-0 mt-0.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 dark:text-white">Mindset Prompt: </span>
                    <span className="italic">{affirmation.reflectionPrompt}</span>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Saved Favorite Affirmations Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[24px] bg-white dark:bg-[#161924] border border-slate-200 dark:border-white/[0.1] shadow-2xl p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/[0.07]">
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#FF453A] fill-[#FF453A]" />
                <span>Saved Favorite Quotes</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FF453A]/15 text-[#FF453A] font-mono font-bold">
                  {savedList.length}
                </span>
              </h3>
              <button
                onClick={() => setShowSavedModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 overflow-y-auto space-y-3 flex-1 pr-1">
              {savedList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 dark:text-white/40">
                  <MessageSquareHeart className="w-10 h-10 mx-auto text-slate-300 dark:text-white/20 mb-2" />
                  <p className="text-[13px] font-semibold text-slate-600 dark:text-white/60">No saved quotes yet</p>
                  <p className="text-[11px] mt-1">Click the bookmark icon on any affirmation to save it to your collection.</p>
                </div>
              ) : (
                savedList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-[18px] bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.07] flex flex-col justify-between gap-2.5 hover:border-slate-300 dark:hover:border-white/[0.14] transition-all"
                  >
                    <p className="text-[13px] text-slate-900 dark:text-white/90 italic font-medium leading-relaxed">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-white/45 pt-1 border-t border-slate-100 dark:border-white/[0.05]">
                      <span className="font-bold text-[#30D158]">— {item.author || 'Aura Wisdom'}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`"${item.quote}" — ${item.author}`);
                            addToast({
                              type: 'info',
                              title: 'Quote Copied',
                              message: 'Copied to clipboard',
                            });
                          }}
                          className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                        >
                          Copy
                        </button>
                        <span>·</span>
                        <button
                          onClick={() => {
                            toggleSaveAffirmation(item);
                            const remaining = getSavedAffirmations();
                            setSavedList(remaining);
                            if (affirmation?.quote === item.quote) {
                              setIsSaved(false);
                            }
                          }}
                          className="text-[11px] text-[#FF453A] hover:underline cursor-pointer font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.07] flex justify-end">
              <button
                onClick={() => setShowSavedModal(false)}
                className="px-4 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black text-[12px] font-bold cursor-pointer active:scale-95 transition-transform"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
