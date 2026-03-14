import { Link, useLocation } from 'react-router-dom';
import { Home, User } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="app-bottom-nav" id="bottom-nav">
      <div className="bottom-nav-inner">
        <Link
          to="/"
          className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}
          id="nav-home"
        >
          <Home size={22} strokeWidth={2.5} />
          <span>Home</span>
        </Link>
        <Link
          to="/profile"
          className={`bottom-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
          id="nav-profile"
        >
          <User size={22} strokeWidth={2.5} />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}
