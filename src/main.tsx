import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthGate } from './components/AuthGate';
import ErrorBoundary from './ErrorBoundary';
import { loadStored, storageKeys } from './lib/storage';
import type { Language, Theme } from './types';
import './styles/index.css';

const root = document.getElementById('app');

if (!root) {
  throw new Error('CONECTA: no se ha encontrado el contenedor #app');
}

const initialTheme=loadStored<Theme>(storageKeys.theme,'Sistema');
const initialDark=initialTheme==='Oscuro'||(initialTheme==='Sistema'&&window.matchMedia?.('(prefers-color-scheme: dark)').matches);
document.documentElement.dataset.theme=initialDark?'dark':'light';

const initialLanguage=loadStored<Language>(storageKeys.language,'Español');
document.documentElement.lang=initialLanguage==='Català'?'ca':initialLanguage==='English'?'en':'es';

const fallbackImage=new URL('image-fallback.svg',document.baseURI).toString();
document.addEventListener('error',event=>{
  const target=event.target;
  if(target instanceof HTMLImageElement&&!target.dataset.fallbackApplied){
    target.dataset.fallbackApplied='true';
    target.src=fallbackImage;
  }
},true);

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthGate>
        <App />
      </AuthGate>
    </ErrorBoundary>
  </StrictMode>,
);
