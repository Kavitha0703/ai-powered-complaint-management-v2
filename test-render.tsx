const env = { VITE_SUPABASE_URL: 'http://localhost', VITE_SUPABASE_ANON_KEY: 'abc' };
global.import = { meta: { env } };
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './src/App.tsx';

try {
  renderToString(<App />);
  console.log("Render OK");
} catch (e) {
  console.error(e);
}
