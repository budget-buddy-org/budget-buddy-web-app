import { Component, type ErrorInfo, type ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { logError } from '@/lib/error-logger';

interface Props {
  children: ReactNode;
  /** Optional custom fallback. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError(error, { source: 'ErrorBoundary', componentStack: info.componentStack });
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;

    if (error) {
      if (this.props.fallback) {
        return this.props.fallback(error, this.reset);
      }
      return <DefaultErrorFallback error={error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, reset }: Readonly<{ error: Error; reset: () => void }>) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-base font-semibold">Something went wrong</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred. Please try again later.
      </p>

      <div className="flex flex-col gap-2">
        <div className="flex justify-center gap-2">
          <Button variant="link" size="sm" onClick={reset}>
            Try again
          </Button>
          <Button variant="link" size="sm" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? 'Hide details' : 'Show details'}
          </Button>
        </div>

        {showDetails && (
          <div className="mt-4 text-left">
            <p className="mb-1 text-sm font-medium text-destructive">{error.message}</p>
            {error.stack && (
              <pre className="max-h-40 overflow-auto rounded bg-muted p-4 text-xs text-muted-foreground">
                {error.stack}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
