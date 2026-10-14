import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Calendar,
  CheckSquare,
  FileSpreadsheet,
  HardDrive,
  Users,
  Mail,
  MapPin,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  ArrowRight,
  MessageSquare,
  Video,
} from 'lucide-react';
import { requestWorkspaceAccess } from '../../services/authService';

export const ConnectedServicesWidget: React.FC = () => {
  const {
    isGoogleAuthenticated,
    googleUser,
    handleGoogleLogin,
    setIsWorkspaceModalOpen,
    setCurrentSection,
    addToast,
  } = useApp();

  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const handleGrantPermissions = async () => {
    setIsAuthorizing(true);
    try {
      await requestWorkspaceAccess();
      addToast({
        type: 'success',
        title: 'Permissions Granted!',
        message: 'All Google Workspace connections have been authorized.',
      });
    } catch (err: any) {
      if (err?.isAccessDenied) {
        addToast({
          type: 'error',
          title: 'Permission Denied',
          message: 'Google Cloud consent requires your test email to be added under OAuth test users.',
        });
      } else {
        addToast({
          type: 'info',
          title: 'Authorization Note',
          message: err?.message || 'Please complete authorization in the popup.',
        });
      }
    } finally {
      setIsAuthorizing(false);
    }
  };

  const services = [
    {
      id: 'calendar',
      name: 'Google Calendar',
      icon: Calendar,
      description: 'Habit schedules & time-blocking',
      location: 'Routines & Calendar',
      targetSection: 'routines',
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      status: isGoogleAuthenticated ? 'Connected' : 'Sign in Required',
    },
    {
      id: 'tasks',
      name: 'Google Tasks',
      icon: CheckSquare,
      description: 'Daily checklists & task pushing',
      location: 'Routines View',
      targetSection: 'routines',
      color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
      status: isGoogleAuthenticated ? 'Connected' : 'Sign in Required',
    },
    {
      id: 'sheets',
      name: 'Google Sheets',
      icon: FileSpreadsheet,
      description: 'Progress & streak spreadsheet export',
      location: 'Analytics View',
      targetSection: 'analytics',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      status: isGoogleAuthenticated ? 'Connected' : 'Sign in Required',
    },
    {
      id: 'drive',
      name: 'Google Drive',
      icon: HardDrive,
      description: 'Cloud backup JSON & storage',
      location: 'Settings > Data Backup',
      targetSection: 'settings',
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      status: isGoogleAuthenticated ? 'Connected' : 'Sign in Required',
    },
    {
      id: 'contacts',
      name: 'Google Contacts',
      icon: Users,
      description: 'People API friend sync & invites',
      location: 'Challenges & Community',
      targetSection: 'challenges',
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      status: isGoogleAuthenticated ? 'Connected' : 'Sign in Required',
    },
    {
      id: 'gmail',
      name: 'Gmail',
      icon: Mail,
      description: 'Daily habit reports & HTML invites',
      location: 'Daily Reports & Community',
      targetSection: 'dashboard',
      color: 'text-red-500 bg-red-500/10 border-red-500/20',
      status: isGoogleAuthenticated ? 'Connected' : 'Sign in Required',
    },
    {
      id: 'maps',
      name: 'Google Maps',
      icon: MapPin,
      description: 'Gyms, parks & movement locator',
      location: 'Habit Places View',
      targetSection: 'maps',
      color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
      status: 'Connected', // Maps JS API key active
    },
    {
      id: 'keep',
      name: 'Google Keep',
      icon: BookOpen,
      description: 'Reflection notes & checklist export',
      location: 'Daily Journal Widget',
      targetSection: 'dashboard',
      color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
      status: 'Connected',
    },
    {
      id: 'chat',
      name: 'Google Chat Spaces',
      icon: MessageSquare,
      description: 'Accountability spaces & milestone sharing',
      location: 'Community & Chat Spaces',
      targetSection: 'chat',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      status: isGoogleAuthenticated ? 'Connected' : 'Sign in Required',
    },
    {
      id: 'meet',
      name: 'Google Meet',
      icon: Video,
      description: 'Live habit standups & video co-working',
      location: 'Meet Live Sync',
      targetSection: 'meet',
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      status: isGoogleAuthenticated ? 'Connected' : 'Sign in Required',
    },
  ];

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Connected Google Workspace Services
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-3xs font-mono font-bold">
                Ecosystem Hub
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Unified status monitor across Calendar, Chat, Contacts, Drive, Gmail, Keep, Maps, Meet, Sheets & Tasks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isGoogleAuthenticated ? (
            <button
              onClick={() => handleGoogleLogin({ withWorkspaceScopes: true })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Connect Google Account</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleGrantPermissions}
                disabled={isAuthorizing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAuthorizing ? 'animate-spin' : ''}`} />
                <span>Verify Permissions</span>
              </button>
              <button
                onClick={() => setIsWorkspaceModalOpen(true)}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                <span>Launch Suite Manager</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid of 8 Services */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {services.map((srv) => {
          const Icon = srv.icon;
          const isOk = srv.status === 'Connected';

          return (
            <div
              key={srv.id}
              onClick={() => setCurrentSection(srv.targetSection)}
              className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className={`p-2 rounded-xl border ${srv.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-mono font-bold ${
                      isOk
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isOk ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {srv.status}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-2.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {srv.name}
                </h4>
                <p className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  {srv.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-3xs text-slate-400 font-medium">
                <span>{srv.location}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
