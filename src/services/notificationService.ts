import {
  Habit,
  HabitLog,
  LifeScoreBreakdown,
  AiNotificationAlert,
  ScheduleRecommendation,
  NotificationTone,
  NotificationChannel,
} from '../types';
import { getAccessToken, requestWorkspaceAccess } from './authService';

/**
 * Audio chime using Web Audio API (zero external assets needed)
 */
export function playNotificationSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Two-tone cheerful chime (E5 -> A5)
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // Ignore audio context restrictions
  }
}

/**
 * Check browser push notification permission status
 */
export function checkPushPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request browser push notification permission
 */
export async function requestPushPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.warn('Failed to request notification permission:', error);
    return 'denied';
  }
}

/**
 * Trigger native browser push notification
 */
export function sendPushNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: unknown;
    onClick?: () => void;
  }
): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notif = new Notification(title, {
      body: options?.body,
      icon: options?.icon || '/favicon.ico',
      badge: options?.badge,
      tag: options?.tag,
      silent: false,
    });

    if (options?.onClick) {
      notif.onclick = () => {
        window.focus();
        options.onClick?.();
        notif.close();
      };
    }

    return true;
  } catch (err) {
    console.warn('Web notification dispatch failed:', err);
    return false;
  }
}

/**
 * Parameters to request an AI-crafted habit nudge
 */
export interface GenerateNudgeParams {
  habit: {
    id: string;
    name: string;
    category: string;
    targetValue: number;
    unit: string;
    reminderTime?: string;
    streak: number;
    priority?: string;
    difficulty?: string;
  };
  userName?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  tone?: NotificationTone;
  triggerType?: 'scheduled_checkin' | 'streak_at_risk' | 'morning_kickoff' | 'evening_winddown' | 'custom_trigger';
}

export interface GeneratedAiNudge {
  title: string;
  body: string;
  callToAction: string;
  scienceTip: string;
  urgencyLevel: 'normal' | 'streak_risk' | 'milestone' | 'celebration';
  habitName: string;
  streakDays: number;
  isAiGenerated: boolean;
  generatedAt: string;
}

/**
 * Call the backend Gemini API to generate an intelligent habit nudge
 */
