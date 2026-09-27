import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Plane, Building, User, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { InputField } from '../components/ui/InputField.jsx';
import { Button } from '../components/ui/Button.jsx';

export function SetupPage() {
  const { setup, setupRequired, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState('AeroDesk');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (!authLoading && !setupRequired) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, setupRequired, navigate]);

  const handleSetup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    try {
      setLoading(true);
      setError('');
      await setup({ companyName, name, email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* Ambient background accents */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[130px] pointer-events-none opacity-25"
        style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white shadow-lg mb-4"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #10b981)' }}
        >
          <Plane className="w-7 h-7 -rotate-45" />
        </div>
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Initial System Setup
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
          Create your primary Administrator account to initialize your agency ERP.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="card p-8 sm:p-10 shadow-lg">
          <form onSubmit={handleSetup} className="space-y-4">
            {error && (
              <div
                className="p-3 rounded-lg text-xs font-medium"
                style={{
                  backgroundColor: 'var(--danger-muted)',
                  color: 'var(--danger)',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
              >
                {error}
              </div>
            )}

            <InputField
              label="Agency / Company Name"
              icon={Building}
              placeholder="e.g. AeroDesk Travel"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              hint="You can rename or rebrand this anytime later from Settings."
            />

            <InputField
              label="Admin Full Name *"
              required
              icon={User}
              placeholder="e.g. Agency Admin"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <InputField
              label="Admin Email Address *"
              required
              type="email"
              icon={Mail}
              placeholder="admin@aerodesk.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <InputField
              label="Admin Password *"
              required
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="Minimum 6 characters."
            />

            <div className="pt-2">
              <Button
                type="submit"
                loading={loading}
                icon={ArrowRight}
                className="w-full py-2.5"
              >
                Initialize & Launch ERP
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
