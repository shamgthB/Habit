import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Bell,
  Sun,
  Moon,
  FileSpreadsheet,
  Mail,
  Flame,
  Zap,
  Menu,
  QrCode,
  Camera,
} from 'lucide-react';
import { getLevelForXp } from '../../utils/calculations';

interface NavbarProps {
  onMobileMenuToggle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMobileMenuToggle }) => {
  const {
    profile,
    lifeScore,
    globalStreak,
    reminders,
    settings,
    updateSettings,
    googleUser,
    isGoogleAuthenticated,
    handleGoogleLogin,
    setIsSearchModalOpen,
    setIsNotificationDrawerOpen,
    setIsSheetsModalOpen,
    setIsWorkspaceModalOpen,
    setIsProfileQrModalOpen,
    setIsQrScannerModalOpen,
    aiAlertHistory,
    setCurrentSection,
  } = useApp();

  const levelInfo = getLevelForXp(profile.xp);
  const pendingRemindersCount =
    reminders.filter((r) => r.status === 'upcoming').length + (aiAlertHistory?.length > 0 ? 1 : 0);
  const userAvatar =
    googleUser?.photoURL ||
    profile.avatar ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80';
  const userName = profile.name || googleUser?.displayName || 'User';

  const toggleTheme = () => {
    const next = settings.themeMode === 'dark' ? 'light' : 'dark';
    updateSettings({ themeMode: next });
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200/80 dark:border-white/[0.07] bg-white/75 dark:bg-[#0D1017]/75 backdrop-blur-2xl px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Mobile hamburger + Capsule Search Widget */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-white/70 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Capsule Search Widget */}
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-slate-200/90 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.04] hover:bg-slate-200/70 dark:hover:bg-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.12] text-slate-400 dark:text-white/50 text-xs transition-all duration-150 cursor-pointer group w-full max-w-xs sm:max-w-sm"
        >
          <Search className="w-4 h-4 text-slate-400 dark:text-white/40 group-hover:text-[#30D158] transition-colors" />
          <span className="hidden sm:inline text-[13px] font-normal tracking-tight text-slate-500 dark:text-white/60">
            Search habits, goals, notes...
          </span>
          <span className="sm:hidden text-xs">Search...</span>
          <span className="ml-auto flex items-center">
            <kbd className="hidden sm:inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-white/70 shadow-xs">
              ⌘K
            </kbd>
          </span>
        </button>
      </div>

      {/* Right: iOS Capsule Stats & Touch-Optimized Icon Buttons */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Global Streak Capsule Widget */}
        <div
          title={`Current global streak: ${globalStreak.currentStreak} days`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF9F0A]/12 text-[#FF9F0A] border border-[#FF9F0A]/20 font-bold text-[12px] shadow-xs cursor-default"
        >
          <Flame className="w-3.5 h-3.5 fill-[#FF9F0A] animate-pulse" />
          <span>{globalStreak.currentStreak}d</span>
        </div>

        {/* Life Score Capsule Widget */}
        <button
          onClick={() => setCurrentSection('analytics')}
          title="Overall Life Score - click to inspect breakdown"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#30D158]/12 text-[#30D158] hover:bg-[#30D158]/20 border border-[#30D158]/25 font-bold text-[12px] transition-all cursor-pointer active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-[#30D158] shadow-[0_0_8px_rgba(48,209,88,0.8)]" />
          <span>Life Score: {lifeScore.overallScore}</span>
        </button>

        {/* Level & XP Capsule Widget */}
        <button
          onClick={() => setCurrentSection('profile')}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-white/[0.05] hover:bg-slate-200/80 dark:hover:bg-white/[0.09] border border-slate-200/70 dark:border-white/[0.08] text-slate-700 dark:text-white/80 text-[12px] font-semibold transition-all cursor-pointer active:scale-95"
        >
          <Zap className="w-3.5 h-3.5 text-[#FFD60A] fill-[#FFD60A]" />
          <span>Lv.{levelInfo.level} {levelInfo.title}</span>
          <span className="text-slate-400 dark:text-white/40 text-[11px]">({profile.xp} XP)</span>
        </button>

        {/* Google Sheets Capsule Button */}
        <button
          onClick={() => setIsSheetsModalOpen(true)}
          className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/60 dark:bg-white/[0.04] hover:bg-[#30D158]/10 hover:border-[#30D158]/30 hover:text-[#30D158] text-slate-700 dark:text-white/70 text-[12px] font-semibold transition-all cursor-pointer active:scale-95"
          title="Google Sheets Backup & Sync"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#30D158]" />
          <span>Sheets</span>
        </button>

        {/* Google Workspace Capsule Button */}
        <button
          onClick={() => setIsWorkspaceModalOpen(true)}
          className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/60 dark:bg-white/[0.04] hover:bg-[#0A84FF]/10 hover:border-[#0A84FF]/30 hover:text-[#0A84FF] text-slate-700 dark:text-white/70 text-[12px] font-semibold transition-all cursor-pointer active:scale-95"
          title="Google Workspace Apps"
        >
          <Mail className="w-3.5 h-3.5 text-[#0A84FF]" />
          <span>Workspace</span>
        </button>

        {/* Scan Profile QR Code */}
        <button
          onClick={() => setIsQrScannerModalOpen(true)}
          className="p-2 rounded-full text-slate-500 hover:text-[#BF5AF2] dark:text-white/60 dark:hover:text-[#BF5AF2] hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer active:scale-95"
          title="Scan QR Code to Verify Profile"
          aria-label="Scan Profile QR Code"
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* My Profile QR Card */}
        <button
          onClick={() => setIsProfileQrModalOpen(true)}
          className="p-2 rounded-full text-slate-500 hover:text-[#30D158] dark:text-white/60 dark:hover:text-[#30D158] hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer active:scale-95"
          title="My Profile QR Code Card"
          aria-label="Generate Profile QR Code"
        >
          <QrCode className="w-4 h-4" />
        </button>

        {/* Reminders / Notifications Bell */}
        <button
          onClick={() => setIsNotificationDrawerOpen(true)}
          className="relative p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer active:scale-95"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          {pendingRemindersCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF453A] ring-2 ring-white dark:ring-[#0D1017]" />
          )}
        </button>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer active:scale-95"
          aria-label="Toggle dark mode"
        >
          {settings.themeMode === 'dark' ? (
            <Sun className="w-4 h-4 text-[#FFD60A]" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Profile Avatar / Sign In button */}
        {!isGoogleAuthenticated ? (
          <button
            onClick={() => handleGoogleLogin()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0A84FF] hover:bg-[#0071E3] text-white text-[12px] font-bold shadow-[0_2px_12px_rgba(10,132,255,0.35)] active:scale-95 transition-all cursor-pointer"
            title="Sign in with Google or OTP"
          >
            <span>Sign In</span>
          </button>
        ) : (
          <button
            onClick={() => setCurrentSection('profile')}
            className="flex items-center gap-2 pl-1 cursor-pointer group active:scale-95 transition-transform"
            aria-label="View profile"
            title={`Signed in as ${userName} (${googleUser?.email || ''})`}
          >
            <img
              src={userAvatar}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[#30D158]/30 group-hover:ring-[#30D158] transition-all"
            />
          </button>
        )}
      </div>
    </header>
  );
};
