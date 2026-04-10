import React, { useState, useEffect } from 'react';
import ReportCard from '../components/ReportCard';
import { getReports, getTrending } from '../api';
import './HomePage.css';

const FILTERS = ['All', 'Severe', 'Road', 'Safety', 'Wildlife'];

const WarnIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const FILTER_MAP = {
  Severe:   { severity: 'critical' },
  Road:     { category: 'road_damage' },
  Safety:   { category: 'women_safety' },
  Wildlife: { category: 'wildlife' },
};

export default function HomePage() {
  const [active, setActive]       = useState('All');
  const [reports, setReports]     = useState([]);
  const [trending, setTrending]   = useState(null);
  const [stats, setStats]         = useState({ total: 0, resolved: 0, votes: 0, severe: 0 });
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Fetch reports when filter changes
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = FILTER_MAP[active] || {};
        const res = await getReports({ ...params, limit: 50 });
        const data = res.data.data.reports;
        setReports(data);

        // Compute stats from response
        const severe   = data.filter(r => r.severity === 'critical').length;
        const resolved = data.filter(r => r.status === 'resolved').length;
        const votes    = data.reduce((sum, r) => sum + (r.votes || 0), 0);
        setStats({ total: res.data.data.total, resolved, votes, severe });
      } catch (err) {
        setError("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [active]);

  // Fetch trending district once on mount
  useEffect(() => {
    getTrending({ period: 7, limit: 1 })
      .then(res => {
        if (res.data.data.length > 0) setTrending(res.data.data[0]);
      })
      .catch(() => {}); // non-critical, silent fail
  }, []);

  return (
    <main className="page-content">

      {/* Sticky header */}
      <div className="page-header">
        <div className="home-hdr">
          <h1 className="text-page-title">Reports</h1>
          <span className="home-district">Uttarakhand</span>
        </div>
      </div>

      {/* Trending Banner — shows top trending district */}
      {trending && (
        <div className="insight-banner">
          <div className="insight-banner-icon"><WarnIcon /></div>
          <div className="insight-banner-body">
            <p className="insight-banner-title">
              High activity in {trending.district}
            </p>
            <p className="insight-banner-sub">
              {trending.totalReports} reports · Top issue: {trending.topCategory?.replace('_', ' ')}
            </p>
          </div>
          <div className="insight-banner-count">
            <span className="insight-count-num">{trending.priorityScore}</span>
            <span className="insight-count-label">priority</span>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="filter-bar">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-pill ${active === f ? 'active' : ''}`}
            onClick={() => setActive(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-num">{stats.total}</span>
          <span className="stat-label">open</span>
        </div>
        <div className="stat-sep" />
        <div className="stat-item">
          <span className="stat-num" style={{ color: 'var(--accent)' }}>{stats.resolved}</span>
          <span className="stat-label">resolved</span>
        </div>
        <div className="stat-sep" />
        <div className="stat-item">
          <span className="stat-num">{stats.votes}</span>
          <span className="stat-label">total votes</span>
        </div>
        <div className="stat-sep" />
        <div className="stat-item">
          <span className="stat-num" style={{ color: '#DC2626' }}>{stats.severe}</span>
          <span className="stat-label">severe</span>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="empty-state">Loading reports...</div>
      ) : error ? (
        <div className="empty-state" style={{ color: '#DC2626' }}>{error}</div>
      ) : (
        <div className="feed">
          {reports.map(r => (
            <ReportCard key={r._id} report={r} />
          ))}
          {reports.length === 0 && (
            <div className="empty-state">No reports matching this filter.</div>
          )}
        </div>
      )}

    </main>
  );
}