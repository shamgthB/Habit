import { getAccessToken, requestWorkspaceAccess } from './authService';

export interface GoogleChatSpace {
  name: string; // e.g. "spaces/AAAAAAAAAAA"
  displayName?: string;
  spaceType: 'SPACE' | 'GROUP_CHAT' | 'DIRECT_MESSAGE';
  spaceDetails?: {
    description?: string;
    guidelines?: string;
  };
  isSample?: boolean;
}

export interface GoogleChatMessage {
  name: string; // e.g. "spaces/AAA/messages/BBB"
  text: string;
  createTime: string;
  sender?: {
    name?: string;
    displayName?: string;
    avatarUrl?: string;
    type?: string;
  };
}

export const CLOUD_CONSOLE_CHAT_CONFIG_URL =
  'https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat?project=zany-rigging-77dgj';

// Sample fallback spaces for immediate testing or demo environments
export const SAMPLE_CHAT_SPACES: GoogleChatSpace[] = [
  {
    name: 'spaces/sample-accountability',
    displayName: 'AuraHabit Accountability Circle',
    spaceType: 'SPACE',
    spaceDetails: {
      description: 'Daily consistency check-ins, streak celebrations, and habit advice',
    },
    isSample: true,
  },
  {
    name: 'spaces/sample-morning-club',
    displayName: '5 AM Morning Routine Sprint',
    spaceType: 'SPACE',
    spaceDetails: {
      description: 'Morning meditation, running, hydration, and deep work accountability',
    },
    isSample: true,
  },
];

export const SAMPLE_CHAT_MESSAGES: Record<string, GoogleChatMessage[]> = {
  'spaces/sample-accountability': [
    {
      name: 'spaces/sample-accountability/messages/1',
      text: 'Welcome to the AuraHabit Accountability Space! Share your daily streak accomplishments and celebrate milestones here. 🚀',
      createTime: new Date(Date.now() - 3600000 * 2).toISOString(),
      sender: {
        displayName: 'AuraHabit Bot',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
      },
    },
    {
      name: 'spaces/sample-accountability/messages/2',
      text: '🎉 Just logged my 24-day streak! Completed morning workout and 20 mins reading today.',
      createTime: new Date(Date.now() - 3600000).toISOString(),
      sender: {
        displayName: 'Sarah Chen',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
      },
    },
  ],
};

/**
 * Parses Google Chat API specific errors (e.g. 404 App Not Configured, 403 Consumer Account)
 */
export const parseChatApiError = (status: number, errJson: any): Error => {
  const errMsg = (errJson?.error?.message || '').toLowerCase();

  if (status === 404 || errMsg.includes('chat app not found') || errMsg.includes('not configured')) {
    return new Error(
      `Google Chat app not found. To use live Google Chat spaces, turn on the Chat API and configure the app in the Google Cloud Console (Project: zany-rigging-77dgj).`
    );
  }

  if (
    status === 403 &&
    (errMsg.includes('consumer') ||
      errMsg.includes('workspace') ||
      errMsg.includes('unsupported') ||
      errMsg.includes('access_denied'))
  ) {
    return new Error(
      `Google Chat user authentication requires a Google Workspace (Business or Enterprise) account. Standard consumer @gmail.com accounts are not supported by the Google Chat API.`
    );
  }

  return new Error(errJson?.error?.message || `Google Chat request failed (HTTP ${status})`);
};

/**
 * Fetch spaces the user belongs to from Google Chat API
 */
