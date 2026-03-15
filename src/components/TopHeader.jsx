import { Bell, User as UserIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function TopHeader() {
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const [imgError, setImgError] = useState(false);

  const avatarSrc = user?.photoURL && !imgError 
    ? user.photoURL 
    : '/default-avatar.png';

  return (
    <header className="app-top-header" id="top-header">
      <Link to="/" className="top-header-logo">
        <img src="/logos/midpoint-events-horizontal.svg" alt="Midpoint Events" className="header-logo-img" />
      </Link>

      <div className="header-right-group">
        <nav className="header-nav" aria-label="Main Navigation">
          <Link to="/" className={`header-nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/events" className={`header-nav-link ${location.pathname === '/events' ? 'active' : ''}`}>
            Events
          </Link>
          <Link to="/register" className={`header-nav-link ${location.pathname === '/register' ? 'active' : ''}`}>
            About Us
          </Link>
          {isAdmin && (
            <Link to="/admin" className={`header-nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
              Admin
            </Link>
          )}
        </nav>

        {user ? (
          <Link to="/profile" className="header-user-icon">
            <img 
              src={avatarSrc} 
              alt={user.name} 
              className="header-avatar-img"
              onError={() => setImgError(true)} 
            />
          </Link>
        ) : (
          <Link to="/login" className="header-login-btn">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
