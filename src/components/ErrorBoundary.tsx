import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary catches unhandled errors in the React render tree
 * and displays a recovery UI instead of a blank screen.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught render crash:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
          color: '#fff',
          fontFamily: "'Inter', system-ui, sans-serif",
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1.5rem',
            padding: '3rem',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              The board encountered an unexpected error during rendering. This is usually temporary.
            </p>
            {this.state.error && (
              <details style={{
                textAlign: 'left',
                marginBottom: '1.5rem',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '0.75rem',
                padding: '1rem',
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                  Error Details
                </summary>
                <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {this.state.error.message}
                </code>
              </details>
            )}
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#fff',
                border: 'none',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
                (e.target as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.5)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                (e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(124, 58, 237, 0.4)';
              }}
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

export default ErrorBoundary;
