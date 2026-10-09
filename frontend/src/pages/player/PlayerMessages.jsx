import React, { useEffect, useState, useRef } from 'react';
import { Shell } from '../../components/Shell';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { Send, MessageSquare, User, PlusCircle, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PlayerMessages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [threadsData, setThreadsData] = useState({ threads: [], coaches: [] });
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [activeCoach, setActiveCoach] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const loadThreadsAndCoaches = async () => {
    try {
      const data = await api.getPlayerThreads();
      setThreadsData(data || { threads: [], coaches: [] });

      // If no active thread selected and threads exist, select the first thread
      if (!activeThreadId && data?.threads && data.threads.length > 0) {
        setActiveThreadId(data.threads[0].id);
        setActiveCoach({
          name: data.threads[0].coach_name,
          specialty: data.threads[0].specialty,
        });
      }
    } catch (err) {
      console.error('Failed to load player threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (threadId) => {
    if (!threadId) return;
    try {
      const data = await api.getPlayerThreadMessages(threadId);
      setMessages(data || []);
    } catch (err) {
      console.error('Failed to load player messages:', err);
    }
  };

  useEffect(() => {
    loadThreadsAndCoaches();
    const interval = setInterval(loadThreadsAndCoaches, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeThreadId) {
      loadMessages(activeThreadId);
      const interval = setInterval(() => loadMessages(activeThreadId), 5000);
      return () => clearInterval(interval);
    }
  }, [activeThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectCoach = async (coach) => {
    setActiveCoach(coach);
    try {
      const thread = await api.startPlayerThread(coach.coach_id);
      setActiveThreadId(thread.id);
      loadMessages(thread.id);
    } catch (err) {
      console.error('Failed to start thread with coach:', err);
    }
  };

  const handleSelectThread = (thread) => {
    setActiveThreadId(thread.id);
    setActiveCoach({
      name: thread.coach_name,
      specialty: thread.specialty,
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThreadId || sending) return;

    const bodyText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const sentMsg = await api.sendPlayerMessage(activeThreadId, bodyText);
      setMessages((prev) => [...prev, sentMsg]);
      loadThreadsAndCoaches();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const threads = threadsData.threads || [];
  const coaches = threadsData.coaches || [];

  return (
    <Shell
      title="Coach Messages"
      subtitle="Direct line of communication with certified cricket instructors."
    >
      {threadsData.locked ? (
        <div className="app-card border-2 border-gold/40 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 p-8 sm:p-12 text-center rounded-[28px] shadow-lg animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gold/15 text-gold-dark flex items-center justify-center mx-auto mb-5 shadow-2xs">
            <Lock className="w-8 h-8" />
          </div>
          <span className="inline-block px-3 py-1 bg-gold/20 text-gold-dark font-bold text-xs rounded-full uppercase tracking-wider mb-2">
            Subscriber Only Feature
          </span>
          <h2 className="font-heading font-extrabold text-3xl text-navy mb-3">
            This Feature Requires an Active Subscription
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6 leading-relaxed">
            Direct 1-on-1 mentorship chat with certified coaches, real-time technique analysis, and personalized drills are reserved for active Cricket Vault subscribers.
          </p>

          <div className="inline-flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 mb-8 text-xs text-slate-700 shadow-2xs">
            <Sparkles className="w-4 h-4 text-gold shrink-0" />
            <span className="font-semibold">Subscribe now to unlock unlimited direct messaging and video reviews.</span>
          </div>

          <div>
            <button
              onClick={() => navigate('/player/plans')}
              className="px-6 py-3.5 bg-forest hover:bg-forest-light text-white text-sm font-bold rounded-xl transition-all shadow-md inline-flex items-center space-x-2 group"
            >
              <span>View Subscription Plans</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[650px]">
        {/* Left Card: THREADS & START A CHAT */}
        <div className="app-card p-0 flex flex-col overflow-hidden h-full">
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {/* THREADS Header & List */}
            <div>
              <div className="p-4 bg-slate-50/50 border-b border-surface-border">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  THREADS
                </span>
              </div>

              {threads.length === 0 ? (
                <div className="p-4 text-xs text-slate-400">No active threads yet.</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {threads.map((t) => {
                    const isSelected = t.id === activeThreadId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelectThread(t)}
                        className={`w-full text-left p-4 transition-colors flex items-start space-x-3 ${
                          isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-forest text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {t.coach_name ? t.coach_name.charAt(0).toUpperCase() : 'C'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-navy truncate">
                              {t.coach_name}
                            </span>
                            {t.has_unread && (
                              <span className="w-2.5 h-2.5 rounded-full bg-gold shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-forest font-medium">{t.specialty}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {t.last_message || 'Tap to message...'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* START A CHAT Section */}
            <div>
              <div className="p-4 bg-slate-50/50 border-b border-surface-border">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  START A CHAT
                </span>
              </div>

              <div className="divide-y divide-slate-50">
                {coaches.map((c) => {
                  const isSelected =
                    activeCoach && activeCoach.coach_id === c.coach_id;

                  return (
                    <button
                      key={c.coach_id}
                      onClick={() => handleSelectCoach(c)}
                      className={`w-full text-left px-4 py-3.5 transition-colors flex items-center justify-between ${
                        isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-sm text-navy block">
                          {c.name}
                        </span>
                        <span className="text-xs text-forest font-medium">
                          ({c.specialty})
                        </span>
                      </div>
                      <PlusCircle className="w-4 h-4 text-slate-400 hover:text-forest" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Conversation Area */}
        <div className="app-card p-0 md:col-span-2 flex flex-col overflow-hidden h-full">
          {activeThreadId && activeCoach ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-surface-border flex items-center justify-between bg-white">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-forest text-white flex items-center justify-center font-bold text-sm">
                    {activeCoach.name ? activeCoach.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-navy">{activeCoach.name}</h3>
                    <p className="text-[11px] text-forest font-medium">{activeCoach.specialty}</p>
                  </div>
                </div>
              </div>

              {/* Messages Bubble Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#F8FAFB]/60">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <MessageSquare className="w-8 h-8 mb-2 text-slate-300" />
                    <span>Start a conversation with {activeCoach.name}.</span>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isOwn = m.sender_id === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            isOwn
                              ? 'bg-forest text-white rounded-br-none shadow-xs'
                              : 'bg-white text-navy border border-surface-border rounded-bl-none shadow-xs'
                          }`}
                        >
                          {m.body}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {m.created_at
                            ? new Date(m.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 bg-white border-t border-surface-border flex items-center space-x-3"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="app-input flex-1 h-11 text-sm"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="btn-primary h-11 px-6 font-bold text-sm shadow-xs"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
              <h4 className="font-heading font-bold text-xl text-navy">No Coach Selected</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Pick an existing thread or click any coach from the left panel to start a conversation.
              </p>
            </div>
          )}
        </div>
      </div>
      )}
    </Shell>
  );
};
