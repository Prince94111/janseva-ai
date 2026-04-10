import React, { useState, useEffect } from 'react';
import ReportCard from '../components/ReportCard';
import { getTrending, getReports } from '../api';
import './TrendingPage.css';

const WINDOWS = [
  { label: 'Today',   days: 1  },
  { label: '7 Days',  days: 7  },
  { label: '30 Days', days: 30 },
];

const SEV_COLOR = {
  critical: '#DC2626',
  high:     '#EA580C',
  medium:   '#CA8A04',
  low:      '#16A34A',
};

const WHY_TRENDING = [
  { emoji: '🌧️', title: 'Monsoon impact',    desc: 'Heavy rainfall causing road damage across Garhwal division.' },
  { emoji: '🛕', title: 'Yatra season peak', desc: 'Char Dham yatra peak — 40% more civic reports than off-season.' },
  { emoji: '📱', title: 'Awareness surge',   desc: 'JanSeva AI driving 3x more report submissions this week.' },
];

export default function TrendingPage() {
  const [activeWindow,     setActiveWindow]     = useState(WINDOWS[1]); // default 7 Days
  const [districts,        setDistricts]        = useState([]);
  const [topReports,       setTopReports]       = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [loading,          setLoading]          = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [trendingRes, reportsRes] = await Promise.all([
          getTrending({ period: activeWindow.days, limit: 13 }),
          getReports({ limit: 10 }),
        ]);
        setDistricts(trendingRes.data.data   || []);
        setTopReports(reportsRes.data.data.reports || []);
      } catch (err) {
        console.error("Trending fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeWindow]);

  const max = Math.max(...districts.map(d => d.totalReports), 1);

  // Map priority score to severity color
  const getColor = (d, i) => {
    if (i === 0) return SEV_COLOR.critical;
    if (i === 1) return SEV_COLOR.high;
    if (i <= 3)  return SEV_COLOR.medium;
    return SEV_COLOR.low;
  };

  return (
    <main className="page-content">
      <div className="page-header">
        <h1 className="text-page-title">Trending</h1>
      </div>

      {/* Time window tabs */}
      <div className="filter-bar">
        {WINDOWS.map(w => (
          <button
            key={w.label}
            className={`filter-pill ${activeWindow.label === w.label ? 'active' : ''}`}
            onClick={() => setActiveWindow(w)}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Why trending */}
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
      {loading ? (
        <div className="empty-state">Loading districts...</div>
      ) : districts.length === 0 ? (
        <div className="empty-state">No trending data for this period.</div>
      ) : (
        <div className="district-list">
          {districts.map((d, i) => (
            <div
              key={d.district}
              className={`district-row ${selectedDistrict === d.district ? 'active' : ''}`}
              onClick={() => setSelectedDistrict(d.district === selectedDistrict ? null : d.district)}
            >
              <div className="district-row-top">
                <div className="district-left">
                  <span className="district-rank">#{i + 1}</span>
                  <div>
                    <span className="district-name">{d.district}</span>
                    {selectedDistrict === d.district && (
                      <p className="district-reason">
                        ↳ Top issue: {d.topCategory?.replace(/_/g, ' ')} · Priority score: {d.priorityScore}
                      </p>
                    )}
                  </div>
                </div>
                <div className="district-right">
                  <span className="district-delta" style={{ color: getColor(d, i) }}>
                    {d.totalReports} report{d.totalReports !== 1 ? 's' : ''}
                  </span>
                  <span className="district-count">{d.priorityScore}</span>
                </div>
              </div>
              {/* Progress bar based on totalReports */}
              <div className="district-bar-track">
                <div
                  className="district-bar-fill"
                  style={{
                    width:      `${(d.totalReports / max) * 100}%`,
                    background: getColor(d, i),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Most upvoted reports */}
      <p className="section-label">Most Upvoted Reports</p>
      {loading ? (
        <div className="empty-state">Loading reports...</div>
      ) : (
        <div className="feed">
          {topReports.length > 0
            ? topReports.map(r => <ReportCard key={r._id} report={r} />)
            : <div className="empty-state">No reports yet.</div>
          }
        </div>
      )}
    </main>
  );
}