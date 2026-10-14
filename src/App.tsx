import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { BottomNav } from './components/common/BottomNav';
import { ToastContainer } from './components/common/Toast';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { OnboardingModal } from './components/common/OnboardingModal';
import { HabitTemplatesModal } from './components/common/HabitTemplatesModal';
import { HabitFormModal } from './components/habits/HabitFormModal';
import { SheetsSyncModal } from './components/sheets/SheetsSyncModal';
import { LoginScreen } from './components/auth/LoginScreen';

// Section Views
import { DashboardView } from './components/dashboard/DashboardView';
import { HabitsView } from './components/habits/HabitsView';
import { CalendarView } from './components/calendar/CalendarView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { GoalsView } from './components/goals/GoalsView';
import { ChallengesView } from './components/challenges/ChallengesView';
import { FriendsContactsTab } from './components/social/FriendsContactsTab';
import { AchievementsView } from './components/achievements/AchievementsView';
import { RoutinesView } from './components/routines/RoutinesView';
import { FocusTimerView } from './components/focustimer/FocusTimerView';
import { MoodView } from './components/mood/MoodView';
import { HistoryView } from './components/history/HistoryView';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsView } from './components/settings/SettingsView';
import { HabitLocationsMap } from './components/maps/HabitLocationsMap';
import { GoogleChatView } from './components/chat/GoogleChatView';
import { GoogleMeetView } from './components/meet/GoogleMeetView';
import { WorkspaceModal } from './components/workspace/WorkspaceModal';
import { AiNotificationModal } from './components/notifications/AiNotificationModal';
import { ProfileQRCodeModal } from './components/profile/ProfileQRCodeModal';
import { QRScannerModal } from './components/profile/QRScannerModal';
import { AuthModal } from './components/auth/AuthModal';

const MainLayout: React.FC = () => {
  const {
    currentSection,
    setCurrentSection,
    profile,
    updateProfile,
    isWorkspaceModalOpen,
    setIsWorkspaceModalOpen,
    isProfileQrModalOpen,
    setIsProfileQrModalOpen,
    isQrScannerModalOpen,
    setIsQrScannerModalOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isAuthLoading,
    isGoogleAuthenticated,
    isGuestMode,
    handleOtpAuthSuccess,
  } = useApp();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Show clean spinner while Firebase auth initializes
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 mt-4 font-medium animate-pulse">Initializing AuraHabit...</p>
      </div>
    );
  }

  // If unauthenticated and not in guest mode, show the sign-in prompt
  if (!isGoogleAuthenticated && !isGuestMode) {
    return (
      <>
        <LoginScreen />
        <ToastContainer />
      </>
    );
  }

  const renderActiveSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <DashboardView />;
      case 'habits':
        return <HabitsView />;
      case 'calendar':
        return <CalendarView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'goals':
        return <GoalsView />;
      case 'challenges':
        return <ChallengesView />;
      case 'community':
        return <FriendsContactsTab />;
      case 'achievements':
        return <AchievementsView />;
      case 'routines':
        return <RoutinesView />;
      case 'focustimer':
        return <FocusTimerView />;
      case 'mood':
        return <MoodView />;
      case 'history':
        return <HistoryView />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <SettingsView />;
      case 'maps':
        return <HabitLocationsMap />;
      case 'chat':
        return <GoogleChatView />;
      case 'meet':
        return <GoogleMeetView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-[#0A0D14] text-slate-900 dark:text-[#F5F6F8] flex flex-col font-sans transition-colors relative overflow-x-hidden selection:bg-[#30D158]/20 selection:text-[#30D158]">
      {/* Apple Subtle Ambient Lighting for Glass Depth */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 hidden dark:block opacity-60">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#30D158]/5 rounded-full blur-[128px]" />
        <div className="absolute top-1/4 -right-32 w-[32rem] h-[32rem] bg-[#0A84FF]/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-20 left-1/3 w-[28rem] h-[28rem] bg-[#BF5AF2]/4 rounded-full blur-[150px]" />
      </div>

      {/* Desktop Sidebar & Mobile Drawer */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 transition-all relative z-1">
        {/* Top App Header */}
        <Navbar onMobileMenuToggle={() => setIsMobileSidebarOpen(true)} />

        {/* Dynamic Section View */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-12">
          {renderActiveSection()}
        </main>
      </div>

      {/* Persistent Mobile Bottom Navigation */}
      <BottomNav />

      {/* Modals & Dialogs */}
      <HabitFormModal />
      <GlobalSearchModal />
      <NotificationDrawer />
      <OnboardingModal />
      <HabitTemplatesModal />
      <SheetsSyncModal />
      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
      />
      <AiNotificationModal />
      <ProfileQRCodeModal
        isOpen={isProfileQrModalOpen}
        onClose={() => setIsProfileQrModalOpen(false)}
        user={profile}
        onOpenChat={() => setCurrentSection('chat')}
      />
      <QRScannerModal
        isOpen={isQrScannerModalOpen}
        onClose={() => setIsQrScannerModalOpen(false)}
        onOpenChatWithUser={() => setCurrentSection('chat')}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleOtpAuthSuccess}
      />

      {/* Toast Feedback */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
