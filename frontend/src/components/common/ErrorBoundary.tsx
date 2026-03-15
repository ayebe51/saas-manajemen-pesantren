import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-app flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full p-8 text-center border-t-4 border-t-danger shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertOctagon className="w-8 h-8" />
            </div>
            
            <h1 className="text-2xl font-bold text-main mb-2">Terjadi Kesalahan Sistem</h1>
            <p className="text-muted mb-6">
              Maaf, terjadi masalah internal saat memproses halaman ini. Tim teknis telah diberitahu.
            </p>

            {this.state.error && (
              <div className="bg-surface-glass border border-light rounded-md p-4 mb-6 text-left overflow-auto max-h-48 scrollbar-thin">
                <p className="text-danger text-sm font-mono mb-2 font-bold">{this.state.error.toString()}</p>
                <p className="text-muted text-xs font-mono whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</p>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <button 
                onClick={this.handleReset}
                className="btn btn-primary flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Muat Ulang
              </button>
              <button 
                onClick={this.handleHome}
                className="btn btn-outline flex items-center gap-2"
              >
                <Home className="w-4 h-4" /> Ke Beranda
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
