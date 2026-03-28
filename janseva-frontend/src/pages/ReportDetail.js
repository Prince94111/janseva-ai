import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import CategoryBadge from '../components/CategoryBadge';
import SeverityBadge from '../components/SeverityBadge';
import { ALL_REPORTS, CLUSTERS } from '../data/sampleData';
import './ReportDetail.css';

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const LocIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const UpIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);
const ShareIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const STATUS_META = {
  open:       { color: '#E8A020', label: 'Open' },
  inprogress: { color: '#0891B2', label: 'In Progress' },
  resolved:   { color: '#16A34A', label: 'Resolved' },
};

const COMMENTS_SEED = [
  { id: 1, author: 'Priya M.',      time: '1h ago',  text: 'Confirmed — I drive this route daily. The damage is exactly as described. Two tyre blowouts near this spot already.', official: false },
  { id: 2, author: 'District PWD',  time: '2h ago',  text: 'Report received. Assessment team has been scheduled for tomorrow morning. Thank you for flagging this.', official: true },
  { id: 3, author: 'Rahul S.',      time: '3h ago',  text: 'Reported to PWD helpline as well. They said "3 days". Please escalate further.', official: false },
];

export default function ReportDetail() {
  const { id } = useParams();
  const report = ALL_REPORTS.find(r => r.id === id) || ALL_REPORTS[0];
  const cluster = CLUSTERS.find(c => c.id === report.clusterId);

  const [upvoted, setUpvoted] = useState(false);
  const [voteCount, setVoteCount] = useState(report.votes);
  const [comments, setComments] = useState(COMMENTS_SEED);
  const [commentText, setCommentText] = useState('');

  const statusMeta = STATUS_META[report.status] || STATUS_META.open;

  const addComment = () => {
    if (!commentText.trim()) return;
    setComments(prev => [{ id: Date.now(), author: 'You', time: 'just now', text: commentText, official: false }, ...prev]);
    setCommentText('');
  };

  return (
    <main className="page-content">

      {/* Back */}
      <div className="rd-back-bar">
        <Link to="/" className="rd-back-btn">
          <BackIcon /> Reports
        </Link>
      </div>

      <div className="rd-body">

        {/* AI Cluster insight — shown if report is part of cluster */}
        {cluster && (
          <div className="rd-cluster-banner">
            <span className="rd-cluster-icon">🔗</span>
            <div>
              <p className="rd-cluster-title">Part of a detected cluster</p>
              <p className="rd-cluster-sub">{cluster.label} · {cluster.reason}</p>
            </div>
          </div>
        )}

        {/* Badges + status */}
        <div className="rd-badges">
          <CategoryBadge category={report.category} />
          <SeverityBadge severity={report.severity} />
          <span className="rd-status" style={{ color: statusMeta.color, borderColor: statusMeta.color }}>
            {statusMeta.label}
          </span>
          {report.aiConfidence && (
            <span className="rd-confidence">🤖 {report.aiConfidence}% confidence</span>
          )}
        </div>

        {/* Title */}
        <h1 className="rd-title">{report.title}</h1>

        {/* Meta */}
        <div className="rd-meta">
          <span className="rd-loc"><LocIcon />{report.location}</span>
          <span className="rd-time">{report.timestamp}</span>
        </div>

        {/* Impact */}
        {report.impact && (
          <div className="rd-impact-row">
            <span className="rd-impact-label">Impact</span>
            <span className="rd-impact-val">{report.impact}</span>
          </div>
        )}

        {/* Image */}
        {report.imageUrl && (
          <div className="rd-img-wrap">
            <img src={report.imageUrl} alt={report.title} className="rd-img" />
          </div>
        )}

        {/* Description */}
        <p className="rd-desc">{report.description}</p>

        <div className="divider" />

        {/* Actions */}
        <div className="rd-actions">
          <button
            className={`rd-action-btn ${upvoted ? 'upvoted' : ''}`}
            onClick={() => { setUpvoted(v => { setVoteCount(c => v ? c - 1 : c + 1); return !v; }); }}
          >
            <UpIcon />
            <span>{upvoted ? voteCount + ' · Supported' : voteCount + ' Upvotes'}</span>
          </button>
          <button className="rd-action-btn">
            <ShareIcon />
            <span>Share</span>
          </button>
        </div>

        <div className="divider" />

        {/* Timeline */}
        <div className="rd-section">
          <p className="rd-section-label">Government Response</p>
          <div className="rd-timeline">
            <div className="rd-tl-item">
              <div className="rd-tl-dot official" />
              <div className="rd-tl-line" />
              <div className="rd-tl-content">
                <p className="rd-tl-author">District PWD Office</p>
                <p className="rd-tl-text">Assessment team scheduled for tomorrow morning.</p>
                <p className="rd-tl-time">2h ago</p>
              </div>
            </div>
            <div className="rd-tl-item">
              <div className="rd-tl-dot system" />
              <div className="rd-tl-line" />
              <div className="rd-tl-content">
                <p className="rd-tl-author">JanSeva AI</p>
                <p className="rd-tl-text">Report forwarded to PWD Uttarakhand and District Collector's office. AI confidence: {report.aiConfidence}%.</p>
                <p className="rd-tl-time">3h ago</p>
              </div>
            </div>
            <div className="rd-tl-item">
              <div className="rd-tl-dot" />
              <div className="rd-tl-content">
                <p className="rd-tl-author">System</p>
                <p className="rd-tl-text">Report filed and verified.</p>
                <p className="rd-tl-time">{report.timestamp}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* Comments */}
        <div className="rd-section">
          <p className="rd-section-label">{comments.length} Comments</p>

          <div className="rd-comment-input-row">
            <input
              className="rd-comment-input"
              placeholder="Add a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addComment()}
            />
            <button
              className="rd-comment-post"
              onClick={addComment}
              disabled={!commentText.trim()}
            >
              Post
            </button>
          </div>

          <div className="rd-comment-list">
            {comments.map(c => (
              <div key={c.id} className={`rd-comment ${c.official ? 'official' : ''}`}>
                <div className="rd-comment-hdr">
                  <span className="rd-comment-author">
                    {c.author}
                    {c.official && <span className="rd-official-tag">Official</span>}
                  </span>
                  <span className="rd-comment-time">{c.time}</span>
                </div>
                <p className="rd-comment-text">{c.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
