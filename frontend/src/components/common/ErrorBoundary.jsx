import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6 text-center"
          style={{ backgroundColor: 'var(--bg)' }}
        >
          <div className="card max-w-md w-full p-8 border shadow-modal space-y-5 animate-scale-in">
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
              style={{ backgroundColor: 'var(--danger-muted)', color: 'var(--danger)' }}
            >
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h2
                className="text-lg font-bold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Something went wrong
              </h2>
              <p
                className="text-xs sm:text-sm mt-1.5 leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                An unexpected interface error occurred. Your financial data is safely stored on the server.
              </p>
            </div>

            {this.state.error && (
              <pre
                className="p-3 rounded-lg text-left text-[11px] font-mono overflow-x-auto border text-danger whitespace-pre-wrap max-h-60"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border)'
                }}
              >
                {this.state.error.stack || this.state.error.message || String(this.state.error)}
              </pre>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                icon={Home}
                onClick={this.handleGoHome}
              >
                Go to Home
              </Button>
              <Button
                size="sm"
                icon={RefreshCw}
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
