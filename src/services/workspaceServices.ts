import { getAccessToken, requestWorkspaceAccess } from './authService';
import { Habit, HabitLog, LifeScoreBreakdown } from '../types';

/**
 * Creates RFC 2822 MIME message with Base64 content transfer encoding
 * and converts to Base64URL (RFC 4648) for Gmail API.
 */
const createMimeEmailPayload = (
  to: string,
  from: string,
  subject: string,
  htmlContent: string
): string => {
  // Safe UTF-8 Base64 subject encoding without deprecated unescape
  const utf8Subject = new TextEncoder().encode(subject);
  let binarySubject = '';
  for (let i = 0; i < utf8Subject.length; i++) {
    binarySubject += String.fromCharCode(utf8Subject[i]);
  }
  const encodedSubject = `=?UTF-8?B?${btoa(binarySubject)}?=`;

  // Safe UTF-8 Base64 HTML body encoding
  const utf8Body = new TextEncoder().encode(htmlContent);
  let binaryBody = '';
  for (let i = 0; i < utf8Body.length; i++) {
    binaryBody += String.fromCharCode(utf8Body[i]);
  }
  const base64Body = btoa(binaryBody);

  const emailLines = [
    `From: ${from || 'me'}`,
    `To: ${to.trim()}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Body,
  ];

  const fullMimeString = emailLines.join('\r\n');

  // Convert full MIME message to Base64URL (RFC 4648) for Gmail REST API
  const utf8Full = new TextEncoder().encode(fullMimeString);
  let binaryFull = '';
  for (let i = 0; i < utf8Full.length; i++) {
    binaryFull += String.fromCharCode(utf8Full[i]);
  }

  return btoa(binaryFull)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// ==========================================
// 1. GMAIL SERVICE
// ==========================================

export interface GmailSendResult {
  id: string;
  threadId: string;
  sentAt: string;
}

export const sendHabitSummaryEmail = async (
  recipientEmail: string,
  userName: string,
  habits: Habit[],
  todayLogs: HabitLog[],
  lifeScore: LifeScoreBreakdown,
  senderEmail?: string
): Promise<GmailSendResult> => {
  if (!recipientEmail || !recipientEmail.trim()) {
    throw new Error('A recipient email address is required.');
  }

  let token = await getAccessToken();
  if (!token) {
    try {
      token = await requestWorkspaceAccess();
    } catch {
      throw new Error('Please sign in with Google and authorize Gmail permissions to send emails.');
    }
  }

  const completedCount = todayLogs.filter((l) => l.completed).length;

  const subject = `AuraHabit Daily Report - Life Score: ${lifeScore.overallScore}/100 (${completedCount}/${habits.length} Habits Done)`;

  const habitRowsHtml = habits
    .map((h) => {
      const log = todayLogs.find((l) => l.habitId === h.id);
      const isDone = log?.completed;
      return `<tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-weight: 600; color: #1e293b;">${h.name}</td>
        <td style="padding: 10px; color: #64748b;">${h.category}</td>
        <td style="padding: 10px; font-weight: bold; color: ${isDone ? '#10b981' : '#f59e0b'};">
          ${isDone ? '✔ Completed' : '⏳ Pending'}
        </td>
      </tr>`;
    })
    .join('');

  const bodyHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: #0f172a; margin-top: 0;">AuraHabit Daily Consistency Report</h2>
      <p style="color: #475569; font-size: 14px;">Hello ${userName || 'there'}, here is your daily habit progress summary.</p>
      
      <div style="background: linear-gradient(135deg, #10b981, #06b6d4); color: white; padding: 16px; border-radius: 12px; margin: 20px 0; text-align: center;">
        <div style="font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Overall Life Score</div>
        <div style="font-size: 36px; font-weight: 800; font-family: monospace;">${lifeScore.overallScore} / 100</div>
        <div style="font-size: 13px; opacity: 0.9;">${completedCount} of ${habits.length} habits completed today</div>
      </div>

      <h3 style="color: #1e293b; margin-top: 24px;">Today's Habit Checklist</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 10px; color: #475569;">Habit</th>
            <th style="padding: 10px; color: #475569;">Category</th>
            <th style="padding: 10px; color: #475569;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${habitRowsHtml}
        </tbody>
      </table>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">Sent securely via AuraHabit Daily Habit Tracker & Gmail API.</p>
    </div>
  `;

  const encodedMessage = createMimeEmailPayload(
    recipientEmail.trim(),
    senderEmail || 'me',
    subject,
    bodyHtml
  );

  let res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  // If token had insufficient scopes (e.g., user authorized before gmail.send was added),
  // prompt for reauthorization with complete scopes and retry once.
  if (res.status === 403 || res.status === 401) {
    const errData = await res.json().catch(() => ({}));
    const errMsg = (errData?.error?.message || '').toLowerCase();
    
    if (errMsg.includes('insufficient') || errMsg.includes('scope') || res.status === 401) {
      console.warn('Gmail API returned scope error, requesting updated workspace token...', errData);
      try {
        token = await requestWorkspaceAccess();
        res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw: encodedMessage }),
        });
      } catch (authErr) {
        throw new Error(
          'Request had insufficient authentication scopes for Gmail. Please grant Gmail send permissions in the Google authorization popup.'
        );
      }
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.error?.message || `Failed to send email (Status: ${res.status})`;
    console.error('Gmail API send error:', err);
    throw new Error(message);
  }

  const data = await res.json();
  return {
    id: data.id,
    threadId: data.threadId,
    sentAt: new Date().toISOString(),
  };
};

