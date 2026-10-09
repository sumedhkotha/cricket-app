import React, { useEffect, useState, useRef } from 'react';
import { Shell } from '../../components/Shell';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { Send, MessageSquare, User, CheckCircle } from 'lucide-react';

export const CoachMessages = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const loadThreads = async () => {
    try {
      const data = await api.getCoachThreads();
      setThreads(data || []);
      if (!activeThreadId && data && data.length > 0) {
        setActiveThreadId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load coach threads:', err);
    } finally {
      setLoadingThreads(false);
    }
  };

  const loadMessages = async (threadId) => {
    if (!threadId) return;
    try {
      const data = await api.getCoachThreadMessages(threadId);
      setMessages(data || []);
    } catch (err) {
      console.error('Failed to load thread messages:', err);
    }
  };

  useEffect(() => {
    loadThreads();
    const interval = setInterval(loadThreads, 8000);
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThreadId || sending) return;

    const bodyText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const sentMsg = await api.sendCoachMessage(activeThreadId, bodyText);
      setMessages((prev) => [...prev, sentMsg]);
      loadThreads();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const activeThread = threads.find((t) => t.id === activeThreadId);

  return (
    <Shell
      title="Player Conversations"
      subtitle="Direct 1-on-1 messaging channel with your assigned players."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[650px]">
        {/* Left Panel: THREADS */}
        <div className="app-card p-0 flex flex-col overflow-hidden h-full">
          <div className="p-4 border-b border-surface-border">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              THREADS
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {loadingThreads ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-forest/20 border-t-forest rounded-full animate-spin mx-auto" />
              </div>
            ) : threads.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No active conversations yet.
              </div>
            ) : (
              threads.map((t) => {
                const isSelected = t.id === activeThreadId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveThreadId(t.id)}
                    className={`w-full text-left p-4 transition-colors flex items-start space-x-3 ${
                      isSelected ? 'bg-forest/5 border-l-4 border-forest' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-forest text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {t.player_name ? t.player_name.charAt(0).toUpperCase() : 'P'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-navy truncate">
                          {t.player_name || 'Player'}
                        </span>
                        {t.has_unread && (
                          <span className="w-2.5 h-2.5 rounded-full bg-gold shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {t.last_message || 'Start the conversation...'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Active Conversation */}
        <div className="app-card p-0 md:col-span-2 flex flex-col overflow-hidden h-full">
          {activeThread ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-surface-border flex items-center justify-between bg-white">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-forest text-white flex items-center justify-center font-bold text-sm">
                    {activeThread.player_name ? activeThread.player_name.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-navy">{activeThread.player_name}</h3>
                    <p className="text-[11px] text-forest font-medium">Cricket Vault Student</p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#F8FAFB]/60">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <MessageSquare className="w-8 h-8 mb-2 text-slate-300" />
                    <span>No messages yet. Send a note to the player.</span>
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

              {/* Message Input */}
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
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <MessageSquare className="w-10 h-10 mb-2 text-slate-300" />
              <span>Select a thread from the left to read messages.</span>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
};
