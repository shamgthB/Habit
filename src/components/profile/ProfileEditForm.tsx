import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  MapPin,
  Calendar,
  Briefcase,
  User as UserIcon,
  Check,
  AlertCircle,
  Loader2,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Save,
  X,
} from 'lucide-react';
import { UserProfile, UserSocialLinks } from '../../types';
import { uploadServerAvatar, updateServerUserProfile } from '../../services/userService';

interface ProfileEditFormProps {
  initialProfile: UserProfile;
  onSaveSuccess: (updatedProfile: UserProfile) => void;
  onCancel: () => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  initialProfile,
  onSaveSuccess,
  onCancel,
}) => {
  // Form fields
  const [fullName, setFullName] = useState(initialProfile.fullName || initialProfile.name || '');
  const [username, setUsername] = useState(initialProfile.username || '');
  const [bio, setBio] = useState(initialProfile.bio || '');
  const [dob, setDob] = useState(initialProfile.dob || '');
  const [gender, setGender] = useState<UserProfile['gender']>(initialProfile.gender || 'Prefer not to say');
  const [occupation, setOccupation] = useState(initialProfile.occupation || '');
  const [location, setLocation] = useState(initialProfile.location || '');
  const [googleChatEmail, setGoogleChatEmail] = useState(
    initialProfile.googleChatEmail || initialProfile.email || ''
  );

  // Social Links
  const [socialLinks, setSocialLinks] = useState<UserSocialLinks>({
    instagram: initialProfile.socialLinks?.instagram || '',
    twitter: initialProfile.socialLinks?.twitter || '',
    facebook: initialProfile.socialLinks?.facebook || '',
    youtube: initialProfile.socialLinks?.youtube || '',
  });

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl || initialProfile.avatar || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [avatarSuccessMsg, setAvatarSuccessMsg] = useState<string | null>(null);

  // Image Cropping Modal State
  const [selectedImageRaw, setSelectedImageRaw] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Location Geolocation loading state
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationSuccessNotice, setLocationSuccessNotice] = useState<string | null>(null);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag & Drop for avatar
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    setAvatarUploadError(null);
    setAvatarSuccessMsg(null);

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setAvatarUploadError('Selected file exceeds maximum limit of 5MB.');
      return;
    }

    // Validate mime type
    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      setAvatarUploadError('Only PNG, JPG, and WEBP formats are supported.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImageRaw(result);
      setZoomLevel(1);
      setCropOffset({ x: 0, y: 0 });
    };
    reader.onerror = () => {
      setAvatarUploadError('Could not read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Perform canvas crop and upload
  const applyCropAndUpload = async () => {
    if (!selectedImageRaw) return;

    setIsUploadingAvatar(true);
    setAvatarUploadError(null);

    try {
      const img = new Image();
      img.src = selectedImageRaw;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const size = 320;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context unavailable');

      // Draw circular crop
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      const naturalAspect = img.width / img.height;
      let drawW = size * zoomLevel;
      let drawH = (size / naturalAspect) * zoomLevel;
      if (naturalAspect < 1) {
        drawH = size * zoomLevel;
        drawW = size * naturalAspect * zoomLevel;
      }

      const drawX = (size - drawW) / 2 + cropOffset.x;
      const drawY = (size - drawH) / 2 + cropOffset.y;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.88);

      // Upload to backend
      const res = await uploadServerAvatar(croppedBase64);
      if (res.success && res.avatarUrl) {
        setAvatarUrl(res.avatarUrl);
        setAvatarSuccessMsg('Avatar uploaded successfully!');
        setSelectedImageRaw(null);
      } else {
        setAvatarUploadError(res.error || 'Failed to save avatar image.');
      }
    } catch (err: any) {
      setAvatarUploadError(err.message || 'Error processing cropped image.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Auto-detect location via Browser Geolocation API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    setLocationSuccessNotice(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Reverse geocoding via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          if (res.ok) {
            const data = await res.json();
            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.county ||
              '';
            const country = data.address?.country || '';
            const detectedStr = city && country ? `${city}, ${country}` : country || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
            setLocation(detectedStr);
            setLocationSuccessNotice(`Detected: ${detectedStr}`);
          } else {
            setLocation(`Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`);
          }
        } catch {
          // Fallback if network blocked
          setLocation('Detected Location');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          setFormError('Location permission denied. Please enter your location manually.');
        } else {
          setFormError('Unable to detect location. Please enter manually.');
        }
      },
      { timeout: 8000 }
    );
  };

  // Auto-normalizing social media handles
  const handleSocialChange = (
    platform: keyof UserSocialLinks,
    value: string
  ) => {
    setSocialLinks((prev) => ({
      ...prev,
      [platform]: value,
    }));
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate Bio length
    if (bio.length > 250) {
      setFormError('Bio exceeds the 250 characters limit.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await updateServerUserProfile({
        name: fullName.trim() || initialProfile.name,
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        dob,
        gender,
        occupation: occupation.trim(),
        location: location.trim(),
        socialLinks,
        googleChatEmail: googleChatEmail.trim(),
        avatar: avatarUrl,
        avatarUrl,
      });

      if (res.success && res.user) {
        onSaveSuccess({
          ...initialProfile,
          ...res.user,
          name: res.user.fullName || res.user.name || fullName,
          avatar: res.user.avatarUrl || avatarUrl,
        });
      } else {
        setFormError(res.error || 'Failed to update profile. Please try again.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error updating profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Edit User Profile
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Update personal identity details, social links, and Google Chat connection
          </p>
        </div>
        <button
          onClick={onCancel}
          type="button"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* SECTION 1: AVATAR UPLOAD & CROP */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Profile Photo (PNG, JPG, WEBP • Max 5MB)
        </label>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group shrink-0">
            <img
              src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80'}
              alt="Avatar preview"
              className="w-24 h-24 rounded-3xl object-cover ring-4 ring-emerald-500/20 shadow-md group-hover:opacity-90 transition-opacity"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-colors cursor-pointer"
              title="Change Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 w-full border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Click to browse or drag and drop image here
            </p>
            <p className="text-2xs text-slate-400 mt-1">
              Supports high-resolution cropping with interactive zoom
            </p>
          </div>
        </div>

        {avatarUploadError && (
          <p className="text-2xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {avatarUploadError}
          </p>
        )}
        {avatarSuccessMsg && (
          <p className="text-2xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
            <Check className="w-3.5 h-3.5" />
            {avatarSuccessMsg}
          </p>
        )}
      </div>

      {/* INTERACTIVE CROP MODAL */}
      {selectedImageRaw && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-500" />
                Adjust & Crop Avatar
              </h3>
              <button
                onClick={() => setSelectedImageRaw(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden bg-slate-950 flex items-center justify-center cursor-grab active:cursor-grabbing border border-slate-800 shadow-inner select-none"
              onMouseDown={(e) => {
                setIsDraggingCrop(true);
                dragStartRef.current = { x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y };
              }}
              onMouseMove={(e) => {
                if (!isDraggingCrop) return;
                setCropOffset({
                  x: e.clientX - dragStartRef.current.x,
                  y: e.clientY - dragStartRef.current.y,
                });
              }}
              onMouseUp={() => setIsDraggingCrop(false)}
              onMouseLeave={() => setIsDraggingCrop(false)}
            >
              <img
                src={selectedImageRaw}
                alt="Crop preview"
                style={{
                  transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${zoomLevel})`,
                  maxWidth: 'none',
                }}
                className="pointer-events-none transition-transform duration-75 max-w-none"
              />
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400/80 pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
            </div>

            {/* Zoom Slider */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-2xs text-slate-500 font-semibold">
                <span className="flex items-center gap-1">
                  <ZoomOut className="w-3.5 h-3.5" /> Zoom
                </span>
                <span>{Math.round(zoomLevel * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="3"
                step="0.05"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setZoomLevel(1);
                  setCropOffset({ x: 0, y: 0 });
                }}
                className="flex items-center gap-1 text-2xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Pan
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedImageRaw(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyCropAndUpload}
                  disabled={isUploadingAvatar}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save & Crop
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: PROFILE DETAILS FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              Full Name *
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

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <span className="font-mono text-slate-400">@</span>
              Username Handle
            </label>
            <input
              type="text"
              readOnly
              value={username}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-xs font-mono text-slate-500 cursor-not-allowed"
              title="Username is locked after creation"
            />
          </div>

          {/* Date of Birth (DOB) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Gender Identity
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-Binary">Non-Binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              Occupation / Role
            </label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="e.g. Software Engineer / Architect"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Location with Geolocation Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Current Location
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="text-2xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isDetectingLocation ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Auto-detect
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
            />
            {locationSuccessNotice && (
              <p className="text-3xs text-emerald-600 dark:text-emerald-400 mt-1">
                {locationSuccessNotice}
              </p>
            )}
          </div>

          {/* Google Chat Email */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Google Chat Handle / Email
            </label>
            <input
              type="email"
              value={googleChatEmail}
              onChange={(e) => setGoogleChatEmail(e.target.value)}
              placeholder="e.g. user@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
            />
            <p className="text-3xs text-slate-400 mt-1">
              Used to enable friends and teammates to deep-link directly into Google Chat conversations.
            </p>
          </div>

          {/* Bio (max 250 characters) */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Personal Bio
              </label>
              <span
                className={`text-2xs font-mono ${
                  bio.length > 230
                    ? bio.length > 250
                      ? 'text-rose-600 font-bold'
                      : 'text-amber-500 font-bold'
                    : 'text-slate-400'
                }`}
              >
                {bio.length}/250 characters
              </span>
            </div>
            <textarea
              rows={3}
              value={bio}
              maxLength={250}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share your habit philosophy, focus areas, or personal goals..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 leading-relaxed"
            />
          </div>
        </div>

        {/* SECTION 3: SOCIAL MEDIA ACCOUNTS */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Social Media Connections
            </h3>
            <p className="text-2xs text-slate-400 mt-0.5">
              Handles are automatically normalized to verified profile links
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Instagram */}
            <div>
              <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-500" />
                Instagram
              </label>
              <input
                type="text"
                value={socialLinks.instagram || ''}
                onChange={(e) => handleSocialChange('instagram', e.target.value)}
                placeholder="@username or profile URL"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Twitter / X */}
            <div>
              <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Twitter className="w-3.5 h-3.5 text-sky-500" />
                Twitter (X)
              </label>
              <input
                type="text"
                value={socialLinks.twitter || ''}
                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                placeholder="@handle or profile URL"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Facebook */}
            <div>
              <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Facebook className="w-3.5 h-3.5 text-blue-600" />
                Facebook
              </label>
              <input
                type="text"
                value={socialLinks.facebook || ''}
                onChange={(e) => handleSocialChange('facebook', e.target.value)}
                placeholder="username or profile link"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* YouTube */}
            <div>
              <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                YouTube
              </label>
              <input
                type="text"
                value={socialLinks.youtube || ''}
                onChange={(e) => handleSocialChange('youtube', e.target.value)}
                placeholder="@channel or channel URL"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