// ==========================================
// 2. GOOGLE CALENDAR SERVICE
// ==========================================

export interface CalendarEventPayload {
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
  colorId?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  htmlLink?: string;
}

export const syncHabitToGoogleCalendar = async (
  habit: Habit,
  dateStr: string
): Promise<GoogleCalendarEvent> => {
  let token = await getAccessToken();
  if (!token) {
    try {
      token = await requestWorkspaceAccess();
    } catch {
      throw new Error('Please sign in with Google and authorize Calendar permissions to schedule events.');
    }
  }

  // Construct valid RFC3339 timestamps using local timezone dates
  const [year, month, day] = (dateStr || '').split('-').map(Number);
  const [hours, minutes] = (habit.reminderTime || '08:00').split(':').map(Number);

  const now = new Date();
  const validYear = year || now.getFullYear();
  const validMonth = (month || now.getMonth() + 1) - 1;
  const validDay = day || now.getDate();
  const validHour = !isNaN(hours) ? hours : 8;
  const validMin = !isNaN(minutes) ? minutes : 0;

  const startDate = new Date(validYear, validMonth, validDay, validHour, validMin, 0);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 minutes duration
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Strict RFC3339 formatted ISO strings
  const payload = {
    summary: `[AuraHabit] ${habit.name}`,
    description: `Habit reminder for ${habit.name}.\nTarget: ${habit.targetValue} ${habit.unit}\nCategory: ${habit.category}\nNotes: ${habit.notes || 'None'}`,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: userTimeZone,
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: userTimeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 10 }],
    },
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.error?.message || `Failed to add event to Google Calendar (Status: ${res.status})`;
    throw new Error(message);
  }

  return await res.json();
};

export const fetchUpcomingCalendarEvents = async (): Promise<GoogleCalendarEvent[]> => {
  const token = await getAccessToken();
  if (!token) return [];

  const timeMin = new Date().toISOString();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=10&singleEvents=true&orderBy=startTime`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
};

// ==========================================
// 3. GOOGLE TASKS SERVICE
// ==========================================

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
}

export const syncHabitToGoogleTasks = async (
  habit: Habit,
  dateStr: string
): Promise<GoogleTaskItem> => {
  let token = await getAccessToken();
  if (!token) {
    try {
      token = await requestWorkspaceAccess();
    } catch {
      throw new Error('Please sign in with Google to sync with Google Tasks.');
    }
  }

  const payload = {
    title: `${habit.name} (${habit.targetValue} ${habit.unit})`,
    notes: `Category: ${habit.category}\nPriority: ${habit.priority}\nNotes: ${habit.notes || ''}`,
    due: `${dateStr}T23:59:59Z`,
  };

  const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create task in Google Tasks.');
  }

  return await res.json();
};

export const fetchGoogleTasks = async (): Promise<GoogleTaskItem[]> => {
  const token = await getAccessToken();
  if (!token) return [];

  const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=false&maxResults=20', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
};
