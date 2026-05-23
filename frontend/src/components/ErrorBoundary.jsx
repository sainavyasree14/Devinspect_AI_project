import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="card-elevated max-w-lg w-full text-center animate-slide-up">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-3xl font-bold mb-3 text-balance">Application Error</h2>
            <p className="text-muted-foreground mb-8">
              We've encountered an unexpected issue. Our team has been notified.
            </p>
            
            {this.state.error && (
              <div className="bg-muted p-4 rounded-xl text-left overflow-auto mb-8 max-h-48 border border-border">
                <p className="text-sm font-mono text-destructive break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <RefreshCcw className="h-5 w-5" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;