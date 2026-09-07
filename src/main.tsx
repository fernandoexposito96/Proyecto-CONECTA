import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import './styles/index.css';

const root = document.getElementById('app');

if (!root) {
  throw new Error('CONECTA: no se ha encontrado el contenedor #app');
}

const fallbackImage=`${import.meta.env.BASE_URL}image-fallback.svg`;
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
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
