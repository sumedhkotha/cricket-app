import React, { useEffect, useState } from 'react';
import { Shell } from '../../components/Shell';
import { StatusPill } from '../../components/StatusPill';
import { api } from '../../api';
import { Search, UserCheck, UserX } from 'lucide-react';

export const AdminPlayers = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [togglingId, setTogglingId] = useState(null);

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
      // Update locally without a page reload
      setPlayers((prev) =>
        prev.map((p) => (p.id === player.id ? { ...p, status: res.status } : p))
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setTogglingId(null);
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
      subtitle="View, monitor and manage active and deactivated player profiles."
      headerAction={
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="app-input pl-10 text-sm h-10"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
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
    </Shell>
  );
};
