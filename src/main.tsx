import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import './styles.css';
import './premium-max-v3.css';
import './home-premium-tune.css';
import './bottom-nav-polish.css';
import './mobile-layout-final.css';
import './mobile-edge-final.css';
import './settings-max.css';
import './settings-polish.css';
import './settings-reference-final.css';

const root = document.getElementById('app');

if (!root) {
  throw new Error('CONECTA: no se ha encontrado el contenedor #app');
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
