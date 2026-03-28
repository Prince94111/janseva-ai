import React, { useState } from 'react';
import ReportCard from '../components/ReportCard';
import { SAMPLE_REPORTS, CLUSTERS } from '../data/sampleData';
import './HomePage.css';

const FILTERS = ['All', 'Severe', 'Road', 'Safety', 'Wildlife', 'Near Me'];

const WarnIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

export default function HomePage() {
  const [active, setActive] = useState('All');

  const filtered = SAMPLE_REPORTS.filter(r => {
    if (active === 'All')      return true;
    if (active === 'Severe')   return r.severity === 'severe';
    if (active === 'Road')     return r.category === 'Road Damage';
    if (active === 'Safety')   return r.category === 'Women Safety';
    if (active === 'Wildlife') return r.category === 'Wild Animal';
    return true;
  });

  const severeCount = SAMPLE_REPORTS.filter(r => r.severity === 'severe').length;
  const cluster     = CLUSTERS[0]; // primary cluster to highlight

  return (
    <main className="page-content">

      {/* Sticky header */}
      <div className="page-header">
        <div className="home-hdr">
          <h1 className="text-page-title">Reports</h1>
          <span className="home-district">Uttarakhand</span>
        </div>
      </div>

      {/* System Insight Banner */}
      <div className="insight-banner">
        <div className="insight-banner-icon"><WarnIcon /></div>
        <div className="insight-banner-body">
          <p className="insight-banner-title">High risk cluster detected near Devprayag</p>
          <p className="insight-banner-sub">3 related incidents in last 24h · Likely due to rainfall on NH-58</p>
        </div>
        <div className="insight-banner-count">
          <span className="insight-count-num">{severeCount}</span>
          <span className="insight-count-label">severe</span>
        </div>
      </div>

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
          <span className="stat-num">{SAMPLE_REPORTS.length}</span>
          <span className="stat-label">open</span>
        </div>
        <div className="stat-sep" />
        <div className="stat-item">
          <span className="stat-num" style={{ color: 'var(--accent)' }}>2</span>
          <span className="stat-label">resolved today</span>
        </div>
        <div className="stat-sep" />
        <div className="stat-item">
          <span className="stat-num">847</span>
          <span className="stat-label">total votes</span>
        </div>
        <div className="stat-sep" />
        <div className="stat-item">
          <span className="stat-num" style={{ color: '#DC2626' }}>{severeCount}</span>
          <span className="stat-label">severe</span>
        </div>
      </div>

      {/* Cluster section — shown on All filter */}
      {active === 'All' && cluster && (
        <div className="cluster-section">
          <div className="cluster-header">
            <div className="cluster-header-left">
              <LinkIcon />
              <span className="cluster-label">Cluster · {cluster.label}</span>
            </div>
            <span className="cluster-reason">{cluster.reason}</span>
          </div>
          {SAMPLE_REPORTS
            .filter(r => cluster.reportIds.includes(r.id))
            .map(r => <ReportCard key={r.id} report={r} />)
          }
        </div>
      )}

      {/* Divider label for remaining */}
      {active === 'All' && (
        <p className="section-label">Other Reports</p>
      )}

      {/* Feed */}
      <div className="feed">
        {filtered
          .filter(r => active !== 'All' || !cluster.reportIds.includes(r.id))
          .map(r => <ReportCard key={r.id} report={r} />)
        }
        {filtered.length === 0 && (
          <div className="empty-state">No reports matching this filter.</div>
        )}
      </div>
    </main>
  );
}
