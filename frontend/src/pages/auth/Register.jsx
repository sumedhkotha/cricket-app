import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Camera, Trash2, CheckCircle2 } from 'lucide-react';

export const Register = () => {
  const { register, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    dob: '',
    location: '',
    photo_url: '',
    playing_role: 'Batter',
    experience: 'Beginner',
    batting_style: 'Right-Handed',
    bowling_style: 'None',
  });

  const [photoPreview, setPhotoPreview] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated && role) {
      if (role === 'player') {
        navigate('/player/plans', { replace: true });
      } else {
        navigate(`/${role}`, { replace: true });
      }
    }
  }, [isAuthenticated, role, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoSelect = (e) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please choose a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile photo size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result;
      setPhotoPreview(base64Data);
      setFormData((prev) => ({ ...prev, photo_url: base64Data }));
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    setFormData((prev) => ({ ...prev, photo_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validations
    if (!formData.name.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('A valid email address is required.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!formData.mobile.trim()) {
      setError('Phone Number is required.');
      return;
    }
    if (!formData.dob) {
      setError('Date of Birth is required.');
      return;
    }
    if (!formData.location.trim()) {
      setError('City / Location is required.');
      return;
    }

    setLoading(true);
    try {
      await register({
        ...formData,
        city: formData.location.trim(),
      });
      setSuccessMsg('Account created successfully! Redirecting to subscription plans...');
      setTimeout(() => {
        navigate('/player/plans', { replace: true });
      }, 700);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#F8FAFB]">
      <div className="w-full max-w-[840px] bg-white rounded-[20px] shadow-soft p-8 sm:p-12 border border-surface-border animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-forest rounded-[12px] flex items-center justify-center shadow-xs">
            <svg className="w-6 h-6" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="7" />
              <circle cx="50" cy="50" r="22" fill="none" stroke="#F59E0B" strokeWidth="6" />
              <circle cx="50" cy="50" r="8" fill="#F59E0B" />
            </svg>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="font-heading font-extrabold text-2xl tracking-wide text-navy">CRICKET</span>
            <span className="font-heading font-extrabold text-2xl tracking-wide text-gold">VAULT</span>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-navy tracking-tight">
            Create Your Profile — Player Registration
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Provide your cricket attributes to match with certified coaches. All fields marked with * are required.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-input bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-input bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start space-x-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo Upload Section */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-forest/20 bg-forest flex items-center justify-center text-gold font-heading text-3xl font-bold shrink-0 shadow-sm">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span>{formData.name ? formData.name.charAt(0).toUpperCase() : 'P'}</span>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-heading font-bold text-lg text-navy">Profile Photo</h3>
              <p className="text-xs text-slate-500 mt-0.5 mb-3">
                Upload a clear face photo or action picture (JPG, PNG, max 5MB).
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="register-photo-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary text-xs font-semibold px-4 py-2 flex items-center space-x-1.5"
                >
                  <Camera className="w-4 h-4 text-forest" />
                  <span>{photoPreview ? 'Change Photo' : 'Upload Photo'}</span>
                </button>

                {photoPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-medium flex items-center space-x-1"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Virat Kohli"
                className="app-input"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="athlete@example.com"
                className="app-input"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                Phone Number *
              </label>
              <input
                type="tel"
                name="mobile"
                required
                value={formData.mobile}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="app-input"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                Password *
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="app-input"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dob"
                required
                value={formData.dob}
                onChange={handleChange}
                className="app-input"
              />
            </div>

            {/* City and Location */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                City and Location *
              </label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                placeholder="Hyderabad, Telangana"
                className="app-input"
              />
            </div>

            {/* Playing Role Dropdown */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                Playing Role *
              </label>
              <select
                name="playing_role"
                value={formData.playing_role}
                onChange={handleChange}
                className="app-input"
              >
                <option value="Batter">Batter</option>
                <option value="Bowler">Bowler</option>
                <option value="All-Rounder">All-Rounder</option>
                <option value="Wicketkeeper">Wicketkeeper</option>
              </select>
            </div>

            {/* Cricket Experience Dropdown */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                Cricket Experience *
              </label>
              <select
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                className="app-input"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            {/* Batting Style Dropdown */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                Batting Style *
              </label>
              <select
                name="batting_style"
                value={formData.batting_style}
                onChange={handleChange}
                className="app-input"
              >
                <option value="Right-Handed">Right-Handed</option>
                <option value="Left-Handed">Left-Handed</option>
              </select>
            </div>

            {/* Bowling Style Dropdown */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                Bowling Style *
              </label>
              <select
                name="bowling_style"
                value={formData.bowling_style}
                onChange={handleChange}
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

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary h-12 text-base font-semibold shadow-md"
            >
              {loading ? 'Creating Your Profile...' : 'Save & Continue to Membership Plans'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-forest hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};
