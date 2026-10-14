import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Trophy, Zap, Check, ArrowRight, Sparkles, Clock, Flame, Users, UserPlus, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FriendsContactsTab } from '../social/FriendsContactsTab';
import { GoogleChatView } from '../chat/GoogleChatView';

export const ChallengesView: React.FC = () => {
  const { challenges, joinChallenge, updateChallengeProgress, awardXp, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'challenges' | 'friends' | 'chat'>('challenges');

  const handleClaimReward = (id: string, title: string, xp: number) => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {}

    awardXp(xp, `Claimed reward for challenge: ${title}`);
    addToast({
      type: 'success',
      title: 'Challenge Mastered!',
      message: `Claimed +${xp} XP bonus and permanent badge!`,
      duration: 5000,
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header with Navigation Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {activeTab === 'challenges'
              ? 'Challenges & Quests'
              : activeTab === 'friends'
              ? 'Community & Friends'
              : 'Google Chat Spaces'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {activeTab === 'challenges'
              ? 'Take on weekly and monthly sprints to level up your XP and test your endurance'
              : activeTab === 'friends'
              ? 'Connect with contacts via Google People API, find app peers, and send invites'
              : 'Collaborate in Google Chat spaces, create sprint rooms, and post habit milestones'}
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setActiveTab('challenges')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'challenges'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Quests & Sprints</span>
          </button>

          <button
            onClick={() => setActiveTab('friends')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'friends'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            <span>Friends & Contacts</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
            <span>Google Chat Spaces</span>
          </button>
        </div>
      </div>

      {activeTab === 'friends' ? (
        <FriendsContactsTab />
      ) : activeTab === 'chat' ? (
        <GoogleChatView />
      ) : (
        /* Challenges Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {challenges.map((chal) => {
          const pct = chal.target > 0 ? Math.min(100, Math.round((chal.current / chal.target) * 100)) : 0;
          const isDone = chal.current >= chal.target;

          return (
            <div
              key={chal.id}
              className={`p-6 rounded-3xl border transition-all ${
                chal.completed
                  ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    {chal.badge}
                  </span>
                  <div>
                    <span className="text-3xs font-bold uppercase tracking-wider font-mono text-amber-600 dark:text-amber-400">
                      {chal.type} sprint
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {chal.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1 font-bold font-mono text-xs text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>+{chal.xpReward} XP</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                {chal.description}
              </p>

              {/* Progress Bar */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Goal: {chal.target} {chal.unit}
                  </span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {chal.current} / {chal.target} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1 text-2xs text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Ends: {chal.endDate}</span>
                </div>

                {!chal.joined ? (
                  <button
                    onClick={() => joinChallenge(chal.id)}
                    className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs shadow-xs hover:opacity-90 cursor-pointer"
                  >
                    Join Challenge
                  </button>
                ) : isDone && !chal.completed ? (
                  <button
                    onClick={() => handleClaimReward(chal.id, chal.title, chal.xpReward)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer animate-bounce"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Claim +{chal.xpReward} XP!</span>
                  </button>
                ) : chal.completed ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span>Completed & Claimed</span>
                  </span>
                ) : (
                  <button
                    onClick={() => updateChallengeProgress(chal.id, 1)}
                    className="px-3.5 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold text-xs hover:bg-emerald-500/20 transition-colors cursor-pointer"
                  >
                    +1 Check-in
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};
