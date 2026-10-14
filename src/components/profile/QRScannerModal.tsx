import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  X,
  Zap,
  RefreshCw,
  Upload,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  ExternalLink,
  MapPin,
  Briefcase,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  RotateCcw,
} from 'lucide-react';
import { ScannedUserProfile } from '../../types';
import { verifyServerQrPayload } from '../../services/userService';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChatWithUser?: (email: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onOpenChatWithUser,
}) => {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [cameraState, setCameraState] = useState<'requesting' | 'granted' | 'denied' | 'unsupported'>('requesting');
  const [permissionErrorMsg, setPermissionErrorMsg] = useState<string | null>(null);

  // Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedUser, setScannedUser] = useState<ScannedUserProfile | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize Camera Stream
  useEffect(() => {
    if (!isOpen || scannedUser) {
      stopCameraStream();
      return;
    }

    startCameraStream();

    return () => {
      stopCameraStream();
    };
  }, [isOpen, facingMode, scannedUser]);

  const stopCameraStream = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCameraStream = async () => {
    stopCameraStream();
    setCameraState('requesting');
    setPermissionErrorMsg(null);
    setScanError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unsupported');
      setPermissionErrorMsg('Camera access is not supported by this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      setCameraState('granted');

      // Check torch capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : {};
      setHasTorchSupport(!!capabilities.torch);

      // Start detection loop
      startScanningLoop();
    } catch (err: any) {
      console.warn('Camera permission denied or error:', err);
      setCameraState('denied');
      setPermissionErrorMsg(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera access was denied. You can grant camera permission in your browser or upload an image below.'
          : 'Could not access camera: ' + (err.message || 'Unknown error')
      );
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextTorch = !torchEnabled;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchEnabled(nextTorch);
    } catch (e) {
      console.warn('Torch toggle failed', e);
    }
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Video Scan Decoding Loop
  const startScanningLoop = () => {
    const scan = () => {
      if (!videoRef.current || !canvasRef.current || isVerifying || scannedUser) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleDecodedPayload(code.data);
          return; // stop scanning while verifying
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(scan);
    };

    animationFrameIdRef.current = requestAnimationFrame(scan);
  };

  // Process and verify scanned QR code payload
  const handleDecodedPayload = async (rawPayload: string) => {
    setIsVerifying(true);
    setScanError(null);

    try {
      let parsed: any;
      try {
        parsed = JSON.parse(rawPayload);
      } catch {
        throw new Error('Invalid or Unsupported QR Code');
      }

      // Check 1: Does the payload match the app QR schema (type === 'USER_PROFILE')?
      if (!parsed || typeof parsed !== 'object' || parsed.type !== 'USER_PROFILE') {
        throw new Error('Invalid or Unsupported QR Code');
      }

      // Check 2: Verify checksum / query backend endpoint /api/qr/verify
      const res = await verifyServerQrPayload(parsed);

      if (!res.valid || !res.user) {
        throw new Error(res.error || 'Invalid or Unsupported QR Code');
      }

      // Valid profile! Stop camera and show profile preview
      stopCameraStream();
      setScannedUser(res.user);
    } catch (err: any) {
      setScanError(err.message || 'Invalid or Unsupported QR Code');
    } finally {
      setIsVerifying(false);
    }
  };

  // Image File Upload Fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleDecodedPayload(code.data);
        } else {
          setScanError('No QR code detected in the uploaded image.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResetScanner = () => {
    setScannedUser(null);
    setScanError(null);
    startCameraStream();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                Scan Profile QR Code
              </h2>
              <p className="text-2xs text-slate-500 dark:text-slate-400">
                Align code in the viewfinder to verify identity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* HIDDEN OFFSCREEN CANVAS FOR FRAME EXTRACTION */}
        <canvas ref={canvasRef} className="hidden" />

        {/* STATE A: VERIFIED USER PROFILE RESULT */}
        {scannedUser ? (
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Verified User Profile
                </p>
                <p className="text-3xs text-emerald-700/80 dark:text-emerald-400/80">
                  Cryptographic signature and identity confirmed
                </p>
              </div>
            </div>

            {/* Profile Card Preview */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={scannedUser.avatarUrl}
                  alt={scannedUser.fullName}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/40 shadow-sm"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
                      {scannedUser.fullName}
                    </h3>
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  </div>
                  <p className="text-xs font-mono text-slate-400">@{scannedUser.username}</p>
                  {scannedUser.occupation && (
                    <p className="text-2xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      {scannedUser.occupation}
                    </p>
                  )}
                </div>
              </div>

              {scannedUser.bio && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800">
                  {scannedUser.bio}
                </p>
              )}

              {scannedUser.location && (
                <p className="text-2xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {scannedUser.location}
                </p>
              )}

              {/* Social Links */}
              {scannedUser.socialLinks && Object.values(scannedUser.socialLinks).some(Boolean) && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  {scannedUser.socialLinks.instagram && (
                    <a
                      href={scannedUser.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-pink-500/10 text-pink-600 hover:scale-105 transition-transform"
                      title="Instagram"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {scannedUser.socialLinks.twitter && (
                    <a
                      href={scannedUser.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-sky-500/10 text-sky-600 hover:scale-105 transition-transform"
                      title="Twitter"
                    >
                      <Twitter className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {scannedUser.socialLinks.facebook && (
                    <a
                      href={scannedUser.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-blue-500/10 text-blue-600 hover:scale-105 transition-transform"
                      title="Facebook"
                    >
                      <Facebook className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {scannedUser.socialLinks.youtube && (
                    <a
                      href={scannedUser.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-red-500/10 text-red-600 hover:scale-105 transition-transform"
                      title="YouTube"
                    >
                      <Youtube className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

              {/* Google Chat Action Button */}
              {scannedUser.googleChatEmail && (
                <div className="pt-2">
                  <a
                    href={`https://mail.google.com/chat/u/0/#chat/dm/${encodeURIComponent(
                      scannedUser.googleChatEmail
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (onOpenChatWithUser && scannedUser.googleChatEmail) {
                        onOpenChatWithUser(scannedUser.googleChatEmail);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message on Google Chat ({scannedUser.googleChatEmail})
                  </a>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleResetScanner}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Scan Another Code
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* STATE B: LIVE CAMERA VIEWFINDER & SCANNER */
          <div className="space-y-4">
            {/* Viewfinder Container */}
            <div className="relative w-full aspect-square bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
              {cameraState === 'granted' ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />

                  {/* Viewfinder Reticle & Target Guide */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                    <div className="relative w-48 h-48 border-2 border-emerald-400/90 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                      {/* Animated scanning laser */}
                      <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse top-1/2 -translate-y-1/2" />
                      {/* Corner Accents */}
                      <span className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-white rounded-tl-sm" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-white rounded-tr-sm" />
                      <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-white rounded-bl-sm" />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-white rounded-br-sm" />
                    </div>
                  </div>

                  {/* In-viewfinder control buttons */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {hasTorchSupport && (
                      <button
                        onClick={toggleTorch}
                        className={`p-2 rounded-xl backdrop-blur-md transition-colors cursor-pointer ${
                          torchEnabled
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-black/50 text-white hover:bg-black/70'
                        }`}
                        title="Toggle Flashlight"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={switchCamera}
                      className="p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-colors cursor-pointer"
                      title="Switch Camera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                /* Fallback when camera permission denied or requesting */
                <div className="text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-300">
                    {cameraState === 'requesting'
                      ? 'Requesting camera access...'
                      : 'Camera access denied or unavailable'}
                  </p>
                  <p className="text-2xs text-slate-400 max-w-xs mx-auto">
                    {permissionErrorMsg || 'Please grant camera access or upload a QR image below.'}
                  </p>
                  {cameraState === 'denied' && (
                    <button
                      onClick={startCameraStream}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-2xs font-bold transition-colors cursor-pointer"
                    >
                      Retry Camera
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Error Banner when tampered/invalid QR is scanned */}
            {scanError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs animate-in shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold">{scanError}</span>
                  <p className="text-3xs text-rose-600 dark:text-rose-400 mt-0.5">
                    Make sure the QR code was generated by Aura Habit.
                  </p>
                </div>
              </div>
            )}

            {/* Image upload fallback */}
            <div className="pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-400" />
                Scan Image / Screenshot from Device
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
