import React, { useState, useEffect } from 'react';
import './AIInsightsPanel.css';

const HOTSPOTS = [
  { location: 'Rishikesh',   count: 5, type: 'severe',   delta: '+2' },
  { location: 'Rudraprayag', count: 4, type: 'severe',   delta: '+3' },
  { location: 'Shivpuri',    count: 3, type: 'moderate', delta: '+1' },
  { location: 'Haridwar',    count: 2, type: 'minor',    delta: '—'  },
];

const RESOLVED = [
  { title: 'Streetlights fixed',    location: 'Dehradun',   time: '2h ago' },
  { title: 'Pothole repaired',      location: 'Mussoorie',  time: '5h ago' },
  { title: 'Garbage cleared',       location: 'Rishikesh',  time: '1d ago' },
];

const SEVERITY_COLOR = { severe: '#C53030', moderate: '#B7781A', minor: '#2D7D4F' };

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="live-clock">
      {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

function PulsingDot({ color = '#E8A020' }) {
  return (
    <span className="pulsing-dot-wrap">
      <span className="pulsing-dot" style={{ background: color }} />
    </span>
  );
}

export default function AIInsightsPanel() {
  const [aqi] = useState(87);

  return (
    <div className="ai-panel">

      {/* Header */}
      <div className="ai-panel-header">
        <div className="ai-panel-title-row">
          <PulsingDot />
          <span className="ai-panel-title">AI Insights</span>
        </div>
        <LiveClock />
      </div>

      {/* Daily Summary */}
      <div className="ai-card">
        <div className="ai-card-label">
          <span className="ai-card-icon">🧠</span>
          Daily Summary
        </div>
        <div className="ai-summary-items">
          <div className="ai-summary-row">
            <span className="ai-summary-text">Road damage reports</span>
            <span className="ai-summary-val severe">↑ 30%</span>
          </div>
          <div className="ai-summary-row">
            <span className="ai-summary-text">Yatra-related issues</span>
            <span className="ai-summary-val moderate">↑ 12%</span>
          </div>
          <div className="ai-summary-row">
            <span className="ai-summary-text">Resolved today</span>
            <span className="ai-summary-val good">2 ✓</span>
          </div>
          <div className="ai-summary-row">
            <span className="ai-summary-text">Avg response time</span>
            <span className="ai-summary-val neutral">6.2h</span>
          </div>
        </div>
      </div>

      {/* Hotspot Detection */}
      <div className="ai-card">
        <div className="ai-card-label">
          <span className="ai-card-icon">⚠️</span>
          Hotspot Detection
        </div>
        <div className="ai-hotspot-list">
          {HOTSPOTS.map((h, i) => (
            <div key={i} className="ai-hotspot-row">
              <div className="ai-hotspot-left">
                <span
                  className="ai-hotspot-dot"
                  style={{ background: SEVERITY_COLOR[h.type] }}
                />
                <span className="ai-hotspot-name">{h.location}</span>
              </div>
              <div className="ai-hotspot-right">
                <span className="ai-hotspot-delta" style={{ color: h.delta.startsWith('+') ? '#DC2626' : 'var(--text-tertiary)' }}>
                  {h.delta}
                </span>
                <span className="ai-hotspot-count">{h.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Confidence */}
      <div className="ai-card">
        <div className="ai-card-label">
          <span className="ai-card-icon">🤖</span>
          System Status
        </div>
        <div className="ai-confidence-items">
          <div className="ai-conf-row">
            <span className="ai-conf-label">Classification</span>
            <div className="ai-conf-bar-wrap">
              <div className="ai-conf-bar" style={{ width: '94%', background: '#16A34A' }} />
            </div>
            <span className="ai-conf-pct">94%</span>
          </div>
          <div className="ai-conf-row">
            <span className="ai-conf-label">Location match</span>
            <div className="ai-conf-bar-wrap">
              <div className="ai-conf-bar" style={{ width: '87%', background: '#E8A020' }} />
            </div>
            <span className="ai-conf-pct">87%</span>
          </div>
          <div className="ai-conf-row">
            <span className="ai-conf-label">Routing accuracy</span>
            <div className="ai-conf-bar-wrap">
              <div className="ai-conf-bar" style={{ width: '91%', background: '#16A34A' }} />
            </div>
            <span className="ai-conf-pct">91%</span>
          </div>
        </div>
      </div>

      {/* Environment */}
      <div className="ai-card">
        <div className="ai-card-label">
          <span className="ai-card-icon">🌫️</span>
          Environment
        </div>
        <div className="ai-env-grid">
          <div className="ai-env-item">
            <span className="ai-env-val" style={{ color: aqi < 100 ? '#16A34A' : aqi < 150 ? '#CA8A04' : '#DC2626' }}>
              {aqi}
            </span>
            <span className="ai-env-label">AQI</span>
          </div>
          <div className="ai-env-item">
            <span className="ai-env-val">18°</span>
            <span className="ai-env-label">Temp</span>
          </div>
          <div className="ai-env-item">
            <span className="ai-env-val">↑↓</span>
            <span className="ai-env-label">Wind</span>
          </div>
          <div className="ai-env-item">
            <span className="ai-env-val" style={{ color: '#0891B2' }}>⛅</span>
            <span className="ai-env-label">Partly cloudy</span>
          </div>
        </div>
      </div>

      {/* Recently Resolved */}
      <div className="ai-card">
        <div className="ai-card-label">
          <span className="ai-card-icon">✅</span>
          Recently Resolved
        </div>
        <div className="ai-resolved-list">
          {RESOLVED.map((r, i) => (
            <div key={i} className="ai-resolved-row">
              <div className="ai-resolved-check">✓</div>
              <div className="ai-resolved-info">
                <span className="ai-resolved-title">{r.title}</span>
                <span className="ai-resolved-meta">{r.location} · {r.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
