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

createRoot(document.getElementById('app')!).render(<StrictMode><App /></StrictMode>);
