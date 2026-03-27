import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar } from 'lucide-react';

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
          to="/events"
          className={`bottom-nav-item ${location.pathname === '/events' ? 'active' : ''}`}
          id="nav-events"
        >
          <Calendar size={22} strokeWidth={2.5} />
          <span>Events</span>
        </Link>
      </div>
    </nav>
  );
}
