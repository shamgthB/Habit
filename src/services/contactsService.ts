import { getAccessToken, requestWorkspaceAccess, db } from './authService';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

export interface GoogleContactPerson {
  resourceName: string;
  displayName: string;
  email: string;
  photoUrl?: string;
  phoneNumber?: string;
  isRegisteredUser?: boolean;
  registeredUser?: RegisteredAppUser;
}

export interface RegisteredAppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  streak?: number;
  lifeScore?: number;
  lastActive?: string;
  bio?: string;
}

// Fallback seed community users so user has an active social experience
export const SAMPLE_COMMUNITY_USERS: RegisteredAppUser[] = [
  {
    uid: 'comm-user-1',
    email: 'sarah.chen.habits@gmail.com',
    displayName: 'Sarah Chen',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    streak: 24,
    lifeScore: 94,
    lastActive: 'Today at 09:30 AM',
    bio: 'Morning runner & deep work enthusiast',
  },
  {
    uid: 'comm-user-2',
    email: 'marcus.rivera.fit@gmail.com',
    displayName: 'Marcus Rivera',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    streak: 18,
    lifeScore: 88,
    lastActive: 'Yesterday',
    bio: 'Strength training & intermittent fasting',
  },
  {
    uid: 'comm-user-3',
    email: 'maya.patel.wellness@gmail.com',
    displayName: 'Maya Patel',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    streak: 42,
    lifeScore: 96,
    lastActive: '2 hours ago',
    bio: 'Mindfulness & daily hydration consistency',
  },
  {
    uid: 'comm-user-4',
    email: 'liam.wright.dev@gmail.com',
    displayName: 'Liam Wright',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    streak: 12,
    lifeScore: 82,
    lastActive: '3 hours ago',
    bio: 'Coding sprints, reading 30 mins daily',
  },
];

/**
 * Fetch contacts from Google People API
 */
export const fetchGoogleContacts = async (): Promise<GoogleContactPerson[]> => {
  let token = await getAccessToken();
  if (!token) {
    try {
      token = await requestWorkspaceAccess();
    } catch {
      throw new Error('Please sign in and authorize Google Contacts access to view your contacts.');
    }
  }

  const endpoint =
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,photos,phoneNumbers&pageSize=100&sortOrder=FIRST_NAME_ASCENDING';

  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const message =
      errorJson.error?.message ||
      `Failed to retrieve contacts from Google People API (Status ${res.status})`;
    throw new Error(message);
  }

  const data = await res.json();
  const rawConnections = data.connections || [];

  const contacts: GoogleContactPerson[] = [];

  for (const item of rawConnections) {
    const primaryName =
      item.names?.find((n: any) => n.metadata?.primary)?.displayName ||
      item.names?.[0]?.displayName ||
      'Unnamed Contact';

    const emailList = item.emailAddresses || [];
    const primaryEmail =
      emailList.find((e: any) => e.metadata?.primary)?.value ||
      emailList[0]?.value ||
      '';

    const photoUrl =
      item.photos?.find((p: any) => p.metadata?.primary)?.url ||
      item.photos?.[0]?.url ||
      undefined;

    const phoneNumber =
      item.phoneNumbers?.find((p: any) => p.metadata?.primary)?.value ||
      item.phoneNumbers?.[0]?.value ||
      undefined;

    // Only include contacts that have an email or valid name
    if (primaryEmail || primaryName !== 'Unnamed Contact') {
      contacts.push({
        resourceName: item.resourceName || `contact-${Math.random()}`,
        displayName: primaryName,
        email: primaryEmail.toLowerCase().trim(),
        photoUrl,
        phoneNumber,
      });
    }
  }

  return contacts;
};

/**
 * Fetches all registered AuraHabit app users from Firestore
 */
export const fetchRegisteredAppUsers = async (): Promise<RegisteredAppUser[]> => {
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);

    const users: RegisteredAppUser[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.email) {
        users.push({
          uid: docSnap.id,
          email: (data.email || '').toLowerCase().trim(),
          displayName: data.displayName || 'Habit Builder',
          photoURL: data.photoURL,
          streak: data.streak || 1,
          lifeScore: data.lifeScore || 85,
          lastActive: data.lastActive,
          bio: data.bio,
        });
      }
    });

    // Merge with sample community members ensuring no duplicates
    const existingEmails = new Set(users.map((u) => u.email));
    SAMPLE_COMMUNITY_USERS.forEach((sample) => {
      if (!existingEmails.has(sample.email)) {
        users.push(sample);
      }
    });

    return users;
  } catch (err) {
    console.warn('Could not query Firestore users, using community pool:', err);
    return SAMPLE_COMMUNITY_USERS;
  }
};

