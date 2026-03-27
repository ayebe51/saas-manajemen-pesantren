import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
          <div className="max-w-md w-full glass-panel p-8 text-center border-rose-500/20">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
              <AlertCircle size={32} />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Ups! Sesuatu Salah</h1>
            <p className="text-slate-400 mb-8 px-4">
              Terjadi kesalahan aplikasi yang tidak terduga. Kami telah mencatat masalah ini.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <RefreshCcw size={18} />
                Refresh Halaman
              </button>
              
              <a
                href="/"
                className="btn bg-slate-800 hover:bg-slate-700 text-white w-full flex items-center justify-center gap-2"
              >
                <Home size={18} />
                Kembali ke Beranda
              </a>
            </div>

            {import.meta.env.DEV && (
              <div className="mt-8 p-4 bg-slate-900 rounded-lg text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-rose-400">
                  {this.state.error?.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
