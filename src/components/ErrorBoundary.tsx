import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * Error Boundary component to catch and display React errors gracefully
 * Prevents the entire app from crashing when a component throws an error
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4 text-destructive">
              <AlertTriangle size={32} />
              <h1 className="text-2xl font-bold">Algo deu errado</h1>
            </div>

            <div className="mb-6">
              <p className="text-muted-foreground mb-2">
                Ocorreu um erro inesperado na aplicação. Você pode tentar recarregar a página ou entrar em contato com o suporte.
              </p>

              {this.state.error && (
                <details className="mt-4 p-3 bg-secondary/20 rounded-md border border-border">
                  <summary className="cursor-pointer text-sm font-medium text-foreground mb-2">
                    Detalhes técnicos
                  </summary>
                  <div className="text-xs text-muted-foreground font-mono overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>Erro:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">{this.state.error.stack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
                aria-label="Recarregar página"
              >
                <RefreshCw size={16} />
                Recarregar Página
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 bg-secondary text-foreground px-4 py-2 rounded-md font-medium hover:bg-secondary/80 transition-colors"
                aria-label="Tentar novamente"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
