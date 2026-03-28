import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CategoryBadge from './CategoryBadge';
import SeverityBadge from './SeverityBadge';
import './ReportCard.css';

const LocIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const UpIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);
const MsgIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const FlagIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);
const PeopleIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const SIGNAL_COLORS = {
  trending:  { color: '#A03030', bg: 'rgba(160,48,48,0.06)'  },
  nearby:    { color: '#A07020', bg: 'rgba(160,112,32,0.06)' },
  escalated: { color: '#1A6480', bg: 'rgba(26,100,128,0.06)' },
  highRisk:  { color: '#A07020', bg: 'rgba(160,112,32,0.06)' },
};

export default function ReportCard({ report, compact = false }) {
  const { id, category, severity, title, description, location, votes, comments, timestamp, imageUrl, status, signal, impact } = report;
  const [upvoted, setUpvoted] = useState(false);
  const [flagged,  setFlagged]  = useState(false);
  const [count, setCount] = useState(votes);

  const sigStyle = signal ? SIGNAL_COLORS[signal.type] || SIGNAL_COLORS.nearby : null;

  const onUp = (e) => {
    e.preventDefault(); e.stopPropagation();
    setUpvoted(v => { setCount(c => v ? c - 1 : c + 1); return !v; });
  };
  const onFlag = (e) => { e.preventDefault(); e.stopPropagation(); setFlagged(v => !v); };

  return (
    <Link to={`/report/${id}`} className="rc">
      {/* AI Signal strip */}
      {signal && (
        <div className="rc-signal" style={{ color: sigStyle.color, background: sigStyle.bg, borderLeftColor: sigStyle.color }}>
          {signal.label}
        </div>
      )}

      <div className="rc-body">
        <div className="rc-main">
          {/* Badges */}
          <div className="rc-badges">
            <CategoryBadge category={category} />
            <SeverityBadge severity={severity} />
            {status === 'resolved' && <span className="rc-resolved">✓ Resolved</span>}
          </div>

          {/* Title */}
          <p className="rc-title">{title}</p>

          {/* Description */}
          {!compact && <p className="rc-desc truncate-2">{description}</p>}

          {/* Impact hint */}
          {impact && (
            <div className="rc-impact">
              <PeopleIcon />
              <span>{impact}</span>
            </div>
          )}

          {/* Footer */}
          <div className="rc-footer">
            <span className="rc-loc"><LocIcon />{location}</span>
            <div className="rc-actions">
              <button className={`rc-btn ${upvoted ? 'rc-btn--up' : ''}`} onClick={onUp} title="Support">
                <UpIcon /><span>{count}</span>
              </button>
              <button className="rc-btn" onClick={e => e.preventDefault()} title="Comments">
                <MsgIcon /><span>{comments}</span>
              </button>
              <button className={`rc-btn ${flagged ? 'rc-btn--flag' : ''}`} onClick={onFlag} title="Flag important">
                <FlagIcon />
              </button>
              <span className="rc-time">{timestamp}</span>
            </div>
          </div>
        </div>

        {imageUrl && !compact && (
          <div className="rc-thumb">
            <img src={imageUrl} alt={title} />
          </div>
        )}
      </div>
    </Link>
  );
}
