import React from 'react';
import { ShieldAlert, RefreshCw, Home, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[EquiWage ErrorBoundary caught an error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.href = '/';
  };

  handleClearSession = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (_) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isSpanish =
        typeof document !== 'undefined'
          ? document.documentElement.lang !== 'en'
          : true;

      return (
        <div className="min-h-screen bg-[#EEF1F6] dark:bg-[#0B0D13] text-[#0F172A] dark:text-[#F8FAFC] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-[#141721] rounded-2xl border border-border dark:border-[#232738] shadow-xl p-8 text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-primary">
              <ShieldAlert className="w-7 h-7 text-primary" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight">
                {isSpanish ? 'Ha ocurrido un inconveniente' : 'Something went wrong'}
              </h2>
              <p className="text-xs text-content-muted leading-relaxed">
                {isSpanish
                  ? 'La aplicación encontró un estado inesperado. Tus datos locales están seguros y protegidos en tu equipo.'
                  : 'The application encountered an unexpected state. Your local data remains securely stored on your device.'}
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-red-500 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isSpanish ? 'Detalle:' : 'Detail:'}</span>
                </div>
                <p className="text-[11px] font-mono text-content-muted break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary-hover shadow-md shadow-primary/25 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isSpanish ? 'Recargar Vista' : 'Reload View'}</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearSession}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-border dark:border-[#232738] hover:bg-surface-light text-content-muted hover:text-content-main font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>{isSpanish ? 'Ir al Inicio' : 'Go Home'}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
