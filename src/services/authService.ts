import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import firebaseConfigFile from '../../firebase-applet-config.json';

// Allow runtime environment variables or fallback to project firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigFile.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigFile.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigFile.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigFile.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigFile.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigFile.appId,
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Explicitly enable persistent authentication state in Firebase Auth (browserLocalPersistence)
try {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Firebase setPersistence notice:', err);
  });
} catch (err) {
  console.warn('Could not set browserLocalPersistence:', err);
}

import { getFirestore, doc, setDoc } from 'firebase/firestore';

export const db = getFirestore(app);

// Workspace sensitive scopes (for Google Sheets, Drive, Gmail, Calendar, Tasks, Contacts, Chat, Meet)
export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/contacts.other.readonly',
  'https://www.googleapis.com/auth/user.emails.read',
  'https://www.googleapis.com/auth/user.phonenumbers.read',
  'https://www.googleapis.com/auth/chat.spaces',
  'https://www.googleapis.com/auth/chat.spaces.readonly',
  'https://www.googleapis.com/auth/chat.spaces.create',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/chat.messages.create',
  'https://www.googleapis.com/auth/chat.messages.readonly',
  'https://www.googleapis.com/auth/chat.memberships',
  'https://www.googleapis.com/auth/chat.memberships.readonly',
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/meetings.space.readonly',
  'https://www.googleapis.com/auth/meetings.space.settings',
];

/**
 * Saves or updates registered user in Firestore for contact discovery
 */
export const syncUserProfileToFirestore = async (
  user: User,
  extra: { streak?: number; lifeScore?: number } = {}
) => {
  if (!user || !user.uid) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: (user.email || '').toLowerCase().trim(),
        displayName: user.displayName || user.email?.split('@')[0] || 'Habit Builder',
        photoURL: user.photoURL || '',
        streak: extra.streak ?? 1,
        lifeScore: extra.lifeScore ?? 85,
        lastActive: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync user to Firestore:', err);
  }
};

// Storage keys for robust session persistence across page refreshes
const STORAGE_ACCESS_TOKEN_KEY = 'google_access_token';
const STORAGE_AUTH_USER_KEY = 'aurahabit_auth_user';
const STORAGE_AUTH_ACTIVE_KEY = 'aurahabit_auth_active';

// 1. Standard Provider: uses basic non-sensitive scopes (openid, profile, email).
export const basicProvider = new GoogleAuthProvider();
basicProvider.setCustomParameters({
  prompt: 'select_account',
});

// 2. Workspace Provider: contains sensitive scopes for Drive, Sheets, Gmail, etc.
export const workspaceProvider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  workspaceProvider.addScope(scope);
});
workspaceProvider.setCustomParameters({
  prompt: 'select_account',
});

// Cache access token in memory with localStorage + sessionStorage backup
let cachedAccessToken: string | null = null;
try {
  cachedAccessToken =
    localStorage.getItem(STORAGE_ACCESS_TOKEN_KEY) ||
    sessionStorage.getItem(STORAGE_ACCESS_TOKEN_KEY);
} catch {
  // Ignore storage access errors
}

export interface CachedUserSession {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export const getCachedAuthUser = (): CachedUserSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const isCachedAuthActive = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_AUTH_ACTIVE_KEY) === 'true';
  } catch {
    return false;
  }
};

const persistToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      localStorage.setItem(STORAGE_ACCESS_TOKEN_KEY, token);
      sessionStorage.setItem(STORAGE_ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(STORAGE_ACCESS_TOKEN_KEY);
    }
  } catch {}
};

const persistUser = (user: User | null) => {
  try {
    if (user) {
      const sessionData: CachedUserSession = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
      localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(sessionData));
      localStorage.setItem(STORAGE_AUTH_ACTIVE_KEY, 'true');
    } else {
      localStorage.removeItem(STORAGE_AUTH_USER_KEY);
      localStorage.removeItem(STORAGE_AUTH_ACTIVE_KEY);
    }
  } catch {}
};

export interface ParsedAuthError {
  isAccessDenied: boolean;
  isUnauthorizedDomain: boolean;
  isPopupBlocked: boolean;
  isPopupClosed: boolean;
  code: string;
  title: string;
  message: string;
  actionableStep: string;
  consoleHelpSteps: string[];
  rawMessage: string;
}

