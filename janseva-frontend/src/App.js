import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';

import Sidebar        from './components/Sidebar';
import AIInsightsPanel from './components/AIInsightsPanel';

import HomePage     from './pages/HomePage';
import ReportPage   from './pages/ReportPage';
import MapPage      from './pages/MapPage';
import ReportDetail from './pages/ReportDetail';
import TrendingPage from './pages/TrendingPage';
import GovDashboard from './pages/GovDashboard';

// Show insights panel only on feed pages
const INSIGHTS_ROUTES = ['/', '/trending'];

function Shell() {
  const location = useLocation();
  const showInsights = INSIGHTS_ROUTES.includes(location.pathname);

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
            <Route path="/gov"        element={<GovDashboard />} />
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
