import { Component, type ReactNode } from 'react';

type TErrorBoundaryProps = {
  children: ReactNode;
  /** Rendered in place of the children once something below throws. */
  fallback: (props: { error: Error; reset: () => void }) => ReactNode;
  /** A change clears the error — pass the route path to recover on navigation. */
  resetKey?: unknown;
};

type TErrorBoundaryState = { error: Error | null; resetKey: unknown };

/**
 * Catches render errors below it so one broken page doesn't blank the whole
 * admin. No componentDidCatch: React already logs caught errors with their
 * component stack.
 */
class ErrorBoundary extends Component<
  TErrorBoundaryProps,
  TErrorBoundaryState
> {
  state: TErrorBoundaryState = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(
    error: unknown,
  ): Partial<TErrorBoundaryState> {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  static getDerivedStateFromProps(
    props: TErrorBoundaryProps,
    state: TErrorBoundaryState,
  ): Partial<TErrorBoundaryState> | null {
    return props.resetKey === state.resetKey
      ? null
      : { error: null, resetKey: props.resetKey };
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    return error
      ? this.props.fallback({ error, reset: this.reset })
      : this.props.children;
  }
}

export default ErrorBoundary;
