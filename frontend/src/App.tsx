import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Journal from './pages/Journal';
import History from './pages/History';
import Statistics from './pages/Statistics';
import Analysis from './pages/Analysis';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import { Toaster } from 'sonner';

function Protected({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  // allow demo user without token (offline mode) — user persisted in localStorage
  if (!user) return <Navigate to="/auth" replace />;
  // if user exists but no token and not demo, still allow (fallback)
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route element={<Protected><DataProvider><Layout /></DataProvider></Protected>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/history" element={<History />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
