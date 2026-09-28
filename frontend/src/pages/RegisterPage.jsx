import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import {
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Plane,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { InputField } from '../components/ui/InputField.jsx';
import { Button } from '../components/ui/Button.jsx';

export function RegisterPage() {
  const { registerAgency, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    agencyName: '',
    phone: '',
    address: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    currency: 'BDT'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  // Generate real-time slug preview
  const slugPreview = formData.agencyName
    ? formData.agencyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'your-agency'
    : 'your-agency';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.agencyName.trim()) {
      setError('Please provide your agency name.');
      return;
    }
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill in all administrator account fields.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await registerAgency({
        agencyName: formData.agencyName.trim(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        currency: formData.currency
      });

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to register agency workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* Background glow accents */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full blur-[130px] pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }}
      />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center relative z-10 mb-6">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white shadow-xl mb-4"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #10b981)' }}
        >
          <Plane className="w-7 h-7 -rotate-45" />
        </div>
        <h1
          className="text-2xl sm:text-3xl font-extrabold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Create Agency Workspace
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Start your dedicated, isolated AeroDesk ERP instance with isolated ledgers, ticket billing, and multi-tenant security.
        </p>
      </div>

      {/* Form Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl px-2 relative z-10">
        <div className="card p-6 sm:p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                className="p-3.5 rounded-lg text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200"
                style={{
                  backgroundColor: 'var(--danger-muted)',
                  color: 'var(--danger)',
                  border: '1px solid rgba(239, 68, 68, 0.25)'
                }}
              >
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Agency Profile */}
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                  <Building2 className="w-4 h-4" />
                  1. Agency Workspace Details
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}>
                  {slugPreview}.aerodesk.app
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <InputField
                    label="Agency / Trade Name *"
                    icon={Building2}
                    placeholder="e.g. Skyline Travel & Tours"
                    required
                    value={formData.agencyName}
                    onChange={(e) => handleChange('agencyName', e.target.value)}
                  />
                </div>

                <InputField
                  label="Official Phone / Hotline"
                  icon={Phone}
                  placeholder="+880 1711 000000"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />

                <InputField
                  label="Office Address"
                  icon={MapPin}
                  placeholder="e.g. Banani, Dhaka"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </div>
            </div>

            {/* Section 2: Primary Administrator Account */}
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                  <ShieldCheck className="w-4 h-4" />
                  2. Agency Administrator Account
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                  Primary Root Admin
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <InputField
                    label="Admin Full Name *"
                    icon={User}
                    placeholder="e.g. Tanvir Ahmed"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <InputField
                    label="Admin Sign-In Email *"
                    icon={Mail}
                    type="email"
                    placeholder="admin@youragency.com"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    hint="You will use this email address to sign in to your agency workspace."
                  />
                </div>

                <InputField
                  label="Password *"
                  icon={Lock}
                  type="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                />

                <InputField
                  label="Confirm Password *"
                  icon={Lock}
                  type="password"
                  placeholder="••••••••"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                />
              </div>
            </div>

            {/* Trust points */}
            <div className="p-3 rounded-lg text-xs flex items-center gap-4" style={{ backgroundColor: 'var(--hover)' }}>
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Isolated Ledgers</span>
              </div>
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Independent Sequences</span>
              </div>
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Zero Data Leakage</span>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                loading={loading}
                icon={ArrowRight}
                className="w-full py-2.5 text-sm font-medium"
              >
                {loading ? 'Provisioning Agency Workspace...' : 'Launch Agency Workspace'}
              </Button>
            </div>
          </form>

          {/* Footer Navigation */}
          <div
            className="mt-6 pt-4 border-t text-center text-xs flex items-center justify-between"
            style={{ borderColor: 'var(--border)' }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>
              Already have an agency registered?
            </span>
            <Link
              to="/login"
              className="font-semibold transition-colors hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] space-y-1" style={{ color: 'var(--text-tertiary)' }}>
          <div>
            <Link to="/" className="hover:underline">← Back to Overview</Link>
          </div>
          <div>AeroDesk Cloud ERP • Enterprise Aviation & Travel Management Platform</div>
        </div>
      </div>
    </div>
  );
}
export default RegisterPage;
