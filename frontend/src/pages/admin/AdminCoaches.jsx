import React, { useEffect, useState } from 'react';
import { Shell } from '../../components/Shell';
import { api } from '../../api';
import { Star, MapPin, PlusCircle, X, AlertCircle } from 'lucide-react';

export const AdminCoaches = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '+91 98111 22233',
    specialty: 'Batting Coach',
    academy_name: 'Cricket Performance Hub',
    location: 'Hyderabad, India',
    bio: 'Certified professional cricket coach with expertise in technical mechanics.',
    experience_years: 10,
  });

  const loadCoaches = async () => {
    try {
      const data = await api.getAdminCoaches();
      setCoaches(data || []);
    } catch (err) {
      console.error('Failed to load coaches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoaches();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      await api.createAdminCoach(form);
      setIsCreateOpen(false);
      setForm({
        name: '',
        email: '',
        mobile: '+91 98111 22233',
        specialty: 'Batting Coach',
        academy_name: 'Cricket Performance Hub',
        location: 'Hyderabad, India',
        bio: 'Certified professional cricket coach with expertise in technical mechanics.',
        experience_years: 10,
      });
      await loadCoaches();
    } catch (err) {
      setCreateError(err.message || 'Failed to create coach');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Shell
      title="Certified Coaches"
      subtitle={`${coaches.length} certified cricket coaches on the platform providing technical evaluations.`}
      headerAction={
        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-primary text-sm h-10 px-4 flex items-center justify-center gap-1.5 shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Coach</span>
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coaches.map((c) => (
            <div
              key={c.id || c.user_id}
              className="app-card flex flex-col items-center text-center p-8 hover:shadow-elevated transition-shadow"
            >
              {/* Round Photo / Neutral Avatar */}
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-forest/20 shadow-md relative bg-forest flex items-center justify-center text-gold font-heading text-2xl font-bold">
                {c.photo_url || c.image_url ? (
                  <img
                    src={c.photo_url || c.image_url}
                    alt={c.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
                <span style={{ display: (c.photo_url || c.image_url) ? 'none' : 'block' }}>
                  {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                </span>
              </div>

              {/* Name */}
              <h3 className="font-heading font-bold text-2xl text-navy">{c.name}</h3>

              {/* Green Specialty Pill */}
              <div className="my-2.5">
                <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]">
                  {c.specialty}
                </span>
              </div>

              {/* Star Rating & Experience */}
              <div className="flex items-center space-x-2 text-sm font-semibold text-navy mt-1">
                <span className="flex items-center text-gold">
                  <Star className="w-4 h-4 fill-gold text-gold mr-1" />
                  {c.rating ? c.rating.toFixed(1) : c.rating_avg ? c.rating_avg.toFixed(1) : '5.0'}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-600">
                  {c.experience_years || c.years_experience || 8}y experience
                </span>
              </div>

              {/* Academy & Location */}
              {(c.academy_name || c.location || c.city) && (
                <div className="flex items-center text-xs text-slate-500 mt-2 gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="line-clamp-1">{c.academy_name || c.location || c.city}</span>
                </div>
              )}

              {c.bio && (
                <p className="text-xs text-slate-600 mt-4 leading-relaxed line-clamp-3">
                  {c.bio}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Coach Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-card shadow-2xl border border-surface-border w-full max-w-lg p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div>
                <h3 className="font-heading font-bold text-2xl text-navy">Add Certified Coach</h3>
                <p className="text-slate-500 text-xs mt-0.5">Register a coach profile and login credentials</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Coach Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Raina"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="app-input text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="coach@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="app-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Mobile</label>
                  <input
                    type="text"
                    placeholder="+91 98111 22233"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className="app-input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Specialty</label>
                  <select
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    className="app-input text-sm"
                  >
                    <option value="Batting Coach">Batting Coach</option>
                    <option value="Fast Bowling Coach">Fast Bowling Coach</option>
                    <option value="Spin Bowling Mentor">Spin Bowling Mentor</option>
                    <option value="Fielding & Reflex Coach">Fielding & Reflex Coach</option>
                    <option value="Wicketkeeping Specialist">Wicketkeeping Specialist</option>
                    <option value="All-Round Performance">All-Round Performance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="45"
                    value={form.experience_years}
                    onChange={(e) => setForm({ ...form, experience_years: parseInt(e.target.value) || 5 })}
                    className="app-input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Academy / Affiliation</label>
                <input
                  type="text"
                  placeholder="e.g. National Cricket Academy"
                  value={form.academy_name}
                  onChange={(e) => setForm({ ...form, academy_name: e.target.value })}
                  className="app-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai, India"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="app-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Bio / Profile Summary</label>
                <textarea
                  rows="3"
                  placeholder="Coach credentials and background..."
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="app-input text-sm py-2"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary text-sm px-6 py-2 shadow-xs"
                >
                  {creating ? 'Creating...' : 'Create Coach'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
};
