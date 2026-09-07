import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[CONECTA] Unhandled render error', error, info);
  }

  private recover = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error" role="alert">
          <section className="fatal-error-card">
            <strong>CONECTA</strong>
            <h1>No se ha podido cargar esta pantalla</h1>
            <p>La aplicación se ha protegido para evitar quedarse en blanco.</p>
            <button type="button" onClick={this.recover}>Volver a cargar</button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
