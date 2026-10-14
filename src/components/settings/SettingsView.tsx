import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Sun,
  Moon,
  Laptop,
  Bell,
  Volume2,
  FileSpreadsheet,
  Download,
  Upload,
  RotateCcw,
  ShieldAlert,
  Check,
  Calendar,
  Clock,
  Sparkles,
  Mail,
  LogOut,
  LogIn,
  HardDrive,
  Cloud,
  CloudUpload,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { AccentColor, ThemeMode } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { ConnectedServicesWidget } from '../workspace/ConnectedServicesWidget';
import {
  uploadBackupToGoogleDrive,
  listGoogleDriveBackups,
  downloadGoogleDriveBackup,
  DriveBackupFile,
} from '../../services/driveService';

export const SettingsView: React.FC = () => {
  const {
    data,
    settings,
    updateSettings,
    exportDataJSON,
    importDataJSON,
    exportDataCSV,
    resetAllData,
    setIsSheetsModalOpen,
    setIsWorkspaceModalOpen,
    setIsAiNotificationModalOpen,
    testPushNotification,
    testEmailAlert,
    googleUser,
    isGoogleAuthenticated,
    handleGoogleLogin,
    handleGoogleLogout,
    addToast,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isBackingUpDrive, setIsBackingUpDrive] = useState(false);
  const [isLoadingDriveList, setIsLoadingDriveList] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [selectedBackupToRestore, setSelectedBackupToRestore] = useState<DriveBackupFile | null>(null);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDataJSON(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRequestBrowserNotifications = async () => {
    if (!('Notification' in window)) {
      addToast({
        type: 'warning',
        title: 'Not Supported',
        message: 'Browser notifications are not supported in this browser.',
      });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      updateSettings({ browserNotifications: true });
      addToast({
        type: 'success',
        title: 'Notifications Allowed',
        message: 'You will receive reminders for scheduled habits and routines.',
      });
    } else {
      updateSettings({ browserNotifications: false });
      addToast({
        type: 'info',
        title: 'Notifications Denied',
        message: 'Permission was not granted.',
      });
    }
  };

  const handleBackupToDrive = async () => {
    setIsBackingUpDrive(true);
    try {
      const file = await uploadBackupToGoogleDrive(data);
      addToast({
        type: 'success',
        title: 'Uploaded to Google Drive!',
        message: `Saved backup file "${file.name}" to your Google Drive.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Google Drive Backup Failed',
        message: err.message || 'Could not upload to Google Drive.',
      });
    } finally {
      setIsBackingUpDrive(false);
    }
  };

  const handleOpenDriveRestoreModal = async () => {
    setIsDriveModalOpen(true);
    setIsLoadingDriveList(true);
    try {
      const list = await listGoogleDriveBackups();
      setDriveBackups(list);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Drive List Failed',
        message: err.message || 'Could not retrieve backups from Google Drive.',
      });
    } finally {
      setIsLoadingDriveList(false);
    }
  };

  const handleRestoreDriveBackup = async (file: DriveBackupFile) => {
    try {
      const backupData = await downloadGoogleDriveBackup(file.id);
      const jsonStr = typeof backupData === 'string' ? backupData : JSON.stringify(backupData);
      const success = importDataJSON(jsonStr);
      if (success) {
        addToast({
          type: 'success',
          title: 'Restored from Google Drive!',
          message: `Successfully loaded data from "${file.name}".`,
        });
        setIsDriveModalOpen(false);
        setSelectedBackupToRestore(null);
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Restore Failed',
        message: err.message || 'Could not restore backup from Google Drive.',
      });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Application Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize themes, calendar preferences, Google Workspace ecosystem, and cloud backups
        </p>
      </div>

      {/* Unified Connected Google Workspace Services Status Widget */}
      <ConnectedServicesWidget />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance & Theme */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Appearance & Visual Theme</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Theme Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'dark' as ThemeMode, label: 'Dark Mode', icon: Moon },
                { id: 'light' as ThemeMode, label: 'Light Mode', icon: Sun },
                { id: 'system' as ThemeMode, label: 'System', icon: Laptop },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = settings.themeMode === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => updateSettings({ themeMode: t.id })}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Accent Color
            </label>
            <div className="flex items-center gap-2.5">
              {[
                { id: 'emerald' as AccentColor, color: '#10b981', label: 'Emerald' },
                { id: 'indigo' as AccentColor, color: '#6366f1', label: 'Indigo' },
                { id: 'violet' as AccentColor, color: '#8b5cf6', label: 'Violet' },
                { id: 'amber' as AccentColor, color: '#f59e0b', label: 'Amber' },
                { id: 'rose' as AccentColor, color: '#f43f5e', label: 'Rose' },
                { id: 'cyan' as AccentColor, color: '#06b6d4', label: 'Cyan' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateSettings({ accentColor: c.id })}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                    settings.accentColor === c.id ? 'ring-2 ring-offset-2 ring-emerald-500' : ''
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                >
                  {settings.accentColor === c.id && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date & Time Preferences */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Calendar & Formatting</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Week Starts On
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateSettings({ weekStartDay: 1 })}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    settings.weekStartDay === 1
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Monday (ISO)
                </button>
                <button
                  onClick={() => updateSettings({ weekStartDay: 0 })}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    settings.weekStartDay === 0
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Sunday
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Date Format
                </label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => updateSettings({ dateFormat: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs cursor-pointer"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Time Format
                </label>
                <select
                  value={settings.timeFormat}
                  onChange={(e) => updateSettings({ timeFormat: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs cursor-pointer"
                >
                  <option value="12h">12-Hour (AM/PM)</option>
                  <option value="24h">24-Hour (Military)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Google Sheets & Workspace Integration Setting */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              <span>Google Account & Cloud Integrations</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsWorkspaceModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Google Apps</span>
              </button>
              <button
                onClick={() => setIsSheetsModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                Open Sync Center
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Connect your Google account to back up habit logs to Google Sheets and use Google Workspace tools (Gmail reports, Google Calendar, Google Tasks, and Google Keep).
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-slate-500 block">Connection Status:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isGoogleAuthenticated ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {isGoogleAuthenticated && googleUser?.email
                    ? `Connected: ${googleUser.email}`
                    : 'Not Connected'}
                </span>
              </div>

              {isGoogleAuthenticated ? (
                <button
                  onClick={handleGoogleLogout}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-semibold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => handleGoogleLogin()}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign in with Google</span>
                </button>
              )}
            </div>

            {settings.googleSheets.lastSyncedAt && (
              <div className="flex justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Last Synced to Sheets:</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {new Date(settings.googleSheets.lastSyncedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* AI-Driven Notifications & Sound */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <span>AI Smart Notifications & Alerts</span>
            </h2>
            <button
              onClick={() => setIsAiNotificationModalOpen(true)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Schedules & Sandbox</span>
              <span>→</span>
            </button>
          </div>

          <div className="space-y-3">
            {/* Open Manager Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Custom Habit Schedule Pipeline
                </p>
                <p className="text-3xs text-slate-500 dark:text-slate-400">
                  Automated Gemini Flash micro-nudges delivered via Browser Push & Gmail Alerts
                </p>
              </div>
              <button
                onClick={() => setIsAiNotificationModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
              >
                Configure Hub
              </button>
            </div>

            {/* Push Notifications Row */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-blue-500" />
                  <span>Browser Push Notifications</span>
                </p>
                <p className="text-3xs text-slate-400">System prompts when habit reminders trigger</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={testPushNotification}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-2xs font-semibold cursor-pointer"
                >
                  Test Push
                </button>
                <button
                  onClick={handleRequestBrowserNotifications}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    settings.browserNotifications
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'border border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {settings.browserNotifications ? 'Allowed' : 'Enable'}
                </button>
              </div>
            </div>

            {/* Gmail Email Alerts Row */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-red-500" />
                  <span>Gmail Scheduled Alerts</span>
                </p>
                <p className="text-3xs text-slate-400">
                  {googleUser?.email ? `Sending to ${googleUser.email}` : 'Requires Google Workspace sign-in'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isGoogleAuthenticated && (
                  <button
                    onClick={() => testEmailAlert()}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-2xs font-semibold cursor-pointer"
                  >
                    Test Email
                  </button>
                )}
                {!isGoogleAuthenticated ? (
                  <button
                    onClick={() => handleGoogleLogin(true)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    Connect Gmail
                  </button>
                ) : (
                  <span className="text-2xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* Sound Effects */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sound Effects & Notification Chimes</span>
                </p>
                <p className="text-3xs text-slate-400">Audio synthesizers on scheduled reminders</p>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Data Management: Export / Import / Backup / Reset (Spans full width) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Download className="w-5 h-5 text-teal-500" />
              <span>Data Portability, Backup & Reset</span>
            </h2>
            <span className="text-xs text-slate-400">100% Client-Side Privacy</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Google Drive Cloud Backup */}
            <button
              onClick={handleBackupToDrive}
              disabled={isBackingUpDrive}
              className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 flex flex-col items-center text-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <HardDrive className={`w-5 h-5 text-amber-500 ${isBackingUpDrive ? 'animate-bounce' : ''}`} />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isBackingUpDrive ? 'Uploading...' : 'Drive Cloud Backup'}
              </span>
              <span className="text-3xs text-amber-600 dark:text-amber-400">Save JSON to Drive</span>
            </button>

            {/* Google Drive Restore */}
            <button
              onClick={handleOpenDriveRestoreModal}
              className="p-4 rounded-2xl border border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/10 flex flex-col items-center text-center gap-2 transition-all cursor-pointer"
            >
              <Cloud className="w-5 h-5 text-sky-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Drive Backups</span>
              <span className="text-3xs text-sky-600 dark:text-sky-400">Restore from Drive</span>
            </button>

            {/* Export JSON */}
            <button
              onClick={exportDataJSON}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center text-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Export JSON</span>
              <span className="text-3xs text-slate-400">Local JSON file</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={exportDataCSV}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center text-center gap-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Export CSV</span>
              <span className="text-3xs text-slate-400">Table logs</span>
            </button>

            {/* Import JSON */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center text-center gap-2 transition-all cursor-pointer"
            >
              <Upload className="w-5 h-5 text-indigo-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Import JSON</span>
              <span className="text-3xs text-slate-400">Restore local file</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".json"
              className="hidden"
            />

            {/* Reset Data */}
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 flex flex-col items-center text-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-5 h-5 text-rose-500" />
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Reset App</span>
              <span className="text-3xs text-rose-400">Default demo data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation modal before application reset */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Reset Application Data?"
        message="This will reset all current habits, logs, and settings back to the initial sample state. Make sure you export a backup first if you have important progress."
        confirmText="Yes, Reset Everything"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={() => {
          resetAllData();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Google Drive Backups Modal */}
      {isDriveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Google Drive Cloud Backups
                </h3>
              </div>
              <button
                onClick={() => setIsDriveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              {isLoadingDriveList ? (
                <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                  <span>Loading backups from Google Drive...</span>
                </div>
              ) : driveBackups.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Cloud className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">No backups found in Google Drive</p>
                  <p className="text-3xs mt-1">Click "Drive Cloud Backup" to create your first cloud snapshot.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {driveBackups.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                        <p className="text-3xs text-slate-400 font-mono">
                          {new Date(file.createdTime).toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedBackupToRestore(file)}
                        className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-2xs cursor-pointer shadow-xs transition-colors"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsDriveModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Restore Dialog */}
      <ConfirmModal
        isOpen={selectedBackupToRestore !== null}
        title="Restore Backup from Google Drive?"
        message={`Are you sure you want to restore "${selectedBackupToRestore?.name}"? Your current application data will be replaced with this cloud backup.`}
        confirmText="Confirm & Restore"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={() => {
          if (selectedBackupToRestore) {
            handleRestoreDriveBackup(selectedBackupToRestore);
          }
        }}
        onCancel={() => setSelectedBackupToRestore(null)}
      />
    </div>
  );
};
