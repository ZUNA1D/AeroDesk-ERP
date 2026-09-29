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
  CheckCircle2,
  Eye,
  EyeOff,
  Coins
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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const isPasswordValid = formData.password.length >= 6;
  const doPasswordsMatch = formData.password && formData.password === formData.confirmPassword;

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
      className="min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center relative z-10 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-white bg-brand-600 shadow-sm mb-3">
          <Plane className="w-6 h-6 -rotate-45" />
        </div>
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Create Agency Workspace
        </h1>
        <p className="mt-1 text-xs sm:text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Launch an isolated AeroDesk ERP instance with dedicated ledger, ticket billing, and multi-tenant security.
        </p>
      </div>

      {/* Form Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl px-1 sm:px-4 relative z-10">
        <div className="card p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                className="p-3 rounded-lg text-xs font-medium border"
                style={{
                  backgroundColor: 'var(--danger-muted)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                  color: 'var(--danger)'
                }}
              >
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Agency Profile */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                  <Building2 className="w-4 h-4" />
                  1. Agency Workspace Details
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border)', color: 'var(--accent)' }}>
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
                    autoFocus
                  />
                </div>

                <InputField
                  label="Official Hotline / Phone"
                  icon={Phone}
                  placeholder="+880 1711 000000"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Primary Currency
                  </label>
                  <div className="relative">
                    <div
                      className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <Coins className="w-4 h-4" />
                    </div>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      className="input-base pl-10 cursor-pointer text-sm"
                    >
                      <option value="BDT">BDT (Bangladeshi Taka)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="AED">AED (UAE Dirham)</option>
                      <option value="SAR">SAR (Saudi Riyal)</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <InputField
                    label="Office Address"
                    icon={MapPin}
                    placeholder="e.g. Suite 402, Banani C/A, Dhaka"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Primary Administrator Account */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                  <ShieldCheck className="w-4 h-4" />
                  2. Administrator Account
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                  Root Admin
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

                {/* Password field with toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] font-medium flex items-center gap-1 transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
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
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className="input-base pl-10"
                    />
                  </div>
                </div>

                {/* Confirm Password field with toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Confirm Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-[11px] font-medium flex items-center gap-1 transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {showConfirmPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showConfirmPassword ? 'Hide' : 'Show'}</span>
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
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      className="input-base pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Password Helper Checklist */}
              {formData.password && (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                  <span className={`flex items-center gap-1 font-medium ${isPasswordValid ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> At least 6 characters
                  </span>
                  {formData.confirmPassword && (
                    <span className={`flex items-center gap-1 font-medium ${doPasswordsMatch ? 'text-emerald-600' : 'text-rose-500'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Trust points */}
            <div className="p-3 rounded-lg text-xs flex flex-wrap items-center gap-4 border" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Isolated Ledgers</span>
              </div>
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Independent Sequences</span>
              </div>
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Data Leakage</span>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                loading={loading}
                icon={ArrowRight}
                className="w-full py-2.5 text-sm font-semibold"
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
