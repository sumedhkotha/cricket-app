import React, { useEffect, useState, useRef } from 'react';
import { Shell } from '../../components/Shell';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import {
  User,
  ShieldCheck,
  Edit3,
  Camera,
  Trash2,
  X,
  Check,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Award
} from 'lucide-react';

export const PlayerProfile = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', text: '' }

  const loadProfile = async () => {
    try {
      const data = await api.getPlayerProfile();
      setProfile(data);
      setEditFormData(data);
    } catch (err) {
      console.error('Failed to load player profile:', err);
      setNotification({ type: 'error', text: 'Failed to load profile data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const showToast = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Photo handlers
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showToast('error', 'Please choose a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Profile photo size must be less than 5MB.');
      return;
    }

    setPhotoUploading(true);
    try {
      // Use uploadPhotoFile for server-side persistence
      const res = await api.uploadPhotoFile(file);
      const newUrl = res.photo_url;
      setProfile((prev) => ({ ...prev, photo_url: newUrl }));
      setEditFormData((prev) => ({ ...prev, photo_url: newUrl }));
      updateUser({ photo_url: newUrl });
      showToast('success', 'Profile photo updated successfully.');
    } catch (err) {
      // Fallback to base64 if needed
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const b64 = reader.result;
          await api.uploadPhotoBase64(b64);
          setProfile((prev) => ({ ...prev, photo_url: b64 }));
          setEditFormData((prev) => ({ ...prev, photo_url: b64 }));
          updateUser({ photo_url: b64 });
          showToast('success', 'Profile photo updated successfully.');
        };
        reader.readAsDataURL(file);
      } catch (innerErr) {
        showToast('error', err.message || 'Failed to upload photo.');
      }
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    setPhotoUploading(true);
    try {
      await api.removePhoto();
      setProfile((prev) => ({ ...prev, photo_url: null }));
      setEditFormData((prev) => ({ ...prev, photo_url: null }));
      updateUser({ photo_url: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast('success', 'Profile photo removed.');
    } catch (err) {
      showToast('error', err.message || 'Failed to remove photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  // Form edit handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOpenEdit = () => {
    setEditFormData({ ...profile });
    setIsEditing(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editFormData.name?.trim()) {
      showToast('error', 'Full Name is required.');
      return;
    }
    if (!editFormData.mobile?.trim()) {
      showToast('error', 'Phone Number is required.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.updatePlayerProfile({
        name: editFormData.name.trim(),
        mobile: editFormData.mobile.trim(),
        dob: editFormData.dob,
        location: (editFormData.location || editFormData.city || '').trim(),
        city: (editFormData.city || editFormData.location || '').trim(),
        playing_role: editFormData.playing_role,
        experience: editFormData.experience,
        batting_style: editFormData.batting_style,
        bowling_style: editFormData.bowling_style,
        photo_url: editFormData.photo_url,
      });

      const updated = res.profile;
      setProfile(updated);
      updateUser({
        name: updated.name,
        photo_url: updated.photo_url,
      });
      setIsEditing(false);
      showToast('success', 'Profile updated successfully!');
    } catch (err) {
      showToast('error', err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
        </div>
      </Shell>
    );
  }

  const p = profile || user || {};
  const currentPhoto = p.photo_url;
  const initial = p.name ? p.name.charAt(0).toUpperCase() : 'P';

  const rows = [
    { label: 'Full Name', value: p.name || 'Not provided' },
    { label: 'Email Address', value: p.email || 'Not provided' },
    { label: 'Phone Number', value: p.mobile || 'Not provided' },
    { label: 'Date of Birth', value: p.dob || (p.age ? `Age: ${p.age} years` : 'Not provided') },
    { label: 'City & Location', value: p.location || p.city || 'Not provided' },
    { label: 'Playing Role', value: p.playing_role || 'Batter' },
    { label: 'Cricket Experience', value: p.experience || 'Beginner' },
    { label: 'Batting Style', value: p.batting_style || 'Right-Handed' },
    { label: 'Bowling Style', value: p.bowling_style || 'None' },
  ];

  return (
    <Shell
      title="My Player Profile"
      subtitle="Manage your cricket credentials, personal details, and profile photo."
      headerAction={
        <button
          onClick={handleOpenEdit}
          className="btn-primary text-xs sm:text-sm px-5 py-2.5 font-bold flex items-center space-x-2"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Profile</span>
        </button>
      }
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`p-4 rounded-card border text-sm flex items-start space-x-2.5 animate-in fade-in slide-in-from-top-2 duration-200 ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            )}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="app-card shadow-soft p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-surface-border">
            {/* Avatar & Photo Controls */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-forest/20 shadow-md bg-forest flex items-center justify-center text-gold font-heading text-4xl font-bold">
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
                <span style={{ display: currentPhoto ? 'none' : 'block' }}>{initial}</span>

                {photoUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Photo Action Buttons */}
              <div className="flex items-center space-x-2 mt-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-navy flex items-center space-x-1 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-forest" />
                  <span>{currentPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                </button>

                {currentPhoto && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={photoUploading}
                    className="p-1 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Header Details */}
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-navy">
                  {p.name}
                </h2>
                <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-heading font-bold uppercase tracking-wider bg-gold text-navy-dark shadow-xs self-center sm:self-auto">
                  {p.playing_role || 'Athlete'}
                </span>
              </div>

              <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs font-semibold text-forest mt-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Cricket Vault Athlete</span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 mt-3 font-medium">
                {p.location && (
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1" />
                    {p.location}
                  </span>
                )}
                {p.experience && (
                  <span className="flex items-center">
                    <Award className="w-3.5 h-3.5 text-slate-400 mr-1" />
                    {p.experience} Level
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="divide-y divide-slate-100 mt-2">
            {rows.map((row, idx) => (
              <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-1">
                <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">
                  {row.label}
                </span>
                <span className="font-bold text-navy text-sm sm:text-right">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleOpenEdit}
              className="btn-primary text-xs sm:text-sm px-6 py-2.5 font-bold flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile Details</span>
            </button>
          </div>
        </div>

        {/* EDIT PROFILE MODAL */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-[24px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-10 shadow-2xl border border-surface-border">
              <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-6">
                <div>
                  <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-navy">
                    Edit Player Profile
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your personal and technical cricket information.
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={editFormData.name || ''}
                      onChange={handleFormChange}
                      className="app-input"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      required
                      value={editFormData.mobile || ''}
                      onChange={handleFormChange}
                      className="app-input"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={editFormData.dob || ''}
                      onChange={handleFormChange}
                      className="app-input"
                    />
                  </div>

                  {/* City and Location */}
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">
                      City & Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      required
                      value={editFormData.location || editFormData.city || ''}
                      onChange={handleFormChange}
                      className="app-input"
                    />
                  </div>

                  {/* Playing Role */}
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">
                      Playing Role *
                    </label>
                    <select
                      name="playing_role"
                      value={editFormData.playing_role || 'Batter'}
                      onChange={handleFormChange}
                      className="app-input"
                    >
                      <option value="Batter">Batter</option>
                      <option value="Bowler">Bowler</option>
                      <option value="All-Rounder">All-Rounder</option>
                      <option value="Wicketkeeper">Wicketkeeper</option>
                    </select>
                  </div>

                  {/* Cricket Experience */}
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">
                      Cricket Experience *
                    </label>
                    <select
                      name="experience"
                      value={editFormData.experience || 'Beginner'}
                      onChange={handleFormChange}
                      className="app-input"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  {/* Batting Style */}
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">
                      Batting Style *
                    </label>
                    <select
                      name="batting_style"
                      value={editFormData.batting_style || 'Right-Handed'}
                      onChange={handleFormChange}
                      className="app-input"
                    >
                      <option value="Right-Handed">Right-Handed</option>
                      <option value="Left-Handed">Left-Handed</option>
                    </select>
                  </div>

                  {/* Bowling Style */}
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">
                      Bowling Style *
                    </label>
                    <select
                      name="bowling_style"
                      value={editFormData.bowling_style || 'None'}
                      onChange={handleFormChange}
                      className="app-input"
                    >
                      <option value="None">None</option>
                      <option value="Right-Arm Fast">Right-Arm Fast</option>
                      <option value="Right-Arm Medium">Right-Arm Medium</option>
                      <option value="Left-Arm Fast">Left-Arm Fast</option>
                      <option value="Left-Arm Medium">Left-Arm Medium</option>
                      <option value="Right-Arm Spin">Right-Arm Spin</option>
                      <option value="Left-Arm Spin">Left-Arm Spin</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary px-5 py-2.5 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary px-6 py-2.5 text-xs font-bold shadow-md flex items-center space-x-1.5"
                  >
                    {saving ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
};
