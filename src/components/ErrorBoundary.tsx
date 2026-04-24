import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    return { hasError: true, message };
  }

  componentDidCatch(_error: unknown, _info: ErrorInfo) {
    // In production, forward to your error tracking service here
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="mb-2 text-xl font-bold">Something went wrong</h2>
            <p className="mb-6 text-sm text-muted-foreground">{this.state.message}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload page
              </Button>
              <Button onClick={this.handleReset}>Try again</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
