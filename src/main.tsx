import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './components/ThemeProvider.tsx';

// Prevent ResizeObserver benign errors from showing an overlay in dev mode
const compileError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('ResizeObserver loop') || args[0]?.message?.includes?.('ResizeObserver loop')) {
    return;
  }
  compileError(...args);
};

window.addEventListener('error', e => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.' || e.message === 'ResizeObserver loop limit exceeded') {
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
