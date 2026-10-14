import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory for persistence
const DATA_DIR = path.resolve(__dirname, '../.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export interface UserSocialLinks {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
}

export interface User {
  id: string; // UUID
  username: string; // Unique, lowercase, indexed
  email: string; // Unique, lowercase, indexed
  isEmailVerified: boolean;
  fullName: string;
  bio: string;
  dob?: string; // YYYY-MM-DD
  gender?: 'Male' | 'Female' | 'Non-Binary' | 'Prefer not to say' | 'Other' | '';
  occupation?: string;
  location?: string;
  avatarUrl: string;
  socialLinks: UserSocialLinks;
  googleChatEmail?: string;
  googleChatSpaceUrl?: string;
  passwordHash?: string; // SHA-256 password hash for email+password credentials
  createdAt: string;
  updatedAt: string;
}

export interface SandboxEmail {
  id: string;
  to: string;
  subject: string;
  otpCode: string;
  html: string;
  text: string;
  sentAt: number;
}

export interface OTPVerification {
  email: string;
  otpHash: string;
  expiresAt: number; // timestamp in ms
  attempts: number; // failed attempts
  resendAttempts: number; // resends within 15min window
  resendWindowStart: number; // timestamp in ms
  lastSentAt: number; // timestamp in ms
}

export interface UserSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export interface QrProfilePayload {
  app: string;
  type: 'USER_PROFILE';
  userId: string;
  username: string;
  gChatId: string;
  checksum: string;
}

const QR_SECRET = process.env.QR_SECRET || 'aura-habit-qr-secret-key-2026';

