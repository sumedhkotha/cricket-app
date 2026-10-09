import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '../../components/Shell';
import { api } from '../../api';
import { BookOpen, Library, Download, X, FileText } from 'lucide-react';

export const PlayerLibrary = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readerEbook, setReaderEbook] = useState(null);

  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const data = await api.getPlayerLibrary();
        setItems(data || []);
      } catch (err) {
        console.error('Failed to load library items:', err);
      } finally {
        setLoading(false);
      }
    };
    loadLibrary();
  }, []);

  return (
    <Shell
      title="My Library"
      subtitle="Access and study your purchased masterclass playbooks and practice plans."
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="app-card py-20 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center text-forest mb-4">
            <Library className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-navy">
            Your library is empty.
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">
            Visit{' '}
            <Link to="/player/ebooks" className="font-bold text-forest hover:underline">
              E-books
            </Link>{' '}
            to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((eb) => (
            <div
              key={eb.id}
              className="app-card flex flex-col justify-between p-0 overflow-hidden hover:shadow-elevated transition-shadow"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                <img
                  src={eb.cover_url}
                  alt={eb.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=600';
                  }}
                />
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="mb-2">
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                      {eb.category}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-2xl text-navy leading-snug">
                    {eb.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {eb.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setReaderEbook(eb)}
                    className="w-full btn-primary py-2.5 text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Open / Download</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Reader Modal */}
      {readerEbook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[20px] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-surface-border relative">
            <button
              onClick={() => setReaderEbook(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-navy hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-2xl text-navy leading-tight">
                  {readerEbook.title}
                </h3>
                <span className="text-xs text-slate-400 uppercase font-semibold">
                  Cricket Vault Official Edition · PDF Document
                </span>
              </div>
            </div>

            <div className="p-8 rounded-card bg-slate-50 border border-slate-200 text-center space-y-4 mb-6">
              <BookOpen className="w-12 h-12 text-forest mx-auto opacity-80" />
              <h4 className="font-heading font-bold text-xl text-navy">
                Complete Masterclass Guide Ready
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                {readerEbook.description} Includes detailed diagrams, technical checkpoints, drill progressions, and elite coach notes.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setReaderEbook(null)}
                className="btn-secondary text-xs px-5 py-2.5"
              >
                Close
              </button>
              <a
                href={readerEbook.file_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  alert(`Downloading ${readerEbook.title} (PDF edition)...`);
                }}
                className="btn-primary text-xs px-6 py-2.5 font-bold shadow-xs flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
};
