import { Component, type ErrorInfo, type ReactNode, useEffect, useState } from "react";
import { CircleAlert, LoaderCircle, RefreshCw, WifiOff } from "lucide-react";

export function AppErrorBoundary({ children }: { children: ReactNode }) { return <ErrorBoundaryImpl>{children}</ErrorBoundaryImpl>; }
class ErrorBoundaryImpl extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { window.dispatchEvent(new CustomEvent("conecta:ui-error", { detail: { message: error.message, stack: info.componentStack } })); }
  render() { if (!this.state.failed) return this.props.children; return <main className="fatal-state" role="alert"><span><CircleAlert /></span><h1>No hemos podido abrir esta pantalla</h1><p>Tu sesión sigue protegida. Recarga CONECTA para intentarlo de nuevo.</p><button type="button" onClick={() => window.location.reload()}><RefreshCw /> Reintentar</button></main>; }
}
export function NetworkStatusBanner() { const [online, setOnline] = useState(() => navigator.onLine); useEffect(() => { const onlineHandler = () => setOnline(true); const offlineHandler = () => setOnline(false); window.addEventListener("online", onlineHandler); window.addEventListener("offline", offlineHandler); return () => { window.removeEventListener("online", onlineHandler); window.removeEventListener("offline", offlineHandler); }; }, []); if (online) return null; return <div className="network-status-banner" role="status"><WifiOff /> Sin conexión · mostrando lo que ya está disponible en el dispositivo</div>; }
export function ScreenSkeleton({ cards = 4 }: { cards?: number }) { return <div className="screen-skeleton" aria-label="Cargando contenido" aria-busy="true"><div className="skeleton-line wide" /><div className="skeleton-line medium" /><div className="skeleton-grid">{Array.from({ length: cards }, (_, index) => <div className="skeleton-card" key={index}><LoaderCircle className="spin" /></div>)}</div></div>; }
export function RetryState({ title = "No hemos podido cargarlo", text = "Comprueba tu conexión y vuelve a intentarlo.", onRetry }: { title?: string; text?: string; onRetry: () => void }) { return <div className="retry-state" role="alert"><CircleAlert /><div><strong>{title}</strong><p>{text}</p></div><button type="button" onClick={onRetry}><RefreshCw /> Reintentar</button></div>; }
