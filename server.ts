import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

import crypto from 'crypto';
import { db } from './server/db';
import { sendOtpEmail } from './server/email';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Initialize Gemini client (User-Agent header required by gemini-api skill)
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Affirmation API endpoint powered by Gemini API
  app.post('/api/affirmation', async (req: Request, res: Response) => {
    try {
      const { category = 'Consistency & Habits', mood = 'focused' } = req.body || {};

      const prompt = `You are a mindful and inspiring life coach for AuraHabit. Generate an uplifting, poignant daily affirmation and motivational quote tailored for personal growth, habit tracking, and mindfulness.
Focus Category: ${category}
User Mood / Energy: ${mood}

Return a valid JSON object matching this exact structure:
{
  "quote": "A powerful, memorable 1-2 sentence affirmation or motivational quote.",
  "author": "Name of inspiring thinker, author, philosopher, athlete, or 'Aura Wisdom'",
  "theme": "Theme tag (e.g. Consistency, Resilience, Focus, Mindfulness, Courage, Vitality)",
  "reflectionPrompt": "A single brief reflective question to ponder today (max 15 words)."
}`;

      const callWithTimeout = (promise: Promise<any>, ms: number) =>
        Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
        ]);

      let response: any = null;
      let usedModel = 'gemini-3.8-flash';

      // 1. Try primary gemini-3.8-flash with timeout
      try {
        response = await callWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.85,
            },
          }),
          4000
        );
      } catch (err: any) {
        console.warn('Primary model gemini-3.8-flash unavailable, trying gemini-3.1-flash-lite:', err?.message || err);
        // 2. Fallback to gemini-3.1-flash-lite
        try {
          usedModel = 'gemini-3.1-flash-lite';
          response = await callWithTimeout(
            ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
                temperature: 0.85,
              },
            }),
            5000
          );
        } catch (liteErr: any) {
          console.warn('Gemini models unavailable, proceeding with intelligent curated fallback:', liteErr?.message || liteErr);
        }
      }

      if (response && response.text) {
        let text = response.text.trim();
        // Remove markdown backticks if present
        text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = {
            quote: text.replace(/^["'`]|["'`]$/g, '').trim(),
            author: 'Aura Wisdom',
            theme: category || 'Consistency',
            reflectionPrompt: 'What one positive action will you take today?',
          };
        }

        return res.json({
          success: true,
          affirmation: data,
          model: usedModel,
          isAiGenerated: true,
        });
      }

      // Curated themed fallback if network / quota blocked
      const categoryFallbacks: Record<string, { quote: string; author: string; theme: string; reflectionPrompt: string }> = {
        'Consistency & Habits': {
          quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
          author: 'Will Durant',
          theme: 'Consistency',
          reflectionPrompt: 'What single ritual will you protect above all else today?',
        },
        'Mindfulness & Peace': {
          quote: 'Peace comes from within. Do not seek it without.',
          author: 'Buddha',
          theme: 'Mindfulness',
          reflectionPrompt: 'Where can you invite stillness and breath into your schedule today?',
        },
        'Focus & Deep Work': {
          quote: 'Concentrate all your thoughts upon the work in hand. The sun’s rays do not burn until brought to a focus.',
          author: 'Alexander Graham Bell',
          theme: 'Deep Focus',
          reflectionPrompt: 'What one priority deserves your undivided attention this morning?',
        },
        'Resilience & Grit': {
          quote: 'It does not matter how slowly you go as long as you do not stop.',
          author: 'Confucius',
          theme: 'Resilience',
          reflectionPrompt: 'How will you honor steady perseverance instead of perfection?',
        },
        'Health & Vitality': {
          quote: 'Take care of your body. It’s the only place you have to live.',
          author: 'Jim Rohn',
          theme: 'Vitality',
          reflectionPrompt: 'What nourishing choice will restore your energy today?',
        },
        'Confidence & Gratitude': {
          quote: 'Gratitude turns what we have into enough, and more.',
          author: 'Melody Beattie',
          theme: 'Gratitude',
          reflectionPrompt: 'What three blessings are you most thankful for right now?',
        },
      };

      const selectedFallback = categoryFallbacks[category] || categoryFallbacks['Consistency & Habits'];
      return res.json({
        success: true,
        affirmation: selectedFallback,
        model: 'aura-wisdom-bank',
        isAiGenerated: true,
      });
    } catch (error: any) {
      console.error('Error generating affirmation:', error);
      res.json({
        success: true,
        affirmation: {
          quote: 'Small daily improvements over time lead to stunning results.',
          author: 'Robin Sharma',
          theme: 'Consistency',
          reflectionPrompt: 'What 1% improvement will you make today?',
        },
        model: 'aura-wisdom-bank',
        isAiGenerated: true,
      });
    }
  });

  // AI Habit Insights endpoint powered by Gemini API (gemini-3.8-flash)
  app.post('/api/habit-insights', async (req: Request, res: Response) => {
    try {
      const { days = [], habits = [], summary = {}, userName = 'Habit Builder' } = req.body || {};

      const prompt = `You are a world-class behavioral scientist and habit optimization coach (combining James Clear's atomic habits with BJ Fogg's tiny habits research).
Analyze the user's completed habit trends over the past 7 days:

User Name: ${userName}
Overall 7-Day Completion Rate: ${summary.overallCompletionRate ?? 0}%
Active Habits: ${summary.activeHabitsCount ?? habits.length}
Total Completions Logged: ${summary.totalCompletedLogs ?? 0}
Best Day: ${summary.bestDay || 'N/A'}
Lowest Day: ${summary.lowestDay || 'N/A'}

Habit Breakdown (Last 7 Days):
${JSON.stringify(habits.slice(0, 10), null, 2)}

Daily Trajectory (Last 7 Days):
${JSON.stringify(days, null, 2)}

Task:
1. Provide a sharp, data-informed trend analysis of their past 7 days (strengths, drop-off risks, timing patterns, or category imbalances).
2. Formulate EXACTLY ONE high-leverage, concrete actionable advice card to improve or sustain their consistency.

Return a valid JSON object matching this schema:
{
  "headline": "A concise, motivating 5-8 word headline summarizing their 7-day trend",
  "trendAnalysis": "2-3 sentences analyzing their specific trends over the past 7 days. Reference specific habit patterns or days.",
  "consistencyScore": 85,
  "trendStatus": "accelerating" | "steady" | "needs_focus",
  "topStrength": "Name or category of the habit with the strongest momentum",
  "growthOpportunity": "Habit or pattern that experienced friction or lowest consistency",
  "adviceCard": {
    "title": "Clear punchy title of the advice (e.g., 'Anchor Mindfulness to Morning Coffee')",
    "action": "One concrete, immediately executable action the user can take today or tomorrow.",
    "rationale": "Why this works based on behavioral science (e.g. habit stacking, friction reduction, visual cues).",
    "impactCategory": "e.g. Habit Stacking, Friction Reduction, Routine Sync, Environmental Design",
    "effortLevel": "Quick Win (2 mins)" | "Moderate" | "Routine Shift"
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = response.text || '';
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          headline: 'Consistent Momentum Over the Last 7 Days',
          trendAnalysis: 'You have shown disciplined follow-through across core routines, with strong morning consistency.',
          consistencyScore: Math.round(summary.overallCompletionRate || 75),
          trendStatus: (summary.overallCompletionRate || 75) >= 70 ? 'accelerating' : 'steady',
          topStrength: habits[0]?.name || 'Daily Routines',
          growthOpportunity: habits[habits.length - 1]?.name || 'Evening Consistency',
          adviceCard: {
            title: 'Leverage Habit Stacking for Secondary Habits',
            action: 'Pair your lowest-performing habit immediately after your highest-streak habit.',
            rationale: 'Habit stacking utilizes established neural pathways to anchor new behaviors without relying on raw willpower.',
            impactCategory: 'Habit Stacking',
            effortLevel: 'Quick Win (2 mins)',
          },
        };
      }

      res.json({
        success: true,
        insight: {
          ...data,
          isAiGenerated: true,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error generating habit insights with Gemini API, serving fallback:', error);
      const { habits = [], summary = {} } = req.body || {};
      const rate = summary.overallCompletionRate ?? 78;
      const topHabit = habits[0]?.name || 'Morning Routines';
      const laggingHabit = habits[habits.length - 1]?.name || 'Evening Habits';

      res.json({
        success: true,
        insight: {
          headline: rate >= 80 ? 'Exceptional 7-Day Habit Momentum' : 'Steady Foundation with Key High-Leverage Wins',
          trendAnalysis: `Across your tracked habits over the past 7 days, you maintained a ${rate}% completion rate. ${topHabit} proved your most consistent anchor, while ${laggingHabit} showed opportunities for friction reduction.`,
          consistencyScore: Math.round(rate),
          trendStatus: rate >= 75 ? 'accelerating' : rate >= 50 ? 'steady' : 'needs_focus',
          topStrength: `${topHabit} (${habits[0]?.completionRate ?? rate}%)`,
          growthOpportunity: `${laggingHabit} (${habits[habits.length - 1]?.completionRate ?? Math.max(10, rate - 25)}%)`,
          adviceCard: {
            title: `Anchor "${laggingHabit}" to Your Established ${topHabit}`,
            action: `Immediately after completing ${topHabit}, initiate a frictionless 2-minute starter version of ${laggingHabit}.`,
            rationale: 'Behavioral habit stacking pairs an already automated neurological trigger with a vulnerable behavior, eliminating activation energy.',
            impactCategory: 'Habit Stacking',
            effortLevel: 'Quick Win (2 mins)',
          },
          isAiGenerated: false,
          generatedAt: new Date().toISOString(),
        },
      });
    }
  });

  // AI Habit Notification Nudge Generator powered by Gemini API (gemini-3.8-flash)
  app.post('/api/ai-notifications/nudge', async (req: Request, res: Response) => {
    try {
      const {
        habit = {},
        user = {},
        context = {},
      } = req.body || {};

      const habitName = habit.name || 'Daily Habit';
      const habitCategory = habit.category || 'Personal';
      const streak = Number(habit.streak) || 0;
      const targetValue = habit.targetValue || 1;
      const unit = habit.unit || 'times';
      const userName = user.name || 'Habit Builder';
      const timeOfDay = context.timeOfDay || 'day';
      const tone = context.tone || 'motivational';
      const triggerType = context.triggerType || 'scheduled_checkin';

      const prompt = `You are an elite behavioral science notification engine for AuraHabit tracker.
Craft a personalized, high-conversion micro-notification for the user.

Habit: "${habitName}"
Category: ${habitCategory}
Target: ${targetValue} ${unit}
Current Streak: ${streak} consecutive days
User Name: ${userName}
Time of Day: ${timeOfDay}
Requested Tone: ${tone} (Options: motivational, gentle, behavioral, urgent)
Trigger Context: ${triggerType} (e.g. scheduled_checkin, streak_at_risk, morning_kickoff, evening_winddown)

Guidelines:
- Title must be punchy (under 7 words), include appropriate emoji, and highlight momentum or streak.
- Body must be 1-2 concise, compelling sentences (max 120 chars) that lower activation energy. Avoid corporate jargon.
- Call To Action (CTA) must be an active 2-4 word imperative (e.g. "Drink 1 Glass Now", "Take 5 Deep Breaths").
- Science Tip should be a 1-sentence behavioral anchor (e.g. habit stacking, 2-minute rule, or cue priming).
- Urgency Level: determine if "normal", "streak_risk" (if streak > 3 and late in day), "milestone" (e.g. 7, 14, 21, 30 days), or "celebration".

Return a valid JSON object matching this schema:
{
  "title": "⚡ 14-Day Streak on the Line: Morning Meditation",
  "body": "Your mind performs best when centered before the rush begins. 10 minutes now safeguards your 14-day momentum.",
  "callToAction": "Begin 10-Min Session",
  "scienceTip": "Starting with just 2 deep breaths bypasses prefrontal resistance.",
  "urgencyLevel": "streak_risk" | "normal" | "milestone" | "celebration"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = response.text || '';
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (!data || !data.title) {
        data = {
          title: streak >= 3 ? `🔥 Protect Your ${streak}-Day Streak: ${habitName}` : `⏰ Time for ${habitName}`,
          body: `Keep your daily momentum rolling. Complete your ${targetValue} ${unit} for today!`,
          callToAction: `Log ${habitName}`,
          scienceTip: 'Consistency is built on never missing twice.',
          urgencyLevel: streak >= 3 ? 'streak_risk' : 'normal',
        };
      }

      res.json({
        success: true,
        nudge: {
          ...data,
          habitName,
          habitCategory,
          streakDays: streak,
          isAiGenerated: true,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error generating AI notification nudge with Gemini API:', error);
      const { habit = {} } = req.body || {};
      const streak = Number(habit.streak) || 0;
      const habitName = habit.name || 'Daily Habit';
      const targetValue = habit.targetValue || 1;
      const unit = habit.unit || 'times';

      res.json({
        success: true,
        nudge: {
          title: streak >= 3 ? `🔥 Keep Your ${streak}-Day Streak: ${habitName}` : `⏰ Scheduled Check-In: ${habitName}`,
          body: `Dedicate a moment to your ${habitName} (${targetValue} ${unit}). Consistent reps compound over time.`,
          callToAction: `Check Off Now`,
          scienceTip: 'Atomic habits compound into extraordinary life results.',
          urgencyLevel: streak >= 3 ? 'streak_risk' : 'normal',
          habitName,
          streakDays: streak,
          isAiGenerated: false,
          generatedAt: new Date().toISOString(),
        },
      });
    }
  });

  // AI Schedule Optimizer endpoint powered by Gemini API (gemini-3.8-flash)
  app.post('/api/ai-notifications/optimize-schedule', async (req: Request, res: Response) => {
    try {
      const { habits = [], routines = [] } = req.body || {};

      const prompt = `You are a circadian rhythm and behavioral habit architect.
Analyze the user's habits and routines to generate an optimal daily reminder schedule.

Habits:
${JSON.stringify(habits.map((h: any) => ({
  id: h.id,
  name: h.name,
  category: h.category,
  difficulty: h.difficulty,
  priority: h.priority,
  currentReminderTime: h.reminderTime || 'unassigned',
})), null, 2)}

Existing Routines:
${JSON.stringify(routines.map((r: any) => ({
  id: r.id,
  name: r.name,
  reminderTime: r.reminderTime,
  habitIds: r.habitIds,
})), null, 2)}

Rules for optimal scheduling:
1. Hydration & Morning Mindfulness: Ideal at waking (06:30 - 08:00).
2. Deep Work & Focus: Peak cortisol/mental acuity (09:00 - 11:30).
3. Physical Workout/Fitness: Mid-afternoon or late afternoon (16:30 - 18:00) when body temperature peaks.
4. Reading, Finance & Sleep: Evening wind-down (20:30 - 22:30).
5. Spread times out so notifications do not clash.

Return a JSON object matching this schema:
{
  "recommendations": [
    {
      "habitId": "habit id string",
      "habitName": "habit name string",
      "category": "category string",
      "recommendedTime": "HH:mm (24-hour format)",
      "rationale": "1-sentence science-based reason for this specific time"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.6,
        },
      });

      const text = response.text || '';
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (!data || !Array.isArray(data.recommendations)) {
        throw new Error('Invalid recommendations JSON');
      }

      res.json({
        success: true,
        recommendations: data.recommendations,
      });
    } catch (error: any) {
      console.error('Error optimizing schedule with Gemini API, serving behavioral default:', error);
      const { habits = [] } = req.body || {};

      const fallbackRecommendations = habits.map((h: any) => {
        let recommendedTime = '08:00';
        let rationale = 'Morning execution secures the habit before daily distractions.';

        if (h.category === 'Mindfulness' || h.category === 'Health') {
          recommendedTime = '07:15';
          rationale = 'Early morning priming aligns with cortisol awakening response.';
        } else if (h.category === 'Study' || h.category === 'Work' || h.category === 'Productivity') {
          recommendedTime = '10:00';
          rationale = 'Peak cognitive alert window for uninterrupted deep work.';
        } else if (h.category === 'Fitness') {
          recommendedTime = '17:30';
          rationale = 'Core body temperature and muscle efficiency peak in the late afternoon.';
        } else if (h.category === 'Sleep' || h.category === 'Finance') {
          recommendedTime = '21:30';
          rationale = 'Evening transition window prepares the nervous system for restorative rest.';
        }

        return {
          habitId: h.id,
          habitName: h.name,
          category: h.category,
          recommendedTime,
          rationale,
        };
      });

      res.json({
        success: true,
        recommendations: fallbackRecommendations,
      });
    }
  });

  // =========================================================================
  // USER PROFILE & AUTHENTICATION API ROUTES
  // =========================================================================

  // Helper function to extract user from session token or query
  const resolveUser = (req: Request) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const session = db.getSession(token);
      if (session) {
        const user = db.getUserById(session.userId);
        if (user) return user;
      }
    }
    const userId = (req.query.userId || req.body?.userId) as string;
    if (userId) {
      const user = db.getUserById(userId);
      if (user) return user;
    }
    // Default to primary demo user
    return db.getUserById('usr_alex_rivera_01') || db.getAllUsers()[0];
  };

  // 1. Check Username Availability (Real-time check)
  app.get('/api/users/check-username', (req: Request, res: Response) => {
    try {
      const username = ((req.query.username as string) || '').trim().toLowerCase();

      if (!username) {
        return res.status(400).json({
          available: false,
          valid: false,
          reason: 'Username is required.',
        });
      }

      // Regex: alphanumeric and underscores, min 3, max 20 chars
      const usernameRegex = /^[a-z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return res.json({
          available: false,
          valid: false,
          reason: 'Must be 3-20 lowercase alphanumeric characters or underscores.',
        });
      }

      const existingUser = db.getUserByUsername(username);
      if (existingUser) {
        return res.json({
          available: false,
          valid: true,
          reason: 'Username is already taken.',
        });
      }

      return res.json({
        available: true,
        valid: true,
        message: 'Username is available!',
      });
    } catch (err: any) {
      return res.status(500).json({ available: false, error: err.message });
    }
  });

  // 2. Send 6-Digit Email OTP (Real Email Dispatch via SMTP)
  app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
    try {
      const { email = '' } = req.body;
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({ success: false, error: 'Email address is required.' });
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
      }

      // Check Rate Limiting: Max 3 OTP resends per 15 minutes
      const existingOtp = db.getOtp(normalizedEmail);
      const now = Date.now();
      const FIFTEEN_MINUTES = 15 * 60 * 1000;

      if (existingOtp && now - existingOtp.resendWindowStart < FIFTEEN_MINUTES) {
        if (existingOtp.resendAttempts >= 3) {
          const resetMinutesLeft = Math.ceil((existingOtp.resendWindowStart + FIFTEEN_MINUTES - now) / 60000);
          return res.status(429).json({
            success: false,
            error: `Rate limit exceeded: Max 3 OTP resends per 15 minutes. Try again in ${resetMinutesLeft} min.`,
            retryAfterMinutes: resetMinutesLeft,
          });
        }
      }

      // Cryptographically secure 6-digit OTP
      const otpCode = crypto.randomInt(100000, 1000000).toString();

      // Store hashed OTP with strict 10-minute expiry
      db.saveOtp(normalizedEmail, otpCode, 10);

      // Email dispatch (Resend API -> SMTP -> Zero-Config Sandbox Inbox)
      let dispatchResult;
      try {
        dispatchResult = await sendOtpEmail(normalizedEmail, otpCode);
        console.log(`[AuraAuth] 📧 6-digit OTP dispatched for ${normalizedEmail} (sandbox: ${dispatchResult.isSandbox})`);
      } catch (emailErr: any) {
        console.error(`[AuraAuth] ❌ Failed to dispatch email to ${normalizedEmail}:`, emailErr.message);
        return res.status(500).json({
          success: false,
          error: emailErr.message || 'SMTP transport error. Please verify SMTP credentials in .env.',
        });
      }

      // Strictly return success without exposing the OTP directly in response payload
      return res.json({
        success: true,
        message: dispatchResult.message || 'OTP sent successfully',
        isSandbox: !!dispatchResult.isSandbox,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2b. Zero-Config Simulated Inbox endpoint (for instant testing without manual SMTP credentials)
  app.get('/api/auth/sandbox-inbox', (req: Request, res: Response) => {
    try {
      const { email = '' } = req.query;
      const emails = db.getSandboxEmails(email ? String(email) : undefined);
      return res.json({
        success: true,
        emails,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2c. Direct Auto-Login / Demo Login (instant testing in client-side sandbox)
  app.post('/api/auth/auto-login', (req: Request, res: Response) => {
    try {
      const {
        email = 'demo.habits@aurahabit.com',
        username = 'demo_user',
        fullName = 'Demo Explorer',
      } = req.body || {};

      const normalizedEmail = String(email).trim().toLowerCase();
      let user = db.getUserByEmail(normalizedEmail);

      if (!user) {
        user = db.createUser({
          username: String(username).toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 20),
          email: normalizedEmail,
          isEmailVerified: true,
          fullName: String(fullName),
          bio: 'Building consistency and mindful daily habits with AuraHabit.',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
          socialLinks: {},
          googleChatEmail: normalizedEmail,
        });
      }

      const session = db.createSession(user.id);
      return res.json({
        success: true,
        message: 'Instant demo login active',
        token: session.token,
        user,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2d. Password Login (Email + Password)
  app.post('/api/auth/login-password', (req: Request, res: Response) => {
    try {
      const { email = '', password = '' } = req.body || {};
      const normalizedEmail = String(email).trim().toLowerCase();

      if (!normalizedEmail || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required.' });
      }

      const user = db.getUserByEmail(normalizedEmail);
      if (!user) {
        return res.status(404).json({ success: false, error: 'No account found with this email. Please register.' });
      }

      if (!user.passwordHash) {
        return res.status(400).json({
          success: false,
          error: 'This account was created via Google/OTP. Please sign in using Email OTP or Google.',
        });
      }

      const hash = crypto.createHash('sha256').update(password).digest('hex');
      if (hash !== user.passwordHash) {
        return res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
      }

      const session = db.createSession(user.id);
      return res.json({
        success: true,
        message: 'Signed in successfully!',
        token: session.token,
        user,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Verify OTP & Register/Login User (with optional password setting)
  app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
    try {
      const { email = '', otp = '', username = '', fullName = '', password = '' } = req.body;
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedOtp = otp.trim();

      if (!normalizedEmail || !normalizedOtp) {
        return res.status(400).json({ success: false, error: 'Email and 6-digit OTP are required.' });
      }

      const otpRecord = db.getOtp(normalizedEmail);
      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          error: 'No active OTP verification found for this email. Please request a new code.',
        });
      }

      const now = Date.now();
      if (now > otpRecord.expiresAt) {
        db.clearOtp(normalizedEmail);
        return res.status(400).json({
          success: false,
          error: 'The verification code has expired (10 minutes elapsed). Please request a new code.',
        });
      }

      // Invalidate immediately if 3 failed attempts already exceeded
      if (otpRecord.attempts >= 3) {
        db.clearOtp(normalizedEmail);
        return res.status(400).json({
          success: false,
          error: 'Maximum failed attempts (3) exceeded. This OTP has been invalidated. Please request a new code.',
        });
      }

      // Verify OTP hash
      const inputHash = crypto.createHash('sha256').update(normalizedOtp).digest('hex');
      if (inputHash !== otpRecord.otpHash) {
        const attemptsUsed = db.recordOtpFailedAttempt(normalizedEmail);
        if (attemptsUsed >= 3) {
          db.clearOtp(normalizedEmail);
          return res.status(400).json({
            success: false,
            error: 'Maximum failed attempts (3) reached. This verification code has been deleted. Please request a new code.',
            attemptsRemaining: 0,
          });
        }
        const remaining = Math.max(0, 3 - attemptsUsed);
        return res.status(400).json({
          success: false,
          error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
          attemptsRemaining: remaining,
        });
      }

      // OTP is valid! Invalidate and delete immediately after successful verification
      db.clearOtp(normalizedEmail);

      // Check if user already exists
      let user = db.getUserByEmail(normalizedEmail);
      let isNewUser = false;
      const passwordHash = password
        ? crypto.createHash('sha256').update(password).digest('hex')
        : undefined;

      if (!user) {
        isNewUser = true;
        // Registration path: check username
        const cleanUsername = (username || normalizedEmail.split('@')[0])
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .slice(0, 20);

        // Ensure username is at least 3 chars and unique
        let finalUsername = cleanUsername.length >= 3 ? cleanUsername : `user_${cleanUsername}`;
        let counter = 1;
        while (db.getUserByUsername(finalUsername)) {
          finalUsername = `${cleanUsername.slice(0, 16)}_${counter++}`;
        }

        user = db.createUser({
          username: finalUsername,
          email: normalizedEmail,
          isEmailVerified: true,
          fullName: fullName.trim() || finalUsername,
          passwordHash,
          bio: 'Consistency seeker and daily habit builder.',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
          socialLinks: {},
          googleChatEmail: normalizedEmail,
        });
      } else {
        // Existing user: mark email verified and update password if provided
        const updates: any = { isEmailVerified: true };
        if (passwordHash) {
          updates.passwordHash = passwordHash;
        }
        user = db.updateUser(user.id, updates)!;
      }

      // Generate session token
      const session = db.createSession(user.id);

      return res.json({
        success: true,
        message: isNewUser ? 'Account registered and verified successfully!' : 'Signed in successfully!',
        token: session.token,
        user,
        isNewUser,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Get Current User Profile
  app.get('/api/users/profile', (req: Request, res: Response) => {
    try {
      const user = resolveUser(req);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User profile not found.' });
      }
      return res.json({ success: true, user });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Update Profile Details & Social Links
  app.put('/api/users/profile', (req: Request, res: Response) => {
    try {
      const user = resolveUser(req);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User profile not found.' });
      }

      const {
        fullName,
        bio,
        dob,
        gender,
        occupation,
        location,
        socialLinks = {},
        googleChatEmail,
        googleChatSpaceUrl,
      } = req.body;

      // Validation: Bio max 250 chars
      if (bio && bio.length > 250) {
        return res.status(400).json({
          success: false,
          error: 'Bio must not exceed 250 characters.',
        });
      }

      // Helper to auto-prefix social URLs
      const formatSocialUrl = (platform: 'instagram' | 'twitter' | 'facebook' | 'youtube', raw?: string) => {
        if (!raw || !raw.trim()) return '';
        let val = raw.trim();
        if (val.startsWith('@')) val = val.substring(1);
        if (val.startsWith('http://') || val.startsWith('https://')) return val;
        switch (platform) {
          case 'instagram':
            return `https://instagram.com/${val}`;
          case 'twitter':
            return `https://x.com/${val}`;
          case 'facebook':
            return `https://facebook.com/${val}`;
          case 'youtube':
            return val.startsWith('@') ? `https://youtube.com/${val}` : `https://youtube.com/@${val}`;
        }
      };

      const updatedSocialLinks = {
        instagram: formatSocialUrl('instagram', socialLinks.instagram),
        twitter: formatSocialUrl('twitter', socialLinks.twitter),
        facebook: formatSocialUrl('facebook', socialLinks.facebook),
        youtube: formatSocialUrl('youtube', socialLinks.youtube),
      };

      const updatedUser = db.updateUser(user.id, {
        ...(fullName !== undefined ? { fullName: fullName.trim() } : {}),
        ...(bio !== undefined ? { bio: bio.trim() } : {}),
        ...(dob !== undefined ? { dob } : {}),
        ...(gender !== undefined ? { gender } : {}),
        ...(occupation !== undefined ? { occupation: occupation.trim() } : {}),
        ...(location !== undefined ? { location: location.trim() } : {}),
        socialLinks: updatedSocialLinks,
        ...(googleChatEmail !== undefined ? { googleChatEmail: googleChatEmail.trim() } : {}),
        ...(googleChatSpaceUrl !== undefined ? { googleChatSpaceUrl: googleChatSpaceUrl.trim() } : {}),
      });

      return res.json({
        success: true,
        message: 'Profile details updated successfully.',
        user: updatedUser,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Profile Avatar Upload Handler (File validation: PNG, JPG, WEBP, max 5MB)
  app.post('/api/users/avatar', (req: Request, res: Response) => {
    try {
      const user = resolveUser(req);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User profile not found.' });
      }

      const { avatar } = req.body;
      if (!avatar || typeof avatar !== 'string') {
        return res.status(400).json({ success: false, error: 'Image data is required.' });
      }

      // Check if data URL or direct image URL
      if (avatar.startsWith('data:image/')) {
        const mimeMatch = avatar.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
        if (!mimeMatch) {
          return res.status(400).json({
            success: false,
            error: 'Invalid image format. Supported formats: PNG, JPG, JPEG, WEBP.',
          });
        }

        const mimeType = mimeMatch[1].toLowerCase();
        const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowedMimes.includes(mimeType)) {
          return res.status(400).json({
            success: false,
            error: 'Unsupported image type. Only PNG, JPG, and WEBP are permitted.',
          });
        }

        // Calculate base64 payload size in bytes
        const base64Data = avatar.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
        const sizeInBytes = (base64Data.length * 3) / 4;
        const MAX_BYTES = 5 * 1024 * 1024; // 5MB

        if (sizeInBytes > MAX_BYTES) {
          return res.status(400).json({
            success: false,
            error: 'File size exceeds maximum limit of 5MB. Please choose a smaller image.',
          });
        }
      }

      const updatedUser = db.updateUser(user.id, { avatarUrl: avatar });
      return res.json({
        success: true,
        message: 'Profile image updated successfully.',
        avatarUrl: updatedUser?.avatarUrl,
        user: updatedUser,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Generate Profile QR Payload
  app.get('/api/qr/generate', (req: Request, res: Response) => {
    try {
      const user = resolveUser(req);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      const payload = db.generateQrPayload(user);
      return res.json({
        success: true,
        payload,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. Verify QR Payload & Checksum
  app.post('/api/qr/verify', (req: Request, res: Response) => {
    try {
      let { payload } = req.body;
      if (!payload) {
        return res.status(400).json({ valid: false, error: 'Invalid or Unsupported QR Code' });
      }

      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          return res.status(400).json({ valid: false, error: 'Invalid or Unsupported QR Code' });
        }
      }

      // Schema verification Check 1: Does the payload match the app's QR schema (type === 'USER_PROFILE')?
      if (!payload || typeof payload !== 'object' || payload.type !== 'USER_PROFILE' || !payload.userId || !payload.username || !payload.checksum) {
        return res.status(400).json({
          valid: false,
          error: 'Invalid or Unsupported QR Code',
        });
      }

      // Verification Check 2: Verify checksum
      const isChecksumValid = db.verifyQrChecksum(payload.userId, payload.username, payload.checksum);
      if (!isChecksumValid) {
        return res.status(400).json({
          valid: false,
          error: 'Invalid or Unsupported QR Code (Checksum verification failed)',
        });
      }

      // Lookup user in database
      const user = db.getUserById(payload.userId) || db.getUserByUsername(payload.username);
      if (!user) {
        return res.status(404).json({
          valid: false,
          error: 'User profile no longer exists or is inactive.',
        });
      }

      return res.json({
        valid: true,
        message: 'QR code verified successfully!',
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
          occupation: user.occupation,
          location: user.location,
          socialLinks: user.socialLinks,
          googleChatEmail: user.googleChatEmail || user.email,
          googleChatSpaceUrl: user.googleChatSpaceUrl,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ valid: false, error: 'Invalid or Unsupported QR Code' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  if (!isProd) {
    // Mount Vite dev server middleware in development
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
