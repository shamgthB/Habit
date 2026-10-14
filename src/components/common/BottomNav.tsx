import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  Calendar,
  MoreHorizontal,
  Target,
  Trophy,
  Award,
  Repeat,
  Smile,
  BarChart3,
  Settings,
  User,
  Plus,
  X,
  MapPin,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentSection, setCurrentSection, setIsAddHabitModalOpen } = useApp();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const mainTabs = [
    { id: 'dashboard', label: 'Today', icon: LayoutDashboard },
    { id: 'habits', label: 'Habits', icon: CheckSquare },
    { id: 'focustimer', label: 'Focus', icon: Timer },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
  ];

  const moreTabs = [
    { id: 'maps', label: 'Places Map', icon: MapPin },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'routines', label: 'Routines', icon: Repeat },
    { id: 'mood', label: 'Mood & Energy', icon: Smile },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* More Sheet Modal for Mobile */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end lg:hidden animate-in fade-in">
          <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl p-6 border-t border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">All Sections</h3>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 py-5">
              {moreTabs.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentSection(item.id);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-2xs text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden h-16 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md px-3 flex items-center justify-around">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentSection(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-3xs">{tab.label}</span>
            </button>
          );
        })}

        {/* Center Quick Add Button */}
        <button
          onClick={() => setIsAddHabitModalOpen(true)}
          className="flex items-center justify-center -mt-5 w-11 h-11 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
          aria-label="Add habit"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* More Button */}
        <button
          onClick={() => setIsMoreMenuOpen(true)}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            moreTabs.some((t) => t.id === currentSection)
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-3xs">More</span>
        </button>
      </nav>
    </>
  );
};
