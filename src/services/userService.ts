import { UserProfile, QrProfilePayload, ScannedUserProfile } from '../types';

const AUTH_TOKEN_KEY = 'aura_auth_token';
const CURRENT_USER_ID_KEY = 'aura_current_user_id';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_ID_KEY);
  } catch {
    // ignore
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * 1. Check Username Availability
 */
export async function checkUsernameAvailability(username: string): Promise<{
  available: boolean;
  valid: boolean;
  reason?: string;
  message?: string;
}> {
  if (!username.trim()) {
    return { available: false, valid: false, reason: 'Username cannot be blank' };
  }

  try {
    const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(username.trim().toLowerCase())}`);
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { available: false, valid: false, reason: 'Network error checking username availability.' };
  }
}

/**
 * 2. Send 6-Digit Email OTP
 */
export async function sendEmailOtp(email: string): Promise<{
  success: boolean;
  message: string;
  isSandbox?: boolean;
  retryAfterMinutes?: number;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.error || 'Failed to dispatch verification code.',
        error: data.error,
        retryAfterMinutes: data.retryAfterMinutes,
      };
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error sending verification code.',
      error: err.message,
    };
  }
}

/**
 * 3. Verify OTP and complete login / registration
 */
export async function verifyEmailOtp(params: {
  email: string;
  otp: string;
  username?: string;
  fullName?: string;
  password?: string;
}): Promise<{
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
  isNewUser?: boolean;
  error?: string;
  attemptsRemaining?: number;
}> {
  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Verification failed.',
        attemptsRemaining: data.attemptsRemaining,
      };
    }

    if (data.token) {
      setAuthToken(data.token);
    }
    if (data.user?.id) {
      try {
        localStorage.setItem(CURRENT_USER_ID_KEY, data.user.id);
      } catch {
        // ignore
      }
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error verifying code.',
    };
  }
}

/**
 * 3b. Sign In with Email & Password
 */
export async function loginWithPassword(params: {
  email: string;
  password: string;
}): Promise<{
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/login-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Invalid email or password.',
      };
    }

    if (data.token) {
      setAuthToken(data.token);
    }
    if (data.user?.id) {
      try {
        localStorage.setItem(CURRENT_USER_ID_KEY, data.user.id);
      } catch {}
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error logging in.',
    };
  }
}

/**
 * 3c. Zero-Config One-Click Auto-Login (Instant sandbox test)
 */
export async function autoLoginDemo(params?: {
  email?: string;
  username?: string;
  fullName?: string;
}): Promise<{
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/auto-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Failed to auto-login demo account.',
      };
    }

    if (data.token) {
      setAuthToken(data.token);
    }
    if (data.user?.id) {
      try {
        localStorage.setItem(CURRENT_USER_ID_KEY, data.user.id);
      } catch {}
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error during auto-login.',
    };
  }
}

/**
 * 3d. Fetch Sandbox Inbox Emails (Simulated inbox for zero-config testing)
 */
export async function fetchSandboxEmails(email?: string): Promise<{
  success: boolean;
  emails: Array<{
    id: string;
    to: string;
    subject: string;
    otpCode: string;
    text: string;
    html: string;
    sentAt: number;
  }>;
}> {
  try {
    const url = email
      ? `/api/auth/sandbox-inbox?email=${encodeURIComponent(email.trim().toLowerCase())}`
      : '/api/auth/sandbox-inbox';
    const res = await fetch(url);
    const data = await res.json();
    return {
      success: !!data.success,
      emails: data.emails || [],
    };
  } catch {
    return { success: false, emails: [] };
  }
}

/**
 * 4. Fetch User Profile
 */
export async function fetchServerUserProfile(userId?: string): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const url = userId ? `/api/users/profile?userId=${encodeURIComponent(userId)}` : '/api/users/profile';
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 5. Update Profile Details & Social Links
 */
export async function updateServerUserProfile(updates: Partial<UserProfile>): Promise<{
  success: boolean;
  user?: any;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to update profile' };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 6. Upload Profile Avatar (Validates PNG, JPG, WEBP, max 5MB)
 */
export async function uploadServerAvatar(avatarBase64: string): Promise<{
  success: boolean;
  avatarUrl?: string;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/users/avatar', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ avatar: avatarBase64 }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to upload avatar' };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 7. Generate Profile QR Payload
 */
export async function fetchServerQrPayload(userId?: string): Promise<{
  success: boolean;
  payload?: QrProfilePayload;
  error?: string;
}> {
  try {
    const url = userId ? `/api/qr/generate?userId=${encodeURIComponent(userId)}` : '/api/qr/generate';
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 8. Verify QR Code Payload
 */
export async function verifyServerQrPayload(payload: any): Promise<{
  valid: boolean;
  user?: ScannedUserProfile;
  error?: string;
  message?: string;
}> {
  try {
    const res = await fetch('/api/qr/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      valid: false,
      error: 'Network failure verifying QR Code: ' + err.message,
    };
  }
}
