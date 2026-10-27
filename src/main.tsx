import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { config as configureZod } from 'zod/v4/core';
import './index.css';
import App from './App.tsx';

// The CSP (vercel.json) forbids eval — keep zod off its `new Function` fast
// path, which it would otherwise try (and the browser report) on every load.
configureZod({ jitless: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