/**
 * Categorize fetched Google Contacts into Friends on App vs. Contacts to Invite
 */
export const categorizeContacts = (
  contacts: GoogleContactPerson[],
  registeredUsers: RegisteredAppUser[]
) => {
  const registeredUserMap = new Map<string, RegisteredAppUser>();
  registeredUsers.forEach((u) => {
    if (u.email) {
      registeredUserMap.set(u.email.toLowerCase().trim(), u);
    }
  });

  const friendsOnApp: (GoogleContactPerson & { registeredUser: RegisteredAppUser })[] = [];
  const contactsToInvite: GoogleContactPerson[] = [];

  const matchedUserEmails = new Set<string>();

  contacts.forEach((contact) => {
    const contactEmail = contact.email.toLowerCase().trim();
    if (contactEmail && registeredUserMap.has(contactEmail)) {
      const matched = registeredUserMap.get(contactEmail)!;
      matchedUserEmails.add(contactEmail);
      friendsOnApp.push({
        ...contact,
        isRegisteredUser: true,
        registeredUser: matched,
      });
    } else {
      contactsToInvite.push({
        ...contact,
        isRegisteredUser: false,
      });
    }
  });

  // Also include registered community users as friends on app
  registeredUsers.forEach((regUser) => {
    if (!matchedUserEmails.has(regUser.email.toLowerCase().trim())) {
      friendsOnApp.push({
        resourceName: `reg-${regUser.uid}`,
        displayName: regUser.displayName,
        email: regUser.email,
        photoUrl: regUser.photoURL,
        isRegisteredUser: true,
        registeredUser: regUser,
      });
    }
  });

  return { friendsOnApp, contactsToInvite };
};

/**
 * Send an email invitation to a contact using Gmail API
 */
export const sendContactInviteEmail = async (
  contactEmail: string,
  contactName: string,
  inviterName: string,
  inviterEmail: string,
  appUrl: string = window.location.origin
): Promise<void> => {
  let token = await getAccessToken();
  if (!token) {
    try {
      token = await requestWorkspaceAccess();
    } catch {
      throw new Error('Please sign in with Google to send invites via Gmail.');
    }
  }

  const subject = `${inviterName} invited you to join AuraHabit!`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 28px; font-weight: 800; color: #10b981; letter-spacing: -0.5px;">Aura<span style="color: #0f172a;">Habit</span></span>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Smart Habit Architecture & Daily Consistency</p>
      </div>
      
      <p style="font-size: 16px; color: #1e293b; line-height: 1.6;">
        Hi <strong>${contactName || 'there'}</strong>,
      </p>

      <p style="font-size: 15px; color: #334155; line-height: 1.6;">
        <strong>${inviterName}</strong> is using AuraHabit to build powerful routines, track streaks, and master daily life scores — and wants to invite you to join their accountability circle!
      </p>

      <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-weight: 600; color: #0f172a; font-size: 14px;">Why join ${inviterName} on AuraHabit?</p>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.6;">
          <li>Seamless Google Workspace Sync (Calendar, Tasks, Keep & Sheets)</li>
          <li>AI Habit Insights powered by Gemini</li>
          <li>Social accountability streaks and shared milestone quests</li>
          <li>Nearby movement & gym finder with Google Maps</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${appUrl}" style="background-color: #10b981; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
          Accept Invitation & Join AuraHabit
        </a>
      </div>

      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        Sent via AuraHabit from ${inviterEmail}. Build the habits of your future self.
      </p>
    </div>
  `;

  // Encode UTF-8 strings safely
  const utf8Subject = new TextEncoder().encode(subject);
  let binarySubject = '';
  for (let i = 0; i < utf8Subject.length; i++) {
    binarySubject += String.fromCharCode(utf8Subject[i]);
  }
  const encodedSubject = `=?UTF-8?B?${btoa(binarySubject)}?=`;

  const utf8Body = new TextEncoder().encode(htmlContent);
  let binaryBody = '';
  for (let i = 0; i < utf8Body.length; i++) {
    binaryBody += String.fromCharCode(utf8Body[i]);
  }
  const base64Body = btoa(binaryBody);

  const emailLines = [
    `From: ${inviterEmail || 'me'}`,
    `To: ${contactEmail.trim()}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Body,
  ];

  const fullMimeString = emailLines.join('\r\n');
  const utf8Full = new TextEncoder().encode(fullMimeString);
  let binaryFull = '';
  for (let i = 0; i < utf8Full.length; i++) {
    binaryFull += String.fromCharCode(utf8Full[i]);
  }

  const rawBase64Url = btoa(binaryFull)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: rawBase64Url }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to send invite email via Gmail API.');
  }
};
