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

const systemThemeQuery=window.matchMedia?.('(prefers-color-scheme: dark)');
const applyStoredTheme=()=>{
  const selectedTheme=loadStored<Theme>(storageKeys.theme,'Sistema');
  const dark=selectedTheme==='Oscuro'||(selectedTheme==='Sistema'&&Boolean(systemThemeQuery?.matches));
  document.documentElement.dataset.theme=dark?'dark':'light';
};
applyStoredTheme();
systemThemeQuery?.addEventListener?.('change',()=>{
  const selectedTheme=loadStored<Theme>(storageKeys.theme,'Sistema');
  if(selectedTheme==='Sistema')applyStoredTheme();
});

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

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    if(!import.meta.env.PROD)return;
    const serviceWorkerUrl=new URL('sw.js',document.baseURI);
    void navigator.serviceWorker.register(serviceWorkerUrl,{updateViaCache:'none'})
      .then(registration=>registration.update())
      .catch(error=>console.warn('CONECTA: no se pudo registrar el service worker',error));
  });
}
