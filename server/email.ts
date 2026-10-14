import nodemailer, { Transporter } from 'nodemailer';
import crypto from 'crypto';
import { db } from './db';

interface SendOtpResult {
  success: boolean;
  message: string;
  messageId?: string;
  isSandbox?: boolean;
}

/**
 * Dispatches a cryptographically secure 6-digit OTP code.
 * 1. If RESEND_API_KEY is configured: Dispatches via Resend API.
 * 2. If SMTP_USER & SMTP_PASS are configured: Dispatches via Nodemailer Gmail/Custom SMTP.
 * 3. Zero-Config Mode: Dispatches to the internal Sandbox Inbox so users/testers
 *    can immediately test full authentication without configuring any local .env credentials!
 */
export async function sendOtpEmail(toEmail: string, otpCode: string): Promise<SendOtpResult> {
  const user = process.env.SMTP_USER?.trim();
  const rawPass = process.env.SMTP_PASS?.trim();
  // Strip spaces from 16-character Gmail app passwords (Google displays them as "xxxx xxxx xxxx xxxx")
  const pass = rawPass ? rawPass.replace(/\s+/g, '') : '';
  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  const subject = `Your AuraHabit Verification Code: ${otpCode}`;
  const html = generateOtpHtml(toEmail, otpCode);
  const text = `Your AuraHabit verification code is: ${otpCode}. This code is valid for 10 minutes. Do not share this code with anyone.`;

  // 1. Resend API Integration (Zero manual SMTP app passwords)
  if (resendApiKey) {
    const from = process.env.SMTP_FROM || 'AuraHabit Security <onboarding@resend.dev>';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [toEmail],
        subject,
        html,
        text,
      }),
    });

    const data: any = await res.json();
    if (!res.ok) {
      throw new Error(`Resend API dispatch failed: ${data?.message || res.statusText}`);
    }

    return {
      success: true,
      message: 'OTP sent successfully via Resend to your email',
      messageId: data.id,
      isSandbox: false,
    };
  }

  // 2. Production SMTP Transport (Gmail SMTP or Custom SMTP)
  if (user && pass) {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const isGmail = host.toLowerCase().includes('gmail') || host.toLowerCase().includes('google');

    let transporter: Transporter;

    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
        pool: true,
        maxConnections: 3,
      });
    } else {
      const secure =
        process.env.SMTP_SECURE !== undefined
          ? process.env.SMTP_SECURE === 'true'
          : port === 465;

      transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        pool: true,
        maxConnections: 3,
      });
    }

    const from = process.env.SMTP_FROM || `"AuraHabit Security" <${user}>`;

    try {
      const info = await transporter.sendMail({
        from,
        to: toEmail,
        subject,
        text,
        html,
      });

      return {
        success: true,
        message: 'OTP sent successfully to your email',
        messageId: info.messageId,
        isSandbox: false,
      };
    } catch (err: any) {
      const errCode = (err.code || '').toUpperCase();
      const errMsg = err.message || '';

      if (errCode === 'EAUTH' || errMsg.includes('BadCredentials') || errMsg.includes('Username and Password not accepted')) {
        throw new Error(
          'Gmail authentication failed (EAUTH). Please verify SMTP_USER and ensure SMTP_PASS is a 16-character Google App Password (not your normal Google account password).'
        );
      }

      if (errCode === 'ESOCKET' || errCode === 'ETIMEDOUT' || errCode === 'ECONNREFUSED') {
        throw new Error(
          `Failed to establish connection with SMTP server (${host}:${port}). Please verify network access.`
        );
      }

      throw new Error(`SMTP dispatch error: ${errMsg}`);
    }
  }

  // 3. Zero-Config Sandbox Mode:
  // Automatically captures the email into the simulated inbox so testing works out of the box!
  const emailRecord = {
    id: `msg_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
    to: toEmail,
    subject,
    otpCode,
    html,
    text,
    sentAt: Date.now(),
  };

  db.recordSandboxEmail(emailRecord);
  console.info(`[AuraAuth Zero-Config] 📬 Dispatched OTP for ${toEmail} to Sandbox Inbox: ${otpCode}`);

  return {
    success: true,
    message: 'OTP sent! Sandbox Inbox active for zero-config testing.',
    messageId: emailRecord.id,
    isSandbox: true,
  };
}

function generateOtpHtml(toEmail: string, otpCode: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AuraHabit Verification Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 36px 28px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { display: inline-block; width: 48px; height: 48px; line-height: 48px; background: linear-gradient(135deg, #10b981, #14b8a6); border-radius: 16px; color: #ffffff; font-size: 24px; margin-bottom: 8px; }
    .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; }
    .subtitle { font-size: 13px; color: #64748b; margin: 0; }
    .otp-container { background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 14px; text-align: center; padding: 22px 16px; margin: 24px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0f172a; display: inline-block; }
    .expiry { font-size: 12px; color: #e11d48; font-weight: 600; margin-top: 8px; }
    .notice { font-size: 12px; line-height: 1.6; color: #475569; margin: 18px 0 0 0; }
    .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 18px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">⚡</div>
      <h1 class="title">AuraHabit Verification</h1>
      <p class="subtitle">Secure authentication for your habit tracking</p>
    </div>
    <p style="font-size: 14px; color: #334155; margin: 0 0 8px 0;">Hello,</p>
    <p style="font-size: 13px; color: #475569; line-height: 1.5; margin: 0;">
      Use the 6-digit verification code below to sign in or complete your registration.
    </p>
    <div class="otp-container">
      <div class="otp-code">${otpCode}</div>
      <div class="expiry">⏱️ Valid for 10 minutes</div>
    </div>
    <p class="notice">
      <b>Security Notice:</b> Never share this code with anyone. AuraHabit staff will never ask for your verification code. If you did not request this code, you can safely ignore this email.
    </p>
    <div class="footer">
      Sent to ${toEmail} • AuraHabit Automated Security System
    </div>
  </div>
</body>
</html>
  `;
}
