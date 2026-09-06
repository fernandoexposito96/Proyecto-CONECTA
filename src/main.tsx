import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './premium-max-v3.css';
import './home-premium-tune.css';
import './bottom-nav-polish.css';
import './mobile-layout-final.css';
import './mobile-edge-final.css';
import './settings-max.css';
import './settings-polish.css';
import './settings-reference-final.css';
import './settings-polish';

createRoot(document.getElementById('app')!).render(<StrictMode><App /></StrictMode>);
