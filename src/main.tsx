import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './components/ThemeProvider.tsx';

// Prevent ResizeObserver benign errors from showing an overlay in dev mode
const compileError = console.error;
console.error = (...args) => {
  const message = args[0] instanceof Error ? args[0].message : String(args[0]);
  if (message.includes('ResizeObserver loop')) {
    return;
  }
  compileError(...args);
};

window.addEventListener('error', e => {
  if (e.message.includes('ResizeObserver loop')) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

window.addEventListener('unhandledrejection', e => {
  if (e.reason?.message?.includes('ResizeObserver loop')) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="dcms-ui-theme">
      <App />
    </ThemeProvider>
  </StrictMode>,
);

// Native registration fallback for Progressive Web App Service Worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('Service Worker registered successfully with scope:', reg.scope);
      })
      .catch(err => {
        console.error('Service Worker registration failed:', err);
      });
  });
}
