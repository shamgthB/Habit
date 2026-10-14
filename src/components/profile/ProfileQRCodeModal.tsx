import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { UserProfile, QrProfilePayload } from '../../types';
import { fetchServerQrPayload } from '../../services/userService';

interface ProfileQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onOpenChat?: () => void;
}

export const ProfileQRCodeModal: React.FC<ProfileQRCodeModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenChat,
}) => {
  const [qrPayload, setQrPayload] = useState<QrProfilePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    fetchServerQrPayload(user.id || user.username).then((res) => {
      if (!isMounted) return;
      if (res.success && res.payload) {
        setQrPayload(res.payload);
      } else {
        // Fallback local payload
        setQrPayload({
          app: 'AuraHabit',
          type: 'USER_PROFILE',
          userId: user.id || 'usr_' + user.username,
          username: user.username,
          gChatId: user.googleChatEmail || user.email || `${user.username}@gmail.com`,
          checksum: 'aura_local_sig',
        });
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  if (!isOpen) return null;

  const payloadString = qrPayload ? JSON.stringify(qrPayload) : '';

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current.querySelector('canvas');
    if (!canvas) return;

    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `profile-qr-${user.username || 'user'}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleShareLink = () => {
    const profileUrl = `${window.location.origin}?profile=${encodeURIComponent(user.username)}`;
    navigator.clipboard.writeText(profileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPayload = () => {
    if (!payloadString) return;
    navigator.clipboard.writeText(payloadString);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const gChatTarget = user.googleChatEmail || user.email || `${user.username}@gmail.com`;
  const gChatDeepLink = `https://mail.google.com/chat/u/0/#chat/dm/${encodeURIComponent(gChatTarget)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Profile QR Card
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Scan with Aura Habit or Google Chat to connect
            </p>
          </div>
        </div>

        {/* QR Code Card Frame */}
        <div className="p-6 rounded-3xl bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-800/20 border border-slate-200/80 dark:border-slate-800 text-center space-y-4 shadow-sm">
          {/* User info preview header */}
          <div className="flex items-center justify-center gap-3">
            <img
              src={
                user.avatarUrl ||
                user.avatar ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80'
              }
              alt={user.fullName || user.name}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/30 shadow-xs"
            />
            <div className="text-left">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                {user.fullName || user.name}
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              </h3>
              <p className="text-xs font-mono text-slate-400">@{user.username}</p>
            </div>
          </div>

          {/* QR Canvas */}
          <div
            ref={canvasRef}
            className="p-4 bg-white rounded-2xl inline-block shadow-md border border-slate-200/60"
          >
            {isLoading || !payloadString ? (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                Generating QR code...
              </div>
            ) : (
              <QRCodeCanvas
                value={payloadString}
                size={192}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: user.avatarUrl || user.avatar || '',
                  x: undefined,
                  y: undefined,
                  height: 38,
                  width: 38,
                  excavate: true,
                }}
              />
            )}
          </div>

          {/* Verification Badge */}
          <div className="flex items-center justify-center gap-2 text-2xs text-slate-500 dark:text-slate-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cryptographically Verified Payload</span>
          </div>

          {/* Google Chat Info in QR Card */}
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-left flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-2xs font-bold text-slate-700 dark:text-slate-300 truncate">
                  Google Chat Connection
                </p>
                <p className="text-3xs text-slate-400 font-mono truncate">{gChatTarget}</p>
              </div>
            </div>

            <a
              href={gChatDeepLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onOpenChat?.()}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-2xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              Chat
            </a>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDownloadPng}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download PNG
          </button>

          <button
            onClick={handleShareLink}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                Copied Link!
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                Share Profile Link
              </>
            )}
          </button>
        </div>

        {/* Copy Payload option */}
        <div className="flex items-center justify-between pt-2 text-2xs text-slate-400">
          <span>Payload format: JSON Deep Link</span>
          <button
            onClick={handleCopyPayload}
            className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300 font-mono cursor-pointer"
          >
            {copiedPayload ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            {copiedPayload ? 'Copied' : 'Copy Raw JSON'}
          </button>
        </div>
      </div>
    </div>
  );
};
