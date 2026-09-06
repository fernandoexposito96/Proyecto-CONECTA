import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './home-premium-tune.css';
import './bottom-nav-polish.css';
import './mobile-layout-final.css';
import './settings-max.css';
import './settings-polish.css';
import './settings-enhancer';
import './settings-polish';
import './premium-max-v3.css';
import './settings-reference-final.css';
import './settings-reference-final';
import './mobile-edge-final.css';
import './ux-fixes.css';
import './ux-fixes';

// Keep the core app boot path isolated from optional feature packs.
// CSS can load immediately, while behavior modules are activated only
// after React has mounted so a runtime error in an optional pack cannot
// blank the entire application.
import './experience-features.css';
import './retention-accessibility.css';
import './map-features.css';

createRoot(document.getElementById('app')!).render(<StrictMode><App /></StrictMode>);

const loadOptionalFeature = (loader: () => Promise<unknown>, name: string, delay: number) => {
  window.setTimeout(() => {
    loader().catch((error) => console.error(`[CONECTA] ${name} disabled after load error`, error));
  }, delay);
};

loadOptionalFeature(() => import('./experience-features'), 'experience-features', 250);
loadOptionalFeature(() => import('./retention-accessibility'), 'retention-accessibility', 500);
loadOptionalFeature(() => import('./map-features'), 'map-features', 750);
