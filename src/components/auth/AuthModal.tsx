import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Inbox,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  checkUsernameAvailability,
  sendEmailOtp,
  verifyEmailOtp,
  loginWithPassword,
  autoLoginDemo,
  fetchSandboxEmails,
} from '../../services/userService';
import { UserProfile } from '../../types';
import { evaluatePasswordStrength } from '../../utils/passwordValidator';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  defaultMode?: 'signin' | 'register';
}

interface SandboxEmailItem {
  id: string;
  to: string;
  subject: string;
  otpCode: string;
  text: string;
  html: string;
  sentAt: number;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  defaultMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>(defaultMode);
  const [signInMethod, setSignInMethod] = useState<'otp' | 'password'>('otp');
  const [step, setStep] = useState<'input' | 'otp'>('input');

  // Input states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');

  // Password states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Real-time username check state
  const [usernameCheck, setUsernameCheck] = useState<{
    status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
    message?: string;
  }>({ status: 'idle' });

  // OTP states
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSandboxActive, setIsSandboxActive] = useState(false);

  // Simulated Inbox state (zero-config testing)
  const [showSandboxInbox, setShowSandboxInbox] = useState(false);
  const [sandboxEmails, setSandboxEmails] = useState<SandboxEmailItem[]>([]);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Loading & error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Password strength evaluation
  const passwordStrength = evaluatePasswordStrength(password);
  const doPasswordsMatch = !confirmPassword || password === confirmPassword;

  useEffect(() => {
    if (defaultMode) setMode(defaultMode);
    setStep('input');
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowSandboxInbox(false);
  }, [isOpen, defaultMode]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Real-time debounced username validation
  useEffect(() => {
    if (mode !== 'register' || !username.trim()) {
      setUsernameCheck({ status: 'idle' });
      return;
    }

    const clean = username.trim().toLowerCase();
    const regex = /^[a-z0-9_]{3,20}$/;

    if (!regex.test(clean)) {
      setUsernameCheck({
        status: 'invalid',
        message: 'Must be 3-20 lowercase alphanumeric characters or underscores.',
      });
      return;
    }

    setUsernameCheck({ status: 'checking' });
    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailability(clean);
      if (res.available) {
        setUsernameCheck({ status: 'available', message: 'Username is available!' });
      } else {
        setUsernameCheck({
          status: 'taken',
          message: res.reason || 'Username is already taken.',
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, mode]);

  // Fetch sandbox inbox emails when inbox modal is opened
  const loadSandboxEmails = async () => {
    const res = await fetchSandboxEmails(email.trim().toLowerCase());
    if (res.emails) {
      setSandboxEmails(res.emails);
    }
  };

  useEffect(() => {
    if (showSandboxInbox) {
      loadSandboxEmails();
    }
  }, [showSandboxInbox, email]);

  if (!isOpen) return null;

  // Auto-fill OTP from sandbox email
  const handleAutoFillOtp = (code: string) => {
    if (!code || code.length !== 6) return;
    const digits = code.split('');
    setOtp(digits);
    setCopiedOtp(true);
    setShowSandboxInbox(false);
    setTimeout(() => {
      setCopiedOtp(false);
      otpInputsRef.current[5]?.focus();
    }, 1200);
  };

  // One-click instant demo auto-login
  const handleQuickDemoLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await autoLoginDemo();
      if (res.success && res.user) {
        setSuccessMsg('Signed in with Demo Sandbox Account!');
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 500);
      } else {
        setErrorMsg(res.error || 'Failed to auto-login.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Auto-login error.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password Sign In handler
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithPassword({ email: cleanEmail, password });
      if (res.success && res.user) {
        setSuccessMsg('Signed in successfully!');
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 500);
      } else {
        setErrorMsg(res.error || 'Invalid email or password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error signing in.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send OTP handler (Registration or OTP Sign In)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (mode === 'register') {
      if (usernameCheck.status !== 'available') {
        setErrorMsg('Please choose a valid and available username handle.');
        return;
      }

      // Client-Side Password Strength Validation Check
      if (!passwordStrength.criteria.minLength) {
        setErrorMsg('Password must be at least 8 characters long.');
        return;
      }
      if (passwordStrength.score < 3) {
        setErrorMsg('Please choose a stronger password meeting the security guidelines below.');
        return;
      }
      if (confirmPassword && password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please re-enter.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const res = await sendEmailOtp(cleanEmail);
      if (res.success) {
        setStep('otp');
        setIsSandboxActive(!!res.isSandbox);
        setSuccessMsg(res.message || 'Verification code dispatched to your email.');
        setResendCooldown(60);
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
      } else {
        setErrorMsg(res.message || res.error || 'Failed to dispatch verification code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error sending code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await sendEmailOtp(email.trim().toLowerCase());
      if (res.success) {
        setSuccessMsg('A new verification code has been dispatched to your email.');
        setIsSandboxActive(!!res.isSandbox);
        setResendCooldown(60);
      } else {
        setErrorMsg(res.message || res.error || 'Failed to resend code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('').trim();
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await verifyEmailOtp({
        email: email.trim().toLowerCase(),
        otp: fullOtp,
        username: mode === 'register' ? username.trim().toLowerCase() : undefined,
        fullName: mode === 'register' ? fullName.trim() : undefined,
        password: mode === 'register' && password ? password : undefined,
      });

      if (res.success && res.user) {
        setSuccessMsg('Verification successful!');
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 500);
      } else {
        setErrorMsg(res.error || 'Invalid verification code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failure.');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP input change handler
  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;

    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    // Auto-focus next box
    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // OTP input paste handler
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(paste)) {
      e.preventDefault();
      const digits = paste.split('');
      setOtp(digits);
      otpInputsRef.current[5]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative space-y-5 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {step === 'otp'
                ? 'Verify 6-Digit OTP'
                : mode === 'register'
                ? 'Create Aura Account'
                : 'Sign In to Aura'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {step === 'otp'
                ? `Enter code sent to ${email}`
                : mode === 'register'
                ? 'Secure registration with client-side password validation'
                : 'Zero-config Gmail OTP & credential login'}
            </p>
          </div>
        </div>

        {/* Tab Switcher (Only on input step) */}
        {step === 'input' && (
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Sign In Method Toggle (Only when in sign-in mode) */}
        {step === 'input' && mode === 'signin' && (
          <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSignInMethod('otp')}
              className={`pb-1 border-b-2 font-bold cursor-pointer transition-colors ${
                signInMethod === 'otp'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Email OTP
            </button>
            <button
              type="button"
              onClick={() => setSignInMethod('password')}
              className={`pb-1 border-b-2 font-bold cursor-pointer transition-colors ${
                signInMethod === 'password'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Email & Password
            </button>
          </div>
        )}

        {/* Messages */}
        {errorMsg && (
          <div className="space-y-2 animate-in fade-in">
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="space-y-0.5">
                <p className="font-bold">Notice</p>
                <p className="text-3xs text-rose-600 dark:text-rose-300/90 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5 text-emerald-700 dark:text-emerald-300 text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <div className="space-y-0.5">
              <p className="font-bold">Success</p>
              <p className="text-3xs text-emerald-600 dark:text-emerald-300/90 leading-relaxed">{successMsg}</p>
            </div>
          </div>
        )}

        {/* STEP 1A: SIGN IN WITH PASSWORD FORM */}
        {step === 'input' && mode === 'signin' && signInMethod === 'password' && (
          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In with Password
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 1B: EMAIL OTP & SECURE REGISTRATION FORM */}
        {step === 'input' && (mode === 'register' || signInMethod === 'otp') && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {mode === 'register' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                {/* Username with Real-time Validation */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <span className="font-mono text-slate-400">@</span>
                      Username Handle
                    </label>
                    {usernameCheck.status === 'checking' && (
                      <span className="text-3xs text-slate-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                      </span>
                    )}
                    {usernameCheck.status === 'available' && (
                      <span className="text-3xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Available
                      </span>
                    )}
                    {usernameCheck.status === 'taken' && (
                      <span className="text-3xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Taken
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="e.g. alex_rivera"
                    className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 ${
                      usernameCheck.status === 'available'
                        ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 focus:ring-emerald-500/30'
                        : usernameCheck.status === 'taken' || usernameCheck.status === 'invalid'
                        ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 focus:ring-rose-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 focus:ring-emerald-500/30'
                    }`}
                  />
                  {usernameCheck.message && (
                    <p
                      className={`text-3xs mt-1 ${
                        usernameCheck.status === 'available'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {usernameCheck.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* CLIENT-SIDE PASSWORD STRENGTH VALIDATION (REGISTRATION FLOW) */}
            {mode === 'register' && (
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    Choose Secure Password
                  </label>
                  {password && (
                    <span className={`text-3xs font-extrabold uppercase tracking-wider ${passwordStrength.colorClass}`}>
                      {passwordStrength.label}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter Bars */}
                {password && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <div className="grid grid-cols-5 gap-1.5 h-1.5">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`rounded-full transition-all duration-300 ${
                            passwordStrength.score >= lvl
                              ? passwordStrength.barColorClass
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Interactive Security Criteria Checklist */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-3xs">
                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordStrength.criteria.minLength
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-slate-400'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center border border-current text-4xs">
                          {passwordStrength.criteria.minLength ? '✓' : '•'}
                        </span>
                        <span>8+ characters</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordStrength.criteria.hasUpper
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-slate-400'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center border border-current text-4xs">
                          {passwordStrength.criteria.hasUpper ? '✓' : '•'}
                        </span>
                        <span>Uppercase (A-Z)</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordStrength.criteria.hasLower
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-slate-400'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center border border-current text-4xs">
                          {passwordStrength.criteria.hasLower ? '✓' : '•'}
                        </span>
                        <span>Lowercase (a-z)</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordStrength.criteria.hasNumber
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-slate-400'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center border border-current text-4xs">
                          {passwordStrength.criteria.hasNumber ? '✓' : '•'}
                        </span>
                        <span>Number (0-9)</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 col-span-2 ${
                          passwordStrength.criteria.hasSpecial
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-slate-400'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center border border-current text-4xs">
                          {passwordStrength.criteria.hasSpecial ? '✓' : '•'}
                        </span>
                        <span>Special character (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirm Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-3xs font-bold text-slate-600 dark:text-slate-400">
                      Confirm Password
                    </label>
                    {confirmPassword && (
                      <span
                        className={`text-3xs font-semibold ${
                          doPasswordsMatch
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-500 dark:text-rose-400'
                        }`}
                      >
                        {doPasswordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={`w-full px-3 py-2 pr-10 rounded-xl border bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 ${
                        confirmPassword && !doPasswordsMatch
                          ? 'border-rose-400 focus:ring-rose-500/30'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500/30'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={
                isLoading ||
                (mode === 'register' &&
                  (usernameCheck.status !== 'available' ||
                    !passwordStrength.criteria.minLength ||
                    passwordStrength.score < 3 ||
                    !doPasswordsMatch))
              }
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Verification Code...
                </>
              ) : (
                <>
                  {mode === 'register' ? 'Register with Secure Password' : 'Send 6-Digit OTP'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: 6-DIGIT OTP VERIFICATION FORM */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            {/* Guidance Banner with Instant Sandbox Inbox Button */}
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 text-xs space-y-2">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div className="space-y-0.5 flex-1">
                  <p className="font-bold text-2xs">Verification Code Dispatched</p>
                  <p className="text-3xs text-blue-700/90 dark:text-blue-300/90 leading-relaxed">
                    A 6-digit verification code was sent for <b className="font-mono">{email}</b>.
                  </p>
                </div>
              </div>

              {/* Zero-Config Simulated Inbox Button */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSandboxInbox(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-3xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>📬 Open Sandbox Inbox (Zero-Config Test)</span>
                </button>
              </div>
            </div>

            {/* 6 Digit Input Boxes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 text-center">
                Enter 6-Digit Code
              </label>
              <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputsRef.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-lg font-black font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                ))}
              </div>
            </div>

            {/* Resend OTP info */}
            <div className="flex items-center justify-between text-2xs text-slate-400">
              <span>Code expires in 10 minutes</span>
              <button
                type="button"
                disabled={resendCooldown > 0 || isLoading}
                onClick={handleResendOtp}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer"
              >
                {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend OTP'}
              </button>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Verify & Continue
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('input')}
                className="w-full py-2 text-2xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                ← Back to email input
              </button>
            </div>
          </form>
        )}

        {/* ZERO-CONFIG AUTO-LOGIN QUICK ACTION */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-3xs font-bold transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>⚡ One-Click Sandbox Auto-Login (Skip All Verification)</span>
          </button>
        </div>
      </div>

      {/* SIMULATED SANDBOX INBOX MODAL */}
      {showSandboxInbox && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <Inbox className="w-4 h-4" />
                <span>Simulated Sandbox Inbox</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadSandboxEmails}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Refresh inbox"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowSandboxInbox(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-3xs text-slate-500 dark:text-slate-400">
              Zero-config email inbox running in memory. Any verification emails dispatched in the sandbox appear here automatically.
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {sandboxEmails.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No emails dispatched yet for this address.</p>
                  <p className="text-3xs mt-1">Submit your email to receive an instant verification code.</p>
                </div>
              ) : (
                sandboxEmails.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{item.subject}</span>
                          <span className="text-4xs px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                            New
                          </span>
                        </div>
                        <div className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5">
                          To: <span className="font-mono">{item.to}</span> •{' '}
                          {new Date(item.sentAt).toLocaleTimeString()}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAutoFillOtp(item.otpCode)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-3xs flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-xs"
                      >
                        {copiedOtp ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>Auto-Fill Code</span>
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-center">
                      <span className="text-3xs text-slate-400 block mb-0.5">Verification Code</span>
                      <span className="font-mono text-xl font-black tracking-widest text-slate-900 dark:text-slate-100">
                        {item.otpCode}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
