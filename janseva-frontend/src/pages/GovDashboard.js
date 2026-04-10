import React, { useState, useEffect, useCallback } from 'react';
import CategoryBadge from '../components/CategoryBadge';
import SeverityBadge from '../components/SeverityBadge';
import {
  getGovStats,
  getPriorityQueue,
  getDeptQueue,
  updateStatus,
} from '../api';
import './GovDashboard.css';

const STATUS_OPTIONS = ['pending', 'in_progress', 'resolved', 'closed'];
const STATUS_LABELS  = { pending: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };
const STATUS_COLORS  = { pending: '#E8A020', in_progress: '#0891B2', resolved: '#16A34A', closed: '#6B7280' };

const TABS = ['Queue', 'Departments', 'Resolved'];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function GovDashboard() {
  const [tab,        setTab]        = useState('Queue');
  const [filter,     setFilter]     = useState('All');
  const [stats,      setStats]      = useState(null);
  const [queue,      setQueue]      = useState([]);
  const [deptQueue,  setDeptQueue]  = useState([]);
  const [resolved,   setResolved]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [updating,   setUpdating]   = useState(null); // reportId being updated

  const token = localStorage.getItem('token');

  // ── Fetch stats + queue on mount ──────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [statsRes, queueRes, deptRes, resolvedRes] = await Promise.all([
          getGovStats(),
          getPriorityQueue({ limit: 50 }),
          getDeptQueue({ limit: 50 }),
          getDeptQueue({ limit: 50 }), // we filter resolved client-side
        ]);
        setStats(statsRes.data.data);
        setQueue(queueRes.data.data.reports      || []);
        setDeptQueue(deptRes.data.data.reports   || []);
        setResolved(
          (resolvedRes.data.data.reports || []).filter(r => r.status === 'resolved' || r.status === 'closed')
        );
      } catch (err) {
        console.error("Gov dashboard fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Status update ─────────────────────────────────────────────
  const handleStatusUpdate = useCallback(async (reportId, newStatus, currentStatus) => {
    if (newStatus === currentStatus || updating === reportId) return;
    setUpdating(reportId);
    try {
      const message = `Status updated to ${STATUS_LABELS[newStatus]} by officer`;
      await updateStatus(reportId, { status: newStatus, message });

      // Update queue local state
      setQueue(prev => prev.map(r =>
        r._id === reportId ? { ...r, status: newStatus } : r
      ));
      setDeptQueue(prev => prev.map(r =>
        r._id === reportId ? { ...r, status: newStatus } : r
      ));

      // Move to resolved if resolved/closed
      if (newStatus === 'resolved' || newStatus === 'closed') {
        const report = queue.find(r => r._id === reportId) ||
                       deptQueue.find(r => r._id === reportId);
        if (report) {
          setResolved(prev => [{ ...report, status: newStatus }, ...prev]);
        }
      }
    } catch (err) {
      console.error("Status update failed:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdating(null);
    }
  }, [updating, queue, deptQueue]);

  // ── Filter queue ──────────────────────────────────────────────
  const activeQueue = queue.filter(r => {
    const notDone = r.status !== 'resolved' && r.status !== 'closed';
    if (filter === 'All')      return notDone;
    if (filter === 'Critical') return notDone && r.severity === 'critical';
    if (filter === 'High')     return notDone && r.severity === 'high';
    if (filter === 'Medium')   return notDone && r.severity === 'medium';
    return notDone;
  });

  // ── Group dept queue by suggestedDepartment ───────────────────
  const deptGroups = deptQueue.reduce((acc, r) => {
    const dept = r.suggestedDepartment || 'Other';
    if (!acc[dept]) acc[dept] = { open: 0, inProgress: 0 };
    if (r.status === 'in_progress') acc[dept].inProgress++;
    else acc[dept].open++;
    return acc;
  }, {});

  const criticalCount = queue.filter(r => r.severity === 'critical' && r.status === 'pending').length;

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

      {/* ── Stats grid — real data ── */}
      <div className="gov-stats-grid">
        {loading ? (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>Loading stats...</div>
        ) : stats ? (
          <>
            <div className="gov-stat-card">
              <span className="gov-stat-val">{stats.total}</span>
              <span className="gov-stat-label">Total Reports</span>
            </div>
            <div className="gov-stat-card">
              <span className="gov-stat-val" style={{ color: '#DC2626' }}>{stats.critical}</span>
              <span className="gov-stat-label">Critical</span>
            </div>
            <div className="gov-stat-card">
              <span className="gov-stat-val" style={{ color: '#0891B2' }}>{stats.inProgress}</span>
              <span className="gov-stat-label">In Progress</span>
            </div>
            <div className="gov-stat-card">
              <span className="gov-stat-val" style={{ color: '#16A34A' }}>{stats.resolved}</span>
              <span className="gov-stat-label">Resolved</span>
            </div>
          </>
        ) : null}
      </div>

      {/* ── Priority alert — real count ── */}
      {criticalCount > 0 && (
        <div className="gov-priority-alert">
          <span className="gov-priority-icon">🔥</span>
          <div>
            <p className="gov-priority-title">
              {criticalCount} critical issue{criticalCount > 1 ? 's' : ''} require immediate action
            </p>
            <p className="gov-priority-sub">
              Scroll down to see priority queue — yatra season impact
            </p>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="filter-bar gov-tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`filter-pill ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'Queue'    && `Queue (${activeQueue.length})`}
            {t === 'Departments' && 'Departments'}
            {t === 'Resolved' && `Resolved (${resolved.length})`}
          </button>
        ))}
      </div>

      {/* ══ QUEUE TAB ══ */}
      {tab === 'Queue' && (
        <>
          <div className="gov-filter-row">
            {['All', 'Critical', 'High', 'Medium'].map(f => (
              <button
                key={f}
                className={`gov-chip ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="empty-state">Loading queue...</div>
          ) : activeQueue.length === 0 ? (
            <div className="empty-state">No reports in this queue. 🎉</div>
          ) : (
            activeQueue.map(r => (
              <div key={r._id} className="gov-report-row">
                <div className="gov-report-top">
                  <div className="gov-report-badges">
                    <CategoryBadge category={r.category} />
                    <SeverityBadge severity={r.severity} />
                  </div>
                  <span className="gov-report-time">{timeAgo(r.createdAt)}</span>
                </div>

                <p className="gov-report-title">{r.title}</p>

                <p className="gov-report-loc">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {r.district} · {r.votes} upvotes · Score: {r.priorityScore}
                </p>

                {/* AI Insights */}
                {r.aiInsights && (
                  <div className="gov-rec-action">
                    <span className="gov-rec-label">AI Insight</span>
                    <span className="gov-rec-text">{r.aiInsights}</span>
                  </div>
                )}

                {/* Suggested Department */}
                {r.suggestedDepartment && (
                  <p style={{ fontSize: '11px', opacity: 0.5, margin: '4px 0 8px' }}>
                    → {r.suggestedDepartment}
                  </p>
                )}

                {/* Status selector */}
                <div className="gov-status-row">
                  <span className="gov-status-label">Status</span>
                  <div className="gov-status-opts">
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s}
                        className={`gov-status-btn ${r.status === s ? 'active' : ''}`}
                        style={r.status === s ? { borderColor: STATUS_COLORS[s], color: STATUS_COLORS[s] } : {}}
                        onClick={() => handleStatusUpdate(r._id, s, r.status)}
                        disabled={updating === r._id}
                      >
                        {updating === r._id && r.status !== s ? '...' : STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ══ DEPARTMENTS TAB ══ */}
      {tab === 'Departments' && (
        <>
          <p className="section-label">Pending by Department</p>
          {loading ? (
            <div className="empty-state">Loading departments...</div>
          ) : Object.keys(deptGroups).length === 0 ? (
            <div className="empty-state">No department data yet.</div>
          ) : (
            Object.entries(deptGroups)
              .sort((a, b) => (b[1].open + b[1].inProgress) - (a[1].open + a[1].inProgress))
              .map(([dept, counts]) => {
                const total   = counts.open + counts.inProgress;
                const pct     = total ? Math.round((counts.inProgress / total) * 100) : 0;
                return (
                  <div key={dept} className="gov-dept-row">
                    <div className="gov-dept-hdr">
                      <span className="gov-dept-name">{dept}</span>
                    </div>
                    <div className="gov-dept-counts">
                      <div className="gov-dept-count">
                        <span className="gov-dept-num" style={{ color: '#E8A020' }}>{counts.open}</span>
                        <span className="gov-dept-lbl">open</span>
                      </div>
                      <div className="gov-dept-count">
                        <span className="gov-dept-num" style={{ color: '#0891B2' }}>{counts.inProgress}</span>
                        <span className="gov-dept-lbl">in progress</span>
                      </div>
                      <div className="gov-dept-bar-wrap">
                        <div className="gov-dept-bar-track">
                          <div className="gov-dept-bar-fill" style={{ width: `${pct}%`, background: '#0891B2' }} />
                        </div>
                        <span className="gov-dept-pct">{pct}% active</span>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </>
      )}

      {/* ══ RESOLVED TAB ══ */}
      {tab === 'Resolved' && (
        <>
          {resolved.length === 0 ? (
            <div className="empty-state">No resolved reports yet. Update status in Queue tab.</div>
          ) : (
            resolved.map(r => (
              <div key={r._id} className="gov-report-row gov-resolved-row">
                <div className="gov-report-top">
                  <div className="gov-report-badges">
                    <CategoryBadge category={r.category} />
                  </div>
                  <span className="gov-resolved-check">✓ {STATUS_LABELS[r.status]}</span>
                </div>
                <p className="gov-report-title">{r.title}</p>
                <p className="gov-report-loc">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {r.district} · {timeAgo(r.updatedAt)}
                </p>
                {r.governmentResponse?.message && (
                  <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '6px', fontStyle: 'italic' }}>
                    "{r.governmentResponse.message}"
                  </p>
                )}
              </div>
            ))
          )}
        </>
      )}
    </main>
  );
}