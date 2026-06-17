import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error('Uncaught error in boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-200">
          <h2 className="text-lg font-semibold mb-2">Something went wrong.</h2>
          <p className="text-xs text-rose-300 mb-4">
            {this.state.error?.message || 'An unexpected error occurred in this module.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-rose-600/80 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
