import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function TopHeader() {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

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
          {isAdmin && (
            <Link to="/admin" className={`header-nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
              Admin
            </Link>
          )}
        </nav>

        {isAdmin && (
          <button 
            className="header-logout-btn" 
            onClick={handleLogoutClick}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--color-gray-200)',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              background: 'white',
              marginLeft: '15px'
            }}
          >
            Logout
          </button>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="admin-modal-backdrop">
          <div className="delete-modal-container">
            <h3>Logout?</h3>
            <p>Are you sure you want to end your administrative session?</p>
            <div className="delete-modal-actions">
              <button 
                className="cancel-delete-btn" 
                onClick={() => setShowLogoutModal(false)}
              >
                Stay
              </button>
              <button 
                className="confirm-delete-btn" 
                onClick={confirmLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
