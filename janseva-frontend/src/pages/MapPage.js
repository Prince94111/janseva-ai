import React, { useState } from 'react';
import './MapPage.css';

const MARKERS = [
  { id: '1', x: 52, y: 38, label: 'Devprayag', severity: 'severe',   count: 3, category: 'Road Damage' },
  { id: '2', x: 44, y: 28, label: 'Rishikesh',  severity: 'severe',   count: 5, category: 'Women Safety' },
  { id: '3', x: 40, y: 24, label: 'Haridwar',   severity: 'minor',    count: 2, category: 'Pilgrimage' },
  { id: '4', x: 55, y: 22, label: 'Mussoorie',  severity: 'moderate', count: 2, category: 'Road Damage' },
  { id: '5', x: 46, y: 44, label: 'Shivpuri',   severity: 'moderate', count: 3, category: 'Tourist Crowd' },
  { id: '6', x: 60, y: 52, label: 'Rudraprayag',severity: 'severe',   count: 4, category: 'Road Damage' },
  { id: '7', x: 34, y: 36, label: 'Lansdowne',  severity: 'moderate', count: 1, category: 'Wild Animal' },
  { id: '8', x: 65, y: 34, label: 'Chamoli',    severity: 'moderate', count: 2, category: 'Tourist Crowd' },
  { id: '9', x: 70, y: 58, label: 'Kedarnath',  severity: 'severe',   count: 4, category: 'Road Damage' },
];

const SEV_COLOR = { severe: '#DC2626', moderate: '#CA8A04', minor: '#16A34A' };

const FILTERS = ['All', 'Severe', 'Road Damage', 'Women Safety', 'Tourist Crowd'];

const LEGEND = [
  { color: '#DC2626', label: 'Severe' },
  { color: '#CA8A04', label: 'Moderate' },
  { color: '#16A34A', label: 'Minor' },
];

