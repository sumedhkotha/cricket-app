import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  LayoutDashboard,
  Users,
  Award,
  Video,
  CreditCard,
  Receipt,
  BookOpen,
  Clock,
  CheckCircle2,
  DollarSign,
  Star,
  MessageSquare,
  User,
  PlusCircle,
  Library,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Megaphone
} from 'lucide-react';

export const Shell = ({ children, title, subtitle, headerAction }) => {
  const { user, role, logout, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSwitchDashboard = async (targetRole) => {
    if (targetRole === role) return;
    try {
      const demoCreds = {
        player: { email: 'player@cricketvault.demo', password: 'demo1234' },
        coach: { email: 'coach@cricketvault.demo', password: 'demo1234' },
        admin: { email: 'admin@cricketvault.demo', password: 'demo1234' },
      };
      const creds = demoCreds[targetRole];
      if (creds) {
        await login(creds);
        navigate(`/${targetRole}`);
      }
    } catch (err) {
      console.error('Failed to switch dashboard role:', err);
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, []);

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  useEffect(() => {
    if (role === 'player') {
      api.getPlayerAnnouncements()
        .then((res) => {
          if (!res?.locked) {
            setUnreadAnnouncements(res?.unread_count || 0);
          }
        })
        .catch(() => {});
    }
  }, [role, location.pathname]);

  // Nav Items Config
  let navItems = [];
  if (role === 'admin') {
    navItems = [
      { label: 'Overview', path: '/admin', icon: LayoutDashboard },
      { label: 'Coach Directory', path: '/admin/coaches-directory', icon: Award },
      { label: 'Players', path: '/admin/players', icon: Users },
      { label: 'Coaches Mgmt', path: '/admin/coaches', icon: Users },
      { label: 'Video Reviews', path: '/admin/reviews', icon: Video },
      { label: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard },
      { label: 'Payments', path: '/admin/payments', icon: Receipt },
      { label: 'E-books', path: '/admin/ebooks', icon: BookOpen },
    ];
  } else if (role === 'coach') {
    navItems = [
      { label: 'Overview', path: '/coach', icon: LayoutDashboard },
      { label: 'Announcements', path: '/coach/announcements', icon: Megaphone },
      { label: 'Coach Directory', path: '/coach/coaches', icon: Award },
      { label: 'Pending Reviews', path: '/coach/pending', icon: Clock },
      { label: 'Completed Reviews', path: '/coach/completed', icon: CheckCircle2 },
      { label: 'Earnings', path: '/coach/earnings', icon: DollarSign },
      { label: 'Ratings', path: '/coach/ratings', icon: Star },
      { label: 'Messages', path: '/coach/messages', icon: MessageSquare },
      { label: 'Profile', path: '/coach/profile', icon: User },
    ];
  } else if (role === 'player') {
    navItems = [
      { label: 'Overview', path: '/player', icon: LayoutDashboard },
      { label: 'Announcements', path: '/player/announcements', icon: Megaphone, badge: unreadAnnouncements },
      { label: 'Coach Directory', path: '/player/coaches', icon: Award },
      { label: 'Video Reviews', path: '/player/reviews', icon: Video },
      { label: 'Submit Video', path: '/player/submit', icon: PlusCircle },
      { label: 'My Subscription', path: '/player/subscription', icon: CreditCard },
      { label: 'My Library', path: '/player/library', icon: Library },
      { label: 'Messages', path: '/player/messages', icon: MessageSquare },
      { label: 'Profile', path: '/player/profile', icon: User },
    ];
  }

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex flex-col font-body text-[#0B1B3A]">
      {/* TOP BAR (~80px height, white, bottom border) */}
      <header className="h-[80px] bg-white border-b border-surface-border sticky top-0 z-40 px-6 lg:px-10 flex items-center justify-between shadow-xs">
        {/* Left: Logo & Role Pill */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-navy hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link to={`/${role}`} className="flex items-center space-x-3 group">
            {/* Dark green rounded square with gold concentric target */}
            <div className="w-11 h-11 bg-forest rounded-[14px] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="7" />
                <circle cx="50" cy="50" r="22" fill="none" stroke="#F59E0B" strokeWidth="6" />
                <circle cx="50" cy="50" r="8" fill="#F59E0B" />
              </svg>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="font-heading font-extrabold text-2xl tracking-wide text-navy">
                CRICKET
              </span>
              <span className="font-heading font-extrabold text-2xl tracking-wide text-gold">
                VAULT
              </span>
            </div>
          </Link>

          {/* Dashboard Role Switcher */}
          <div className="hidden lg:flex items-center space-x-1 bg-slate-100/90 p-1 rounded-full border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
              Dashboard:
            </span>
            <button
              onClick={() => handleSwitchDashboard('player')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                role === 'player'
                  ? 'bg-forest text-gold shadow-xs'
                  : 'text-slate-600 hover:text-navy hover:bg-white/80'
              }`}
              title="Switch to Player Dashboard"
            >
              Player
            </button>
            <button
              onClick={() => handleSwitchDashboard('coach')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                role === 'coach'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-navy hover:bg-white/80'
              }`}
              title="Switch to Coach Dashboard"
            >
              Coach
            </button>
            <button
              onClick={() => handleSwitchDashboard('admin')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                role === 'admin'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-navy hover:bg-white/80'
              }`}
              title="Switch to Admin Dashboard"
            >
              Admin
            </button>
          </div>

          <div className="lg:hidden inline-flex items-center px-3 py-0.5 rounded-full bg-forest text-gold text-xs font-heading font-bold uppercase tracking-widest border border-forest-dark/40 shadow-xs">
            {role}
          </div>
        </div>

        {/* Right: Notifications & User Avatar */}
        <div className="flex items-center space-x-5">
          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2.5 rounded-full hover:bg-slate-100 text-navy transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gold rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-card shadow-elevated border border-surface-border py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-surface-border flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-heading font-bold text-lg text-navy">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-forest/10 text-forest text-xs font-semibold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-semibold text-forest hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 hover:bg-slate-50 transition-colors flex items-start space-x-3 ${
                          !notif.read ? 'bg-forest/[0.02]' : ''
                        }`}
                      >
                        <div className="mt-1">
                          {!notif.read ? (
                            <div className="w-2.5 h-2.5 rounded-full bg-gold" />
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-navy leading-tight">{notif.title}</p>
                          <p className="text-xs text-slate-600 mt-1 leading-snug">{notif.body}</p>
                          <p className="text-[10px] text-slate-400 mt-1.5">
                            {new Date(notif.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: 'short',
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar + Name + Logout */}
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-forest text-white font-heading font-bold text-lg flex items-center justify-center shadow-xs border border-forest/20 shrink-0">
              {user?.photo_url ? (
                <img
                  src={user.photo_url}
                  alt={user.name || 'User'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
              <span style={{ display: user?.photo_url ? 'none' : 'block' }}>{initial}</span>
            </div>
            <div className="hidden md:block text-left leading-tight">
              <div className="font-semibold text-sm text-navy">{user?.name || 'User'}</div>
              <div className="text-xs text-slate-500 capitalize">{role}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* BODY LAYOUT (Left Sidebar ~320px + Main Area) */}
      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP SIDEBAR (~320px, white, right border) */}
        <aside className="hidden lg:flex flex-col w-[320px] bg-white border-r border-surface-border shrink-0 py-8 px-6">
          <nav className="space-y-1.5 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-5 py-3.5 rounded-full font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-forest text-white shadow-sm font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-gold text-navy-dark text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom helper or support link */}
          <div className="pt-6 border-t border-surface-border">
            <div className="p-4 rounded-card bg-[#F8FAFB] border border-surface-border">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cricket Vault Pro</p>
              <p className="text-xs text-slate-600 mt-1">Certified coaching & video analytics</p>
            </div>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-[300px] max-w-[80vw] bg-white h-full p-6 flex flex-col z-10 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-forest rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="8" />
                      <circle cx="50" cy="50" r="22" fill="none" stroke="#F59E0B" strokeWidth="6" />
                      <circle cx="50" cy="50" r="8" fill="#F59E0B" />
                    </svg>
                  </div>
                  <span className="font-heading font-bold text-xl text-navy">CRICKET VAULT</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-2 flex-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-full font-medium text-sm transition-all ${
                        isActive
                          ? 'bg-forest text-white shadow-sm font-semibold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-gold text-navy-dark text-[10px] font-bold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-3 pb-2 border-t border-surface-border">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                  Switch Dashboard
                </div>
                <div className="grid grid-cols-3 gap-1.5 px-1 mb-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSwitchDashboard('player');
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg border text-center ${
                      role === 'player' ? 'bg-forest text-gold border-forest' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Player
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSwitchDashboard('coach');
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg border text-center ${
                      role === 'coach' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Coach
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSwitchDashboard('admin');
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg border text-center ${
                      role === 'admin' ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Admin
                  </button>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 font-medium text-sm hover:bg-red-50 rounded-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN AREA (padding ~40px, page title in Barlow Condensed ~44px) */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12 max-w-7xl mx-auto w-full">
          {(title || headerAction) && (
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                {title && (
                  <h1 className="font-heading text-4xl lg:text-[44px] font-extrabold text-navy tracking-tight leading-none">
                    {title}
                  </h1>
                )}
                {subtitle && <p className="text-slate-600 text-sm mt-1.5">{subtitle}</p>}
              </div>
              {headerAction && <div className="shrink-0">{headerAction}</div>}
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
};
