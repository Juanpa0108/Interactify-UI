import React from 'react';

/**
 * ErrorBoundary
 *
 * Catches rendering errors anywhere in its child component tree and
 * displays a simple, developer-friendly error message. This prevents
 * the UI from staying blank and provides a clear pointer to check the
 * browser console for further details.
 */
type State = {
  hasError: boolean;
  error?: Error | string;
};

class ErrorBoundary extends React.Component<React.PropsWithChildren<object>, State> {
  constructor(props: React.PropsWithChildren<object>) {
    super(props);
    this.state = { hasError: false };
  }

  // Update state when an error is thrown so `render` shows the fallback UI.
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Log to console — integrate with an error-reporting service here
    // in production (Sentry, LogRocket, etc.). Keep logs concise.
    // eslint-disable-next-line no-console
    console.error('Captured render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const message =
        typeof this.state.error === 'string' ? this.state.error : this.state.error?.message || 'Unexpected error';
      return (
        <div style={{ padding: 24, color: '#b00020', fontFamily: 'system-ui, sans-serif' }}>
          <h2>Something went wrong while rendering the app</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{message}</pre>
          <p>Check the developer console for details.</p>
        </div>
      );
    }

    // When no error, render children normally.
    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;
