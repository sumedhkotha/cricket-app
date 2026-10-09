import React, { useEffect, useState } from 'react';
import { Shell } from '../../components/Shell';
import { StatusPill } from '../../components/StatusPill';
import { api } from '../../api';
import { Search, UserCheck, UserX, PlusCircle, X, AlertCircle } from 'lucide-react';

export const AdminPlayers = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '+91 98000 00000',
    location: 'Hyderabad, India',
    playing_role: 'Batter',
    experience: 'Intermediate',
    batting_style: 'Right Hand',
    bowling_style: 'None',
    age: 18,
  });

  const loadPlayers = async () => {
    try {
      const data = await api.getAdminPlayers();
      setPlayers(data || []);
    } catch (err) {
      console.error('Failed to load players:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handleToggleStatus = async (player) => {
    setTogglingId(player.id);
    try {
      const res = await api.togglePlayerStatus(player.id);
      setPlayers((prev) =>
        prev.map((p) => (p.id === player.id ? { ...p, status: res.status } : p))
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      await api.createAdminPlayer(form);
      setIsCreateOpen(false);
      setForm({
        name: '',
        email: '',
        mobile: '+91 98000 00000',
        location: 'Hyderabad, India',
        playing_role: 'Batter',
        experience: 'Intermediate',
        batting_style: 'Right Hand',
        bowling_style: 'None',
        age: 18,
      });
      await loadPlayers();
    } catch (err) {
      setCreateError(err.message || 'Failed to create player');
    } finally {
      setCreating(false);
    }
  };

  const filteredPlayers = players.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.location?.toLowerCase().includes(term) ||
      p.playing_role?.toLowerCase().includes(term)
    );
  });

  return (
    <Shell
      title="Players Management"
      subtitle="View, monitor, manage and create player profiles on the platform."
      headerAction={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="app-input pl-10 text-sm h-10 w-full"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary text-sm h-10 px-4 flex items-center justify-center gap-1.5 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Player</span>
          </button>
        </div>
      }
    >
      <div className="app-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-border bg-slate-50/50">
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Name
                </th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email
                </th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Location
                </th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Role
                </th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-forest/20 border-t-forest rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">
                    No players found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((p) => {
                  const isActive = p.status === 'active';
                  const isBusy = togglingId === p.id;
                  return (
                    <tr key={p.id} className="h-[70px] hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-6 font-semibold text-navy">
                        {p.name}
                        <div className="text-xs font-normal text-slate-400 md:hidden">{p.email}</div>
                      </td>
                      <td className="py-3 px-6 text-slate-600 text-sm">{p.email}</td>
                      <td className="py-3 px-6 text-slate-600 text-sm">{p.location || '—'}</td>
                      <td className="py-3 px-6 text-slate-700 text-sm font-medium">
                        {p.playing_role || 'Batter'}
                      </td>
                      <td className="py-3 px-6">
                        <StatusPill status={p.status} />
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          disabled={isBusy}
                          className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            isActive
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-forest text-forest hover:bg-forest/5'
                          }`}
                        >
                          {isBusy ? (
                            'Updating...'
                          ) : isActive ? (
                            <>
                              <UserX className="w-3.5 h-3.5 mr-1" /> Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5 mr-1" /> Activate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Player Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-card shadow-2xl border border-surface-border w-full max-w-lg p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div>
                <h3 className="font-heading font-bold text-2xl text-navy">Create New Player</h3>
                <p className="text-slate-500 text-xs mt-0.5">Register a player profile directly into the system</p>
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
                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Verma"
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
                    placeholder="vikram@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="app-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Mobile</label>
                  <input
                    type="text"
                    placeholder="+91 98000 00000"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className="app-input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Playing Role</label>
                  <select
                    value={form.playing_role}
                    onChange={(e) => setForm({ ...form, playing_role: e.target.value })}
                    className="app-input text-sm"
                  >
                    <option value="Batter">Batter</option>
                    <option value="Bowler">Bowler</option>
                    <option value="All-Rounder">All-Rounder</option>
                    <option value="Wicketkeeper">Wicketkeeper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Experience Level</label>
                  <select
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    className="app-input text-sm"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Location / City</label>
                <input
                  type="text"
                  placeholder="e.g. Hyderabad, India"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="app-input text-sm"
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
                  {creating ? 'Creating...' : 'Create Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
};