export async function generateAiHabitNudge(params: GenerateNudgeParams): Promise<GeneratedAiNudge> {
  const { habit, userName = 'Friend', timeOfDay, tone = 'motivational', triggerType = 'scheduled_checkin' } = params;

  // Determine time of day if not supplied
  let computedTimeOfDay = timeOfDay;
  if (!computedTimeOfDay) {
    const hour = new Date().getHours();
    if (hour < 12) computedTimeOfDay = 'morning';
    else if (hour < 17) computedTimeOfDay = 'afternoon';
    else if (hour < 21) computedTimeOfDay = 'evening';
    else computedTimeOfDay = 'night';
  }

  try {
    const res = await fetch('/api/ai-notifications/nudge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        habit: {
          name: habit.name,
          category: habit.category,
          targetValue: habit.targetValue,
          unit: habit.unit,
          reminderTime: habit.reminderTime,
          streak: habit.streak,
          priority: habit.priority,
          difficulty: habit.difficulty,
        },
        user: { name: userName },
        context: {
          timeOfDay: computedTimeOfDay,
          tone,
          triggerType,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.nudge?.title && data?.nudge?.body) {
        return data.nudge as GeneratedAiNudge;
      }
    }
  } catch (error) {
    console.warn('AI notification nudge endpoint failed, using local behavioral engine:', error);
  }

  // Behavioral fallback based on streak and tone
  const streak = habit.streak;
  let title = `⏰ Time for ${habit.name}`;
  let body = `Take a quick moment to complete your ${habit.targetValue} ${habit.unit} today.`;
  let cta = `Log ${habit.name}`;
  let urgency: 'normal' | 'streak_risk' | 'milestone' | 'celebration' = 'normal';

  if (streak >= 7) {
    title = `🔥 Protect Your ${streak}-Day Streak: ${habit.name}!`;
    body = `You've built high momentum over the past ${streak} days. Don't let today break your chain!`;
    urgency = 'streak_risk';
    cta = 'Protect Streak';
  } else if (streak >= 3) {
    title = `⚡ Keep the Fire Burning: ${habit.name}`;
    body = `Day ${streak + 1} is waiting. Consistent daily reps create permanent transformation.`;
    cta = 'Keep Streak';
  }

  if (tone === 'gentle') {
    title = `🌿 Mindful Pause: ${habit.name}`;
    body = `Give yourself permission to slow down and check off your ${habit.name}. Small acts matter.`;
  } else if (tone === 'behavioral') {
    title = `🧩 Habit Trigger: ${habit.name}`;
    body = `Pair this with your current activity to eliminate friction and bypass decision fatigue.`;
  }

  return {
    title,
    body,
    callToAction: cta,
    scienceTip: 'Never miss twice: executing an imperfect rep preserves the underlying identity.',
    urgencyLevel: urgency,
    habitName: habit.name,
    streakDays: streak,
    isAiGenerated: false,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Call the backend Gemini API to optimize habit reminder schedules
 */
export async function optimizeScheduleWithAi(
  habits: Habit[],
  routines: unknown[] = []
): Promise<ScheduleRecommendation[]> {
  try {
    const res = await fetch('/api/ai-notifications/optimize-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habits, routines }),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.recommendations)) {
        return data.recommendations;
      }
    }
  } catch (err) {
    console.warn('Schedule optimization endpoint failed, using local chronobiology fallback:', err);
  }

  // Local fallback
  return habits.map((h) => {
    let recommendedTime = '08:00';
    let rationale = 'Morning execution secures the habit before cognitive fatigue sets in.';

    if (h.category === 'Mindfulness' || h.category === 'Health') {
      recommendedTime = '07:15';
      rationale = 'Early morning calm matches cortisol awakening response.';
    } else if (h.category === 'Study' || h.category === 'Work' || h.category === 'Productivity') {
      recommendedTime = '10:00';
      rationale = 'Peak prefrontal cortex alertness window for maximum deep work.';
    } else if (h.category === 'Fitness') {
      recommendedTime = '17:30';
      rationale = 'Late afternoon peak in core body temperature and joint mobility.';
    } else if (h.category === 'Sleep' || h.category === 'Finance') {
      recommendedTime = '21:30';
      rationale = 'Evening transition window minimizes blue light and pre-sleep anxiety.';
    }

    return {
      habitId: h.id,
      habitName: h.name,
      category: h.category,
      currentReminderTime: h.reminderTime,
      recommendedTime,
      rationale,
    };
  });
}

/**
 * Creates RFC 2822 MIME message with Base64 content transfer encoding
 * and converts to Base64URL for Gmail API.
 */
