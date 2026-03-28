import React, { useState } from 'react';
import CategoryBadge from '../components/CategoryBadge';
import SeverityBadge from '../components/SeverityBadge';
import { ALL_REPORTS } from '../data/sampleData';
import './GovDashboard.css';

const STATS = [
  { label: 'Total Reports', value: 47, delta: '+8 today',  color: 'var(--text-primary)' },
  { label: 'Severe',        value: 12, delta: '+3 today',  color: '#DC2626' },
  { label: 'In Progress',   value: 9,  delta: '',          color: '#0891B2' },
  { label: 'Resolved',      value: 26, delta: 'this week', color: '#16A34A' },
];

const DEPARTMENTS = [
  { name: 'PWD Uttarakhand',         open: 8,  inprogress: 3, color: '#E8A020' },
  { name: 'Forest Department',       open: 5,  inprogress: 1, color: '#16A34A' },
  { name: 'Tourism Board',           open: 6,  inprogress: 2, color: '#0891B2' },
  { name: 'District Administration', open: 4,  inprogress: 3, color: '#CA8A04' },
  { name: 'Police',                  open: 3,  inprogress: 0, color: '#DC2626' },
];

const RECOMMENDED_ACTIONS = {
  '6': '🚨 Dispatch emergency road crew — yatra season impact critical',
  '1': '⚠️ Deploy PWD team to NH-58 — 3 near-misses reported',
  '2': '💡 Restore streetlights — immediate safety risk for women',
  '3': '🏕️ Enforce camping ban — Ganga pollution risk',
};

const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Rejected'];
const STATUS_COLORS  = { 'Open': '#E8A020', 'In Progress': '#0891B2', 'Resolved': '#16A34A', 'Rejected': '#DC2626' };

const TABS = ['Queue', 'Departments', 'Resolved'];

export default function GovDashboard() {
  const [tab, setTab] = useState('Queue');
  const [filter, setFilter] = useState('All');
  const [statuses, setStatuses] = useState(
    Object.fromEntries(ALL_REPORTS.map(r => [r.id, r.status === 'resolved' ? 'Resolved' : 'Open']))
  );

  const setStatus = (id, s) => setStatuses(p => ({ ...p, [id]: s }));

  const queueReports = ALL_REPORTS.filter(r => {
    if (filter === 'All')      return true;
    if (filter === 'Severe')   return r.severity === 'severe';
    if (filter === 'Moderate') return r.severity === 'moderate';
    if (filter === 'Minor')    return r.severity === 'minor';
    return true;
  }).filter(r => statuses[r.id] !== 'Resolved');

  const resolvedReports = ALL_REPORTS.filter(r => statuses[r.id] === 'Resolved');

  return (
    <main className="page-content">
      <div className="page-header">
        <div className="gov-hdr-row">
          <div>
            <h1 className="text-page-title">Gov Dashboard</h1>
            <p className="gov-subtitle">Uttarakhand Civic Response</p>
          </div>
          <span className="gov-officer-badge">OFFICER VIEW</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="gov-stats-grid">
        {STATS.map(s => (
          <div key={s.label} className="gov-stat-card">
            <span className="gov-stat-val" style={{ color: s.color }}>{s.value}</span>
            <span className="gov-stat-label">{s.label}</span>
            {s.delta && <span className="gov-stat-delta">{s.delta}</span>}
          </div>
        ))}
      </div>

      {/* Priority alert */}
      <div className="gov-priority-alert">
        <span className="gov-priority-icon">🔥</span>
        <div>
          <p className="gov-priority-title">2 critical issues require immediate action</p>
          <p className="gov-priority-sub">Kedarnath road collapse + Devprayag NH-58 pothole — yatra season impact</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-bar gov-tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`filter-pill ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t} {t === 'Queue' ? `(${queueReports.length})` : t === 'Resolved' ? `(${resolvedReports.length})` : ''}
          </button>
        ))}
      </div>

      {/* ── Queue ── */}
      {tab === 'Queue' && (
        <>
          <div className="gov-filter-row">
            {['All', 'Severe', 'Moderate', 'Minor'].map(f => (
              <button
                key={f}
                className={`gov-chip ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {queueReports.map(r => {
            const action = RECOMMENDED_ACTIONS[r.id];
            return (
              <div key={r.id} className="gov-report-row">
                <div className="gov-report-top">
                  <div className="gov-report-badges">
                    <CategoryBadge category={r.category} />
                    <SeverityBadge severity={r.severity} />
                  </div>
                  <span className="gov-report-time">{r.timestamp}</span>
                </div>

                <p className="gov-report-title">{r.title}</p>

                <p className="gov-report-loc">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {r.location} · {r.votes} upvotes · {r.impact}
                </p>

                {/* AI Recommended action */}
                {action && (
                  <div className="gov-rec-action">
                    <span className="gov-rec-label">Recommended</span>
                    <span className="gov-rec-text">{action}</span>
                  </div>
                )}

                {/* Status selector */}
                <div className="gov-status-row">
                  <span className="gov-status-label">Status</span>
                  <div className="gov-status-opts">
                    {STATUS_OPTIONS.map(s => {
                      const cur = statuses[r.id];
                      return (
                        <button
                          key={s}
                          className={`gov-status-btn ${cur === s ? 'active' : ''}`}
                          style={cur === s ? { borderColor: STATUS_COLORS[s], color: STATUS_COLORS[s] } : {}}
                          onClick={() => setStatus(r.id, s)}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {queueReports.length === 0 && (
            <div className="empty-state">No reports in this queue.</div>
          )}
        </>
      )}

      {/* ── Departments ── */}
      {tab === 'Departments' && (
        <>
          <p className="section-label">Pending by Department</p>
          {DEPARTMENTS.map(d => (
            <div key={d.name} className="gov-dept-row">
              <div className="gov-dept-hdr">
                <span className="gov-dept-name">{d.name}</span>
              </div>
              <div className="gov-dept-counts">
                <div className="gov-dept-count">
                  <span className="gov-dept-num" style={{ color: d.color }}>{d.open}</span>
                  <span className="gov-dept-lbl">open</span>
                </div>
                <div className="gov-dept-count">
                  <span className="gov-dept-num" style={{ color: '#0891B2' }}>{d.inprogress}</span>
                  <span className="gov-dept-lbl">in progress</span>
                </div>
                <div className="gov-dept-bar-wrap">
                  <div className="gov-dept-bar-track">
                    <div
                      className="gov-dept-bar-fill"
                      style={{
                        width: `${Math.round((d.inprogress / (d.open + d.inprogress || 1)) * 100)}%`,
                        background: '#0891B2',
                      }}
                    />
                  </div>
                  <span className="gov-dept-pct">
                    {Math.round((d.inprogress / (d.open + d.inprogress || 1)) * 100)}% active
                  </span>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── Resolved ── */}
      {tab === 'Resolved' && (
        <>
          {resolvedReports.map(r => (
            <div key={r.id} className="gov-report-row gov-resolved-row">
              <div className="gov-report-top">
                <div className="gov-report-badges"><CategoryBadge category={r.category} /></div>
                <span className="gov-resolved-check">✓ Resolved</span>
              </div>
              <p className="gov-report-title">{r.title}</p>
              <p className="gov-report-loc">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {r.location}
              </p>
            </div>
          ))}
          {resolvedReports.length === 0 && (
            <div className="empty-state">No resolved reports yet. Change status in Queue tab.</div>
          )}
        </>
      )}
    </main>
  );
}
