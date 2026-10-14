import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Video,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Users,
  Sparkles,
  Calendar,
  Clock,
  Trash2,
  Share2,
  Mail,
  MessageSquare,
  Flame,
  Zap,
  ArrowRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import {
  createMeetSpace,
  getSavedMeetSpaces,
  saveMeetSpaceToStorage,
  removeSavedMeetSpace,
  GoogleMeetSpace,
  HABIT_MEET_TEMPLATES,
  HabitMeetingTemplate,
} from '../../services/meetService';
import { ConfirmModal } from '../common/ConfirmModal';

export const GoogleMeetView: React.FC = () => {
  const {
    googleUser,
    isGoogleAuthenticated,
    handleGoogleLogin,
    profile,
    addToast,
    awardXp,
    setCurrentSection,
  } = useApp();

  const [savedSpaces, setSavedSpaces] = useState<GoogleMeetSpace[]>([]);
  const [activeSpace, setActiveSpace] = useState<GoogleMeetSpace | null>(null);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Custom Room creation state
  const [customTopic, setCustomTopic] = useState('');

  // Confirmation dialog state
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

  useEffect(() => {
    const list = getSavedMeetSpaces();
    setSavedSpaces(list);
    if (list.length > 0 && !activeSpace) {
      setActiveSpace(list[0]);
    }
  }, []);

  const handleCopyUri = (uri: string, code: string) => {
    navigator.clipboard.writeText(uri);
    setCopiedCode(code);
    addToast({
      type: 'success',
      title: 'Link Copied!',
      message: `Google Meet link copied to clipboard: ${uri}`,
    });
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleRequestCreateSpace = (topicName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Create Google Meet Room?',
      message: `Spin up a live Google Meet conference room for "${topicName}"?`,
      action: async () => {
        setIsCreatingSpace(true);
        try {
          const space = await createMeetSpace(topicName);
          setActiveSpace(space);
          setSavedSpaces(getSavedMeetSpaces());
          awardXp(15, `Created Google Meet space: ${topicName}`);
          addToast({
            type: 'success',
            title: 'Google Meet Space Ready!',
            message: `Meeting code: ${space.meetingCode}`,
          });
        } catch (err: any) {
          addToast({
            type: 'error',
            title: 'Meet Creation Failed',
            message: err.message || 'Could not create Google Meet space.',
          });
        } finally {
          setIsCreatingSpace(false);
        }
      },
    });
  };

  const handleDeleteSpace = (space: GoogleMeetSpace) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Saved Meeting Room?',
      message: `Remove "${space.topic || space.meetingCode}" from your saved rooms list?`,
      action: async () => {
        removeSavedMeetSpace(space.name);
        const updated = getSavedMeetSpaces();
        setSavedSpaces(updated);
        if (activeSpace?.name === space.name) {
          setActiveSpace(updated.length > 0 ? updated[0] : null);
        }
        addToast({
          type: 'info',
          title: 'Room Removed',
          message: 'Saved meeting reference cleared.',
        });
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                Google Meet Live Sync
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-2xs font-bold uppercase tracking-wider">
                  Meet v2 API
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Host live habit accountability standups, co-working focus sprints, and weekly streak reviews
              </p>
            </div>
          </div>
        </div>

        {/* Auth / Account Indicator */}
        <div className="flex items-center gap-3">
          {!isGoogleAuthenticated ? (
            <button
              onClick={() => handleGoogleLogin({ withWorkspaceScopes: true })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Connect Google Account</span>
            </button>
          ) : (
            <div className="px-3.5 py-1.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-semibold text-rose-900 dark:text-rose-200">
                Meet Connected: {googleUser?.email || 'Google User'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Active Space Showcase & Quick Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active / Launch Meeting Card */}
        <div className="lg:col-span-2 space-y-6">
          {activeSpace ? (
            <div className="p-6 sm:p-7 rounded-3xl bg-linear-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-3xs font-bold uppercase tracking-wider mb-2">
                    <Radio className="w-3 h-3 animate-pulse" />
                    <span>Live Meeting Space</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                    {activeSpace.topic || 'Habit Accountability Room'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Created: {activeSpace.createdAt ? new Date(activeSpace.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'} • Code: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{activeSpace.meetingCode}</span>
                  </p>
                </div>

                <a
                  href={activeSpace.meetingUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 hover:scale-105 transition-all cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Google Meet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Meeting Link Pill Box */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-3xs uppercase font-mono font-bold text-slate-400 tracking-wider">
                      Meeting Link
                    </p>
                    <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {activeSpace.meetingUri}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyUri(activeSpace.meetingUri, activeSpace.meetingCode)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {copiedCode === activeSpace.meetingCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedCode === activeSpace.meetingCode ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Invite Ecosystem Actions */}
              <div className="pt-2">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Invite Habit Buddies & Workspace Integrations
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setCurrentSection('community');
                      addToast({
                        type: 'info',
                        title: 'Share with Contacts',
                        message: 'Send this Meet link to Google Contacts friends via email or chat.',
                      });
                    }}
                    className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 hover:border-indigo-400 transition-colors flex items-center gap-3 cursor-pointer text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Contacts & Friends
                      </p>
                      <p className="text-3xs text-slate-500 dark:text-slate-400">
                        Invite app peers
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentSection('chat');
                      addToast({
                        type: 'info',
                        title: 'Share to Chat',
                        message: 'Post meeting link to your Google Chat accountability space.',
                      });
                    }}
                    className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 hover:border-blue-400 transition-colors flex items-center gap-3 cursor-pointer text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Google Chat Space
                      </p>
                      <p className="text-3xs text-slate-500 dark:text-slate-400">
                        Broadcast to room
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentSection('routines');
                      addToast({
                        type: 'info',
                        title: 'Routines & Calendar',
                        message: 'Schedule this Meet call into your daily Google Calendar routine.',
                      });
                    }}
                    className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 hover:border-emerald-400 transition-colors flex items-center gap-3 cursor-pointer text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Google Calendar
                      </p>
                      <p className="text-3xs text-slate-500 dark:text-slate-400">
                        Add to schedule
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
                <Video className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  No Active Google Meet Room
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Launch an instant video room below or choose a habit accountability template to get started.
                </p>
              </div>
              <button
                onClick={() => handleRequestCreateSpace('Daily Habit Accountability Call')}
                disabled={isCreatingSpace}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreatingSpace ? 'Creating Meet Space...' : 'Create Instant Google Meet'}</span>
              </button>
            </div>
          )}

          {/* Curated Habit Meeting Templates */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Habit Call Formats & Templates
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pre-configured meeting formats tailored for consistency and accountability
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {HABIT_MEET_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-2xl p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        {tmpl.icon}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-3xs font-bold font-mono">
                        {tmpl.duration}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {tmpl.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => handleRequestCreateSpace(tmpl.title)}
                      disabled={isCreatingSpace}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Start This Session</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Saved Meeting Rooms & Custom Space Generator */}
        <div className="space-y-6">
          {/* Custom Room Creator */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>Create Custom Room</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate a unique Google Meet space with custom agenda or name.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!customTopic.trim()) return;
                handleRequestCreateSpace(customTopic.trim());
                setCustomTopic('');
              }}
              className="space-y-3"
            >
              <input
                type="text"
                placeholder="e.g. 7 AM Morning Sprint Standup"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={isCreatingSpace || !customTopic.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Meet Room</span>
              </button>
            </form>
          </div>

          {/* Saved Meeting Rooms */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Recent Meeting Spaces</span>
              </h3>
              <span className="text-3xs font-mono font-bold text-slate-400">
                {savedSpaces.length} saved
              </span>
            </div>

            {savedSpaces.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">
                No saved spaces yet. Launch a room above!
              </p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {savedSpaces.map((s) => (
                  <div
                    key={s.name}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                      activeSpace?.name === s.name
                        ? 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30'
                        : 'bg-slate-50 dark:bg-slate-850 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div
                      onClick={() => setActiveSpace(s)}
                      className="flex-1 overflow-hidden cursor-pointer"
                    >
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {s.topic || 'Habit Call'}
                      </p>
                      <p className="text-3xs font-mono text-slate-500 dark:text-slate-400 truncate">
                        {s.meetingCode}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={s.meetingUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                        title="Join on Google Meet"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDeleteSpace(s)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Confirm & Launch"
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
