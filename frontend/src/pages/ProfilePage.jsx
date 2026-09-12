import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Shield,
  Mail,
  Calendar,
  Camera,
  Trash2,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import userService from '../services/userService';
import Avatar from '../components/ui/Avatar';
import ButtonSpinner from '../components/ui/ButtonSpinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function ProfilePage() {
  const { user, refreshUser, isManagerAdmin } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const fileInputRef = useRef(null);

  // --- Profile Info State ---
  const [name, setName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);

  // --- Avatar Upload State ---
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // --- Password Change State ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
  }, [user]);

  // Format joined date
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  // -------------------------------------------------------------
  // Profile Information Update
  // -------------------------------------------------------------
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setProfileError('Full name is required.');
      return;
    }

    if (trimmedName === user?.name) {
      toastSuccess('Profile is already up to date.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await userService.updateProfile({ name: trimmedName });
      await refreshUser();
      toastSuccess('Profile details updated successfully.');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
      toastError(err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // -------------------------------------------------------------
  // Photo Selection & Validation
  // -------------------------------------------------------------
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers change
    e.target.value = '';

    // Validate type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toastError('Invalid file format. Allowed formats: JPG, PNG, or WebP.');
      return;
    }

    // Validate size (5MB limit)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toastError('Image exceeds the maximum allowed size of 5MB.');
      return;
    }

    // Read preview as Base64 data URL
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedPreview(reader.result);
    };
    reader.onerror = () => {
      toastError('Failed to read selected image.');
    };
    reader.readAsDataURL(file);
  };

  const handleCancelPreview = () => {
    setSelectedPreview(null);
  };

  const handleUploadPhoto = async () => {
    if (!selectedPreview) return;

    setIsUploadingPhoto(true);
    try {
      await userService.updateProfilePicture(selectedPreview);
      await refreshUser();
      setSelectedPreview(null);
      toastSuccess('Profile picture updated successfully.');
    } catch (err) {
      toastError(err.message || 'Failed to upload profile picture.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setShowRemoveConfirm(false);
    setIsRemovingPhoto(true);
    try {
      await userService.removeProfilePicture();
      await refreshUser();
      setSelectedPreview(null);
      toastSuccess('Profile picture removed successfully.');
    } catch (err) {
      toastError(err.message || 'Failed to remove profile picture.');
    } finally {
      setIsRemovingPhoto(false);
    }
  };

  // -------------------------------------------------------------
  // Password Change Handler
  // -------------------------------------------------------------
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }

    if (!newPassword) {
      setPasswordError('New password is required.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await userService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toastSuccess('Password changed successfully.');
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
      toastError(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm relative overflow-hidden shadow-xl shadow-black/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar / Photo Display */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="relative group">
              {selectedPreview ? (
                <img
                  src={selectedPreview}
                  alt="Preview"
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-brand-500/50 shadow-lg"
                />
              ) : (
                <Avatar
                  src={user?.avatar}
                  name={user?.name}
                  size="2xl"
                  ring={true}
                  className="w-28 h-28 text-3xl"
                />
              )}

              {/* Quick Change Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto || isRemovingPhoto}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-semibold transition-opacity duration-200 cursor-pointer disabled:pointer-events-none"
                aria-label="Change profile photo"
              >
                <Camera className="w-6 h-6 mb-1 text-brand-300" />
                <span>Upload</span>
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Select profile picture"
            />
          </div>

          {/* User Summary & Photo Actions */}
          <div className="flex-1 text-center sm:text-left space-y-3 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                  {user?.name || 'User Profile'}
                </h1>
                <p className="text-sm text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </p>
              </div>

              {/* Status & Role Badges */}
              <div className="flex items-center justify-center sm:justify-end gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                    isManagerAdmin
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                      : 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                  }`}
                >
                  {isManagerAdmin ? (
                    <Shield className="w-3 h-3" />
                  ) : (
                    <User className="w-3 h-3" />
                  )}
                  {user?.role}
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 pt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Member since {joinedDate}</span>
            </div>

            {/* Photo Action Controls */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              {selectedPreview ? (
                <>
                  <button
                    type="button"
                    onClick={handleUploadPhoto}
                    disabled={isUploadingPhoto}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <ButtonSpinner />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save Photo</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPreview}
                    disabled={isUploadingPhoto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto || isRemovingPhoto}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-brand-400" />
                    <span>Change Photo</span>
                  </button>

                  {user?.avatar && (
                    <button
                      type="button"
                      onClick={() => setShowRemoveConfirm(true)}
                      disabled={isUploadingPhoto || isRemovingPhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
                    >
                      {isRemovingPhoto ? (
                        <ButtonSpinner />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>Remove Photo</span>
                    </button>
                  )}
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Allowed: JPG, PNG, WebP. Maximum size: 5 MB.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Personal Info & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Personal Information */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">
                  Personal Information
                </h2>
                <p className="text-xs text-slate-400">
                  Manage your display name and view account attributes
                </p>
              </div>
            </div>

            {profileError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
              {/* Full Name Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  disabled={isUpdatingProfile}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all disabled:opacity-50"
                  required
                />
              </div>

              {/* Email Address (Read-only) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Read-only
                  </span>
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-400 cursor-not-allowed"
                />
              </div>

              {/* Role & Status (Read-only) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Role</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Immutable
                    </span>
                  </label>
                  <input
                    type="text"
                    value={user?.role || ''}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Status</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Immutable
                    </span>
                  </label>
                  <input
                    type="text"
                    value="Active"
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono text-emerald-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold tracking-wide shadow-md shadow-brand-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50"
                >
                  {isUpdatingProfile ? (
                    <>
                      <ButtonSpinner />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Card 2: Security & Password Management */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Security & Password</h2>
                <p className="text-xs text-slate-400">
                  Update your authentication password securely
                </p>
              </div>
            </div>

            {passwordError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Current Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    disabled={isChangingPassword}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    aria-label={showCurrentPass ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    disabled={isChangingPassword}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    aria-label={showNewPass ? 'Hide password' : 'Show password'}
                  >
                    {showNewPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm New Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    disabled={isChangingPassword}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    aria-label={showConfirmPass ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold tracking-wide shadow-md shadow-amber-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                >
                  {isChangingPassword ? (
                    <>
                      <ButtonSpinner />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Photo Removal */}
      <ConfirmDialog
        isOpen={showRemoveConfirm}
        title="Remove Profile Photo"
        message="Are you sure you want to remove your profile picture? Your initials will be displayed instead."
        confirmText="Yes, Remove"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleRemovePhoto}
        onCancel={() => setShowRemoveConfirm(false)}
      />
    </div>
  );
}