export const listChatSpaces = async (): Promise<{
  spaces: GoogleChatSpace[];
  isRealApiSuccess: boolean;
  notice?: string;
}> => {
  let token = await getAccessToken();
  if (!token) {
    try {
      token = await requestWorkspaceAccess();
    } catch {
      return {
        spaces: SAMPLE_CHAT_SPACES,
        isRealApiSuccess: false,
        notice: 'Sign in with Google to query live Google Chat spaces.',
      };
    }
  }

  try {
    const res = await fetch('https://chat.googleapis.com/v1/spaces?pageSize=50', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const parsedErr = parseChatApiError(res.status, errJson);
      console.warn('Google Chat list spaces error:', parsedErr.message);
      return {
        spaces: SAMPLE_CHAT_SPACES,
        isRealApiSuccess: false,
        notice: parsedErr.message,
      };
    }

    const data = await res.json();
    const liveSpaces: GoogleChatSpace[] = data.spaces || [];

    if (liveSpaces.length === 0) {
      return {
        spaces: SAMPLE_CHAT_SPACES,
        isRealApiSuccess: true,
        notice: 'No existing spaces found in your Google Workspace. Showing sample accountability spaces below.',
      };
    }

    return {
      spaces: liveSpaces,
      isRealApiSuccess: true,
    };
  } catch (netErr: any) {
    console.warn('Network issue fetching Google Chat spaces:', netErr);
    return {
      spaces: SAMPLE_CHAT_SPACES,
      isRealApiSuccess: false,
      notice: netErr.message || 'Could not connect to Google Chat API.',
    };
  }
};

/**
 * Create a new Google Chat Space
 */
export const createChatSpace = async (
  displayName: string,
  description?: string
): Promise<GoogleChatSpace> => {
  let token = await getAccessToken();
  if (!token) {
    try {
      token = await requestWorkspaceAccess();
    } catch {
      throw new Error('Please sign in to Google to create a Chat Space.');
    }
  }

  const payload = {
    spaceType: 'SPACE',
    displayName,
    spaceDetails: {
      description: description || 'AuraHabit Daily Accountability & Habit Tracking Space',
    },
  };

  const res = await fetch('https://chat.googleapis.com/v1/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw parseChatApiError(res.status, errJson);
  }

  return await res.json();
};

/**
 * Fetch messages from a Google Chat Space
 */
export const listSpaceMessages = async (spaceName: string): Promise<GoogleChatMessage[]> => {
  if (spaceName.startsWith('spaces/sample-')) {
    return SAMPLE_CHAT_MESSAGES[spaceName] || [];
  }

  const token = await getAccessToken();
  if (!token) return [];

  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=25`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    return SAMPLE_CHAT_MESSAGES['spaces/sample-accountability'] || [];
  }

  const data = await res.json();
  return data.messages || [];
};

/**
 * Send a message into a Google Chat Space
 */
export const sendChatMessage = async (
  spaceName: string,
  text: string
): Promise<GoogleChatMessage> => {
  if (!text.trim()) {
    throw new Error('Message text cannot be empty.');
  }

  // Handle sample space locally for testing
  if (spaceName.startsWith('spaces/sample-')) {
    const newMsg: GoogleChatMessage = {
      name: `${spaceName}/messages/${Date.now()}`,
      text: text.trim(),
      createTime: new Date().toISOString(),
      sender: {
        displayName: 'You',
      },
    };
    if (!SAMPLE_CHAT_MESSAGES[spaceName]) {
      SAMPLE_CHAT_MESSAGES[spaceName] = [];
    }
    SAMPLE_CHAT_MESSAGES[spaceName].push(newMsg);
    return newMsg;
  }

  let token = await getAccessToken();
  if (!token) {
    try {
      token = await requestWorkspaceAccess();
    } catch {
      throw new Error('Please sign in to Google to post to Chat.');
    }
  }

  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: text.trim() }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw parseChatApiError(res.status, errJson);
  }

  return await res.json();
};

/**
 * Post an automated habit streak check-in card into a Google Chat Space
 */
export const shareHabitMilestoneToChat = async (
  spaceName: string,
  userName: string,
  lifeScore: number,
  streak: number,
  completedHabitsCount: number,
  totalHabitsCount: number
): Promise<GoogleChatMessage> => {
  const text =
    `🔥 *AuraHabit Daily Check-in & Milestone*\n\n` +
    `👤 *${userName}* has completed *${completedHabitsCount}/${totalHabitsCount} habits* today!\n` +
    `⭐ *Life Score:* ${lifeScore}/100\n` +
    `⚡ *Consistency Streak:* ${streak} consecutive days\n\n` +
    `Keep up the momentum! Let's conquer tomorrow together. 💪`;

  return await sendChatMessage(spaceName, text);
};
