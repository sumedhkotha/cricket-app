import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { Lock, Mail, AlertCircle, ArrowRight, Shield, Award, User, Sparkles } from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'player',
    title: 'Player',
    name: 'Rohan Verma',
    email: 'player@cricketvault.demo',
    password: 'demo1234',
    icon: User,
    colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70',
    activeClass: 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/30',
    badgeClass: 'bg-emerald-600 text-white',
    description: 'Player drills, review submissions, and live fixtures',
    targetPath: '/player',
  },
  {
    role: 'coach',
    title: 'Coach',
    name: 'Rahul Sharma',
    email: 'coach@cricketvault.demo',
    password: 'demo1234',
    icon: Award,
    colorClass: 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100/70',
    activeClass: 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-500/30',
    badgeClass: 'bg-amber-600 text-white',
    description: 'Video assessments, player messaging, and earnings',
    targetPath: '/coach',
  },
  {
    role: 'admin',
    title: 'Admin',
    name: 'Platform Admin',
    email: 'admin@cricketvault.demo',
    password: 'demo1234',
    icon: Shield,
    colorClass: 'text-indigo-800 bg-indigo-50 border-indigo-200 hover:bg-indigo-100/70',
    activeClass: 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/30',
    badgeClass: 'bg-indigo-600 text-white',
    description: 'System control, coaches directory, and platform analytics',
    targetPath: '/admin',
  },
];

export const Login = () => {
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  React.useEffect(() => {
    if (isAuthenticated && role) {
      if (role === 'player') {
        api.getPlayerSubscription()
          .then((subRes) => {
            if (subRes?.subscription?.status === 'active') {
              navigate('/player', { replace: true });
            } else {
              navigate('/player/plans', { replace: true });
            }
          })
          .catch(() => navigate('/player/plans', { replace: true }));
      } else {
        navigate(`/${role}`, { replace: true });
      }
    }
  }, [isAuthenticated, role, navigate]);

  const performLogin = async (loginEmail, loginPassword) => {
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login({ email: loginEmail, password: loginPassword });
      if (loggedUser.role === 'player') {
        try {
          const subRes = await api.getPlayerSubscription();
          if (subRes?.subscription?.status === 'active') {
            navigate('/player', { replace: true });
          } else {
            navigate('/player/plans', { replace: true });
          }
        } catch {
          navigate('/player/plans', { replace: true });
        }
      } else {
        navigate(`/${loggedUser.role}`, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performLogin(email, password);
  };

  const handleRoleSelect = (demo) => {
    setSelectedRole(demo.role);
    setEmail(demo.email);
    setPassword(demo.password);
    setError('');
  };

  const handleOneClickLogin = (demo) => {
    setSelectedRole(demo.role);
    setEmail(demo.email);
    setPassword(demo.password);
    performLogin(demo.email, demo.password);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 py-8 bg-gradient-to-br from-[#0F4A30] via-[#0B4D3B] to-[#0B3D2B] relative overflow-hidden">
      {/* Background decorative glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-forest-light/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[560px] bg-white rounded-[24px] shadow-2xl p-7 sm:p-9 z-10 border border-white/20 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Logo */}
        <div className="flex items-center justify-center space-x-3 mb-5">
          <div className="w-12 h-12 bg-forest rounded-[14px] flex items-center justify-center shadow-sm">
            <svg className="w-7 h-7" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="7" />
              <circle cx="50" cy="50" r="22" fill="none" stroke="#F59E0B" strokeWidth="6" />
              <circle cx="50" cy="50" r="8" fill="#F59E0B" />
            </svg>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="font-heading font-extrabold text-3xl tracking-wide text-navy">CRICKET</span>
            <span className="font-heading font-extrabold text-3xl tracking-wide text-gold">VAULT</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="font-heading font-extrabold text-3xl text-navy tracking-tight">
            Select Your Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Choose a role below for instant 1-click dashboard entry, or sign in manually.
          </p>
        </div>

        {/* 1-Click Dashboard Access Cards */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              Quick Demo Access
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Click to prefill & enter</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {DEMO_ACCOUNTS.map((demo) => {
              const Icon = demo.icon;
              const isSelected = selectedRole === demo.role;
              return (
                <div
                  key={demo.role}
                  onClick={() => handleRoleSelect(demo)}
                  className={`relative cursor-pointer rounded-2xl p-3.5 border transition-all text-left flex flex-col justify-between ${
                    isSelected
                      ? demo.activeClass
                      : `${demo.colorClass} border-slate-200/90 hover:shadow-md`
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-white/90 shadow-xs flex items-center justify-center">
                        <Icon className="w-4 h-4 text-slate-700" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${demo.badgeClass}`}>
                        {demo.title}
                      </span>
                    </div>
                    <div className="font-heading font-bold text-base text-navy leading-tight">
                      {demo.name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      {demo.description}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOneClickLogin(demo);
                    }}
                    disabled={loading}
                    className="mt-3 w-full py-1.5 px-2 rounded-xl text-xs font-semibold bg-white text-navy border border-slate-200/80 hover:bg-navy hover:text-white transition-colors flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <span>Enter</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Standard credentials form */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
              Or Sign In With Email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedRole(null);
                }}
                placeholder="athlete@example.com"
                className="app-input pl-11"
              />
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="app-input pl-11"
              />
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary h-12 text-base font-semibold shadow-md mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Entering Dashboard...</span>
              </>
            ) : (
              <>
                <span>Enter Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-7 pt-5 border-t border-slate-100 text-center text-sm text-slate-500">
          New athlete or coach?{' '}
          <Link to="/register" className="font-bold text-forest hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
