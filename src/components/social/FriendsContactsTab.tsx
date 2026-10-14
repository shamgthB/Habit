import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  UserPlus,
  Mail,
  Send,
  Search,
  Sparkles,
  Flame,
  Award,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Heart,
  Share2,
  ShieldCheck,
  UserCheck,
  MessageSquare,
} from 'lucide-react';
import {
  fetchGoogleContacts,
  fetchRegisteredAppUsers,
  categorizeContacts,
  sendContactInviteEmail,
  GoogleContactPerson,
  RegisteredAppUser,
} from '../../services/contactsService';
import { ConfirmModal } from '../common/ConfirmModal';

export const FriendsContactsTab: React.FC = () => {
  const {
    googleUser,
    isGoogleAuthenticated,
    handleGoogleLogin,
    profile,
    globalStreak,
    addToast,
    awardXp,
    setCurrentSection,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'friends' | 'invite'>('friends');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [friendsOnApp, setFriendsOnApp] = useState<
    (GoogleContactPerson & { registeredUser: RegisteredAppUser })[]
  >([]);
  const [contactsToInvite, setContactsToInvite] = useState<GoogleContactPerson[]>([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);
  const [cheeredUserIds, setCheeredUserIds] = useState<Set<string>>(new Set());
  const [selectedProfileModal, setSelectedProfileModal] = useState<RegisteredAppUser | null>(null);

  // Invite Modal / Dialog State
  const [inviteDialog, setInviteDialog] = useState<{
    isOpen: boolean;
    contact: GoogleContactPerson | null;
  }>({
    isOpen: false,
    contact: null,
  });
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const loadContactsData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch registered app users from Firestore
      const registeredUsers = await fetchRegisteredAppUsers();

      // 2. Fetch Google Contacts if user has access token
      let rawContacts: GoogleContactPerson[] = [];
      try {
        rawContacts = await fetchGoogleContacts();
      } catch (contactErr: any) {
        console.warn('Google Contacts fetch note:', contactErr);
        // If contacts permission not yet granted or no contacts returned,
        // we still populate registered friends from Firestore
      }

      // 3. Categorize into friends on app and contacts to invite
      const { friendsOnApp: matchedFriends, contactsToInvite: toInvite } =
        categorizeContacts(rawContacts, registeredUsers);

      setFriendsOnApp(matchedFriends);
      setContactsToInvite(toInvite);
      setHasLoadedOnce(true);
    } catch (err: any) {
      console.error('Error loading contacts:', err);
      addToast({
        type: 'error',
        title: 'Contacts Sync Error',
        message: err.message || 'Could not synchronize Google Contacts.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContactsData();
  }, [googleUser]);

  // Handle cheer / encouragement
  const handleCheerFriend = (friendId: string, name: string) => {
    if (cheeredUserIds.has(friendId)) return;
    setCheeredUserIds((prev) => new Set(prev).add(friendId));
    awardXp(15, `Cheered friend: ${name}`);
    addToast({
      type: 'success',
      title: `Cheered ${name}! 🎉`,
      message: `Sent motivational vibes and earned +15 XP!`,
    });
  };

  // Handle copy referral link
  const handleCopyReferral = () => {
    const link = `${window.location.origin}?ref=${encodeURIComponent(
      profile.username || googleUser?.email?.split('@')[0] || 'friend'
    )}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
    addToast({
      type: 'success',
      title: 'Invite Link Copied',
      message: 'Share this link anywhere to invite friends to AuraHabit.',
    });
  };

  // Handle send invite via Gmail API
  const handleSendInviteEmail = async (contact: GoogleContactPerson) => {
    if (!contact.email) {
      addToast({
        type: 'warning',
        title: 'No Email Found',
        message: 'This contact does not have an email address.',
      });
      return;
    }

    setIsSendingInvite(true);
    try {
      const inviterName = profile.name || googleUser?.displayName || 'Your Friend';
      const inviterEmail = googleUser?.email || profile.email || 'styshamspx5@gmail.com';
      const inviteUrl = `${window.location.origin}?ref=${encodeURIComponent(
        profile.username || inviterEmail.split('@')[0]
      )}`;

      await sendContactInviteEmail(
        contact.email,
        contact.displayName,
        inviterName,
        inviterEmail,
        inviteUrl
      );

      addToast({
        type: 'success',
        title: 'Invitation Sent via Gmail!',
        message: `Personal invitation delivered to ${contact.displayName} (${contact.email}).`,
      });
      awardXp(20, `Invited contact: ${contact.displayName}`);
      setInviteDialog({ isOpen: false, contact: null });
    } catch (err: any) {
      console.error('Failed to send invite via Gmail:', err);
      // Fallback: offer mailto
      const mailtoSubject = encodeURIComponent(`${profile.name || 'Your friend'} invited you to AuraHabit!`);
      const mailtoBody = encodeURIComponent(
        `Hi ${contact.displayName},\n\nI'm using AuraHabit to track my daily habits and consistency score. Join me here: ${window.location.origin}\n\nCheers!`
      );
      window.open(`mailto:${contact.email}?subject=${mailtoSubject}&body=${mailtoBody}`, '_blank');
      addToast({
        type: 'info',
        title: 'Opened Email Draft',
        message: 'Drafted invitation in your default email client.',
      });
      setInviteDialog({ isOpen: false, contact: null });
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Filtered lists
  const filteredFriends = friendsOnApp.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      f.displayName.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q) ||
      (f.registeredUser?.bio && f.registeredUser.bio.toLowerCase().includes(q))
    );
  });

  const filteredInvites = contactsToInvite.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.displayName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Stats */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Friends & Contacts Hub
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-2xs font-bold uppercase tracking-wider">
                Google People API
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Connect with fellow habit builders and invite contacts to your consistency circle
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            onClick={() => setCurrentSection('chat')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Chat Spaces</span>
          </button>

          <button
            onClick={handleCopyReferral}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors cursor-pointer shadow-xs"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
          </button>

          <button
            onClick={loadContactsData}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Contacts</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Subtabs */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
          <button
            onClick={() => setActiveSubTab('friends')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'friends'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Friends on AuraHabit</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-3xs font-mono font-bold">
              {friendsOnApp.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('invite')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'invite'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-indigo-500" />
            <span>Invite Contacts</span>
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-3xs font-mono font-bold">
              {contactsToInvite.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeSubTab === 'friends'
                ? 'Search friends on app...'
                : 'Search Google contacts to invite...'
            }
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-xs"
          />
        </div>
      </div>

      {/* Content Area */}
      {activeSubTab === 'friends' ? (
        /* Section 1: Friends on AuraHabit */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing {filteredFriends.length} friend{filteredFriends.length === 1 ? '' : 's'} registered in the AuraHabit network
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified App Users
            </span>
          </div>

          {filteredFriends.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No friends found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                {searchQuery
                  ? 'No friends match your search query.'
                  : 'None of your Google Contacts are registered yet. Switch to the "Invite Contacts" tab to invite them!'}
              </p>
              <button
                onClick={() => setActiveSubTab('invite')}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Contacts</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFriends.map((friend) => {
                const reg = friend.registeredUser;
                const isCheered = cheeredUserIds.has(reg.uid);

                return (
                  <div
                    key={friend.resourceName}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            friend.photoUrl ||
                            reg.photoURL ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              friend.displayName
                            )}`
                          }
                          alt={friend.displayName}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500/20"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {friend.displayName}
                            </h4>
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-3xs font-mono font-bold">
                              Member
                            </span>
                          </div>
                          <p className="text-2xs text-slate-400 font-mono mt-0.5">{friend.email}</p>
                          {reg.bio && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                              {reg.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Streak / Life Score Badge */}
                      <div className="flex flex-col items-end gap-1">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-2xs font-bold">
                          <Flame className="w-3.5 h-3.5 fill-current" />
                          <span>{reg.streak || 1}d Streak</span>
                        </div>
                        <span className="text-3xs font-mono text-slate-400">
                          Score: {reg.lifeScore || 85}/100
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-3xs text-slate-400 font-mono">
                        {reg.lastActive ? `Active ${reg.lastActive}` : 'Active recently'}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedProfileModal(reg)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          View Profile
                        </button>

                        <button
                          onClick={() => handleCheerFriend(reg.uid, friend.displayName)}
                          disabled={isCheered}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isCheered
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-default'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isCheered ? 'fill-current' : ''}`} />
                          <span>{isCheered ? 'Cheered!' : 'Cheer (+15 XP)'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Section 2: Contacts to Invite */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing {filteredInvites.length} contact{filteredInvites.length === 1 ? '' : 's'} from your Google Contacts
            </span>
            <span className="text-2xs text-slate-400">
              Invite opens a pre-filled draft via Gmail API with your personal referral link
            </span>
          </div>

          {filteredInvites.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Mail className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {contactsToInvite.length === 0 ? 'No Google Contacts Loaded' : 'No matching contacts'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                {contactsToInvite.length === 0
                  ? 'Click "Sync Contacts" above to load your Google Contacts, or copy your direct invite link to share anywhere.'
                  : 'Try searching with a different name or email.'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={loadContactsData}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Google Contacts</span>
                </button>
                <button
                  onClick={handleCopyReferral}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredInvites.map((contact) => (
                <div
                  key={contact.resourceName}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-500/30 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={
                        contact.photoUrl ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          contact.displayName
                        )}`
                      }
                      alt={contact.displayName}
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {contact.displayName}
                      </h4>
                      <p className="text-3xs text-slate-400 font-mono truncate">
                        {contact.email || contact.phoneNumber || 'No email/phone'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setInviteDialog({ isOpen: true, contact })}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Invite</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Modal */}
      {selectedProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in zoom-in-95">
            <div className="flex items-start gap-4">
              <img
                src={
                  selectedProfileModal.photoURL ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    selectedProfileModal.displayName
                  )}`
                }
                alt={selectedProfileModal.displayName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500"
              />
              <div className="flex-1">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  {selectedProfileModal.displayName}
                </h3>
                <p className="text-xs text-slate-400 font-mono">{selectedProfileModal.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-2xs font-bold flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-current" />
                    {selectedProfileModal.streak || 1}d Streak
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-2xs font-bold">
                    Life Score: {selectedProfileModal.lifeScore || 85}/100
                  </span>
                </div>
              </div>
            </div>

            {selectedProfileModal.bio && (
              <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                "{selectedProfileModal.bio}"
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedProfileModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleCheerFriend(selectedProfileModal.uid, selectedProfileModal.displayName);
                  setSelectedProfileModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
              >
                Send Cheer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Confirmation Modal */}
      {inviteDialog.isOpen && inviteDialog.contact && (
        <ConfirmModal
          isOpen={inviteDialog.isOpen}
          title={`Invite ${inviteDialog.contact.displayName} to AuraHabit?`}
          message={`Send an invitation email via your authorized Gmail account to ${inviteDialog.contact.email || inviteDialog.contact.displayName} containing your referral link and invite details?`}
          confirmText={isSendingInvite ? 'Sending...' : 'Send Invite via Gmail'}
          onConfirm={() => handleSendInviteEmail(inviteDialog.contact!)}
          onCancel={() => setInviteDialog({ isOpen: false, contact: null })}
        />
      )}
    </div>
  );
};
