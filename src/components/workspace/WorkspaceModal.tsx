import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Mail,
  Calendar,
  CheckSquare,
  FileSpreadsheet,
  X,
  Send,
  Plus,
  RefreshCw,
  ExternalLink,
  Check,
  AlertCircle,
  Copy,
  Sparkles,
  Users,
  HardDrive,
  UserPlus,
  MessageSquare,
  Video,
} from 'lucide-react';
import {
  sendHabitSummaryEmail,
  syncHabitToGoogleCalendar,
  syncHabitToGoogleTasks,
} from '../../services/workspaceServices';
import { uploadBackupToGoogleDrive } from '../../services/driveService';
import { ConfirmModal } from '../common/ConfirmModal';
import { getTodayDateString } from '../../utils/dateUtils';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({ isOpen, onClose }) => {
  const {
    data,
    habits,
    logs,
    lifeScore,
    profile,
    isGoogleAuthenticated,
    handleGoogleLogin,
    googleUser,
    addToast,
    setIsSheetsModalOpen,
    setCurrentSection,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'gmail' | 'contacts' | 'chat' | 'meet' | 'calendar' | 'tasks' | 'drive' | 'keep' | 'sheets'
  >('gmail');
  const [recipientEmail, setRecipientEmail] = useState(googleUser?.email || '');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isBackingUpDrive, setIsBackingUpDrive] = useState(false);

  // Dynamically sync recipientEmail with logged in user email
  useEffect(() => {
    if (googleUser?.email) {
      setRecipientEmail(googleUser.email);
    } else if (profile?.email) {
      setRecipientEmail(profile.email);
    }
  }, [googleUser?.email, profile?.email]);
  const [selectedHabitForCalendar, setSelectedHabitForCalendar] = useState(habits[0]?.id || '');
  const [selectedHabitForTasks, setSelectedHabitForTasks] = useState(habits[0]?.id || '');
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [isSyncingTasks, setIsSyncingTasks] = useState(false);

  // Destructive / mutating operation confirmation states
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

  if (!isOpen) return null;

  const today = getTodayDateString();
  const todayLogs = logs.filter((l) => l.date === today);

  // 1. Gmail send with confirmation
  const handleRequestSendEmail = () => {
    if (!recipientEmail.trim()) {
      addToast({ type: 'warning', title: 'Email required', message: 'Please enter a recipient email.' });
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Send Daily Habit Report via Gmail?',
      message: `Send an email report containing today's Life Score (${lifeScore.overallScore}/100) and habit status checklist to ${recipientEmail}?`,
      action: async () => {
        setIsSendingEmail(true);
        try {
          await sendHabitSummaryEmail(
            recipientEmail.trim(),
            profile.name || googleUser?.displayName || 'Habit Builder',
            habits,
            todayLogs,
            lifeScore,
            googleUser?.email || profile.email
          );
          addToast({
            type: 'success',
            title: 'Email Sent via Gmail!',
            message: `Daily report delivered to ${recipientEmail}.`,
          });
        } catch (err: any) {
          const msg = (err.message || '').toLowerCase();
          const is403 = msg.includes('403') || msg.includes('access_denied') || msg.includes('denied');
          addToast({
            type: 'error',
            title: is403 ? 'Gmail Access Denied (403)' : 'Failed to Send',
            message: is403
              ? 'Google blocked Gmail access. Add your email under "Test users" in Google Cloud Console > OAuth consent screen.'
              : err.message || 'Gmail error',
            duration: 8000,
          });
        } finally {
          setIsSendingEmail(false);
        }
      },
    });
  };

  // 2. Calendar event with confirmation
  const handleRequestCalendarSync = () => {
    const habit = habits.find((h) => h.id === selectedHabitForCalendar);
    if (!habit) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Add Event to Google Calendar?',
      message: `Create a calendar event for "${habit.name}" scheduled at ${habit.reminderTime || '08:00'} today in your primary Google Calendar?`,
      action: async () => {
        setIsSyncingCalendar(true);
        try {
          await syncHabitToGoogleCalendar(habit, today);
          addToast({
            type: 'success',
            title: 'Added to Google Calendar!',
            message: `Event for "${habit.name}" created at ${habit.reminderTime || '08:00'}.`,
          });
        } catch (err: any) {
          const msg = (err.message || '').toLowerCase();
          const is403 = msg.includes('403') || msg.includes('access_denied') || msg.includes('denied');
          addToast({
            type: 'error',
            title: is403 ? 'Calendar Access Denied (403)' : 'Calendar Error',
            message: is403
              ? 'Google blocked Calendar access. Add your email under "Test users" in Google Cloud Console > OAuth consent screen.'
              : err.message || 'Failed to add event',
            duration: 8000,
          });
        } finally {
          setIsSyncingCalendar(false);
        }
      },
    });
  };

  // 3. Tasks sync with confirmation
  const handleRequestTasksSync = () => {
    const habit = habits.find((h) => h.id === selectedHabitForTasks);
    if (!habit) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Create Task in Google Tasks?',
      message: `Add "${habit.name}" to your Google Tasks checklist?`,
      action: async () => {
        setIsSyncingTasks(true);
        try {
          await syncHabitToGoogleTasks(habit, today);
          addToast({
            type: 'success',
            title: 'Task Created in Google Tasks!',
            message: `"${habit.name}" added to your tasks list.`,
          });
        } catch (err: any) {
          const msg = (err.message || '').toLowerCase();
          const is403 = msg.includes('403') || msg.includes('access_denied') || msg.includes('denied');
          addToast({
            type: 'error',
            title: is403 ? 'Tasks Access Denied (403)' : 'Google Tasks Error',
            message: is403
              ? 'Google blocked Tasks access. Add your email under "Test users" in Google Cloud Console > OAuth consent screen.'
              : err.message || 'Failed to create task',
            duration: 8000,
          });
        } finally {
          setIsSyncingTasks(false);
        }
      },
    });
  };

  // 4. Copy Keep Notes formatted checklist
  const handleCopyKeepNotes = () => {
    const text = `[AuraHabit Daily Focus - ${today}]\n\n` +
      habits.map((h) => `[ ] ${h.name} (${h.targetValue} ${h.unit})`).join('\n') +
      `\n\nDaily Life Score Goal: ${lifeScore.overallScore}/100`;

    navigator.clipboard.writeText(text);
    addToast({
      type: 'success',
      title: 'Copied for Google Keep!',
      message: 'Habit list checklist formatted and copied to clipboard.',
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Google Workspace & Productivity Suite
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Direct connection with Gmail, Calendar, Tasks, Keep & Sheets
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Account connection status */}
          <div className="my-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isGoogleAuthenticated ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {isGoogleAuthenticated
                  ? `Connected: ${googleUser?.email || googleUser?.displayName || 'Google Account'}`
                  : 'Google Account Not Signed In'}
              </span>
            </div>

            {!isGoogleAuthenticated && (
              <button
                onClick={() => handleGoogleLogin()}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-2xs cursor-pointer shadow-xs"
              >
                Sign in with Google
              </button>
            )}
          </div>

          {/* Tool Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            {[
              { id: 'gmail', label: 'Gmail', icon: Mail },
              { id: 'contacts', label: 'Contacts', icon: Users },
              { id: 'chat', label: 'Chat', icon: MessageSquare },
              { id: 'meet', label: 'Meet', icon: Video },
              { id: 'calendar', label: 'Calendar', icon: Calendar },
              { id: 'tasks', label: 'Tasks', icon: CheckSquare },
              { id: 'drive', label: 'Drive', icon: HardDrive },
              { id: 'keep', label: 'Keep', icon: Copy },
              { id: 'sheets', label: 'Sheets', icon: FileSpreadsheet },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="py-4 space-y-4">
            {/* GMAIL */}
            {activeTab === 'gmail' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Send an HTML summary report of your daily habit completion, streaks, and Life Score to your inbox via Gmail API.
                </p>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Recipient Email Address
                    </label>
                    {googleUser?.email && (
                      <button
                        type="button"
                        onClick={() => setRecipientEmail(googleUser.email!)}
                        className="text-3xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                      >
                        Use my account ({googleUser.email})
                      </button>
                    )}
                  </div>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1 text-2xs text-slate-500">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Email Preview Includes:</p>
                  <p>• Today&apos;s Life Score: {lifeScore.overallScore}/100</p>
                  <p>• Full breakdown of {habits.length} habits with completion status</p>
                  <p>• Clean HTML design formatted for mobile and desktop mail clients</p>
                </div>

                <button
                  onClick={handleRequestSendEmail}
                  disabled={isSendingEmail}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSendingEmail ? 'Sending via Gmail...' : 'Send Daily Report'}</span>
                </button>
              </div>
            )}

            {/* CALENDAR */}
            {activeTab === 'calendar' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Schedule your daily habit times as structured events in your primary Google Calendar.
                </p>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Habit to Schedule
                  </label>
                  <select
                    value={selectedHabitForCalendar}
                    onChange={(e) => setSelectedHabitForCalendar(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs cursor-pointer"
                  >
                    {habits.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} (Scheduled: {h.reminderTime || '08:00'})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleRequestCalendarSync}
                  disabled={isSyncingCalendar}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{isSyncingCalendar ? 'Scheduling...' : 'Add to Google Calendar'}</span>
                </button>
              </div>
            )}

            {/* TASKS */}
            {activeTab === 'tasks' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Sync your habits into Google Tasks to check them off on your phone or in Google Calendar side panel.
                </p>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Habit to Add
                  </label>
                  <select
                    value={selectedHabitForTasks}
                    onChange={(e) => setSelectedHabitForTasks(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs cursor-pointer"
                  >
                    {habits.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.targetValue} {h.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleRequestTasksSync}
                  disabled={isSyncingTasks}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>{isSyncingTasks ? 'Creating task...' : 'Sync to Google Tasks'}</span>
                </button>
              </div>
            )}

            {/* KEEP NOTES */}
            {activeTab === 'keep' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Generate a daily habit checklist formatted for Google Keep notes. Consumer Google accounts can paste it directly into keep.google.com with one click.
                </p>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 font-mono text-2xs space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Preview:</p>
                  <p className="text-slate-600 dark:text-slate-400">[AuraHabit Daily Focus - {today}]</p>
                  {habits.slice(0, 3).map((h) => (
                    <p key={h.id} className="text-slate-500">[ ] {h.name}</p>
                  ))}
                  <p className="text-slate-400">...and {habits.length - 3} more</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopyKeepNotes}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Checklist for Keep</span>
                  </button>

                  <a
                    href="https://keep.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    <span>Open Keep</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* CONTACTS */}
            {activeTab === 'contacts' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Synchronize your Google Contacts via Google People API to discover peers already tracking habits on AuraHabit and dispatch personalized email invites.
                </p>

                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-indigo-900 dark:text-indigo-200">
                      Friends & Contacts Hub
                    </h4>
                    <p className="text-3xs text-indigo-700 dark:text-indigo-400 mt-0.5">
                      Categorize friends on app vs contacts to invite via Gmail API
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentSection('community');
                      onClose();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors shrink-0"
                  >
                    Open Friends Hub
                  </button>
                </div>
              </div>
            )}

            {/* CHAT */}
            {activeTab === 'chat' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Connect with team members in Google Chat spaces, post daily habit milestones, celebrate consistency streaks, and create accountability rooms.
                </p>

                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-200">
                      Google Chat Spaces & Accountability
                    </h4>
                    <p className="text-3xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Live spaces, milestone announcements & accountability check-ins
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentSection('chat');
                      onClose();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors shrink-0"
                  >
                    Open Chat Spaces
                  </button>
                </div>
              </div>
            )}

            {/* MEET */}
            {activeTab === 'meet' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Host live video accountability standups, co-working Pomodoro sprints, and streak reviews using Google Meet.
                </p>

                <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-rose-900 dark:text-rose-200">
                      Google Meet Live Rooms
                    </h4>
                    <p className="text-3xs text-rose-700 dark:text-rose-400 mt-0.5">
                      Launch instant meeting spaces, share call links, and invite habit partners
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentSection('meet');
                      onClose();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors shrink-0"
                  >
                    Open Google Meet
                  </button>
                </div>
              </div>
            )}

            {/* DRIVE */}
            {activeTab === 'drive' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Save your complete AuraHabit JSON backup directly to Google Drive so your progress is securely stored in your personal cloud.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Backup to Google Drive?',
                        message: 'Upload full habit and journal data to your personal Google Drive?',
                        action: async () => {
                          setIsBackingUpDrive(true);
                          try {
                            const res = await uploadBackupToGoogleDrive(data);
                            addToast({
                              type: 'success',
                              title: 'Backup Saved to Drive!',
                              message: `File: "${res.name}"`,
                            });
                          } catch (err: any) {
                            addToast({
                              type: 'error',
                              title: 'Drive Upload Failed',
                              message: err.message || 'Error uploading to Google Drive.',
                            });
                          } finally {
                            setIsBackingUpDrive(false);
                          }
                        },
                      });
                    }}
                    disabled={isBackingUpDrive}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 cursor-pointer disabled:opacity-50"
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>{isBackingUpDrive ? 'Uploading to Drive...' : 'Upload Backup to Google Drive'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* SHEETS */}
            {activeTab === 'sheets' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Export habit logs, streaks, and monthly statistics as spreadsheets into Google Drive.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsSheetsModalOpen(true);
                      onClose();
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Open Google Sheets Sync Center</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workspace Destructive / Mutating Operation Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Confirm & Execute"
        cancelText="Cancel"
        isDestructive={false}
        onConfirm={async () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          await confirmDialog.action();
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};
