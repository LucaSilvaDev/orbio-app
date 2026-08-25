import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-[18px] font-semibold text-midnight-ink">A interface quebrou.</p>
        <p className="max-w-lg text-[13px] text-ash-helper">{this.state.error.message}</p>
        <button
          type="button"
          className="rounded-pill bg-midnight-ink px-4 py-2 text-[12px] text-snow-canvas"
          onClick={() => window.location.reload()}
        >
          Recarregar
        </button>
      </div>
    );
  }
}
