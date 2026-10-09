import React, { useState, useEffect } from 'react';
import { Shell } from '../../components/Shell';
import { api } from '../../api';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Send,
  Save,
  Tag,
  Calendar,
  Search
} from 'lucide-react';

const CATEGORIES = [
  'General',
  'Training Drills',
  'Schedule Update',
  'Match Preparation',
  'Fitness & Recovery',
  'Important Notice'
];

export const CoachAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'General',
    target_audience: 'all_subscribers',
    target_user_ids: [],
    published: true
  });
  const [formErrors, setFormErrors] = useState({});

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [annData, recData] = await Promise.all([
        api.getCoachAnnouncements(),
        api.getCoachAnnouncementRecipients().catch(() => ({ recipients: [] }))
      ]);
      setAnnouncements(annData.announcements || []);
      setRecipients(recData.recipients || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
      setError('Unable to load coach announcements. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      message: '',
      category: 'General',
      target_audience: 'all_subscribers',
      target_user_ids: [],
      published: true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      title: item.title || '',
      message: item.message || '',
      category: item.category || 'General',
      target_audience: item.target_audience || 'all_subscribers',
      target_user_ids: item.target_user_ids || [],
      published: Boolean(item.published)
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Announcement title is required.';
    if (!formData.message.trim()) errors.message = 'Message content is required.';
    if (formData.target_audience === 'selected_players' && (!formData.target_user_ids || formData.target_user_ids.length === 0)) {
      errors.recipients = 'Please select at least one player recipient.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e, forcePublishState = null) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    const payload = {
      ...formData,
      published: forcePublishState !== null ? forcePublishState : formData.published
    };

    try {
      if (editingId) {
        await api.updateCoachAnnouncement(editingId, payload);
        setSuccess('Announcement updated successfully.');
      } else {
        await api.createCoachAnnouncement(payload);
        setSuccess(payload.published ? 'Announcement published successfully!' : 'Announcement saved as draft.');
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to save announcement:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to save announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (item) => {
    try {
      const nextState = !item.published;
      await api.publishCoachAnnouncement(item.id, nextState);
      setSuccess(`Announcement marked as ${nextState ? 'Published' : 'Draft'}.`);
      await loadData();
    } catch (err) {
      console.error('Failed to update publish state:', err);
      setError('Could not update publication status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      return;
    }
    setIsDeletingId(id);
    try {
      await api.deleteCoachAnnouncement(id);
      setSuccess('Announcement deleted successfully.');
      await loadData();
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      setError('Failed to delete announcement.');
    } finally {
      setIsDeletingId(null);
    }
  };

  const togglePlayerRecipient = (playerId) => {
    setFormData(prev => {
      const current = prev.target_user_ids || [];
      const updated = current.includes(playerId)
        ? current.filter(id => id !== playerId)
        : [...current, playerId];
      return { ...prev, target_user_ids: updated };
    });
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <Shell>
      {/* Header Banner */}
      <div className="rounded-[28px] bg-gradient-to-r from-[#0F4A30] to-[#0B3D2B] p-8 sm:p-10 text-white mb-8 shadow-elevated relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full text-gold text-xs font-bold tracking-wider uppercase mb-3">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Coach Communications</span>
            </div>
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight">
              Player Announcements
            </h1>
            <p className="text-white/80 text-sm sm:text-base mt-2 font-medium max-w-xl">
              Broadcast training schedules, match preparation guidelines, drill updates, and personalized notes directly to your subscribed players.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="self-start md:self-auto px-5 py-3 bg-gold hover:bg-gold-light text-navy font-bold rounded-xl transition-all shadow-md flex items-center space-x-2 text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Announcement</span>
          </button>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Notifications */}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-sm animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center justify-between text-sm animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Announcements List */}
      <div className="app-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-heading font-bold text-2xl text-navy">
              Published & Draft Bulletins
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your notifications and keep athletes up to date with academy routines.
            </p>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg self-start sm:self-auto">
            Total: {announcements.length}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-forest" />
            <p className="text-sm">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-heading font-bold text-xl text-navy">No Announcements Created Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              Draft your first bulletin to inform subscribed players about upcoming drills, technique homework, or timing changes.
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-forest text-white text-xs font-bold rounded-xl hover:bg-forest-light transition-all"
            >
              Create Announcement
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((item) => {
              const isPub = Boolean(item.published);
              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isPub ? 'bg-white border-slate-200 shadow-2xs hover:border-forest/40' : 'bg-slate-50/80 border-dashed border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isPub
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isPub ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span>{isPub ? 'Published' : 'Draft'}</span>
                        </span>

                        {/* Category Badge */}
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>{item.category || 'General'}</span>
                        </span>

                        {/* Audience Badge */}
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-forest/10 text-forest">
                          <Users className="w-3 h-3 text-forest" />
                          <span>
                            {item.target_audience === 'selected_players'
                              ? `Selected Players (${(item.target_user_ids || []).length})`
                              : 'All Subscribed Players'}
                          </span>
                        </span>
                      </div>

                      <h3 className="font-heading font-bold text-xl text-navy tracking-tight mb-2">
                        {item.title}
                      </h3>

                      <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed mb-4">
                        {item.message}
                      </p>

                      <div className="flex items-center space-x-4 text-xs text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Posted: {formatDate(item.created_at)}</span>
                        </span>
                        {item.published_at && item.published && (
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Live since: {formatDate(item.published_at)}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-center gap-2 shrink-0 pt-2 sm:pt-0">
                      <button
                        onClick={() => handleTogglePublish(item)}
                        title={isPub ? 'Unpublish (Make Draft)' : 'Publish Announcement'}
                        className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1 border transition-all ${
                          isPub
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {isPub ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span className="text-[11px] font-bold">{isPub ? 'Unpublish' : 'Publish'}</span>
                      </button>

                      <button
                        onClick={() => openEditModal(item)}
                        title="Edit Announcement"
                        className="p-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:text-forest hover:border-forest transition-all flex items-center space-x-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="text-[11px]">Edit</span>
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isDeletingId === item.id}
                        title="Delete Announcement"
                        className="p-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 transition-all flex items-center space-x-1 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-[11px]">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT ANNOUNCEMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] border border-surface-border shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-forest to-forest-dark text-white relative flex items-center justify-between">
              <div>
                <span className="text-gold text-xs font-bold tracking-wider uppercase">
                  {editingId ? 'Modify Bulletin' : 'New Broadcast'}
                </span>
                <h3 className="font-heading font-bold text-2xl text-white mt-1">
                  {editingId ? 'Edit Announcement' : 'Create Announcement'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Announcement Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Weekend Match Simulation & Fielding Drill Timing"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-navy focus:outline-hidden transition-all ${
                    formErrors.title ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-forest'
                  }`}
                />
                {formErrors.title && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.title}</p>
                )}
              </div>

              {/* Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-navy bg-white focus:outline-hidden focus:border-forest transition-all"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Audience Scope <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-navy bg-white focus:outline-hidden focus:border-forest transition-all"
                  >
                    <option value="all_subscribers">All Subscribed Players</option>
                    <option value="selected_players">Selected Subscribed Players</option>
                  </select>
                </div>
              </div>

              {/* Selected Players list if target_audience === 'selected_players' */}
              {formData.target_audience === 'selected_players' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Player Recipients <span className="text-rose-500">*</span>
                  </label>
                  {recipients.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      No active subscribed players currently assigned to your roster.
                    </p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                      {recipients.map(p => {
                        const isChecked = formData.target_user_ids.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center space-x-3 p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                              isChecked ? 'bg-forest/10 border border-forest/20 text-navy font-semibold' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePlayerRecipient(p.id)}
                              className="rounded-sm text-forest focus:ring-forest"
                            />
                            <span>{p.name}</span>
                            <span className="text-slate-400 font-normal">({p.email})</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {formErrors.recipients && (
                    <p className="text-xs text-rose-500 mt-2">{formErrors.recipients}</p>
                  )}
                </div>
              )}

              {/* Message Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Announcement Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Provide comprehensive details, training schedule changes, match analysis instructions, or guidance..."
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-navy focus:outline-hidden transition-all ${
                    formErrors.message ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-forest'
                  }`}
                />
                {formErrors.message && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.message}</p>
                )}
              </div>

              {/* Publishing Status Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-navy block">Publish Immediately</span>
                  <span className="text-[11px] text-slate-500">
                    If checked, subscribed players will immediately see this announcement.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest"></div>
                </label>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-navy"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={submitting}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>Save as Draft</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={submitting}
                className="px-5 py-2.5 bg-forest text-white text-xs font-bold rounded-xl hover:bg-forest/90 transition-all shadow-xs disabled:opacity-50 flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Saving...' : 'Publish Announcement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
};
