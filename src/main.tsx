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

window.addEventListener('appinstalled', () => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification("App Installed", {
      body: "Workplace Hub has been successfully installed on your device.",
      icon: "/logo-192.png"
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("App Installed", {
          body: "Workplace Hub has been successfully installed on your device.",
          icon: "/logo-192.png"
        });
      }
    });
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="dcms-ui-theme">
      <App />
    </ThemeProvider>
  </StrictMode>,
);
