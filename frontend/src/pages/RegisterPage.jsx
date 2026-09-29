import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Plane,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Coins
} from 'lucide-react';
import { InputField } from '../components/ui/InputField.jsx';
import { PasswordField } from '../components/ui/PasswordField.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Alert } from '../components/ui/Alert.jsx';
import { toast } from 'sonner';

export function RegisterPage() {
  const { registerAgency, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
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
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!formData.agencyName.trim()) {
      setError('Please provide your agency / trade name.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.agencyName.trim()) {
      setError('Please provide your agency name.');
      setStep(1);
      return;
    }
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill in all administrator account fields.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!doPasswordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await registerAgency({
        agencyName: formData.agencyName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        currency: formData.currency,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      toast.success('Agency workspace created successfully!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to register agency workspace';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* Background radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none opacity-40 blur-3xl"
        style={{
          background: 'radial-gradient(circle at 50% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 70%)'
        }}
      />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Plane className="w-5 h-5 -rotate-45" />
          </div>
          <span className="font-bold text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
            AeroDesk <span className="text-accent text-sm font-semibold ml-1">Cloud</span>
          </span>
        </Link>

        <h1
          className="text-2xl font-bold tracking-tight sm:text-3xl"
          style={{ color: 'var(--text-primary)' }}
        >
          Create Agency Workspace
        </h1>
        <p className="mt-1 text-xs sm:text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Launch an isolated AeroDesk ERP instance with dedicated ledger, ticket billing, and multi-tenant security.
        </p>

        {/* Wizard Step Indicator */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-all border ${
              step === 1
                ? 'bg-accent/10 border-accent text-accent'
                : 'bg-surface-secondary border-theme-border text-theme-text-tertiary'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-current text-surface text-[10px] flex items-center justify-center font-bold">
              1
            </span>
            <span>Agency Details</span>
          </button>
          <div className="w-6 h-[1px] bg-theme-border" />
          <button
            type="button"
            onClick={() => formData.agencyName.trim() && setStep(2)}
            disabled={!formData.agencyName.trim()}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-all border ${
              step === 2
                ? 'bg-accent/10 border-accent text-accent'
                : 'bg-surface-secondary border-theme-border text-theme-text-tertiary'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-current text-surface text-[10px] flex items-center justify-center font-bold">
              2
            </span>
            <span>Admin Account</span>
          </button>
        </div>
      </div>

      {/* Form Container */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-1 sm:px-4 relative z-10">
        <div className="card p-5 sm:p-8">
          {error && <Alert variant="error" message={error} onClose={() => setError('')} className="mb-5" />}

          {step === 1 ? (
            /* Step 1: Agency Profile */
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 text-accent">
                  <Building2 className="w-4 h-4" />
                  Step 1: Agency Workspace Details
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border bg-surface-secondary border-theme-border text-accent">
                  {slugPreview}.aerodesk.app
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
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

              <div className="pt-4 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
                <Button type="submit" icon={ArrowRight} className="py-2.5 px-6 text-sm font-semibold">
                  Next: Admin Account
                </Button>
              </div>
            </form>
          ) : (
            /* Step 2: Primary Administrator Account */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 text-accent">
                  <ShieldCheck className="w-4 h-4" />
                  Step 2: Root Administrator Account
                </span>
                <span className="text-[11px] text-theme-text-tertiary">
                  {formData.agencyName}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="sm:col-span-2">
                  <InputField
                    label="Admin Full Name *"
                    icon={User}
                    placeholder="e.g. Tanvir Ahmed"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    autoFocus
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

                <PasswordField
                  label="Password *"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                />

                <PasswordField
                  label="Confirm Password *"
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                />
              </div>

              {/* Password Helper Checklist */}
              {formData.password && (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                  <span className={`flex items-center gap-1 font-medium ${isPasswordValid ? 'text-success' : 'text-theme-text-tertiary'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> At least 6 characters
                  </span>
                  {formData.confirmPassword && (
                    <span className={`flex items-center gap-1 font-medium ${doPasswordsMatch ? 'text-success' : 'text-danger'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                    </span>
                  )}
                </div>
              )}

              {/* Trust points */}
              <div
                className="p-3 rounded-lg text-xs flex flex-wrap items-center gap-4 border"
                style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  <span>Isolated Ledgers</span>
                </div>
                <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  <span>Independent Sequences</span>
                </div>
                <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  <span>Zero Data Leakage</span>
                </div>
              </div>

              {/* Step Navigation Buttons */}
              <div className="pt-4 border-t flex items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
                <Button
                  type="button"
                  variant="outline"
                  icon={ArrowLeft}
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  icon={ArrowRight}
                  className="py-2.5 px-6 text-sm font-semibold"
                >
                  {loading ? 'Provisioning Agency Workspace...' : 'Launch Agency Workspace'}
                </Button>
              </div>
            </form>
          )}

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
              className="font-semibold transition-colors hover:underline text-accent"
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
