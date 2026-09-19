import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

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
    console.error('Uncaught error in Crazy Sale Application:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#/';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-stone-200 shadow-xl text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 font-serif mb-2">
              Something went wrong
            </h2>
            <p className="text-stone-600 text-sm mb-6 leading-relaxed">
              We encountered an unexpected issue while loading this page. Your cart items and account data remain completely safe.
            </p>
            {this.state.error && (
              <div className="bg-stone-50 text-stone-700 text-xs p-3 rounded-lg border border-stone-200 mb-6 text-left overflow-auto max-h-32 font-mono">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={() => {
                  window.location.hash = '#/';
                  window.location.reload();
                }}
                className="flex items-center justify-center gap-2 bg-stone-100 text-stone-800 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-200 transition-colors"
              >
                <Home className="w-4 h-4" />
                Return to Store Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
