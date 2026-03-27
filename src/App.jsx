import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import TopHeader from './components/TopHeader';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import Login from './pages/Login';
import SeedPage from './pages/SeedPage';
import AdminDashboard from './pages/AdminDashboard';
import Footer from './components/Footer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';
import './index.css';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <div className="loading-state">Loading...</div>;
  if (adminOnly && (!user || !isAdmin)) return <Navigate to="/login" replace />;

  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isFullScreen = isAuthPage;

  return (
    <div className="app-container" id="app-root-container">
      <ScrollToTop />
      {!isFullScreen && <TopHeader />}
      <main className={isAuthPage ? "login-main" : "app-main"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/event/:slug" element={<EventDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/seed" element={<SeedPage />} />
        </Routes>
      </main>
      {!isFullScreen && <Footer />}
      {!isFullScreen && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}
