import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Plane, LogIn, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { InputField } from '../components/ui/InputField.jsx';
import { Button } from '../components/ui/Button.jsx';

export function LoginPage() {
  const { login, settings, setupRequired, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const defaultHome = user?.role === 'SUPER_ADMIN' ? '/agencies' : '/dashboard';
  const from = location.state?.from?.pathname || defaultHome;

  React.useEffect(() => {
    if (!authLoading) {
      if (setupRequired) {
        navigate('/setup', { replace: true });
      } else if (user) {
        const dest = user.role === 'SUPER_ADMIN' ? '/agencies' : from;
        navigate(dest, { replace: true });
      }
    }
  }, [authLoading, setupRequired, user, navigate, from]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError('');
      const data = await login({ email, password });
      const dest = data?.user?.role === 'SUPER_ADMIN' ? '/agencies' : from;
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@aerodesk.com');
    setPassword('admin123');
    setError('');
  };

  const companyName = settings?.companyName || 'AeroDesk';

  return (
    <div
      className="min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-white bg-brand-600 shadow-sm mb-4">
          <Plane className="w-6 h-6 -rotate-45" />
        </div>
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {companyName}
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
          Sign in to access your ledger & ticketing terminal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-1 sm:px-4 relative z-10">
        <div className="card p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div
                className="p-3 rounded-lg text-xs font-medium border"
                style={{
                  backgroundColor: 'var(--danger-muted)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                  color: 'var(--danger)',
                }}
              >
                {error}
              </div>
            )}

            <InputField
              label="Email Address"
              type="email"
              required
              icon={Mail}
              placeholder="admin@aerodesk.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-medium flex items-center gap-1 transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3 h-3" /> Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" /> Show
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <div
                  className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base pl-10"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                loading={loading}
                icon={LogIn}
                className="w-full py-2.5 text-sm font-medium"
              >
                Sign In
              </Button>
            </div>

            {/* Quick Demo Fill button */}
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full mt-2 py-1.5 px-3 rounded-lg border border-dashed text-xs font-medium flex items-center justify-center gap-1.5 transition-colors hover:bg-[var(--surface-secondary)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Fill Demo Credentials (admin@aerodesk.com)</span>
            </button>
          </form>

          <div
            className="mt-6 pt-4 border-t text-center text-xs flex items-center justify-between"
            style={{ borderColor: 'var(--border)' }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>
              Need an agency workspace?
            </span>
            <Link
              to="/signup"
              className="font-semibold transition-colors hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              Create Account
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] space-y-1" style={{ color: 'var(--text-tertiary)' }}>
          <div>
            <Link to="/" className="hover:underline">← Back to Overview</Link>
          </div>
          <div>AeroDesk ERP • Secured Aviation & Travel Management Platform</div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
