import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FileSpreadsheet, X, Check, ExternalLink, RefreshCw, LogIn, LogOut, ShieldAlert, Sparkles } from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

export const SheetsSyncModal: React.FC = () => {
  const {
    isSheetsModalOpen,
    setIsSheetsModalOpen,
    googleUser,
    isGoogleAuthenticated,
    isSyncingSheets,
    syncWithGoogleSheets,
    handleGoogleLogin,
    handleGoogleLogout,
    settings,
    habits,
    logs,
  } = useApp();

  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState(settings.googleSheets.spreadsheetId || '');
  const [createdUrl, setCreatedUrl] = useState<string | null>(settings.googleSheets.spreadsheetUrl || null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (!isSheetsModalOpen) return null;

  const handleStartSync = () => {
    // Show user confirmation dialog before updating/overwriting spreadsheet
    setIsConfirmOpen(true);
  };

  const executeSync = async () => {
    setIsConfirmOpen(false);
    try {
      const url = await syncWithGoogleSheets(spreadsheetIdInput.trim() || undefined);
      if (url) {
        setCreatedUrl(url);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Google Sheets Integration
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Synchronize your habit records and wellness metrics to spreadsheets
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSheetsModalOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="py-5 space-y-5">
            {/* Account Status */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Connection Status</p>
                {isGoogleAuthenticated && googleUser ? (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {googleUser.displayName || googleUser.email}
                    </p>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Not connected to Google</p>
                  </div>
                )}
              </div>

              {isGoogleAuthenticated ? (
                <button
                  onClick={handleGoogleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              ) : (
                /* Official Google Sign In button format */
                <button
                  onClick={() => handleGoogleLogin()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Sign in with Google
                </button>
              )}
            </div>

            {/* Custom Spreadsheet ID option */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Spreadsheet ID (Optional)
              </label>
              <input
                type="text"
                value={spreadsheetIdInput}
                onChange={(e) => setSpreadsheetIdInput(e.target.value)}
                placeholder="Leave blank to automatically create a brand new Google Sheet"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 outline-hidden"
              />
              <p className="text-2xs text-slate-400">
                If left empty, a spreadsheet named &quot;AuraHabit Tracker&quot; with 4 tabs will be created in your Google Drive.
              </p>
            </div>

            {/* Sync Preview */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Data Ready for Sync:
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                <div>• {habits.length} Habits Configuration</div>
                <div>• {logs.length} Historical Daily Logs</div>
                <div>• 4 Dedicated Tabs (Overview, Logs, Wellness, Score)</div>
                <div>• Live Formulas & Life Score Summary</div>
              </div>
            </div>

            {/* Existing Sheet Link if Synced */}
            {createdUrl && (
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                <div>
                  <p className="text-2xs uppercase font-semibold text-slate-400">Connected Spreadsheet</p>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                    Last Synced: {settings.googleSheets.lastSyncedAt ? new Date(settings.googleSheets.lastSyncedAt).toLocaleString() : 'Just now'}
                  </p>
                </div>
                <a
                  href={createdUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Open Sheet
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Your Google token is kept securely in memory.
            </span>
            <button
              onClick={handleStartSync}
              disabled={isSyncingSheets}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              {isSyncingSheets ? 'Syncing to Google...' : 'Sync Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog before updating/overwriting */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Sync to Google Sheets?"
        message={`This will write ${logs.length} habit logs and metrics to your Google Spreadsheet tabs (Habits_Overview, Daily_Logs, Wellness_Metrics, and Life_Score_Summary). Proceed with synchronization?`}
        confirmText="Yes, Sync Now"
        cancelText="Cancel"
        isDestructive={false}
        onConfirm={executeSync}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
};
