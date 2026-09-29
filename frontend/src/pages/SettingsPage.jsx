import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings.api.js';
import { getAssetUrl } from '../api/client.js';
import { maintenanceApi } from '../api/maintenance.api.js';
import { useAuth } from '../hooks/useAuth.js';
import { Card } from '../components/ui/Card.jsx';
import { InputField } from '../components/ui/InputField.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import {
  Settings as SettingsIcon,
  Building,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';

export function SettingsPage() {
  const { user, refreshSettings } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  const [form, setForm] = useState({ companyName: '', tagline: '', address: '', phone: '', email: '', website: '', currency: 'BDT' });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [recalcResult, setRecalcResult] = useState(null);

  const { data: settingsData, isLoading } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.get });

  useEffect(() => {
    if (settingsData?.settings) {
      const s = settingsData.settings;
      setForm({ companyName: s.companyName || '', tagline: s.tagline || '', address: s.address || '', phone: s.phone || '', email: s.email || '', website: s.website || '', currency: s.currency || 'BDT' });
      if (s.logoUrl) setLogoPreview(getAssetUrl(s.logoUrl));
    }
  }, [settingsData]);

  const updateSettingsMutation = useMutation({
    mutationFn: (formData) => settingsApi.update(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      refreshSettings();
      setSuccessMessage('Agency settings & branding updated successfully.');
      setErrorMessage('');
      setTimeout(() => setSuccessMessage(''), 4000);
    },
    onError: (err) => setErrorMessage(err.message)
  });

  const recalcMutation = useMutation({
    mutationFn: maintenanceApi.recalculateBalances,
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      setRecalcResult(data);
      setSuccessMessage('All balances successfully recalculated from transaction ledger.');
    },
    onError: (err) => setErrorMessage(err.message)
  });

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (!isAdmin) { setErrorMessage('Only administrators can modify agency branding.'); return; }
    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));
    if (logoFile) formData.append('logo', logoFile);
    updateSettingsMutation.mutate(formData);
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <SettingsIcon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          Agency Settings
        </h2>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Customize agency branding, contact information, header logo, and manage database integrity tools.
        </p>
      </div>

      {successMessage && (
        <div className="rounded-xl p-4 flex items-center gap-3 text-xs sm:text-sm font-medium border" style={{ backgroundColor: 'var(--success-muted)', borderColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl p-4 flex items-center gap-3 text-xs sm:text-sm font-medium border" style={{ backgroundColor: 'var(--danger-muted)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-5">
        <Card title="Agency Branding & Profile" subtitle="Customizes all screens, statements, and receipt vouchers">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Agency Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-16 rounded-lg border border-dashed flex items-center justify-center overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-secondary)' }}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <Building className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
                  )}
                </div>
                <div>
                  <input type="file" id="logo-upload" accept="image/*" onChange={handleLogoChange} className="hidden" disabled={!isAdmin} />
                  <label htmlFor="logo-upload" className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors hover:bg-[var(--surface-secondary)] ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`} style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    <Upload className="w-3.5 h-3.5" /> Upload New Logo
                  </label>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>PNG, JPG, or SVG with transparent background recommended.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Agency / Company Name *" required disabled={!isAdmin} value={form.companyName} onChange={(e) => setForm(prev => ({ ...prev, companyName: e.target.value }))} />
              <InputField label="Tagline / Subtitle" disabled={!isAdmin} value={form.tagline} onChange={(e) => setForm(prev => ({ ...prev, tagline: e.target.value }))} />
            </div>

            <InputField label="Office Address" disabled={!isAdmin} value={form.address} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField label="Primary Phone" disabled={!isAdmin} value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} />
              <InputField label="Official Email" type="email" disabled={!isAdmin} value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} />
              <InputField label="Base Currency" disabled={!isAdmin} value={form.currency} onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value.toUpperCase() }))} />
            </div>
          </div>

          {isAdmin && (
            <div className="mt-6 flex justify-end">
              <Button type="submit" loading={updateSettingsMutation.isPending}>Save Agency Settings</Button>
            </div>
          )}
        </Card>
      </form>

      {isAdmin && (
        <Card title="Ledger Safety Net & Balance Rebuilder" subtitle="Admin-only maintenance tool to ensure zero drift">
          <div className="space-y-4">
            <div className="p-4 rounded-lg border space-y-3" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border)' }}>
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                <div>
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recalculate All Balances from Transaction Ledger</h4>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                    This algorithm resets all cached client dues and supplier balances to zero and sequentially replays every active transaction from the immutable ledger.
                  </p>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Atomic Mongoose Session Execution</span>
                <Button size="sm" variant="secondary" icon={RefreshCw} loading={recalcMutation.isPending} onClick={() => recalcMutation.mutate()}>
                  Run Recalculation
                </Button>
              </div>
            </div>

            {recalcResult && (
              <div className="p-3 rounded-lg text-xs space-y-1 border" style={{ backgroundColor: 'var(--accent-muted)', borderColor: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent)' }}>
                <div className="font-bold">Recalculation Complete:</div>
                <div>Processed <strong>{recalcResult.result.processedTransactions}</strong> active transactions.</div>
                <div>Updated {recalcResult.result.clientsUpdated} clients and {recalcResult.result.suppliersUpdated} suppliers.</div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export default SettingsPage;
