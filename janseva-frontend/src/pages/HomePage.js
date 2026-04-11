import React, { useState, useEffect, useRef } from 'react';
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

// ── Animated counter hook ──────────────────────────────────────────
function useCountUp(target, duration = 800) {
  const [count, setCount] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    if (target === prev.current) return;
    const start   = prev.current;
    const diff    = target - start;
    const startTs = performance.now();

    const tick = (now) => {
      const elapsed = now - startTs;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return count;
}

// ── Skeleton card ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-badges">
        <div className="skeleton-badge" />
        <div className="skeleton-badge short" />
      </div>
      <div className="skeleton-title" />
      <div className="skeleton-title short" />
      <div className="skeleton-desc" />
      <div className="skeleton-desc shorter" />
      <div className="skeleton-footer">
        <div className="skeleton-loc" />
        <div className="skeleton-actions" />
      </div>
    </div>
  );
}

// ── Animated stat item ─────────────────────────────────────────────
function StatNum({ value, color }) {
  const count = useCountUp(value);
  return (
    <span className="stat-num" style={color ? { color } : {}}>
      {count}
    </span>
  );
}

export default function HomePage() {
  const [active,   setActive]   = useState('All');
  const [reports,  setReports]  = useState([]);
  const [trending, setTrending] = useState(null);
  const [stats,    setStats]    = useState({ total: 0, resolved: 0, votes: 0, severe: 0 });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = FILTER_MAP[active] || {};
        const res    = await getReports({ ...params, limit: 50 });
        const data   = res.data.data.reports;
        setReports(data);

        const severe   = data.filter(r => r.severity === 'critical').length;
        const resolved = data.filter(r => r.status === 'resolved').length;
        const votes    = data.reduce((sum, r) => sum + (r.votes || 0), 0);
        setStats({ total: res.data.data.total, resolved, votes, severe });
      } catch {
        setError("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [active]);

  useEffect(() => {
    getTrending({ period: 7, limit: 1 })
      .then(res => {
        if (res.data.data.length > 0) setTrending(res.data.data[0]);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="page-content">

      {/* Header */}
      <div className="page-header">
        <div className="home-hdr">
          <h1 className="text-page-title">Reports</h1>
          <span className="home-district">Uttarakhand</span>
        </div>
      </div>

      {/* Trending Banner */}
      {trending && (
        <div className="insight-banner">
          <div className="insight-banner-icon"><WarnIcon /></div>
          <div className="insight-banner-body">
            <p className="insight-banner-title">
              High activity in {trending.district}
            </p>
            <p className="insight-banner-sub">
              {trending.totalReports} reports · Top issue: {trending.topCategory?.replace(/_/g, ' ')}
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

      {/* ✅ Animated Stats bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <StatNum value={stats.total} />
          <span className="stat-label">open</span>
        </div>
        <div className="stat-sep" />
        <div className="stat-item">
          <StatNum value={stats.resolved} color="var(--accent)" />
          <span className="stat-label">resolved</span>
        </div>
        <div className="stat-sep" />
        <div className="stat-item">
          <StatNum value={stats.votes} />
          <span className="stat-label">total votes</span>
        </div>
        <div className="stat-sep" />
        <div className="stat-item">
          <StatNum value={stats.severe} color="#DC2626" />
          <span className="stat-label">severe</span>
        </div>
      </div>

      {/* ✅ Skeleton loading / error / feed */}
      {loading ? (
        <div className="feed">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="empty-state" style={{ color: '#DC2626' }}>{error}</div>
      ) : (
        <div className="feed">
          {reports.map((r, i) => (
            <div
              key={r._id}
              className="feed-item-animate"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <ReportCard report={r} />
            </div>
          ))}
          {reports.length === 0 && (
            <div className="empty-state">No reports matching this filter.</div>
          )}
        </div>
      )}

    </main>
  );
}