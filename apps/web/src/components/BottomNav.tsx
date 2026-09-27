import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Avatar from './Avatar';

export default function BottomNav() {
  const { user } = useAuth();
  return (
    <nav className="bottom-nav">
      <div className="nav-pages">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 9h18M8 3v4M16 3v4" />
          </svg>
          <span className="smallcaps">week</span>
        </NavLink>
        <NavLink to="/library" className={({ isActive }) => (isActive ? 'active' : '')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z" />
            <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
          </svg>
          <span className="smallcaps">library</span>
        </NavLink>
        <NavLink to="/shop" className={({ isActive }) => (isActive ? 'active' : '')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span className="smallcaps">shop</span>
        </NavLink>
      </div>
      <NavLink to="/profile" className={({ isActive }) => `you ${isActive ? 'active' : ''}`}>
        <span className="nav-avatar">
          <Avatar pictureUrl={user?.pictureUrl} name={user?.name} size={24} />
        </span>
        <span className="smallcaps">you</span>
      </NavLink>
    </nav>
  );
}
