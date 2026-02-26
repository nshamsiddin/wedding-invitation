import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import HomePage from './pages/HomePage';
import EventPage from './pages/EventPage';
import InvitePage from './pages/InvitePage';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import ProtectedRoute from './components/admin/ProtectedRoute';

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"               element={<HomePage />} />
          <Route path="/tashkent"       element={<EventPage slug="tashkent" />} />
          <Route path="/ankara"         element={<EventPage slug="ankara" />} />
          <Route path="/invite/:token"  element={<InvitePage />} />
          <Route path="/admin/login"    element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          {/* Catch-all — redirect unknown paths to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
