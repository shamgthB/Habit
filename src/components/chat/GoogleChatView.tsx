import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Send,
  Plus,
  RefreshCw,
  Sparkles,
  Flame,
  Award,
  ExternalLink,
  AlertCircle,
  Users,
  Check,
  ChevronRight,
  ShieldAlert,
  Info,
} from 'lucide-react';
import {
  listChatSpaces,
  createChatSpace,
  listSpaceMessages,
  sendChatMessage,
  shareHabitMilestoneToChat,
  GoogleChatSpace,
  GoogleChatMessage,
  CLOUD_CONSOLE_CHAT_CONFIG_URL,
} from '../../services/chatService';
import { ConfirmModal } from '../common/ConfirmModal';

export const GoogleChatView: React.FC = () => {
  const {
    googleUser,
    isGoogleAuthenticated,
    handleGoogleLogin,
    profile,
    lifeScore,
    globalStreak,
    habits,
    logs,
    addToast,
    awardXp,
  } = useApp();

  const [spaces, setSpaces] = useState<GoogleChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<GoogleChatSpace | null>(null);
  const [messages, setMessages] = useState<GoogleChatMessage[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [apiNotice, setApiNotice] = useState<string | null>(null);

  // Create Space Modal state
  const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDesc, setNewSpaceDesc] = useState('');
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);

  // Destructive / Mutating Operation confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });

  const loadSpaces = async () => {
    setIsLoadingSpaces(true);
    try {
      const res = await listChatSpaces();
      setSpaces(res.spaces);
      if (res.notice) {
        setApiNotice(res.notice);
      } else {
        setApiNotice(null);
      }
      if (res.spaces.length > 0 && !selectedSpace) {
        setSelectedSpace(res.spaces[0]);
      }
    } catch (err: any) {
      console.warn('Could not load spaces:', err);
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  useEffect(() => {
    loadSpaces();
  }, [googleUser]);

  // Load messages whenever selected space changes
  useEffect(() => {
    if (!selectedSpace) return;
    const fetchMsgs = async () => {
      setIsLoadingMessages(true);
      try {
        const msgs = await listSpaceMessages(selectedSpace.name);
        setMessages(msgs);
      } catch (err) {
        console.warn('Error fetching messages:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    fetchMsgs();
  }, [selectedSpace]);

  // Handle send message with user confirmation
  const handleRequestSendMessage = () => {
    if (!messageText.trim() || !selectedSpace) return;
    const textToSend = messageText.trim();

    setConfirmDialog({
      isOpen: true,
      title: 'Send Message to Google Chat?',
      message: `Post message to "${selectedSpace.displayName || selectedSpace.name}"?`,
      action: async () => {
        setIsSendingMessage(true);
        try {
          const sent = await sendChatMessage(selectedSpace.name, textToSend);
          setMessages((prev) => [...prev, sent]);
          setMessageText('');
          awardXp(10, 'Sent Google Chat message');
          addToast({
            type: 'success',
            title: 'Message Sent!',
            message: `Delivered to ${selectedSpace.displayName || 'Google Chat Space'}.`,
          });
        } catch (err: any) {
          addToast({
            type: 'error',
            title: 'Message Failed',
            message: err.message || 'Could not send message.',
          });
        } finally {
          setIsSendingMessage(false);
        }
      },
    });
  };

  // Handle share daily habit milestone into space
  const handleRequestShareMilestone = () => {
    if (!selectedSpace) return;
    const today = new Date().toISOString().split('T')[0];
    const completedHabits = habits.filter((h) => {
      const log = logs.find((l) => l.habitId === h.id && l.date === today);
      return log && log.completed;
    });

    setConfirmDialog({
      isOpen: true,
      title: 'Announce Daily Habit Milestone in Google Chat?',
      message: `Post your Life Score (${lifeScore.overallScore}/100) and ${globalStreak.currentStreak}-day consistency streak to "${selectedSpace.displayName || 'Google Chat'}"?`,
      action: async () => {
        setIsSendingMessage(true);
        try {
          const sent = await shareHabitMilestoneToChat(
            selectedSpace.name,
            profile.name || googleUser?.displayName || 'Habit Builder',
            lifeScore.overallScore,
            globalStreak.currentStreak,
            completedHabits.length,
            habits.length
          );
          setMessages((prev) => [...prev, sent]);
          awardXp(25, 'Shared milestone in Google Chat');
          addToast({
            type: 'success',
            title: 'Milestone Announced! 🎉',
            message: 'Shared your daily streak with the accountability space.',
          });
        } catch (err: any) {
          addToast({
            type: 'error',
            title: 'Share Failed',
            message: err.message || 'Could not post milestone to Google Chat.',
          });
        } finally {
          setIsSendingMessage(false);
        }
      },
    });
  };

  // Handle create new Chat space
  const handleCreateSpaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;

    setIsCreatingSpace(true);
    try {
      const created = await createChatSpace(newSpaceName.trim(), newSpaceDesc.trim());
      setSpaces((prev) => [created, ...prev]);
      setSelectedSpace(created);
      setIsCreateSpaceOpen(false);
      setNewSpaceName('');
      setNewSpaceDesc('');
      addToast({
        type: 'success',
        title: 'Space Created!',
        message: `Created Google Chat Space "${created.displayName}".`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Could Not Create Space',
        message: err.message || 'Error creating Chat Space.',
      });
    } finally {
      setIsCreatingSpace(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Google Chat Accountability
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-mono text-2xs font-bold uppercase tracking-wider">
                Workspace API
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Coordinate team habits, cheer peer progress, and post milestone cards to Google Chat spaces
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsCreateSpaceOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Space</span>
          </button>

          <button
            onClick={loadSpaces}
            disabled={isLoadingSpaces}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSpaces ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* API Notice / Google Cloud Console Prerequisite Info */}
      {apiNotice && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-100">
                Google Chat API Setup Guidance
              </p>
              <p className="text-3xs text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                {apiNotice}
              </p>
            </div>
          </div>

          <a
            href={CLOUD_CONSOLE_CHAT_CONFIG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-3xs cursor-pointer transition-colors"
          >
            <span>Cloud Console Chat Config</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Main Grid: Spaces List (Left) + Space Messenger (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* Left: Spaces List (4 cols) */}
        <div className="lg:col-span-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Chat Spaces ({spaces.length})
              </h3>
              <span className="text-3xs text-slate-400 font-mono">chat.googleapis.com</span>
            </div>

            <div className="space-y-1.5 max-h-[380px] overflow-y-auto">
              {spaces.map((sp) => {
                const isSelected = selectedSpace?.name === sp.name;

                return (
                  <button
                    key={sp.name}
                    onClick={() => setSelectedSpace(sp)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-teal-500/10 border-teal-500/30 text-teal-900 dark:text-teal-100'
                        : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate">
                          {sp.displayName || sp.name.replace('spaces/', 'Space ')}
                        </span>
                        {sp.isSample && (
                          <span className="px-1 py-0.2 rounded-sm bg-slate-200 dark:bg-slate-700 text-3xs font-mono text-slate-600 dark:text-slate-400">
                            Demo
                          </span>
                        )}
                      </div>
                      {sp.spaceDetails?.description && (
                        <p className="text-3xs text-slate-400 truncate mt-0.5">
                          {sp.spaceDetails.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? 'text-teal-600 translate-x-0.5' : 'text-slate-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-3xs text-slate-400 flex items-center justify-between">
            <span>Enterprise Workspace Spaces</span>
            <button
              onClick={() => setIsCreateSpaceOpen(true)}
              className="text-teal-600 dark:text-teal-400 font-semibold hover:underline cursor-pointer"
            >
              + Create Space
            </button>
          </div>
        </div>

        {/* Right: Messages Messenger (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          {/* Active Space Header */}
          <div className="flex flex-wrap items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {selectedSpace?.displayName || 'Select a Space'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-mono text-3xs font-bold">
                  {selectedSpace?.spaceType || 'SPACE'}
                </span>
              </div>
              <p className="text-3xs text-slate-400 mt-0.5">
                {selectedSpace?.spaceDetails?.description || 'Daily accountability messages & cheer'}
              </p>
            </div>

            <button
              onClick={handleRequestShareMilestone}
              disabled={isSendingMessage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold cursor-pointer transition-colors"
              title="Post today's streak and life score into this space"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-current" />
              <span>Share Daily Milestone</span>
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {isLoadingMessages ? (
              <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-teal-500" />
                <span>Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No messages in this space yet</p>
                <p className="text-3xs mt-1">Send a greeting or share your daily habit milestone!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.name}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center text-3xs font-bold">
                        {msg.sender?.displayName?.slice(0, 1) || 'U'}
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {msg.sender?.displayName || 'User'}
                      </span>
                    </div>
                    <span className="text-3xs text-slate-400 font-mono">
                      {new Date(msg.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed pl-8">
                    {msg.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Message Input Box */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleRequestSendMessage();
                }
              }}
              placeholder={`Message ${selectedSpace?.displayName || 'space'}...`}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={handleRequestSendMessage}
              disabled={isSendingMessage || !messageText.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs disabled:opacity-50 cursor-pointer transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingMessage ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Create Space Modal */}
      {isCreateSpaceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-1">
              Create Google Chat Space
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Create a dedicated workspace channel for habit sprints, daily standups, and group goals.
            </p>

            <form onSubmit={handleCreateSpaceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Space Name
                </label>
                <input
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="e.g. AuraHabit Morning Sprints"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Guidelines
                </label>
                <textarea
                  rows={2}
                  value={newSpaceDesc}
                  onChange={(e) => setNewSpaceDesc(e.target.value)}
                  placeholder="e.g. Daily check-in at 8 AM, share workout logs and habit wins."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateSpaceOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSpace || !newSpaceName.trim()}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isCreatingSpace ? 'Creating...' : 'Create Space'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mutating Operation Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Confirm & Post"
        cancelText="Cancel"
        isDestructive={false}
        onConfirm={async () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          await confirmDialog.action();
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
