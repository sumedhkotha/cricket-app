import React, { useEffect, useState, useRef } from 'react';
import { Shell } from '../../components/Shell';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import {
  Star,
  MapPin,
  Award,
  Edit3,
  Camera,
  Trash2,
  X,
  Check,
  AlertCircle,
  CheckCircle2,
  Clock,
  Briefcase
} from 'lucide-react';

export const CoachProfile = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [notification, setNotification] = useState(null);

  const loadProfile = async () => {
    try {
      const data = await api.getCoachProfile();
      setProfile(data);
      setEditFormData(data);
    } catch (err) {
      console.error('Failed to load coach profile:', err);
      showToast('error', 'Failed to load coach profile.');
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

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showToast('error', 'Please choose a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Profile photo size must be less than 5MB.');
      return;
    }

    setPhotoUploading(true);
    try {
      const res = await api.uploadPhotoFile(file);
      const newUrl = res.photo_url;
      setProfile((prev) => ({ ...prev, photo_url: newUrl }));
      setEditFormData((prev) => ({ ...prev, photo_url: newUrl }));
      updateUser({ photo_url: newUrl });
      showToast('success', 'Profile photo updated successfully.');
    } catch (err) {
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
      [name]: name === 'years_experience' ? parseInt(value) || 0 : value,
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

    setSaving(true);
    try {
      const res = await api.updateCoachProfile({
        name: editFormData.name.trim(),
        bio: editFormData.bio || editFormData.biography || '',
        biography: editFormData.biography || editFormData.bio || '',
        city: editFormData.city?.trim() || '',
        years_experience: Number(editFormData.years_experience) || 0,
        specialty: editFormData.specialty?.trim() || 'Batting Coach',
        qualifications: editFormData.qualifications?.trim() || 'Certified Level 3 Master Cricket Coach',
        photo_url: editFormData.photo_url,
      });

      const updated = res.profile;
      setProfile(updated);
      updateUser({
        name: updated.name,
        photo_url: updated.photo_url,
      });
      setIsEditing(false);
      showToast('success', 'Coach profile updated successfully!');
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

  const p = profile || {
    name: user?.name || 'Coach',
    email: user?.email || '',
    specialty: 'Batting Coach',
    bio: 'Cricket Vault Certified Coach.',
    city: 'Mumbai, India',
    years_experience: 10,
    rating_avg: 4.9,
    photo_url: null,
  };

  const initial = p.name ? p.name.charAt(0).toUpperCase() : 'C';

  return (
    <Shell
      title="Coach Profile"
      subtitle="Your public coaching identity and credentials visible to platform players."
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

        <div className="app-card flex flex-col items-center text-center p-10 sm:p-12 shadow-elevated">
          {/* Round Photo / Neutral Avatar */}
          <div className="relative w-36 h-36 rounded-full overflow-hidden mb-4 border-4 border-forest/15 shadow-md bg-forest flex items-center justify-center text-gold font-heading text-5xl font-bold">
            {p.photo_url ? (
              <img
                src={p.photo_url}
                alt={p.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <span style={{ display: p.photo_url ? 'none' : 'block' }}>{initial}</span>

            {photoUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Photo Action Buttons */}
          <div className="flex items-center space-x-2 mb-6">
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
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-navy flex items-center space-x-1.5 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-forest" />
              <span>{p.photo_url ? 'Change Photo' : 'Upload Photo'}</span>
            </button>

            {p.photo_url && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={photoUploading}
                className="p-1.5 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                title="Remove Photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Name */}
          <h2 className="font-heading font-extrabold text-4xl text-navy">
            {p.name}
          </h2>

          {/* Specialty Pill */}
          <div className="my-3">
            <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]">
              {p.specialty || 'Cricket Coach'}
            </span>
          </div>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-slate-600 mt-2">
            {p.city && (
              <span className="flex items-center">
                <MapPin className="w-4 h-4 text-slate-400 mr-1" />
                {p.city}
              </span>
            )}
            <span className="text-slate-300">·</span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 text-slate-400 mr-1" />
              {p.years_experience}+ years experience
            </span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center text-gold font-bold">
              <Star className="w-4 h-4 fill-gold text-gold mr-1" />
              Rating {p.rating_avg ? p.rating_avg.toFixed(1) : '4.9'}
            </span>
          </div>

          {/* Bio */}
          <div className="mt-8 pt-6 border-t border-slate-100 max-w-xl text-left sm:text-center w-full">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
              Coaching Biography
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed italic">
              "{p.bio || p.biography || 'Dedicated certified coach focusing on player technique, mental preparation, and tactical awareness.'}"
            </p>
          </div>

          {/* Accreditation Badge */}
          <div className="mt-8 flex items-center space-x-2 text-xs font-semibold text-forest bg-forest/10 px-4 py-2 rounded-full">
            <Award className="w-4 h-4" />
            <span>{p.qualifications || 'Certified Level 3 Master Cricket Coach'}</span>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 w-full flex justify-center">
            <button
              onClick={handleOpenEdit}
              className="btn-primary text-xs sm:text-sm px-6 py-2.5 font-bold flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Coach Profile</span>
            </button>
          </div>
        </div>

        {/* EDIT COACH PROFILE MODAL */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-[24px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-10 shadow-2xl border border-surface-border">
              <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-6">
                <div>
                  <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-navy">
                    Edit Coach Profile
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your public credentials and coaching information.
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
                      Coach Name *
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

                  {/* Specialization */}
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">
                      Coaching Specialization *
                    </label>
                    <input
                      type="text"
                      name="specialty"
                      required
                      value={editFormData.specialty || ''}
                      onChange={handleFormChange}
                      placeholder="e.g. Batting Coach, Fast Bowling Mentor"
                      className="app-input"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">
                      City / Location
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={editFormData.city || ''}
                      onChange={handleFormChange}
                      placeholder="e.g. Mumbai, India"
                      className="app-input"
                    />
                  </div>

                  {/* Years of Experience */}
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      name="years_experience"
                      min="1"
                      max="60"
                      value={editFormData.years_experience || 10}
                      onChange={handleFormChange}
                      className="app-input"
                    />
                  </div>
                </div>

                {/* Qualifications */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">
                    Accreditation & Qualifications
                  </label>
                  <input
                    type="text"
                    name="qualifications"
                    value={editFormData.qualifications || ''}
                    onChange={handleFormChange}
                    placeholder="e.g. Certified Level 3 Master Coach / Former Ranji Trophy Cricketer"
                    className="app-input"
                  />
                </div>

                {/* Biography */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">
                    Coaching Biography / Philosophy
                  </label>
                  <textarea
                    rows={4}
                    name="bio"
                    value={editFormData.bio || editFormData.biography || ''}
                    onChange={handleFormChange}
                    placeholder="Describe your coaching philosophy, background, and technique expertise..."
                    className="app-input"
                  />
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
