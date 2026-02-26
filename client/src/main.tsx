import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { queryClient } from './lib/queryClient';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FEFCF7',
            color: '#6B5D52',
            fontFamily: '"Lato", system-ui, sans-serif',
            fontSize: '14px',
            borderRadius: '14px',
            border: '1px solid rgba(196,154,108,0.25)',
            boxShadow: '0 4px 24px rgba(140,123,110,0.15)',
          },
          success: {
            iconTheme: { primary: '#C9707A', secondary: '#FEFCF7' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
