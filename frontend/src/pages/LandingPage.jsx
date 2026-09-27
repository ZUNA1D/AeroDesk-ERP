import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../context/ThemeContext.jsx';
import {
  Plane,
  PlaneTakeoff,
  Stamp,
  Wallet,
  BookOpen,
  ShieldCheck,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Moon,
  Sun,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  Users,
  Building2,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';

export function LandingPage() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const features = [
    {
      icon: PlaneTakeoff,
      color: 'var(--accent)',
      title: 'Multi-Pax Flight Ticketing',
      desc: 'Batch ticket issuance for family and group travelers in a single transaction with individual passenger names, ticket numbers, PNRs, routes, and instant profit calculations.'
    },
    {
      icon: Stamp,
      color: '#10b981',
      title: 'Visa Application Processing',
      desc: 'Full visa case lifecycle management with embassy fee breakdowns, service margin tracking, and automated client billing.'
    },
    {
      icon: Wallet,
      color: '#f59e0b',
      title: 'BSP & GDS Portal Wallets',
      desc: 'Real-time balance tracking for prepaid booking portals (Sabre, Amadeus, Galileo, Flyhub) and credit line consolidator accounts.'
    },
    {
      icon: BookOpen,
      color: '#8b5cf6',
      title: 'Double-Entry General Ledger',
      desc: 'Immutable financial transactions ledger with atomic session balance updates, transaction voiding with mandatory audit rationales, and CSV exports.'
    },
    {
      icon: Receipt,
      color: '#06b6d4',
      title: 'Printable Money Receipts',
      desc: 'Professional money receipt vouchers featuring automatic English and Bengali Lakh/Crore word formatting, payment channel tagging, and print formatting.'
    },
    {
      icon: ShieldCheck,
      color: '#ec4899',
      title: 'Self-Healing Balance Engine',
      desc: 'Admin one-click ledger auditing engine that re-calculates all client dues and supplier balances from raw transactions to guarantee 100% integrity.'
    }
  ];

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-x-hidden selection:bg-brand-500 selection:text-white"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
    >
      {/* Ambient background glows */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, var(--accent), #10b981, transparent 70%)' }}
      />
      <div
        className="absolute top-[800px] right-0 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none opacity-15"
        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }}
      />

      {/* Top Navbar */}
      <header
        className="sticky top-0 z-40 backdrop-blur-xl border-b h-16 flex items-center transition-colors"
        style={{
          backgroundColor: 'var(--header-bg)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #10b981)' }}
            >
              <Plane className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight block leading-tight">
                AeroDesk
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase block" style={{ color: 'var(--text-tertiary)' }}>
                Aviation ERP
              </span>
            </div>
          </Link>

          {/* Navigation links & Theme switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border transition-colors hover:bg-[var(--sidebar-hover)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <Button onClick={() => navigate('/dashboard')} icon={ArrowRight}>
                Dashboard
              </Button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl transition-colors hover:bg-[var(--sidebar-hover)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Sign In
                </Link>
                <Button onClick={() => navigate('/signup')} icon={ArrowRight} size="sm">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold mb-6 shadow-sm animate-fade-in"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--accent)'
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AeroDesk • Modern Travel Agency Management</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            The Operating System for{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #3b82f6, #10b981)' }}
            >
              Travel & Aviation
            </span>{' '}
            Agencies.
          </h1>

          <p
            className="mt-6 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            Streamline multi-passenger ticketing, BSP portal wallets, visa processing, and client receivable dues with an immutable double-entry accounting engine.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Button
              size="lg"
              icon={ArrowRight}
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
              className="w-full sm:w-auto px-6 py-3 text-sm font-bold shadow-lg"
            >
              {user ? 'Enter ERP Terminal' : 'Launch AeroDesk Terminal'}
            </Button>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold transition-all hover:bg-[var(--sidebar-hover)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <Terminal className="w-4 h-4" />
              <span>Sign In to Agency</span>
            </Link>
          </div>

          {/* Demo Credentials Notice for GitHub Viewers */}
          <div
            className="mt-8 max-w-md mx-auto p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-sm"
            style={{
              backgroundColor: 'var(--surface-secondary)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="flex items-center gap-2.5 text-left">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}
              >
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold block" style={{ color: 'var(--text-primary)' }}>
                  Demo Admin Credentials
                </span>
                <span className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                  admin@aerodesk.com • admin123
                </span>
              </div>
            </div>
            <Link
              to="/login"
              className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Try Demo
            </Link>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section
          className="py-16 sm:py-24 border-t"
          style={{
            backgroundColor: 'var(--surface-secondary)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Built for High-Velocity Flight & Visa Desks
              </h2>
              <p className="mt-2 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                Every tool needed to run a travel agency, from counter ticket sales to consolidator balance reconciliation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={idx}
                    className="card p-6 flex flex-col justify-between transition-all hover:-translate-y-1"
                  >
                    <div>
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border"
                        style={{
                          backgroundColor: 'var(--surface-secondary)',
                          borderColor: 'var(--border)',
                          color: feat.color
                        }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-base mb-2" style={{ color: 'var(--text-primary)' }}>
                        {feat.title}
                      </h3>
                      <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {feat.desc}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t flex items-center gap-1.5 text-xs font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>
                      <span>Explore feature</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Double Entry Accounting Callout */}
        <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-3xl p-8 sm:p-12 border relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8"
            style={{
              background: 'linear-gradient(135deg, var(--surface), var(--surface-secondary))',
              borderColor: 'var(--border)'
            }}
          >
            <div className="max-w-xl">
              <Badge variant="primary" size="sm" className="mb-3">
                INTEGRITY GUARANTEE
              </Badge>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Atomic Double-Entry Balances & Self-Healing Ledger
              </h3>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Whenever you issue a ticket, void an invoice, or receive money, balances are updated within MongoDB atomic transactions. If an audit check is ever needed, the Self-Healing engine mathematically recalculates dues from raw ledger history with zero discrepancy.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
                  <span>Atomic Mongoose Sessions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
                  <span>Full Audit Trail</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
                  <span>Immutable Reversals</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button size="lg" icon={ArrowRight} onClick={() => navigate(user ? '/dashboard' : '/signup')}>
                Get Started with AeroDesk
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="border-t py-8 text-xs transition-colors"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text-tertiary)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #10b981)' }}
            >
              <Plane className="w-3.5 h-3.5 -rotate-45" />
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              AeroDesk ERP
            </span>
            <span className="text-[11px]">• Travel & Aviation Agency Management</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:underline" style={{ color: 'var(--text-secondary)' }}>
              Sign In
            </Link>
            <Link to="/signup" className="hover:underline" style={{ color: 'var(--text-secondary)' }}>
              Create Account
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
              style={{ color: 'var(--text-secondary)' }}
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