export default function MapPage() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('All');

  const visible = MARKERS.filter(m => {
    if (filter === 'All') return true;
    if (filter === 'Severe') return m.severity === 'severe';
    return m.category === filter;
  });

  const sel = MARKERS.find(m => m.id === selected);

  return (
    <main className="page-content">
      <div className="page-header">
        <div className="map-hdr">
          <h1 className="text-page-title">Map View</h1>
          <span className="map-live-badge">
            <span className="map-live-dot" />
            Live
          </span>
        </div>
      </div>

      {/* Filter chips */}
      <div className="map-filters">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`map-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Map container */}
      <div className="map-wrap">
        {/* SVG map */}
        <svg className="map-svg" viewBox="0 0 100 80" preserveAspectRatio="xMidYMid meet">
          {/* Background terrain suggestion */}
          <defs>
            <radialGradient id="heatRed" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="#DC2626" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="heatAmber" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#CA8A04" stopOpacity="0.14"/>
              <stop offset="100%" stopColor="#CA8A04" stopOpacity="0"/>
            </radialGradient>
          </defs>

          {/* Uttarakhand rough outline */}
          <path
            d="M20,15 Q30,10 45,12 Q58,8 72,14 Q82,18 88,28 Q92,38 88,50 Q84,62 76,68 Q66,74 55,72 Q44,74 34,68 Q24,62 18,52 Q12,42 14,30 Q16,22 20,15 Z"
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.4"
          />

          {/* River suggestion */}
          <path d="M44,12 Q46,28 46,44 Q47,58 52,70" fill="none" stroke="rgba(8,145,178,0.25)" strokeWidth="0.6" strokeDasharray="1,1"/>
          <path d="M60,8 Q58,24 54,38 Q52,50 52,70" fill="none" stroke="rgba(8,145,178,0.18)" strokeWidth="0.5" strokeDasharray="1,1"/>

          {/* Heat zones for severe clusters */}
          <ellipse cx="52" cy="42" rx="14" ry="12" fill="url(#heatRed)" />
          <ellipse cx="44" cy="26" rx="10" ry="9" fill="url(#heatAmber)" />

          {/* Markers */}
          {visible.map(m => {
            const color  = SEV_COLOR[m.severity];
            const isSel  = selected === m.id;
            const radius = Math.min(2.5 + m.count * 0.4, 4.5);
            return (
              <g key={m.id} onClick={() => setSelected(m.id === selected ? null : m.id)} style={{ cursor: 'pointer' }}>
                {/* Pulse ring for severe */}
                {m.severity === 'severe' && (
                  <circle cx={m.x} cy={m.y} r={radius + 2} fill="none" stroke={color} strokeWidth="0.5" opacity="0.4">
                    <animate attributeName="r" from={radius + 1} to={radius + 4} dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite"/>
                  </circle>
                )}
                <circle
                  cx={m.x} cy={m.y} r={radius}
                  fill={color} fillOpacity={isSel ? 1 : 0.85}
                  stroke={isSel ? '#fff' : 'rgba(255,255,255,0.3)'}
                  strokeWidth={isSel ? 0.6 : 0.3}
                />
                {m.count > 1 && (
                  <text x={m.x} y={m.y + 0.7} textAnchor="middle" fill="#fff" fontSize="2.2" fontWeight="700">
                    {m.count}
                  </text>
                )}
                <text x={m.x} y={m.y + radius + 2.5} textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="2">
                  {m.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="map-legend">
          {LEGEND.map(l => (
            <div key={l.label} className="map-legend-item">
              <span className="map-legend-dot" style={{ background: l.color }} />
              <span>{l.label}</span>
            </div>
          ))}
          <div className="map-legend-item">
            <span className="map-legend-river" />
            <span>River</span>
          </div>
        </div>

        {/* Selected tooltip */}
        {sel && (
          <div className="map-tooltip">
            <div className="map-tooltip-hdr">
              <span className="map-tooltip-loc">📍 {sel.label}</span>
              <button className="map-tooltip-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="map-tooltip-row">
              <span className="map-tt-label">Category</span>
              <span className="map-tt-val">{sel.category}</span>
            </div>
            <div className="map-tooltip-row">
              <span className="map-tt-label">Severity</span>
              <span className="map-tt-val" style={{ color: SEV_COLOR[sel.severity] }}>
                ● {sel.severity.charAt(0).toUpperCase() + sel.severity.slice(1)}
              </span>
            </div>
            <div className="map-tooltip-row">
              <span className="map-tt-label">Reports</span>
              <span className="map-tt-val">{sel.count} active</span>
            </div>
          </div>
        )}
      </div>

      {/* Summary strip */}
      <div className="map-summary">
        <div className="map-sum-item">
          <span className="map-sum-num" style={{ color: '#DC2626' }}>{MARKERS.filter(m => m.severity === 'severe').length}</span>
          <span className="map-sum-label">Severe zones</span>
        </div>
        <div className="map-sum-sep" />
        <div className="map-sum-item">
          <span className="map-sum-num">{MARKERS.reduce((a, m) => a + m.count, 0)}</span>
          <span className="map-sum-label">Total reports</span>
        </div>
        <div className="map-sum-sep" />
        <div className="map-sum-item">
          <span className="map-sum-num" style={{ color: 'var(--accent)' }}>2</span>
          <span className="map-sum-label">Active clusters</span>
        </div>
        <div className="map-sum-sep" />
        <div className="map-sum-item">
          <span className="map-sum-num" style={{ color: '#16A34A' }}>3</span>
          <span className="map-sum-label">Resolved today</span>
        </div>
      </div>

      {/* District list */}
      <p className="section-label">Hotspot Districts</p>
      <div className="map-district-list">
        {[...MARKERS]
          .filter(m => m.severity === 'severe' || m.count >= 3)
          .sort((a, b) => b.count - a.count)
          .map(m => (
            <div
              key={m.id}
              className={`map-district-row ${selected === m.id ? 'active' : ''}`}
              onClick={() => setSelected(m.id === selected ? null : m.id)}
            >
              <span className="map-district-dot" style={{ background: SEV_COLOR[m.severity] }} />
              <span className="map-district-name">{m.label}</span>
              <span className="map-district-cat">{m.category}</span>
              <span className="map-district-count">{m.count}</span>
            </div>
          ))}
      </div>
    </main>
  );
}
