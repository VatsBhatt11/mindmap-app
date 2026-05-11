import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import useStore from './store/useStore';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import CanvasPage from './pages/CanvasPage';

function ProtectedRoute({ children }) {
  const user = useStore((s) => s.user);
  if (user === undefined) return null; // still loading
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  const setUser = useStore((s) => s.setUser);
  const setSession = useStore((s) => s.setSession);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setSession]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
        />
        <Route
          path="/canvas/:id"
          element={<ProtectedRoute><CanvasPage /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
