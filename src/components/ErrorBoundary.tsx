import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold text-red-400">应用程序出错了</h1>
            <p className="text-slate-300">
              很抱歉，应用程序遇到了一个错误。请刷新页面重试。
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors mr-2"
              >
                刷新页面
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                }}
                className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors"
              >
                重试
              </button>
            </div>
            {this.state.error && (
              <details className="text-left text-xs text-slate-400 mt-4">
                <summary className="cursor-pointer">错误详情</summary>
                <pre className="mt-2 whitespace-pre-wrap bg-slate-800 p-3 rounded text-xs overflow-auto max-h-40">
                  {this.state.error.message}
                  {this.state.error.stack && '\n\n' + this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}