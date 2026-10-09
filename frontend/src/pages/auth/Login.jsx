import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export const Login = () => {
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login({ email, password });
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-[#0F4A30] via-[#0B4D3B] to-[#0B3D2B] relative overflow-hidden">
      {/* Background decorative glow / concentric circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-forest-light/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[500px] bg-white rounded-[20px] shadow-2xl p-8 sm:p-10 z-10 border border-white/20 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Logo */}
        <div className="flex items-center justify-center space-x-3 mb-6">
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

        <div className="text-center mb-8">
          <h1 className="font-heading font-extrabold text-3xl text-navy tracking-tight">
            Welcome back
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Login to continue your training and coaching platform.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-input bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

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
                onChange={(e) => setEmail(e.target.value)}
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
            className="w-full btn-primary h-12 text-base font-semibold shadow-md mt-2"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
          New athlete or coach?{' '}
          <Link to="/register" className="font-bold text-forest hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
