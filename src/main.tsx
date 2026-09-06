import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './home-premium-tune.css';
import './bottom-nav-polish.css';

createRoot(document.getElementById('app')!).render(<StrictMode><App /></StrictMode>);
