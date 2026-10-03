import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1f5f9] p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900">
            Halaman terjadi kesalahan
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Silakan muat ulang halaman atau kembali ke beranda.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700">
              Muat Ulang
            </button>
            <button
              onClick={() => window.location.assign("/")}
              className="w-full rounded-xl border border-gray-300 py-3 font-semibold transition hover:bg-gray-100">
              Kembali ke Beranda
            </button>
          </div>
          <p className="mt-4 break-words text-xs text-gray-400">
            {error.message}
          </p>
        </div>
      </div>
    );
  }
}
