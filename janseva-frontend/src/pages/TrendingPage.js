import React, { useState } from 'react';
import ReportCard from '../components/ReportCard';
import { ALL_REPORTS } from '../data/sampleData';
import './TrendingPage.css';

const WINDOWS = ['Today', '7 Days', '30 Days'];

const DISTRICTS = [
  { name: 'Rudraprayag',   count: 14, delta: '+6', reason: 'Road collapses after heavy rain',  severity: 'severe' },
  { name: 'Pauri Garhwal', count: 11, delta: '+3', reason: 'Wildlife incidents increasing',     severity: 'moderate' },
  { name: 'Tehri Garhwal', count: 9,  delta: '+4', reason: 'Yatra season surge',               severity: 'severe' },
  { name: 'Chamoli',       count: 7,  delta: '+2', reason: 'Permit system failures',            severity: 'moderate' },
  { name: 'Haridwar',      count: 6,  delta: '+1', reason: 'Tourist overcrowding',              severity: 'moderate' },
  { name: 'Uttarkashi',    count: 4,  delta: '+1', reason: 'Road damage post-monsoon',          severity: 'minor' },
];

const MAX = Math.max(...DISTRICTS.map(d => d.count));

const SEV_COLOR = { severe: '#DC2626', moderate: '#CA8A04', minor: '#16A34A' };

const WHY_TRENDING = [
  { emoji: '🌧️', title: 'Monsoon impact', desc: 'Heavy rainfall in last 48h causing road damage across Garhwal division.' },
  { emoji: '🛕', title: 'Yatra season peak', desc: 'Char Dham yatra peak period — 40% more civic reports than off-season.' },
  { emoji: '📱', title: 'Awareness surge', desc: 'JanSeva AI social campaign driving 3x more report submissions.' },
];

export default function TrendingPage() {
  const [window_, setWindow] = useState('Today');
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const sorted = [...ALL_REPORTS].sort((a, b) => b.votes - a.votes);

  return (
    <main className="page-content">
      <div className="page-header">
        <h1 className="text-page-title">Trending</h1>
      </div>

      {/* Time tabs */}
      <div className="filter-bar">
        {WINDOWS.map(w => (
          <button
            key={w}
            className={`filter-pill ${window_ === w ? 'active' : ''}`}
            onClick={() => setWindow(w)}
          >
            {w}
          </button>
        ))}
      </div>

      {/* Why trending section */}
      <div className="why-section">
        <p className="section-label" style={{ padding: '12px 20px 8px' }}>Why it's trending</p>
        <div className="why-cards">
          {WHY_TRENDING.map((w, i) => (
            <div key={i} className="why-card">
              <span className="why-emoji">{w.emoji}</span>
              <div>
                <p className="why-title">{w.title}</p>
                <p className="why-desc">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* District ranking */}
      <p className="section-label">By District</p>
      <div className="district-list">
        {DISTRICTS.map((d, i) => (
          <div
            key={d.name}
            className={`district-row ${selectedDistrict === d.name ? 'active' : ''}`}
            onClick={() => setSelectedDistrict(d.name === selectedDistrict ? null : d.name)}
          >
            <div className="district-row-top">
              <div className="district-left">
                <span className="district-rank">#{i + 1}</span>
                <div>
                  <span className="district-name">{d.name}</span>
                  {selectedDistrict === d.name && (
                    <p className="district-reason">↳ {d.reason}</p>
                  )}
                </div>
              </div>
              <div className="district-right">
                <span className="district-delta" style={{ color: SEV_COLOR[d.severity] }}>{d.delta} today</span>
                <span className="district-count">{d.count}</span>
              </div>
            </div>
            <div className="district-bar-track">
              <div
                className="district-bar-fill"
                style={{ width: `${(d.count / MAX) * 100}%`, background: SEV_COLOR[d.severity] }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Most upvoted */}
      <p className="section-label">Most Upvoted Reports</p>
      <div className="feed">
        {sorted.map(r => <ReportCard key={r.id} report={r} />)}
      </div>
    </main>
  );
}