// Initial seed users so profile lookups and QR verification work out of the box
const DEFAULT_USERS: User[] = [
  {
    id: 'usr_alex_rivera_01',
    username: 'alex_rivera',
    email: 'alex.rivera@gmail.com',
    isEmailVerified: true,
    fullName: 'Alex Rivera',
    bio: 'Product Designer & Habit Architect. Focused on daily deep work and 10k morning steps.',
    dob: '1995-04-18',
    gender: 'Male',
    occupation: 'Senior Product Designer',
    location: 'San Francisco, CA',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    socialLinks: {
      instagram: 'https://instagram.com/alexrivera_design',
      twitter: 'https://x.com/alexrivera',
      facebook: '',
      youtube: 'https://youtube.com/@alexriveradesign',
    },
    googleChatEmail: 'alex.rivera@gmail.com',
    googleChatSpaceUrl: 'https://chat.google.com/room/AAAAvG6J8Xk',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr_sarah_chen_02',
    username: 'sarah_chen',
    email: 'sarah.chen@gmail.com',
    isEmailVerified: true,
    fullName: 'Sarah Chen',
    bio: 'Mindfulness practitioner and AI researcher. Tracking meditation and continuous learning.',
    dob: '1997-09-12',
    gender: 'Female',
    occupation: 'AI Research Scientist',
    location: 'Seattle, WA',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    socialLinks: {
      instagram: 'https://instagram.com/sarahchen.ai',
      twitter: 'https://x.com/sarahchen_ai',
      facebook: '',
      youtube: '',
    },
    googleChatEmail: 'sarah.chen@gmail.com',
    googleChatSpaceUrl: '',
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr_marcus_vance_03',
    username: 'marcus_v',
    email: 'marcus.vance@gmail.com',
    isEmailVerified: true,
    fullName: 'Marcus Vance',
    bio: 'Endurance athlete & software engineer. Building resilient morning routines.',
    dob: '1992-11-03',
    gender: 'Male',
    occupation: 'Lead Systems Architect',
    location: 'Austin, TX',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    socialLinks: {
      instagram: 'https://instagram.com/marcusv_endurance',
      twitter: 'https://x.com/marcusv_tech',
      facebook: '',
      youtube: 'https://youtube.com/@marcusruns',
    },
    googleChatEmail: 'marcus.vance@gmail.com',
    googleChatSpaceUrl: '',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// In-Memory Database store with optional filesystem persistence
class Database {
  private users: Map<string, User> = new Map();
  private usersByUsername: Map<string, string> = new Map(); // username -> id
  private usersByEmail: Map<string, string> = new Map(); // email -> id
  private otps: Map<string, OTPVerification> = new Map(); // email -> OTPVerification
  private sessions: Map<string, UserSession> = new Map(); // token -> UserSession

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        const loaded: User[] = JSON.parse(raw);
        for (const u of loaded) {
          this.indexUser(u);
        }
      } else {
        for (const u of DEFAULT_USERS) {
          this.indexUser(u);
        }
        this.saveUsersToDisk();
      }
    } catch (err) {
      console.warn('Could not initialize file persistence, using in-memory store:', err);
      for (const u of DEFAULT_USERS) {
        this.indexUser(u);
      }
    }
  }

  private indexUser(user: User) {
    this.users.set(user.id, user);
    this.usersByUsername.set(user.username.toLowerCase(), user.id);
    this.usersByEmail.set(user.email.toLowerCase(), user.id);
  }

  private saveUsersToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(USERS_FILE, JSON.stringify(Array.from(this.users.values()), null, 2), 'utf-8');
    } catch (err) {
      console.warn('Failed writing users to disk:', err);
    }
  }

  // --- User Operations ---
  public getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public getUserByUsername(username: string): User | undefined {
    const id = this.usersByUsername.get(username.trim().toLowerCase());
    return id ? this.users.get(id) : undefined;
  }

  public getUserByEmail(email: string): User | undefined {
    const id = this.usersByEmail.get(email.trim().toLowerCase());
    return id ? this.users.get(id) : undefined;
  }

  public getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  public createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): User {
    const id = userData.id || `usr_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();
    const newUser: User = {
      ...userData,
      id,
      username: userData.username.toLowerCase(),
      email: userData.email.toLowerCase(),
      createdAt: now,
      updatedAt: now,
    };

    this.indexUser(newUser);
    this.saveUsersToDisk();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const existing = this.users.get(id);
    if (!existing) return undefined;

    // Handle username change index update
    if (updates.username && updates.username.toLowerCase() !== existing.username) {
      this.usersByUsername.delete(existing.username);
      this.usersByUsername.set(updates.username.toLowerCase(), id);
    }

    // Handle email change index update
    if (updates.email && updates.email.toLowerCase() !== existing.email) {
      this.usersByEmail.delete(existing.email);
      this.usersByEmail.set(updates.email.toLowerCase(), id);
    }

    const updatedUser: User = {
      ...existing,
      ...updates,
      id, // Preserve ID
      updatedAt: new Date().toISOString(),
    };

    this.users.set(id, updatedUser);
    this.saveUsersToDisk();
    return updatedUser;
  }

  // --- OTP Verification Operations ---
  public getOtp(email: string): OTPVerification | undefined {
    return this.otps.get(email.trim().toLowerCase());
  }

  public saveOtp(email: string, otp: string, expiryMinutes = 10): OTPVerification {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = this.otps.get(normalizedEmail);
    const now = Date.now();
    const FIFTEEN_MINUTES = 15 * 60 * 1000;

    let resendAttempts = 1;
    let resendWindowStart = now;

    if (existing) {
      if (now - existing.resendWindowStart < FIFTEEN_MINUTES) {
        resendAttempts = existing.resendAttempts + 1;
        resendWindowStart = existing.resendWindowStart;
      } else {
        resendAttempts = 1;
        resendWindowStart = now;
      }
    }

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const record: OTPVerification = {
      email: normalizedEmail,
      otpHash,
      expiresAt: now + expiryMinutes * 60 * 1000,
      attempts: 0,
      resendAttempts,
      resendWindowStart,
      lastSentAt: now,
    };

    this.otps.set(normalizedEmail, record);
    return record;
  }

  public recordOtpFailedAttempt(email: string): number {
    const record = this.otps.get(email.trim().toLowerCase());
    if (!record) return 0;
    record.attempts += 1;
    this.otps.set(email.trim().toLowerCase(), record);
    return record.attempts;
  }

  public clearOtp(email: string): void {
    this.otps.delete(email.trim().toLowerCase());
  }

  // --- Session Management ---
  public createSession(userId: string): UserSession {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const session: UserSession = {
      token,
      userId,
      createdAt: now,
      expiresAt: now + 30 * 86400000, // 30 days
    };
    this.sessions.set(token, session);
    return session;
  }

  public getSession(token: string): UserSession | undefined {
    const session = this.sessions.get(token);
    if (!session) return undefined;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return undefined;
    }
    return session;
  }

  // --- QR Code Cryptographic Verification ---
  public calculateChecksum(userId: string, username: string): string {
    return crypto
      .createHmac('sha256', QR_SECRET)
      .update(`${userId}:${username.toLowerCase()}:USER_PROFILE`)
      .digest('hex')
      .slice(0, 16);
  }

  public generateQrPayload(user: User): QrProfilePayload {
    const checksum = this.calculateChecksum(user.id, user.username);
    return {
      app: 'AuraHabit',
      type: 'USER_PROFILE',
      userId: user.id,
      username: user.username,
      gChatId: user.googleChatEmail || user.email,
      checksum,
    };
  }

  public verifyQrChecksum(userId: string, username: string, checksum: string): boolean {
    if (!userId || !username || !checksum) return false;
    const expected = this.calculateChecksum(userId, username);
    return crypto.timingSafeEqual(Buffer.from(checksum), Buffer.from(expected));
  }

  // --- Zero-Config Sandbox Inbox ---
  private sandboxEmails: SandboxEmail[] = [];

  public recordSandboxEmail(email: SandboxEmail): void {
    this.sandboxEmails.unshift(email);
    if (this.sandboxEmails.length > 50) {
      this.sandboxEmails.pop();
    }
  }

  public getSandboxEmails(recipient?: string): SandboxEmail[] {
    if (!recipient) return this.sandboxEmails;
    const target = recipient.trim().toLowerCase();
    return this.sandboxEmails.filter((e) => e.to.toLowerCase() === target);
  }

  public getLatestSandboxEmail(recipient?: string): SandboxEmail | undefined {
    if (!recipient) return this.sandboxEmails[0];
    const target = recipient.trim().toLowerCase();
    return this.sandboxEmails.find((e) => e.to.toLowerCase() === target);
  }
}

export const db = new Database();
