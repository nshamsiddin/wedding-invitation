import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import CustomCursor from './components/ui/CustomCursor';
import ScrollProgress from './components/ui/ScrollProgress';
import HomePage from './garden/pages/HomePage';
import InvitePage from './pages/InvitePage';
import EventPage from './pages/EventPage';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import ProtectedRoute from './components/admin/ProtectedRoute';

function InvitationChrome() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  if (isAdmin) return null;
  return (
    <>
      <CustomCursor />
      <ScrollProgress />
    </>
  );
}

function AppInner() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: '13px',
            borderRadius: '14px',
            border: '1px solid var(--border-warm)',
            boxShadow: 'var(--shadow-md)',
          },
          success: {
            iconTheme: { primary: '#C4975A', secondary: 'var(--bg-surface)' },
          },
          error: {
            iconTheme: { primary: '#C9808A', secondary: 'var(--bg-surface)' },
          },
        }}
      />
      <BrowserRouter>
        <InvitationChrome />
        <Routes>
          {/* ── Garden design ── */}
          <Route path="/"              element={<HomePage />} />
          <Route path="/invite/:token" element={<InvitePage />} />

          {/* ── Event landing pages (linked from homepage event cards) ── */}
          <Route path="/:slug"         element={<EventPage />} />

          {/* ── Admin ── */}
          <Route path="/admin/login"   element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <AppInner />
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
