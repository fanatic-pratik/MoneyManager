import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';

const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
  >
    {icon}
    {label}
  </NavLink>
);

const GridIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1" y="1" width="6" height="6" rx="1.5" />
    <rect x="9" y="1" width="6" height="6" rx="1.5" />
    <rect x="1" y="9" width="6" height="6" rx="1.5" />
    <rect x="9" y="9" width="6" height="6" rx="1.5" />
  </svg>
);
const ArrowsIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 5h12M10 2l4 3-4 3M14 11H2M6 8l-4 3 4 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const TargetIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6" />
    <circle cx="8" cy="8" r="3" />
    <circle cx="8" cy="8" r="0.5" fill="currentColor" />
  </svg>
);
const TagIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 2h5l7 7-5 5-7-7V2z" strokeLinejoin="round" />
    <circle cx="5" cy="5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const GearIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="2.5" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M3.05 12.95l1.42-1.42M11.53 4.47l1.42-1.42" strokeLinecap="round" />
  </svg>
);

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">₹</div>
          <span className="sidebar-logo-text">MoneyManager</span>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Overview</span>
          <NavItem to="/" icon={<GridIcon />} label="Dashboard" />
          <NavItem to="/transactions" icon={<ArrowsIcon />} label="Transactions" />

          <span className="nav-section-label">Planning</span>
          <NavItem to="/budgets" icon={<TargetIcon />} label="Budgets" />
          <NavItem to="/categories" icon={<TagIcon />} label="Categories" />

          <span className="nav-section-label">Account</span>
          <NavItem to="/settings" icon={<GearIcon />} label="Settings" />
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={handleLogout} title="Click to logout">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
