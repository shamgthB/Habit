import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Flame,
  Mail,
  FileSpreadsheet,
  MapPin,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { parseAuthError, ParsedAuthError } from '../../services/authService';
import { AuthModal } from './AuthModal';
import { autoLoginDemo } from '../../services/userService';

export const LoginScreen: React.FC = () => {
  const {
    handleGoogleLogin,
    continueAsGuest,
    authError,
    clearAuthError,
    isAuthModalOpen,
    setIsAuthModalOpen,
    handleOtpAuthSuccess,
  } = useApp();
  const [isLocalAuthOpen, setIsLocalAuthOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  const onSignInClick = async () => {
    setIsLoading(true);
    clearAuthError();
    try {
      // Standard sign in with basic scopes (email, profile, openid).
      await handleGoogleLogin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const onQuickAutoLogin = async () => {
    setIsAutoLoggingIn(true);
    clearAuthError();
    try {
      const res = await autoLoginDemo();
      if (res.success && res.user) {
        handleOtpAuthSuccess(res.user);
      }
    } finally {
      setIsAutoLoggingIn(false);
    }
  };

  const activeError = authError && !authError.isPopupClosed ? authError : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center px-4 py-12 transition-colors relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-500/10 via-blue-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* App Logo & Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/25 ring-4 ring-emerald-500/10 mb-1">
            <Flame className="w-8 h-8 fill-white" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            AuraHabit
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Build unstoppable consistency, calculate your daily Life Score, and sync seamlessly with Google Workspace.
          </p>
        </div>

        {/* Sign In Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Welcome to Your Habit Hub
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sign in with your Google account to track personal habits and enable cloud sync.
            </p>
          </div>

          {/* Error Banner with detailed 403 / access_denied guidance */}
          {activeError && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-2 ${
                activeError.isAccessDenied
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-current" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{activeError.title}</p>
                    {activeError.isAccessDenied && (
                      <span className="px-1.5 py-0.5 rounded text-3xs font-mono font-bold bg-amber-200/60 dark:bg-amber-900/60">
                        403 access_denied
                      </span>
                    )}
                  </div>
                  <p className="text-2xs leading-relaxed opacity-95">{activeError.message}</p>
                  <p className="text-2xs font-semibold leading-relaxed pt-1">
                    {activeError.actionableStep}
                  </p>
                </div>
              </div>

              {activeError.isAccessDenied && (
                <div className="pt-2 border-t border-amber-200/70 dark:border-amber-800/70 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setShowConfigHelp(true)}
                    className="text-2xs underline font-semibold hover:opacity-80 cursor-pointer"
                  >
                    View step-by-step console fix &rarr;
                  </button>
                  <button
                    onClick={continueAsGuest}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-3xs transition-colors cursor-pointer"
                  >
                    Continue as Guest
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Primary Action: Google Sign In */}
          <button
            onClick={onSignInClick}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-bold text-sm border border-slate-300 dark:border-slate-750 shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                />
              </svg>
            )}
            <span>{isLoading ? 'Connecting to Google...' : 'Sign in with Google'}</span>
          </button>

          {/* Alternative: Email OTP Sign In */}
          <button
            type="button"
            onClick={() => {
              clearAuthError();
              setIsAuthModalOpen(true);
              setIsLocalAuthOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/90 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4 text-emerald-500" />
            <span>Sign in with Email OTP & Password</span>
          </button>

          {/* Zero-Config Instant Auto-Login Button */}
          <button
            type="button"
            onClick={onQuickAutoLogin}
            disabled={isAutoLoggingIn}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/20 transition-colors cursor-pointer"
          >
            {isAutoLoggingIn ? (
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-500" />
            )}
            <span>{isAutoLoggingIn ? 'Connecting Demo User...' : '⚡ Instant Demo Auto-Login (Zero-Config)'}</span>
          </button>

          {/* Secondary Action: Guest Mode */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <span className="relative px-3 bg-white dark:bg-slate-900 text-3xs uppercase font-semibold text-slate-400 tracking-wider">
              or
            </span>
          </div>

          <button
            onClick={continueAsGuest}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>Continue as Guest / Try Demo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-1">
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              <span>Google Apps</span>
            </div>
            <p className="text-3xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Sync with Gmail reports, Google Calendar, Tasks & Keep notes.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs mb-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Habit Places</span>
            </div>
            <p className="text-3xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tag habits to gyms, parks, cafes, and libraries on Google Maps.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sheets Backup</span>
            </div>
            <p className="text-3xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Automated 4-tab continuous spreadsheet backup to Google Drive.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Life Score</span>
            </div>
            <p className="text-3xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Daily algorithmic score (0-100) and gamified XP consistency levels.
            </p>
          </div>
        </div>

        {/* Complete Console Checklist: Fix 403 & Allow External Users */}
        <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setShowConfigHelp(!showConfigHelp)}
            className="w-full flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-500" />
              <span>Console Checklist: Fix 403 & Allow Users</span>
            </div>
            {showConfigHelp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showConfigHelp && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 text-2xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {/* Fix 403 access_denied Section */}
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 space-y-1.5">
                <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Fix "403: access_denied - App has not completed verification":
                </p>
                <p className="text-amber-800 dark:text-amber-300">
                  Google blocks logins in "Testing" mode for emails not in the test list. Choose either option below:
                </p>
                <div className="pl-2 space-y-1 text-slate-700 dark:text-slate-300">
                  <p>
                    <strong>Option A (Quickest - Add Test Users):</strong> In{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials/consent"
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5"
                    >
                      Google Cloud Console &gt; OAuth consent screen
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    , scroll down to <strong>Test users</strong> &rarr; Click <strong>+ ADD USERS</strong> &rarr; Enter your Google email &rarr; Save.
                  </p>
                  <p>
                    <strong>Option B (Allow Everyone):</strong> On the same OAuth consent screen, under <strong>Publishing status</strong>, click <strong>PUBLISH APP</strong> to switch from "Testing" to "In production".
                  </p>
                </div>
              </div>

              {/* Firebase Console Checklist */}
              <div className="space-y-1.5">
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  1. Firebase Console Checklist:
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>
                    <strong>Authentication &gt; Sign-in method</strong>: Ensure <strong>Google</strong> provider is Enabled.
                  </li>
                  <li>
                    <strong>Authentication &gt; Settings &gt; Authorized Domains</strong>: Add your deployed domain (e.g. <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">shamgtb.github.io</code> or your custom domain).
                  </li>
                </ol>
              </div>

              {/* Google Cloud Console Checklist */}
              <div className="space-y-1.5">
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  2. Google Cloud Console Credentials Checklist:
                </p>
                <p>
                  Open <em>APIs & Services &gt; Credentials &gt; Web client (OAuth 2.0 Client IDs)</em>:
                </p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  <li>
                    <strong>Authorized JavaScript origins:</strong> Add your deployed site origin: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">https://shamgtb.github.io</code>
                  </li>
                  <li>
                    <strong>Authorized redirect URIs:</strong> Ensure Firebase Auth handler is present: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">https://zany-rigging-77dgj.firebaseapp.com/__/auth/handler</code>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Security / Privacy badge */}
        <div className="flex items-center justify-center gap-1.5 text-3xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Firebase Auth SDK & GoogleAuthProvider Popup Flow</span>
        </div>
      </div>

      {/* Gmail OTP Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen || isLocalAuthOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setIsLocalAuthOpen(false);
        }}
        onAuthSuccess={handleOtpAuthSuccess}
        defaultMode="signin"
      />
    </div>
  );
};