/**
 * Parses Firebase and Google OAuth errors into structured, user-friendly details.
 */
export const parseAuthError = (err: any): ParsedAuthError => {
  const errMsg = (err?.message || '').toLowerCase();
  const errCode = (err?.code || '').toLowerCase();
  const customDataStr = JSON.stringify(err?.customData || '').toLowerCase();

  const isAccessDenied =
    errCode.includes('access-denied') ||
    errMsg.includes('403') ||
    errMsg.includes('access_denied') ||
    errMsg.includes('verification process') ||
    errMsg.includes('not completed the google verification') ||
    errMsg.includes('developer-approved test users') ||
    errMsg.includes('access denied') ||
    customDataStr.includes('access_denied') ||
    customDataStr.includes('403');

  const isUnauthorizedDomain =
    errCode.includes('unauthorized-domain') ||
    errMsg.includes('unauthorized domain') ||
    errMsg.includes('auth/unauthorized-domain');

  const isPopupBlocked =
    errCode.includes('popup-blocked') ||
    errMsg.includes('popup blocked');

  const isPopupClosed =
    errCode.includes('popup-closed-by-user') ||
    errCode.includes('cancelled-popup-request') ||
    errCode.includes('popup_closed') ||
    errMsg.includes('popup-closed-by-user') ||
    errMsg.includes('popup closed') ||
    errMsg.includes('closed by user') ||
    errMsg.includes('cancelled');

  if (isAccessDenied) {
    return {
      isAccessDenied: true,
      isUnauthorizedDomain: false,
      isPopupBlocked: false,
      isPopupClosed: false,
      code: 'auth/access_denied_testing_mode',
      title: 'Google OAuth 403: Access Denied',
      message:
        'Google blocked the popup because your Google Cloud project is in "Testing" mode or has not completed Google App Verification for sensitive permissions.',
      actionableStep:
        'Add your Google email under "Test users" in Google Cloud Console > APIs & Services > OAuth consent screen, or switch the app Publishing status to "In production".',
      consoleHelpSteps: [
        '1. Go to Google Cloud Console (console.cloud.google.com) > APIs & Services > OAuth consent screen.',
        '2. Under "Test users", click "+ ADD USERS" and enter your Google email address.',
        '3. If you want any external user to sign in without being on the test list, click "PUBLISH APP" to switch Publishing status to "In production".',
        '4. In Firebase Console > Authentication > Settings > Authorized Domains, verify your deployed domain is listed.',
      ],
      rawMessage: err?.message || '403: access_denied',
    };
  }

  if (isUnauthorizedDomain) {
    return {
      isAccessDenied: false,
      isUnauthorizedDomain: true,
      isPopupBlocked: false,
      isPopupClosed: false,
      code: 'auth/unauthorized-domain',
      title: 'Firebase Unauthorized Domain',
      message:
        'This domain is not authorized in Firebase Authentication.',
      actionableStep:
        'Add your current web domain to Firebase Console > Authentication > Settings > Authorized Domains.',
      consoleHelpSteps: [
        '1. Go to Firebase Console > Your Project > Authentication > Settings tab.',
        '2. Select "Authorized domains" and click "Add domain".',
        '3. Enter your deployed hostname (e.g. shamgtb.github.io).',
      ],
      rawMessage: err?.message || 'auth/unauthorized-domain',
    };
  }

  if (isPopupBlocked) {
    return {
      isAccessDenied: false,
      isUnauthorizedDomain: false,
      isPopupBlocked: true,
      isPopupClosed: false,
      code: 'auth/popup-blocked',
      title: 'Popup Window Blocked',
      message: 'The Google sign-in popup was blocked by your web browser.',
      actionableStep: 'Please allow popups for this site in your browser URL bar and try again.',
      consoleHelpSteps: ['Check your browser URL bar for the blocked popup icon and select "Always allow popups".'],
      rawMessage: err?.message || 'auth/popup-blocked',
    };
  }

  if (isPopupClosed) {
    return {
      isAccessDenied: false,
      isUnauthorizedDomain: false,
      isPopupBlocked: false,
      isPopupClosed: true,
      code: 'auth/popup-closed-by-user',
      title: 'Sign In Cancelled',
      message: 'The Google sign-in window was closed before completing authentication.',
      actionableStep: 'Click "Sign in with Google" again and select your account.',
      consoleHelpSteps: [],
      rawMessage: err?.message || 'auth/popup-closed-by-user',
    };
  }

  return {
    isAccessDenied: false,
    isUnauthorizedDomain: false,
    isPopupBlocked: false,
    isPopupClosed: false,
    code: errCode || 'auth/unknown',
    title: 'Sign In Failed',
    message: err?.message || 'Could not complete Google sign-in. Please try again.',
    actionableStep: 'Check your internet connection or use "Continue as Guest" to test immediately.',
    consoleHelpSteps: [],
    rawMessage: err?.message || 'Unknown authentication error',
  };
};

