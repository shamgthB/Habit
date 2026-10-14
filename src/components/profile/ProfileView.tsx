import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Edit2,
  Zap,
  Flame,
  CheckCircle2,
  Trophy,
  Calendar,
  Sparkles,
  Mail,
  LogOut,
  LogIn,
  Check,
  QrCode,
  Camera,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Briefcase,
  ExternalLink,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  KeyRound,
} from 'lucide-react';
import { getLevelForXp } from '../../utils/calculations';
import { ConnectedServicesWidget } from '../workspace/ConnectedServicesWidget';
import { ProfileEditForm } from './ProfileEditForm';
import { ProfileQRCodeModal } from './ProfileQRCodeModal';
import { QRScannerModal } from './QRScannerModal';
import { AuthModal } from '../auth/AuthModal';

export const ProfileView: React.FC = () => {
  const {
    profile,
    updateProfile,
    globalStreak,
    achievements,
    logs,
    googleUser,
    isGoogleAuthenticated,
    handleGoogleLogin,
    handleGoogleLogout,
    handleOtpAuthSuccess,
    setCurrentSection,
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const levelInfo = getLevelForXp(profile.xp);
  const totalCompletedHabits = logs.filter((l) => l.completed).length;

  const displayName = profile.fullName || profile.name || googleUser?.displayName || 'Alex Rivera';
  const displayUsername = profile.username ? (profile.username.startsWith('@') ? profile.username : `@${profile.username}`) : '@alex_rivera';
  const displayAvatar =
    profile.avatarUrl ||
    profile.avatar ||
    googleUser?.photoURL ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

  const gChatEmail = profile.googleChatEmail || profile.email || googleUser?.email || 'alex.rivera@gmail.com';
  const gChatUrl = `https://mail.google.com/chat/u/0/#chat/dm/${encodeURIComponent(gChatEmail)}`;

  const handleProfileSaveSuccess = (updated: any) => {
    updateProfile(updated);
    setIsEditing(false);
  };

  const handleAuthSuccess = (authUser: any) => {
    handleOtpAuthSuccess(authUser);
    setIsAuthModalOpen(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header with Quick Profile Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            User Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage identity, verified credentials, QR profile cards, and Google Chat connection
          </p>
        </div>

        {/* Action Buttons: QR Code, QR Scanner, OTP Auth */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Generate Profile QR Code"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Generate QR</span>
          </button>

          <button
            onClick={() => setIsScanModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            title="Scan In-App QR Code"
          >
            <Camera className="w-3.5 h-3.5 text-purple-500" />
            <span>Scan QR</span>
          </button>

          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            title="Gmail OTP Verification"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
            <span>OTP Auth</span>
          </button>
        </div>
      </div>

      {/* Profile Edit Form Component (if active) */}
      {isEditing ? (
        <ProfileEditForm
          initialProfile={profile}
          onSaveSuccess={handleProfileSaveSuccess}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        /* Main Profile Identity Card */
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className="relative">
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-24 h-24 rounded-3xl object-cover ring-4 ring-emerald-500/20 shadow-md"
                />
                <span
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs"
                  title="Verified Account"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                    {displayName}
                  </h2>
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                    {displayUsername}
                  </span>
                  {profile.isEmailVerified !== false && (
                    <span className="text-3xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Email Verified
                    </span>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                    {profile.bio}
                  </p>
                )}

                {/* Badges: Occupation, Location, Level */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-2xs text-slate-500 dark:text-slate-400">
                  {profile.occupation && (
                    <span className="flex items-center gap-1 font-medium">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {profile.occupation}
                    </span>
                  )}

                  {profile.location && (
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {profile.location}
                    </span>
                  )}

                  <span className="flex items-center gap-1 font-mono text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {new Date(profile.joinedDate).toLocaleDateString()}
                  </span>

                  <span className="font-bold text-purple-600 dark:text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded-md">
                    Lv.{levelInfo.level} {levelInfo.title}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Profile Button */}
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer self-center md:self-auto shrink-0"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Social Links Row & Google Chat Row */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Social Accounts */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                Socials:
              </span>
              {profile.socialLinks?.instagram ? (
                <a
                  href={profile.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 text-2xs font-semibold hover:bg-pink-500/20 transition-colors"
                >
                  <Instagram className="w-3 h-3" />
                  Instagram
                </a>
              ) : null}

              {profile.socialLinks?.twitter ? (
                <a
                  href={profile.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 text-2xs font-semibold hover:bg-sky-500/20 transition-colors"
                >
                  <Twitter className="w-3 h-3" />
                  Twitter (X)
                </a>
              ) : null}

              {profile.socialLinks?.facebook ? (
                <a
                  href={profile.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-2xs font-semibold hover:bg-blue-500/20 transition-colors"
                >
                  <Facebook className="w-3 h-3" />
                  Facebook
                </a>
              ) : null}

              {profile.socialLinks?.youtube ? (
                <a
                  href={profile.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-2xs font-semibold hover:bg-red-500/20 transition-colors"
                >
                  <Youtube className="w-3 h-3" />
                  YouTube
                </a>
              ) : null}

              {(!profile.socialLinks || !Object.values(profile.socialLinks).some(Boolean)) && (
                <span className="text-2xs text-slate-400 italic">No social accounts linked</span>
              )}
            </div>

            {/* Google Chat Connection Link */}
            <div className="flex items-center gap-2">
              <a
                href={gChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setCurrentSection('chat')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-2xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Message on Google Chat
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Google Account Authentication Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Google Workspace & Chat</h3>
              <span
                className={`text-3xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  isGoogleAuthenticated
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isGoogleAuthenticated ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                {isGoogleAuthenticated ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isGoogleAuthenticated && googleUser?.email
                ? `Signed in as ${googleUser.email} • Google Chat Spaces enabled`
                : 'Connect your Google account for Google Chat, Meet, Calendar, Tasks, Keep, and Sheets sync.'}
            </p>
          </div>
        </div>

        {isGoogleAuthenticated ? (
          <button
            onClick={handleGoogleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        ) : (
          <button
            onClick={() => handleGoogleLogin()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign in with Google</span>
          </button>
        )}
      </div>

      {/* Lifetime Stats Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
          <Zap className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {profile.xp}
          </span>
          <span className="block text-3xs font-bold uppercase text-slate-400 mt-1">Total XP Earned</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {totalCompletedHabits}
          </span>
          <span className="block text-3xs font-bold uppercase text-slate-400 mt-1">Completed Habits</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
          <Flame className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {globalStreak.bestStreak}d
          </span>
          <span className="block text-3xs font-bold uppercase text-slate-400 mt-1">Longest Streak</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
          <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {achievements.filter((a) => a.unlockedAt).length}
          </span>
          <span className="block text-3xs font-bold uppercase text-slate-400 mt-1">Unlocked Badges</span>
        </div>
      </div>

      {/* Connected Google Workspace Ecosystem Widget */}
      <ConnectedServicesWidget />

      {/* MODALS */}
      <ProfileQRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        user={profile}
        onOpenChat={() => {
          setIsQrModalOpen(false);
          setCurrentSection('chat');
        }}
      />

      <QRScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onOpenChatWithUser={(email) => {
          setIsScanModalOpen(false);
          setCurrentSection('chat');
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
};
