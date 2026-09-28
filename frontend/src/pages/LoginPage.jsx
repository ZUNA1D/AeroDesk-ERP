import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Plane, LogIn, Mail, Lock } from 'lucide-react';
import { InputField } from '../components/ui/InputField.jsx';
import { Button } from '../components/ui/Button.jsx';

export function LoginPage() {
  const { login, settings, setupRequired, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const companyName = settings?.companyName || 'AeroDesk';

  return (
    <div
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* Subtle background accents */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white shadow-lg mb-5"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #10b981)' }}
        >
          <Plane className="w-7 h-7 -rotate-45" />
        </div>
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {companyName}
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Sign in to access your ledger & ticketing terminal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="card p-8 sm:p-10">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div
                className="p-3 rounded-lg text-xs font-medium"
                style={{
                  backgroundColor: 'var(--danger-muted)',
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

            <InputField
              label="Password"
              type="password"
              required
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="pt-2">
              <Button
                type="submit"
                loading={loading}
                icon={LogIn}
                className="w-full py-2.5 text-sm"
              >
                Sign In
              </Button>
            </div>
          </form>

          <div
            className="mt-6 pt-4 border-t text-center text-xs flex items-center justify-between"
            style={{ borderColor: 'var(--border)' }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>
              Need an account?
            </span>
            <Link
              to="/signup"
              className="font-semibold transition-colors hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              Sign Up
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] space-y-1" style={{ color: 'var(--text-tertiary)' }}>
          <div>
            <Link to="/" className="hover:underline">← Back to AeroDesk Overview</Link>
          </div>
          <div>AeroDesk ERP • Secured Multi-user Aviation & Travel Ledger</div>
        </div>
      </div>
    </div>
  );
}