function createMimeEmail(to: string, from: string, subject: string, htmlContent: string): string {
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
  const utf8Full = new TextEncoder().encode(fullMimeString);
  let binaryFull = '';
  for (let i = 0; i < utf8Full.length; i++) {
    binaryFull += String.fromCharCode(utf8Full[i]);
  }

  return btoa(binaryFull).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Send an AI-crafted habit notification alert email via Google Workspace Gmail API
 */
export async function sendHabitAiAlertEmail(params: {
  recipientEmail: string;
  userName: string;
  nudge: GeneratedAiNudge;
  habit: Habit;
  todayCompletedCount: number;
  totalScheduledCount: number;
  lifeScore?: number;
}): Promise<{ id: string; sentAt: string }> {
  const { recipientEmail, userName, nudge, habit, todayCompletedCount, totalScheduledCount, lifeScore = 80 } = params;

  if (!recipientEmail || !recipientEmail.trim()) {
    throw new Error('A recipient email address is required to deliver email alerts.');
  }

  let token = await getAccessToken();
  if (!token) {
    try {
      token = await requestWorkspaceAccess();
    } catch {
      throw new Error('Please sign in with Google and authorize Gmail permissions to send email alerts.');
    }
  }

  const subject = `${nudge.title} - AuraHabit AI Reminder`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 580px; margin: 24px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        
        <!-- Header banner -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
          <div style="display: inline-block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; background-color: rgba(255,255,255,0.2); padding: 4px 14px; border-radius: 20px; margin-bottom: 12px;">
            AuraHabit AI Intelligent Alert
          </div>
          <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1.3;">
            ${nudge.title}
          </h1>
          <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.9);">
            Scheduled Check-In for <strong>${userName}</strong>
          </p>
        </div>

        <!-- Body Content -->
        <div style="padding: 28px;">
          <!-- Motivational Nudge Card -->
          <div style="background-color: #f8fafc; border-left: 4px solid #10b981; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #1e293b; font-weight: 500;">
              "${nudge.body}"
            </p>
            ${
              nudge.scienceTip
                ? `<p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b; font-style: italic;">
                    🧠 <strong>Behavioral Anchor:</strong> ${nudge.scienceTip}
                  </p>`
                : ''
            }
          </div>

          <!-- Habit Details Box -->
          <div style="border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <div>
                <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Habit</span>
                <h3 style="margin: 2px 0 0 0; font-size: 18px; color: #0f172a; font-weight: 700;">${habit.name}</h3>
              </div>
              <div style="text-align: right;">
                <span style="display: inline-block; background-color: #fef3c7; color: #b45309; font-weight: 700; font-size: 13px; padding: 4px 10px; border-radius: 10px;">
                  🔥 ${nudge.streakDays} Day Streak
                </span>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
              <tr>
                <td style="padding: 6px 0;"><strong>Category:</strong></td>
                <td style="padding: 6px 0; text-align: right;">${habit.category}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;"><strong>Daily Target:</strong></td>
                <td style="padding: 6px 0; text-align: right;">${habit.targetValue} ${habit.unit}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;"><strong>Scheduled Time:</strong></td>
                <td style="padding: 6px 0; text-align: right;">${habit.reminderTime || 'Custom'}</td>
              </tr>
            </table>
          </div>

          <!-- Daily Status Bar -->
          <div style="background-color: #ecfdf5; border-radius: 14px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <div>
              <div style="font-size: 11px; color: #065f46; font-weight: 700; text-transform: uppercase;">Today's Progress</div>
              <div style="font-size: 15px; color: #047857; font-weight: 700;">
                ${todayCompletedCount} of ${totalScheduledCount} habits completed
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; color: #065f46; font-weight: 700; text-transform: uppercase;">Life Score</div>
              <div style="font-size: 20px; color: #047857; font-weight: 800; font-family: monospace;">
                ${lifeScore}/100
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin: 28px 0 16px 0;">
            <a href="https://ais-dev-wfeoqxt62z6xcginrechbg-935224382262.asia-southeast1.run.app" 
               style="display: inline-block; background-color: #10b981; color: #ffffff; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);">
              ✔ ${nudge.callToAction || 'Open AuraHabit & Check Off'}
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0 0 4px 0;">This notification was triggered based on your custom habit schedule in AuraHabit.</p>
          <p style="margin: 0;">You can customize your notification channels or quiet hours anytime in Settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const encodedMessage = createMimeEmail(recipientEmail.trim(), 'me', subject, emailHtml);

  let res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  if (res.status === 403 || res.status === 401) {
    const errData = await res.json().catch(() => ({}));
    const errMsg = (errData?.error?.message || '').toLowerCase();

    if (errMsg.includes('insufficient') || errMsg.includes('scope') || res.status === 401) {
      console.warn('Gmail API returned scope error, requesting updated token...', errData);
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
        throw new Error('Please authorize Google Gmail access to send email alerts.');
      }
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Gmail API responded with status ${res.status}`);
  }

  const result = await res.json();
  return {
    id: result.id,
    sentAt: new Date().toISOString(),
  };
}
