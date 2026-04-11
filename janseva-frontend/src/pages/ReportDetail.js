import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import CategoryBadge from '../components/CategoryBadge';
import SeverityBadge from '../components/SeverityBadge';
import { getReportById, voteReport, addComment as addCommentAPI, downloadPDF, deleteReport as deleteReportAPI } from '../api';
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
  pending:     { color: '#E8A020', label: 'Pending' },
  in_progress: { color: '#0891B2', label: 'In Progress' },
  resolved:    { color: '#16A34A', label: 'Resolved' },
  closed:      { color: '#6B7280', label: 'Closed' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report,      setReport]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [upvoted,     setUpvoted]     = useState(false);
  const [voteCount,   setVoteCount]   = useState(0);
  const [comments,    setComments]    = useState([]);
  const [commentText, setCommentText] = useState('');
  const [posting,     setPosting]     = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getReportById(id);
        const r   = res.data.data;
        setReport(r);
        setVoteCount(r.votes || 0);
      } catch {
        setError("Report not found");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const onVote = async (e) => {
    e.preventDefault();
    if (!token || !report) return;

    const wasUpvoted = upvoted;
    setUpvoted(v => !v);
    setVoteCount(c => wasUpvoted ? c - 1 : c + 1);

    try {
      const res = await voteReport(report._id);
      setVoteCount(res.data.data.votes);
      setUpvoted(res.data.data.voted);
    } catch {
      setUpvoted(wasUpvoted);
      setVoteCount(c => wasUpvoted ? c + 1 : c - 1);
    }
  };

  const onShare = () => {
    navigator.clipboard?.writeText(window.location.href);
  };

  const onAddComment = async () => {
    if (!commentText.trim() || !token) return;
    setPosting(true);
    try {
      const res = await addCommentAPI(report._id, { text: commentText.trim() });
      setComments(prev => [res.data.data, ...prev]);
      setCommentText('');
    } catch {
      // silent fail
    } finally {
      setPosting(false);
    }
  };
  const onDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      await deleteReportAPI(report._id);
      navigate('/');
    } catch {
      alert('Delete failed. Only the report owner can delete.');
    }
  };
  const onDownloadPDF = async () => {
  try {
    const res = await downloadPDF(report._id);
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a   = document.createElement("a");
    a.href     = url;
    a.download = `JanSeva-${report.reportId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
    } catch {
    alert("PDF generation failed. Please try again.");
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isOwner = user._id === report?.reportedBy?._id;
  const isOfficer = user.role === 'officer';

  // ── Loading / Error states ──────────────────────────────────────
  if (loading) return (
    <main className="page-content">
      <div className="empty-state">Loading report...</div>
    </main>
  );

  if (error || !report) return (
    <main className="page-content">
      <div className="rd-back-bar">
        <Link to="/" className="rd-back-btn"><BackIcon /> Reports</Link>
      </div>
      <div className="empty-state" style={{ color: '#DC2626' }}>
        {error || "Report not found"}
      </div>
    </main>
  );

  const statusMeta = STATUS_META[report.status] || STATUS_META.pending;
  const imageUrl   = report.photos?.[0] || null;

  return (
    <main className="page-content">

      {/* Back */}
      <div className="rd-back-bar">
        <Link to="/" className="rd-back-btn"><BackIcon /> Reports</Link>
      </div>

      <div className="rd-body">

        {/* Badges + status */}
        <div className="rd-badges">
          <CategoryBadge category={report.category} />
          <SeverityBadge severity={report.severity} />
          <span className="rd-status" style={{ color: statusMeta.color, borderColor: statusMeta.color }}>
            {statusMeta.label}
          </span>
          {report.aiConfidence && (
            <span className="rd-confidence">
              🤖 {Math.round(report.aiConfidence * 100)}% confidence
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="rd-title">{report.title}</h1>

        {/* Meta */}
        <div className="rd-meta">
          <span className="rd-loc"><LocIcon />{report.district}</span>
          <span className="rd-time">{timeAgo(report.createdAt)}</span>
          <span className="rd-time" style={{ opacity: 0.5 }}>{report.reportId}</span>
        </div>

        {/* AI Insights */}
        {report.aiInsights && (
          <div className="rd-cluster-banner">
            <span className="rd-cluster-icon">🤖</span>
            <div>
              <p className="rd-cluster-title">AI Analysis</p>
              <p className="rd-cluster-sub">{report.aiInsights}</p>
            </div>
          </div>
        )}

        {/* Image */}
        {imageUrl && (
          <div className="rd-img-wrap">
            <img src={imageUrl} alt={report.title} className="rd-img" />
          </div>
        )}

        {/* Description */}
        <p className="rd-desc">{report.description}</p>

        {/* Suggested Department */}
        {report.suggestedDepartment && (
          <div className="rd-impact-row">
            <span className="rd-impact-label">Department</span>
            <span className="rd-impact-val">{report.suggestedDepartment}</span>
          </div>
        )}

        {/* Priority Score */}
        {report.priorityScore !== undefined && (
          <div className="rd-impact-row">
            <span className="rd-impact-label">Priority Score</span>
            <span className="rd-impact-val" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              {report.priorityScore}
            </span>
          </div>
        )}

        <div className="divider" />

        {/* Actions */}
        <div className="rd-actions">
          <button
            className={`rd-action-btn ${upvoted ? 'upvoted' : ''}`}
            onClick={onVote}
            disabled={!token}
            title={token ? 'Support this report' : 'Login to vote'}
          >
            <UpIcon />
            <span>{upvoted ? `${voteCount} · Supported` : `${voteCount} Upvotes`}</span>
          </button>

          <button className="rd-action-btn" onClick={onShare}>
            <ShareIcon />
            <span>Share</span>
          </button>
          {(isOwner || isOfficer) && (
            <button
              className="rd-action-btn"
              onClick={onDelete}
              style={{ color: '#DC2626' }}
            >
              <span>Delete</span>
            </button>
          )}

          <button className="rd-action-btn" onClick={onDownloadPDF}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>PDF</span>
          </button>
        </div>

        <div className="divider" />

        {/* Government Response Timeline */}
        {report.governmentResponse && (
          <div className="rd-section">
            <p className="rd-section-label">Government Response</p>
            <div className="rd-timeline">
              <div className="rd-tl-item">
                <div className="rd-tl-dot official" />
                <div className="rd-tl-line" />
                <div className="rd-tl-content">
                  <p className="rd-tl-author">
                    {report.governmentResponse.officerName || 'Government Officer'}
                  </p>
                  <p className="rd-tl-text">{report.governmentResponse.message}</p>
                  <p className="rd-tl-time">{timeAgo(report.governmentResponse.updatedAt)}</p>
                </div>
              </div>
              <div className="rd-tl-item">
                <div className="rd-tl-dot" />
                <div className="rd-tl-content">
                  <p className="rd-tl-author">System</p>
                  <p className="rd-tl-text">Report filed · {report.reportId}</p>
                  <p className="rd-tl-time">{timeAgo(report.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="divider" />

        {/* Comments */}
        <div className="rd-section">
          <p className="rd-section-label">{comments.length} Comments</p>

          {token ? (
            <div className="rd-comment-input-row">
              <input
                className="rd-comment-input"
                placeholder="Add a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onAddComment()}
              />
              <button
                className="rd-comment-post"
                onClick={onAddComment}
                disabled={!commentText.trim() || posting}
              >
                {posting ? '...' : 'Post'}
              </button>
            </div>
          ) : (
            <p style={{ fontSize: '13px', opacity: 0.5, marginBottom: '12px' }}>
              Login to comment
            </p>
          )}

          <div className="rd-comment-list">
            {comments.map((c, i) => (
              <div key={c._id || i} className={`rd-comment ${c.isOfficialResponse ? 'official' : ''}`}>
                <div className="rd-comment-hdr">
                  <span className="rd-comment-author">
                    {c.user?.name || 'User'}
                    {c.isOfficialResponse && <span className="rd-official-tag">Official</span>}
                  </span>
                  <span className="rd-comment-time">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="rd-comment-text">{c.text}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p style={{ fontSize: '13px', opacity: 0.4 }}>No comments yet.</p>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}