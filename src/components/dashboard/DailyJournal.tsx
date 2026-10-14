import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Send,
  Trash2,
  Calendar,
  Sparkles,
  CloudCheck,
  ChevronDown,
  ChevronUp,
  Smile,
  Heart,
  Edit3,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DailyJournalEntry, EmotionTag } from '../../types';
import {
  saveJournalEntry,
  loadJournalEntries,
  deleteJournalEntry,
  EMOTION_TAG_CONFIG,
} from '../../services/journalService';
import { getTodayDateString } from '../../utils/dateUtils';

const EMOTION_KEYS: EmotionTag[] = [
  'grateful',
  'calm',
  'inspired',
  'energized',
  'thoughtful',
  'victorious',
  'anxious',
  'exhausted',
];

export const DailyJournal: React.FC = () => {
  const { addToast, googleUser } = useApp();
  const [entries, setEntries] = useState<DailyJournalEntry[]>([]);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionTag>('grateful');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpandedList, setIsExpandedList] = useState(false);
  const [isWriting, setIsWriting] = useState(false);

  // Load entries on mount and whenever user changes
  useEffect(() => {
    let isMounted = true;
    const fetchEntries = async () => {
      try {
        const data = await loadJournalEntries();
        if (isMounted) {
          setEntries(data);
        }
      } catch (err) {
        console.warn('Error loading entries:', err);
      }
    };
    fetchEntries();
    return () => {
      isMounted = false;
    };
  }, [googleUser]);

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const todayStr = getTodayDateString();

    try {
      const saved = await saveJournalEntry({
        date: todayStr,
        time: timeStr,
        title: title.trim() || undefined,
        content: content.trim(),
        emotion: selectedEmotion,
      });

      setEntries((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)]);
      setContent('');
      setTitle('');
      setIsWriting(false);

      addToast({
        type: 'success',
        title: 'Journal Entry Saved',
        message: `Saved to Firebase under ${EMOTION_TAG_CONFIG[selectedEmotion].label} mood.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Could Not Save',
        message: err?.message || 'Error writing entry',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      await deleteJournalEntry(entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      addToast({
        type: 'info',
        title: 'Entry Deleted',
        message: 'Journal entry removed.',
      });
    } catch {
      // Ignored
    }
  };

  const handleExportToKeep = (entry?: DailyJournalEntry) => {
    let noteText = '';
    if (entry) {
      const cfg = EMOTION_TAG_CONFIG[entry.emotion] || EMOTION_TAG_CONFIG.grateful;
      noteText = `[AuraHabit Reflection - ${entry.date} ${entry.time}]\n` +
        `Mood: ${cfg.label} ${cfg.emoji}\n` +
        (entry.title ? `Title: ${entry.title}\n\n` : '\n') +
        `${entry.content}\n\n` +
        `Tracked with AuraHabit`;
    } else {
      noteText = `[AuraHabit Journal - ${todayStr}]\n\n` +
        entries.slice(0, 3).map((e) => `• [${EMOTION_TAG_CONFIG[e.emotion]?.label || 'Note'}]: ${e.content}`).join('\n\n');
    }

    navigator.clipboard.writeText(noteText);
    window.open('https://keep.google.com', '_blank');
    addToast({
      type: 'success',
      title: 'Exported to Google Keep!',
      message: 'Note copied to clipboard and Google Keep opened.',
    });
  };

  const activeEmotionCfg = EMOTION_TAG_CONFIG[selectedEmotion];
  const todayStr = getTodayDateString();
  const todayEntries = entries.filter((e) => e.date === todayStr);

  return (
    <div className="p-5 rounded-[22px] bg-white/75 dark:bg-[#141722]/75 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>Daily Journal</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-3xs font-semibold">
                Firebase
              </span>
            </h3>
            <p className="text-3xs text-slate-400">Quick reflections & emotional tagging</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {entries.length > 0 && (
            <button
              type="button"
              onClick={() => handleExportToKeep()}
              className="px-2.5 py-1 rounded-xl text-3xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1 transition-all cursor-pointer"
              title="Export reflections to Google Keep"
            >
              <Copy className="w-3 h-3" />
              <span>Google Keep</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </button>
          )}

          <button
            onClick={() => setIsWriting((prev) => !prev)}
            className={`px-2.5 py-1 rounded-xl text-2xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isWriting
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>{isWriting ? 'Close' : 'New Entry'}</span>
          </button>
        </div>
      </div>

      {/* Writing Form */}
      {isWriting && (
        <form
          onSubmit={handleSaveEntry}
          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-200"
        >
          {/* Emotion Tag Picker */}
          <div>
            <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              How are you feeling right now?
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {EMOTION_KEYS.map((key) => {
                const cfg = EMOTION_TAG_CONFIG[key];
                const isSelected = selectedEmotion === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedEmotion(key)}
                    className={`px-2 py-1.5 rounded-xl text-3xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                      isSelected
                        ? `${cfg.badgeBg} ${cfg.badgeText} ${cfg.border} ring-2 ring-emerald-500/30 font-bold scale-[1.02]`
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cfg.emoji}</span>
                    <span className="truncate">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional, e.g. Morning Breakthrough)"
              className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          {/* Content Area */}
          <div>
            <textarea
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What went well today? What thoughts or insights do you want to capture?"
              className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500 text-slate-800 dark:text-slate-200 placeholder-slate-400 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-3xs text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Tagged as {activeEmotionCfg.label}</span>
            </span>

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-2xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-3 h-3" />
              <span>{isSubmitting ? 'Saving...' : 'Save to Firebase'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Entries List Preview */}
      <div className="space-y-2">
        {entries.length === 0 ? (
          <div className="text-center py-6 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Smile className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No journal entries yet</p>
            <p className="text-3xs text-slate-400 mt-0.5">
              Reflect on your day with an emotional tag to build mindfulness
            </p>
            {!isWriting && (
              <button
                onClick={() => setIsWriting(true)}
                className="mt-3 px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-2xs font-bold transition-colors cursor-pointer"
              >
                + Write First Entry
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Show top 2 or all depending on isExpandedList */}
            {(isExpandedList ? entries : entries.slice(0, 2)).map((entry) => {
              const cfg = EMOTION_TAG_CONFIG[entry.emotion] || EMOTION_TAG_CONFIG.grateful;
              return (
                <div
                  key={entry.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5 group transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-3xs font-bold border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.border}`}
                      >
                        <span>{cfg.emoji}</span>
                        <span>{cfg.label}</span>
                      </span>
                      {entry.title && (
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                          {entry.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-3xs text-slate-400 font-mono">
                        {entry.date === todayStr ? 'Today' : entry.date} {entry.time}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleExportToKeep(entry)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-500 transition-opacity cursor-pointer"
                        title="Export this reflection to Google Keep"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-3">
                    {entry.content}
                  </p>
                </div>
              );
            })}

            {entries.length > 2 && (
              <button
                onClick={() => setIsExpandedList((prev) => !prev)}
                className="w-full py-1 text-center text-3xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>{isExpandedList ? 'Show fewer entries' : `View all ${entries.length} reflections`}</span>
                {isExpandedList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
