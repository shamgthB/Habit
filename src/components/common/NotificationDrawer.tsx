import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, X, Check, Clock, Sparkles, Send, Flame, Sliders } from 'lucide-react';

export const NotificationDrawer: React.FC = () => {
  const {
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen,
    reminders,
    toggleReminderStatus,
    setIsAiNotificationModalOpen,
    aiAlertHistory,
    toggleHabitCompletion,
    addToast,
  } = useApp() as any;

  const [activeTab, setActiveTab] = useState<'reminders' | 'ai_alerts'>('reminders');

  if (!isNotificationDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">Notifications & Alerts</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Custom schedules & AI nudges</p>
                </div>
              </div>
              <button
                onClick={() => setIsNotificationDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Open AI Hub Action */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setIsNotificationDrawerOpen(false);
                  setIsAiNotificationModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Open AI Notification & Schedule Hub</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('reminders')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'reminders'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Today's Check-ins ({reminders.length})
              </button>
              <button
                onClick={() => setActiveTab('ai_alerts')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'ai_alerts'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>AI Nudges ({aiAlertHistory?.length || 0})</span>
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {activeTab === 'reminders' ? (
              reminders.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No active reminders</p>
                  <p className="text-xs text-slate-400 mt-1">Configure habit reminders in settings</p>
                </div>
              ) : (
                reminders.map((rem: any) => {
                  const isDone = rem.status === 'completed';
                  const isMissed = rem.status === 'missed';

                  return (
                    <div
                      key={rem.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isDone
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-75'
                          : isMissed
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                          : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {rem.time}
                            </span>
                            <h4
                              className={`text-sm font-semibold truncate ${
                                isDone ? 'line-through text-slate-500' : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {rem.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                            {rem.subtitle}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleReminderStatus(rem.id, isDone ? 'upcoming' : 'completed')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isDone
                                ? 'bg-emerald-500 text-white'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                            title={isDone ? 'Mark as upcoming' : 'Mark completed'}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* AI ALERTS STREAM */
              (!aiAlertHistory || aiAlertHistory.length === 0) ? (
                <div className="text-center py-12 space-y-3">
                  <Sparkles className="w-10 h-10 text-emerald-500/50 mx-auto" />
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No AI Nudges Yet</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                      AI alerts trigger at each habit's reminder time via push notification and Gmail.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsNotificationDrawerOpen(false);
                      setIsAiNotificationModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>Test AI Alerts in Hub</span>
                  </button>
                </div>
              ) : (
                aiAlertHistory.map((alert: any) => {
                  const time = new Date(alert.sentAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <div
                      key={alert.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 space-y-2 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-2xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {time}
                          </span>
                          <span
                            className={`text-2xs font-bold px-1.5 py-0.5 rounded ${
                              alert.channel === 'push'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : alert.channel === 'email'
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {alert.channel.toUpperCase()}
                          </span>
                        </div>
                        {alert.streakDays > 0 && (
                          <span className="text-2xs font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Flame className="w-3 h-3 fill-amber-500" />
                            {alert.streakDays}d
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {alert.body}
                      </p>

                      <div className="pt-1.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-2xs text-slate-400 italic">
                          {alert.scienceTip ? `🧠 ${alert.scienceTip}` : 'AuraHabit AI'}
                        </span>
                        {alert.habitId && (
                          <button
                            onClick={() => {
                              toggleHabitCompletion(alert.habitId);
                              addToast({
                                type: 'success',
                                title: 'Habit Logged!',
                                message: `Marked completed from notification drawer.`,
                              });
                            }}
                            className="text-2xs font-bold px-2 py-0.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Check Off</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
