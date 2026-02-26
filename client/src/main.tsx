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
            background: '#1e1b2e',
            color: '#f5ede0',
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '15px',
            borderRadius: '12px',
            border: '1px solid rgba(201,165,90,0.25)',
            boxShadow: '0 4px 24px rgba(14,12,26,0.6)',
          },
          success: {
            iconTheme: { primary: '#c9a55a', secondary: '#1e1b2e' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
