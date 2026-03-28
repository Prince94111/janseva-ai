import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const icons = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  trending: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  report: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  map: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
      <line x1="9" y1="3" x2="9" y2="18"/>
      <line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  ),
  gov: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  collapse: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  expand: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
};

const NAV = [
  { path: '/',         label: 'Home',     icon: icons.home },
  { path: '/trending', label: 'Trending', icon: icons.trending },
  { path: '/report',   label: 'Report',   icon: icons.report,  cta: true },
  { path: '/map',      label: 'Map',      icon: icons.map },
];

export default function Sidebar() {
  const loc = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sb-logo">
        <Link to="/" className="sb-logo-link">
          <span className="sb-logo-mark">J</span>
          {!collapsed && (
            <span className="sb-logo-text">
              JanSeva<span className="sb-logo-ai">AI</span>
            </span>
          )}
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="sb-nav">
        {NAV.map(({ path, label, icon, cta }) => {
          const active = loc.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`sb-item ${active ? 'active' : ''} ${cta ? 'cta' : ''}`}
              title={collapsed ? label : ''}
            >
              {active && <span className="sb-pip" />}
              <span className="sb-icon">{icon}</span>
              {!collapsed && <span className="sb-label">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="sb-spacer" />

      {/* Gov Dashboard — secondary */}
      <div className="sb-footer">
        <Link
          to="/gov"
          className={`sb-item sb-gov ${loc.pathname === '/gov' ? 'active' : ''}`}
          title={collapsed ? 'Gov Dashboard' : ''}
        >
          {loc.pathname === '/gov' && <span className="sb-pip" />}
          <span className="sb-icon">{icons.gov}</span>
          {!collapsed && <span className="sb-label">Gov Dashboard</span>}
        </Link>

        <button className="sb-collapse-btn" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? icons.expand : icons.collapse}
        </button>
      </div>
    </aside>
  );
}
