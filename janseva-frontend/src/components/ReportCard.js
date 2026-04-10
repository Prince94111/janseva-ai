import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CategoryBadge from './CategoryBadge';
import SeverityBadge from './SeverityBadge';
import { voteReport } from '../api';
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

// ✅ Format ISO date to relative time
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ReportCard({ report, compact = false }) {
  // ✅ FIXED: map API fields to component fields
  const {
    _id,
    reportId,
    category,
    severity,
    title,
    description,
    district,        // ✅ was location
    votes: initVotes,
    createdAt,       // ✅ was timestamp
    photos,          // ✅ was imageUrl
    status,
  } = report;

  const [upvoted, setUpvoted] = useState(false);
  const [flagged,  setFlagged]  = useState(false);
  const [count, setCount] = useState(initVotes || 0);

  const imageUrl = photos?.[0] || null;
  const token    = localStorage.getItem("token");

  const onUp = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) return; // silent — no auth

    // Optimistic update
    const wasUpvoted = upvoted;
    setUpvoted(v => !v);
    setCount(c => wasUpvoted ? c - 1 : c + 1);

    try {
      const res = await voteReport(_id);
      // Sync with server truth
      setCount(res.data.data.votes);
      setUpvoted(res.data.data.voted);
    } catch {
      // Revert on failure
      setUpvoted(wasUpvoted);
      setCount(c => wasUpvoted ? c + 1 : c - 1);
    }
  };

  const onFlag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFlagged(v => !v);
  };

  return (
    <Link to={`/report/${_id}`} className="rc">
      <div className="rc-body">
        <div className="rc-main">
          {/* Badges */}
          <div className="rc-badges">
            <CategoryBadge category={category} />
            <SeverityBadge severity={severity} />
            {status === 'resolved'    && <span className="rc-resolved">✓ Resolved</span>}
            {status === 'in_progress' && <span className="rc-resolved" style={{color:'#F59E0B'}}>⏳ In Progress</span>}
          </div>

          {/* Title */}
          <p className="rc-title">{title}</p>

          {/* Description */}
          {!compact && <p className="rc-desc truncate-2">{description}</p>}

          {/* Footer */}
          <div className="rc-footer">
            <span className="rc-loc"><LocIcon />{district}</span>
            <div className="rc-actions">
              <button className={`rc-btn ${upvoted ? 'rc-btn--up' : ''}`} onClick={onUp} title="Support">
                <UpIcon /><span>{count}</span>
              </button>
              <button className="rc-btn" onClick={e => e.preventDefault()} title="Comments">
                <MsgIcon /><span>0</span>
              </button>
              <button className={`rc-btn ${flagged ? 'rc-btn--flag' : ''}`} onClick={onFlag} title="Flag important">
                <FlagIcon />
              </button>
              <span className="rc-time">{timeAgo(createdAt)}</span>
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