import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import './App.css';

import Sidebar         from './components/Sidebar';
import AIInsightsPanel from './components/AIInsightsPanel';

import HomePage     from './pages/HomePage';
import ReportPage   from './pages/ReportPage';
import MapPage      from './pages/MapPage';
import ReportDetail from './pages/ReportDetail';
import TrendingPage from './pages/TrendingPage';
import GovDashboard from './pages/GovDashboard';
import LoginPage    from './pages/LoginPage';
import SignupPage   from './pages/SignupPage';

const INSIGHTS_ROUTES = ['/', '/trending'];

// ✅ Protect officer-only routes
function OfficerRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user?.role) return <Navigate to="/login" replace />;
  if (user.role !== 'officer') return <Navigate to="/" replace />;
  return children;
}

function Shell() {
  const location     = useLocation();
  const showInsights = INSIGHTS_ROUTES.includes(location.pathname);

  // ✅ Hide shell on auth pages
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);
  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login"  element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <div className="feed-column">
          <Routes>
            <Route path="/"           element={<HomePage />} />
            <Route path="/report"     element={<ReportPage />} />
            <Route path="/map"        element={<MapPage />} />
            <Route path="/report/:id" element={<ReportDetail />} />
            <Route path="/trending"   element={<TrendingPage />} />
            <Route path="/gov"        element={
              <OfficerRoute><GovDashboard /></OfficerRoute>
            } />
            <Route path="/login"      element={<LoginPage />} />
            <Route path="/signup"     element={<SignupPage />} />
            <Route path="*"           element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        {showInsights && (
          <aside className="insights-column">
            <AIInsightsPanel />
          </aside>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Shell />
    </Router>
  );
}

export default App;