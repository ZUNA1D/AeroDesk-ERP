import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Plane, Building, User, Mail, Lock, ArrowRight } from 'lucide-react';
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
      className="min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-white bg-brand-600 shadow-sm mb-3">
          <Plane className="w-6 h-6 -rotate-45" />
        </div>
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Initial System Setup
        </h2>
        <p className="mt-1 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
          Create your primary Administrator account to initialize your agency ERP.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-1 sm:px-4 relative z-10">
        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSetup} className="space-y-4">
            {error && (
              <div
                className="p-3 rounded-lg text-xs font-medium border"
                style={{
                  backgroundColor: 'var(--danger-muted)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                  color: 'var(--danger)'
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
              hint="You can customize this later from Settings."
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
                className="w-full py-2.5 text-sm font-semibold"
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

export default SetupPage;
