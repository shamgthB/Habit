import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Mail,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  X,
  Play,
  Send,
  Sliders,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Zap,
  Volume2,
  Check,
  Settings,
  History,
} from 'lucide-react';
import {
  checkPushPermission,
  requestPushPermission,
  playNotificationSound,
} from '../../services/notificationService';
import { NotificationChannel, NotificationTone, ScheduleRecommendation } from '../../types';

export const AiNotificationModal: React.FC = () => {
  const {
    isAiNotificationModalOpen,
    setIsAiNotificationModalOpen,
    habits,
    updateHabit,
    logs,
    profile,
    settings,
    updateSettings,
    googleUser,
    isGoogleAuthenticated,
    handleGoogleLogin,
    aiAlertHistory,
    isAiGeneratingAlert,
    triggerHabitAlertNow,
    testPushNotification,
    testEmailAlert,
    optimizeHabitSchedulesWithAi,
    clearAlertHistory,
    toggleHabitCompletion,
    addToast,
    calculateHabitStreak,
  } = useApp() as any;

  const [activeTab, setActiveTab] = useState<'schedules' | 'sandbox' | 'history' | 'settings'>('schedules');
  const [selectedHabitIdForTrigger, setSelectedHabitIdForTrigger] = useState<string>(habits[0]?.id || '');
  const [testTone, setTestTone] = useState<NotificationTone>(
    settings?.aiNotifications?.tone || 'motivational'
  );
  const [testChannel, setTestChannel] = useState<'push' | 'email' | 'both'>('push');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [recommendations, setRecommendations] = useState<ScheduleRecommendation[] | null>(null);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [pushStatus, setPushStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>(
    checkPushPermission()
  );

  if (!isAiNotificationModalOpen) return null;

  const handleRequestPush = async () => {
    const res = await requestPushPermission();
    setPushStatus(res);
    if (res === 'granted') {
      updateSettings({
        browserNotifications: true,
        aiNotifications: {
          ...(settings.aiNotifications || {
            enabled: true,
            pushEnabled: true,
            emailEnabled: true,
            tone: 'motivational',
            autoSchedulerActive: true,
            streakProtectionAlerts: true,
          }),
          pushEnabled: true,
        },
      });
      playNotificationSound();
      addToast({
        type: 'success',
        title: 'Push Notifications Enabled',
        message: 'AuraHabit can now alert you at your scheduled habit times.',
      });
    } else {
      addToast({
        type: 'warning',
        title: 'Permission Not Granted',
        message: 'Browser push notifications were blocked or dismissed.',
      });
    }
  };

  const handleOptimizeClick = async () => {
    setIsOptimizing(true);
    try {
      const recs = await optimizeHabitSchedulesWithAi();
      setRecommendations(recs);
      addToast({
        type: 'success',
        title: 'AI Schedule Generated',
        message: `Circadian rhythms analyzed for ${recs.length} habits.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Optimization Failed',
        message: err.message || 'Could not optimize habit schedules.',
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyAllRecommendations = () => {
    if (!recommendations) return;
    recommendations.forEach((rec) => {
      updateHabit(rec.habitId, { reminderTime: rec.recommendedTime });
    });
    addToast({
      type: 'success',
      title: 'Schedule Applied',
      message: `Updated reminder times for ${recommendations.length} habits.`,
    });
    setRecommendations(null);
  };

  const handleApplySingleRecommendation = (rec: ScheduleRecommendation) => {
    updateHabit(rec.habitId, { reminderTime: rec.recommendedTime });
    setRecommendations((prev) => prev?.filter((r) => r.habitId !== rec.habitId) || null);
    addToast({
      type: 'info',
      title: 'Schedule Updated',
      message: `${rec.habitName} set to ${rec.recommendedTime}.`,
    });
  };

  const handleRunManualTrigger = async (habitId: string) => {
    try {
      await triggerHabitAlertNow(habitId);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Trigger Error',
        message: err.message,
      });
    }
  };

  const handleRunTestPush = async () => {
    setIsTestingPush(true);
    try {
      await testPushNotification();
    } finally {
      setIsTestingPush(false);
    }
  };

  const handleRunTestEmail = async () => {
    setIsTestingEmail(true);
    try {
      await testEmailAlert();
    } finally {
      setIsTestingEmail(false);
    }
  };

  const targetEmail =
    settings?.aiNotifications?.targetEmail || googleUser?.email || profile?.email || '';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  AI Smart Notifications & Schedules
                </h2>
                <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  Gemini Flash
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automated behaviorally tuned push notifications & Gmail alerts based on your habit schedules
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAiNotificationModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STATUS BAR */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Push status */}
            <div className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400">Push:</span>
              {pushStatus === 'granted' ? (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Enabled
                </span>
              ) : (
                <button
                  onClick={handleRequestPush}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Enable Permissions
                </button>
              )}
            </div>

            {/* Email status */}
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400">Gmail Alert:</span>
              {isGoogleAuthenticated ? (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate max-w-[160px]">
                  <CheckCircle2 className="w-3 h-3" /> {targetEmail || 'Connected'}
                </span>
              ) : (
                <button
                  onClick={() => handleGoogleLogin()}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Connect Google
                </button>
              )}
            </div>

            {/* Auto Scheduler Status */}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  settings?.aiNotifications?.autoSchedulerActive !== false
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-500 dark:text-slate-400">Scheduler:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {settings?.aiNotifications?.autoSchedulerActive !== false ? 'Live Checking' : 'Paused'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => playNotificationSound()}
              title="Test notification chime sound"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="px-6 pt-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'schedules', label: 'Habit Schedules & Channels', icon: Calendar },
            { id: 'sandbox', label: 'AI Trigger Sandbox & Preview', icon: Play },
            { id: 'history', label: `Alert History (${aiAlertHistory?.length || 0})`, icon: History },
            { id: 'settings', label: 'Preferences', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* TAB 1: SCHEDULES & HABITS */}
          {activeTab === 'schedules' && (
            <div className="space-y-6">
              {/* AI Optimizer Card Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Circadian Rhythm AI Schedule Optimizer
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                    Let Gemini analyze your habits, cognitive peak hours, and body temperature cycles to compute the optimal daily reminder schedule.
                  </p>
                </div>
                <button
                  onClick={handleOptimizeClick}
                  disabled={isOptimizing}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
                  <span>{isOptimizing ? 'Analyzing Chronobiology...' : 'Optimize Schedules with AI'}</span>
                </button>
              </div>

              {/* AI Recommendations Review Drawer / Card */}
              {recommendations && (
                <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                        Recommended Schedules ({recommendations.length} Habits)
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleApplyAllRecommendations}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Apply All Recommendations
                      </button>
                      <button
                        onClick={() => setRecommendations(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recommendations.map((rec) => (
                      <div
                        key={rec.habitId}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/30 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{rec.habitName}</span>
                            <span className="font-mono text-2xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold">
                              {rec.recommendedTime}
                            </span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-2xs">{rec.rationale}</p>
                        </div>
                        <button
                          onClick={() => handleApplySingleRecommendation(rec)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white dark:text-amber-400 font-semibold transition-all cursor-pointer shrink-0"
                        >
                          Apply
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Habit Schedule Configuration List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Habit Schedules & Channels
                  </h3>
                  <span className="text-xs text-slate-400">{habits.length} Active Habits</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {habits.map((habit: any) => {
                    const streak = calculateHabitStreak(habit, logs).currentStreak;
                    const channel: NotificationChannel = habit.notificationChannel || 'push';
                    const hasAiNudge = habit.aiNudgeEnabled !== false;

                    return (
                      <div
                        key={habit.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        {/* Habit Info */}
                        <div className="flex items-center gap-3.5 min-w-[200px]">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                            {habit.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {habit.name}
                              </h4>
                              {streak > 0 && (
                                <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                  <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  {streak}d
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{habit.category}</span>
                              <span>•</span>
                              <span>
                                {habit.targetValue} {habit.unit}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Schedule & Controls */}
                        <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                          {/* Time Picker */}
                          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <input
                              type="time"
                              value={habit.reminderTime || '08:00'}
                              onChange={(e) => updateHabit(habit.id, { reminderTime: e.target.value })}
                              className="text-xs font-mono font-bold bg-transparent text-slate-900 dark:text-slate-100 outline-hidden cursor-pointer"
                            />
                          </div>

                          {/* Channel Selector */}
                          <select
                            value={channel}
                            onChange={(e) =>
                              updateHabit(habit.id, {
                                notificationChannel: e.target.value as NotificationChannel,
                              })
                            }
                            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-hidden cursor-pointer font-medium"
                          >
                            <option value="push">🔔 Push Notification</option>
                            <option value="email">✉️ Gmail Alert</option>
                            <option value="both">🔔 + ✉️ Both Channels</option>
                            <option value="none">Off (No Alerts)</option>
                          </select>

                          {/* AI Nudge Toggle */}
                          <button
                            type="button"
                            onClick={() => updateHabit(habit.id, { aiNudgeEnabled: !hasAiNudge })}
                            className={`px-2.5 py-1.5 rounded-xl text-2xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              hasAiNudge
                                ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-transparent'
                            }`}
                            title="Toggle whether Gemini creates dynamic motivational text for this alert"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>AI Nudge {hasAiNudge ? 'ON' : 'OFF'}</span>
                          </button>

                          {/* Manual Trigger Now button */}
                          <button
                            type="button"
                            onClick={() => handleRunManualTrigger(habit.id)}
                            disabled={isAiGeneratingAlert}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-500 hover:text-white dark:bg-slate-700/60 dark:hover:bg-emerald-600 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                            title="Trigger this notification right now"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRIGGER SANDBOX & PREVIEW */}
          {activeTab === 'sandbox' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Configuration Panel */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Notification Simulation Sandbox
                    </h3>
                  </div>

                  {/* Habit Picker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Target Habit
                    </label>
                    <select
                      value={selectedHabitIdForTrigger}
                      onChange={(e) => setSelectedHabitIdForTrigger(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-hidden cursor-pointer"
                    >
                      {habits.map((h: any) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.category} • {h.reminderTime || 'No time'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Channel Picker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Delivery Channel
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'push', label: 'Push Only', icon: Bell },
                        { id: 'email', label: 'Gmail Only', icon: Mail },
                        { id: 'both', label: 'Both', icon: Layers },
                      ].map((ch) => {
                        const Icon = ch.icon;
                        const isSel = testChannel === ch.id;
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => setTestChannel(ch.id as any)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isSel
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{ch.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tone Picker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      AI Motivation Tone
                    </label>
                    <select
                      value={testTone}
                      onChange={(e) => setTestTone(e.target.value as NotificationTone)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-hidden cursor-pointer font-medium"
                    >
                      <option value="motivational">🔥 Motivational (Energetic Streak Booster)</option>
                      <option value="gentle">🌿 Gentle & Mindful (Low-Pressure Check-in)</option>
                      <option value="behavioral">🧠 Behavioral Science (Cue & Habit Stacking)</option>
                      <option value="urgent">⚡ Urgent (Day Ending / Streak Risk)</option>
                    </select>
                  </div>

                  {/* Trigger Buttons */}
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => handleRunManualTrigger(selectedHabitIdForTrigger)}
                      disabled={isAiGeneratingAlert}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {isAiGeneratingAlert
                          ? 'Generating AI Alert & Sending...'
                          : 'Generate AI Nudge & Trigger Alert'}
                      </span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleRunTestPush}
                        disabled={isTestingPush}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Bell className="w-3.5 h-3.5 text-blue-500" />
                        <span>{isTestingPush ? 'Testing...' : 'Test Push (Browser)'}</span>
                      </button>

                      <button
                        onClick={handleRunTestEmail}
                        disabled={isTestingEmail || !isGoogleAuthenticated}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        title={!isGoogleAuthenticated ? 'Connect Google Account to send email alerts' : ''}
                      >
                        <Mail className="w-3.5 h-3.5 text-red-500" />
                        <span>{isTestingEmail ? 'Sending...' : 'Test Email (Gmail)'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Preview Mockup */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Live Notification Preview
                  </h4>

                  {/* Browser Push Mockup Card */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center text-white text-2xs font-bold">
                          A
                        </div>
                        <span className="text-2xs font-semibold text-slate-400">AuraHabit • Now</span>
                      </div>
                      <span className="text-2xs font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        PUSH
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>🔥 Protect Your 14-Day Streak: Morning Meditation</span>
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      "Your mind performs best when centered before the rush begins. 10 minutes now safeguards your 14-day momentum."
                    </p>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <span className="text-2xs text-slate-400 italic">
                        🧠 Starting with just 2 deep breaths bypasses resistance.
                      </span>
                      <button className="text-2xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500 text-white">
                        Check Off
                      </button>
                    </div>
                  </div>

                  {/* Gmail Alert Mockup Card */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-2 text-xs">
                    <div className="flex items-center justify-between text-2xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-red-500" />
                        <span>Delivered to: {targetEmail || 'user@gmail.com'}</span>
                      </div>
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                        GMAIL REST API
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 space-y-1.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        Subject: 🔥 Protect Your 14-Day Streak - AuraHabit AI Reminder
                      </div>
                      <div className="text-2xs text-slate-500">
                        Includes rich HTML table, current Life Score (88/100), streak flame badge, and one-click check-off link.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALERT HISTORY & STREAM */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Recent AI Notification Alerts
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live log of triggered notifications across Push & Email
                  </p>
                </div>
                {aiAlertHistory?.length > 0 && (
                  <button
                    onClick={clearAlertHistory}
                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {(!aiAlertHistory || aiAlertHistory.length === 0) ? (
                <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <History className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    No notifications recorded yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Trigger a test alert in the Sandbox or wait for your habit reminder time!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiAlertHistory.map((alert: any) => {
                    const timeString = new Date(alert.sentAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={alert.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {timeString}
                            </span>
                            <span
                              className={`text-2xs font-bold px-2 py-0.5 rounded-md ${
                                alert.channel === 'push'
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                  : alert.channel === 'email'
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {alert.channel.toUpperCase()}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {alert.title}
                            </span>
                          </div>

                          {alert.habitId && (
                            <button
                              onClick={() => {
                                toggleHabitCompletion(alert.habitId);
                                addToast({
                                  type: 'success',
                                  title: 'Habit Logged!',
                                  message: `Marked completed from notification history.`,
                                });
                              }}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark Done</span>
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {alert.body}
                        </p>

                        {alert.scienceTip && (
                          <div className="text-2xs text-slate-400 italic">
                            🧠 {alert.scienceTip}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PREFERENCES & SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-xl">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Global Alert Preferences
                </h3>

                {/* Auto Scheduler Toggle */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Automatic Habit Scheduler
                    </h4>
                    <p className="text-2xs text-slate-500 dark:text-slate-400">
                      Runs in background and automatically triggers push & email alerts at each habit's reminder time
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings?.aiNotifications?.autoSchedulerActive !== false}
                    onChange={(e) =>
                      updateSettings({
                        aiNotifications: {
                          ...(settings.aiNotifications || {
                            enabled: true,
                            pushEnabled: true,
                            emailEnabled: true,
                            tone: 'motivational',
                            autoSchedulerActive: true,
                            streakProtectionAlerts: true,
                          }),
                          autoSchedulerActive: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>

                {/* Streak Protection Warning */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Evening Streak Protection Check
                    </h4>
                    <p className="text-2xs text-slate-500 dark:text-slate-400">
                      Triggers a high-priority alert at 20:30 if any active streak is at risk of breaking tonight
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings?.aiNotifications?.streakProtectionAlerts !== false}
                    onChange={(e) =>
                      updateSettings({
                        aiNotifications: {
                          ...(settings.aiNotifications || {
                            enabled: true,
                            pushEnabled: true,
                            emailEnabled: true,
                            tone: 'motivational',
                            autoSchedulerActive: true,
                            streakProtectionAlerts: true,
                          }),
                          streakProtectionAlerts: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>

                {/* Custom Target Email Override */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Recipient Email for Alerts
                  </label>
                  <input
                    type="email"
                    value={targetEmail}
                    onChange={(e) =>
                      updateSettings({
                        aiNotifications: {
                          ...(settings.aiNotifications || {
                            enabled: true,
                            pushEnabled: true,
                            emailEnabled: true,
                            tone: 'motivational',
                            autoSchedulerActive: true,
                            streakProtectionAlerts: true,
                          }),
                          targetEmail: e.target.value,
                        },
                      })
                    }
                    placeholder="you@gmail.com"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-hidden"
                  />
                  <p className="text-2xs text-slate-400">
                    Defaults to your connected Google Account or profile email.
                  </p>
                </div>

                {/* Default AI Motivation Tone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Default AI Motivation Tone
                  </label>
                  <select
                    value={settings?.aiNotifications?.tone || 'motivational'}
                    onChange={(e) =>
                      updateSettings({
                        aiNotifications: {
                          ...(settings.aiNotifications || {
                            enabled: true,
                            pushEnabled: true,
                            emailEnabled: true,
                            autoSchedulerActive: true,
                            streakProtectionAlerts: true,
                          }),
                          tone: e.target.value as NotificationTone,
                        },
                      })
                    }
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-hidden font-medium"
                  >
                    <option value="motivational">🔥 Motivational (Energetic Streak Booster)</option>
                    <option value="gentle">🌿 Gentle & Mindful (Low-Pressure Check-in)</option>
                    <option value="behavioral">🧠 Behavioral Science (Cue & Habit Stacking)</option>
                    <option value="urgent">⚡ Urgent (Day Ending / Streak Risk)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Powered by Gemini Flash & Web Notification API
          </span>
          <button
            onClick={() => setIsAiNotificationModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