/**
 * Initializes persistent Firebase Authentication listener on app start.
 */
export const initAuth = (
  onAuthChange: (user: User | null, token: string | null) => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!cachedAccessToken) {
        try {
          cachedAccessToken =
            localStorage.getItem(STORAGE_ACCESS_TOKEN_KEY) ||
            sessionStorage.getItem(STORAGE_ACCESS_TOKEN_KEY);
        } catch {}
      }
      persistUser(user);
      onAuthChange(user, cachedAccessToken);
    } else {
      // Only clear if auth is definitely null
      persistUser(null);
      persistToken(null);
      onAuthChange(null, null);
    }
  });
};

/**
 * Signs in using Firebase Authentication with GoogleAuthProvider.
 */
export interface GoogleSignInResult {
  user: User | null;
  accessToken: string;
  workspaceGranted: boolean;
  isCancelled?: boolean;
}

/**
 * Signs in using Firebase Authentication with GoogleAuthProvider.
 */
export const googleSignIn = async (
  options: { withWorkspaceScopes?: boolean } = {}
): Promise<GoogleSignInResult> => {
  const targetProvider = options.withWorkspaceScopes ? workspaceProvider : basicProvider;

  try {
    const result = await signInWithPopup(auth, targetProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || '';

    if (token) {
      persistToken(token);
    }
    persistUser(result.user);

    return {
      user: result.user,
      accessToken: token,
      workspaceGranted: !!options.withWorkspaceScopes && !!token,
    };
  } catch (error: any) {
    const parsed = parseAuthError(error);

    // If the user cancelled or closed the popup, handle gracefully
    if (parsed.isPopupClosed) {
      return {
        user: null,
        accessToken: '',
        workspaceGranted: false,
        isCancelled: true,
      };
    }

    // If sensitive workspace scopes were requested and failed with 403 access_denied,
    // gracefully fall back to basic sign-in so user can still enter the app
    if (options.withWorkspaceScopes && parsed.isAccessDenied) {
      console.warn('Workspace sensitive scopes returned 403 access_denied. Falling back to basic Google sign-in...');
      try {
        const fallbackResult = await signInWithPopup(auth, basicProvider);
        const fallbackCred = GoogleAuthProvider.credentialFromResult(fallbackResult);
        const fallbackToken = fallbackCred?.accessToken || '';
        if (fallbackToken) {
          persistToken(fallbackToken);
        }
        persistUser(fallbackResult.user);
        return {
          user: fallbackResult.user,
          accessToken: fallbackToken,
          workspaceGranted: false,
        };
      } catch (fallbackError: any) {
        const fallbackParsed = parseAuthError(fallbackError);
        if (fallbackParsed.isPopupClosed) {
          return {
            user: null,
            accessToken: '',
            workspaceGranted: false,
            isCancelled: true,
          };
        }
        throw fallbackParsed;
      }
    }

    throw parsed;
  }
};

/**
 * Explicitly requests Google Workspace permissions (Sheets, Gmail, Calendar, Tasks).
 */
export const requestWorkspaceAccess = async (): Promise<string | null> => {
  try {
    const result = await signInWithPopup(auth, workspaceProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || '';
    if (token) {
      persistToken(token);
    }
    persistUser(result.user);
    return token;
  } catch (error: any) {
    const parsed = parseAuthError(error);
    if (parsed.isPopupClosed) {
      return null;
    }
    throw parsed;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const stored =
      localStorage.getItem(STORAGE_ACCESS_TOKEN_KEY) ||
      sessionStorage.getItem(STORAGE_ACCESS_TOKEN_KEY);
    if (stored) {
      cachedAccessToken = stored;
      return stored;
    }
  } catch {}
  return null;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
  persistToken(null);
  persistUser(null);
};
