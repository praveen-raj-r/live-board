import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Shown above the retry button. */
  title?: string;
  /** Called after the user clicks "Try again", before the children are re-rendered. */
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Catches render errors in its subtree and offers a retry instead of a blank screen. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack);
  }

  private retry = () => {
    this.props.onRetry?.();
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-lg font-semibold text-text">{this.props.title ?? 'Something went wrong'}</h1>
        <p className="max-w-sm text-[13px] text-text-muted">
          An unexpected error stopped this part of the page from displaying. Your board data is stored on the server and is not affected.
        </p>
        <button
          type="button"
          onClick={this.retry}
          className="rounded-md bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Try again
        </button>
      </div>
    );
  }
}
