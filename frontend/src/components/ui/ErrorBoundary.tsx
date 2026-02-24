import React from "react";

interface ErrorState {
  hasError: boolean;
  error?: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    this.setState({ error: error.message });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-orange-200">
            <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-2xl flex items-center justify-center">
              <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Something went wrong</h2>
            <p className="text-slate-600 mb-6">{this.state.error || "Unknown error occurred."}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-orange-600 text-white py-3 px-6 rounded-xl hover:bg-orange-700 font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
