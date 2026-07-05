import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// PWA Service Worker Registration
// @ts-ignore
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('PWA Service Worker registrado com sucesso:', reg.scope);
      })
      .catch((err) => {
        console.error('Falha ao registrar PWA Service Worker:', err);
      });
  });
} else if ('serviceWorker' in navigator) {
  // In development, also register but with a log indicating development mode
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('PWA Service Worker registrado em modo dev:', reg.scope);
      })
      .catch((err) => {
        console.log('Falha ao registrar PWA Service Worker em modo dev (comum em sandboxes):', err);
      });
  });
}

