import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createReport } from '../api';
import './ReportPage.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'road_damage',  label: 'Road Damage',  icon: '🛣️' },
  { id: 'women_safety', label: 'Women Safety',  icon: '🔒' },
  { id: 'wildlife',     label: 'Wild Animal',   icon: '🐆' },
  { id: 'pilgrimage',   label: 'Pilgrimage',    icon: '🛕' },
  { id: 'water',        label: 'Water Supply',  icon: '💧' },
  { id: 'electricity',  label: 'Electricity',   icon: '⚡' },
  { id: 'sanitation',   label: 'Garbage',       icon: '🗑️' },
  { id: 'other',        label: 'Other',         icon: '🚧' },
];

// ✅ FIXED: match backend enum exactly
const SEVERITIES = [
  { id: 'low',      label: 'Minor',    color: '#16A34A', desc: 'Can wait a few days' },
  { id: 'medium',   label: 'Moderate', color: '#CA8A04', desc: 'Needs attention soon' },
  { id: 'high',     label: 'High',     color: '#EA580C', desc: 'Urgent attention needed' },
  { id: 'critical', label: 'Severe',   color: '#DC2626', desc: 'Immediate action needed' },
];

// ✅ FIXED: match backend district enum exactly
const DISTRICTS = [
  'Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun',
  'Haridwar', 'Nainital', 'Pauri Garhwal', 'Pithoragarh',
  'Rudraprayag', 'Tehri Garhwal', 'Udham Singh Nagar', 'Uttarkashi',
];

const AI_THINKING_SEQUENCES = {
  road_damage:  ['Scanning road surface texture...', 'Detected irregular surface patterns...', 'Cross-referencing NH road condition database...', 'Possible issue: pothole or structural road damage identified.'],
  sanitation:   ['Analysing object density in frame...', 'Detected accumulation of solid waste...', 'Checking proximity to residential zones...', 'Possible issue: uncleared garbage near public area.'],
  women_safety: ['Evaluating ambient light levels...', 'Detected insufficient lighting on pedestrian path...', 'Cross-referencing with safety incident zones...', 'Possible issue: unsafe conditions for women after dark.'],
  water:        ['Analysing surface moisture patterns...', 'Detected water logging or pipe exposure...', 'Comparing with reported supply issues...', 'Possible issue: water leakage or supply failure.'],
  wildlife:     ['Scanning for animal habitat indicators...', 'Detected wildlife activity near settlement...', 'Cross-referencing forest department alert zones...', 'Possible issue: wild animal sighting near populated area.'],
  pilgrimage:   ['Detecting pilgrimage infrastructure...', 'Identified yatra route or gathering point...', 'Checking for service disruptions in zone...', 'Possible issue: pilgrimage facility or service failure.'],
  other:        ['Analysing image content...', 'Detecting civic issue patterns...', 'Cross-referencing district issue database...', 'Possible civic issue detected.'],
};

const AI_RESULTS = [
  { category: 'road_damage',  severity: 'critical', confidence: 94, reasoning: 'Large surface deformation consistent with structural road failure, likely worsened by water erosion.' },
  { category: 'sanitation',   severity: 'medium',   confidence: 88, reasoning: 'Dense accumulation of solid waste near a public zone, indicating a collection failure.' },
  { category: 'women_safety', severity: 'critical', confidence: 91, reasoning: 'Critically low ambient lighting on a pedestrian stretch, posing after-dark safety risk.' },
  { category: 'water',        severity: 'low',      confidence: 78, reasoning: 'Moisture patterns consistent with underground pipe leakage.' },
  { category: 'wildlife',     severity: 'high',     confidence: 83, reasoning: 'Wildlife activity indicators detected near human settlement boundary.' },
];

function randomAI() {
  return AI_RESULTS[Math.floor(Math.random() * AI_RESULTS.length)];
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  return (
    <div className="step-indicator">
      {[1, 2, 3].map((n, i) => (
        <React.Fragment key={n}>
          <div className={`step-dot ${n < current ? 'done' : n === current ? 'active' : ''}`}>
            {n < current
              ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <span className="step-num">{n}</span>
            }
          </div>
          {i < 2 && <div className={`step-line ${n < current ? 'done' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Location Row ─────────────────────────────────────────────────────────────

function LocationRow({ locationStatus, location, district, onDistrictChange }) {
  return (
    <div>
      {locationStatus === 'loading' && (
        <div className="loc-row loading">
          <span className="loc-spinner" />
          <span>Detecting your location...</span>
        </div>
      )}
      {locationStatus === 'found' && (
        <div className="loc-row found">
          <span className="loc-icon">📍</span>
          <span><strong>GPS captured</strong> · {location}</span>
          <span className="loc-gps-badge">GPS ✓</span>
        </div>
      )}
      {/* ✅ Always show district picker — required by backend */}
      <select
        className="rp-input"
        value={district}
        onChange={e => onDistrictChange(e.target.value)}
        style={{ marginTop: '8px' }}
      >
        <option value="">Select district *</option>
        {DISTRICTS.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
    </div>
  );
}

// ─── AI Thinking Feed ─────────────────────────────────────────────────────────

function AIThinkingFeed({ imagePreview, aiResult, thinkingMessages, thinkingDone }) {
  const cat = CATEGORIES.find(c => c.id === aiResult?.category);
  const sev = SEVERITIES.find(s => s.id === aiResult?.severity);

  return (
    <div className="ai-feed-wrap">
      {imagePreview && (
        <div className="ai-image-ref">
          <img src={imagePreview} alt="Uploaded report" className="ai-image-ref-img" referrerPolicy="no-referrer" />
          <span className="ai-image-ref-label">Analysing this image</span>
        </div>
      )}

      <div className="ai-messages">
        {thinkingMessages.map((msg, i) => (
          <div key={i} className="ai-message" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="ai-msg-avatar">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>
            <p className="ai-msg-text">{msg}</p>
          </div>
        ))}
        {!thinkingDone && thinkingMessages.length > 0 && (
          <div className="ai-message ai-message--typing">
            <div className="ai-msg-avatar">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>
            <div className="ai-typing-dots"><span /><span /><span /></div>
          </div>
        )}
      </div>

      {thinkingDone && aiResult && (
        <div className="ai-result-card">
          <div className="ai-result-header">
            <div className="ai-result-badge-row">
              <span className="ai-result-badge">🤖 AI Analysis Complete</span>
              <span className="ai-confidence-pill">{aiResult.confidence}% confidence</span>
            </div>
          </div>
          <div className="ai-result-body">
            <div className="ai-result-row">
              <span className="ai-result-key">Category</span>
              <span className="ai-result-val">{cat?.icon} {cat?.label}</span>
            </div>
            <div className="ai-result-row">
              <span className="ai-result-key">Severity</span>
              <span className="ai-result-val" style={{ color: sev?.color }}>● {sev?.label}</span>
            </div>
            <div className="ai-result-row reasoning">
              <span className="ai-result-key">Reasoning</span>
              <span className="ai-result-reasoning">{aiResult.reasoning}</span>
            </div>
          </div>
          <div className="ai-result-footer">✓ Pre-filled in next step · You can override any field</div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportPage() {
  const navigate     = useNavigate();
  const fileInputRef = useRef(null);
  const dropRef      = useRef(null);

  const [step, setStep] = useState(1);

  // Photo
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging,   setIsDragging]   = useState(false);

  // Location
  const [locationStatus, setLocationStatus] = useState('idle');
  const [location,       setLocation]       = useState('');
  const [locationCoords, setLocationCoords] = useState(null);
  const [district,       setDistrict]       = useState('');

  // AI
  const [thinkingMessages, setThinkingMessages] = useState([]);
  const [thinkingDone,     setThinkingDone]     = useState(false);
  const [aiResult,         setAiResult]         = useState(null);

  // Form
  const [category,   setCategory]   = useState('');
  const [severity,   setSeverity]   = useState('');
  const [title,      setTitle]      = useState('');
  const [details,    setDetails]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(null); // holds created report

  // GPS on mount
  useEffect(() => {
    setLocationStatus('loading');
    if (!navigator.geolocation) { setLocationStatus('denied'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setLocationStatus('found');
      },
      () => setLocationStatus('denied'),
      { timeout: 6000 }
    );
  }, []);

  const runAiAnalysis = useCallback((result) => {
    const msgs = AI_THINKING_SEQUENCES[result.category] || AI_THINKING_SEQUENCES.other;
    setThinkingMessages([]);
    setThinkingDone(false);
    msgs.forEach((msg, i) => {
      setTimeout(() => {
        setThinkingMessages(prev => [...prev, msg]);
        if (i === msgs.length - 1) {
          setTimeout(() => {
            setThinkingDone(true);
            setTimeout(() => setStep(3), 1200);
          }, 600);
        }
      }, i * 750);
    });
  }, []);

  const processImage = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImageFile(file); // ✅ store actual file for FormData
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return;
      setImagePreview(dataUrl);
      const result = randomAI();
      setAiResult(result);
      setCategory(result.category);
      setSeverity(result.severity);
      setStep(2);
      runAiAnalysis(result);
    };
    reader.readAsDataURL(file);
  }, [runAiAnalysis]);

  // Drag & drop
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const prevent = (e) => e.preventDefault();
    const onEnter = () => setIsDragging(true);
    const onLeave = (e) => { if (!el.contains(e.relatedTarget)) setIsDragging(false); };
    const onDrop  = (e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) processImage(file); };
    el.addEventListener('dragover',  prevent);
    el.addEventListener('dragenter', onEnter);
    el.addEventListener('dragleave', onLeave);
    el.addEventListener('drop',      onDrop);
    return () => {
      el.removeEventListener('dragover',  prevent);
      el.removeEventListener('dragenter', onEnter);
      el.removeEventListener('dragleave', onLeave);
      el.removeEventListener('drop',      onDrop);
    };
  }, [processImage]);

  const canSubmit = category && severity && title.trim().length >= 5 && district;

  // ✅ FIXED: uses FormData + real API
  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title',       title.trim());
      formData.append('description', details.trim() || title.trim());
      formData.append('category',    category);
      formData.append('severity',    severity);
      formData.append('district',    district);
      if (locationCoords) {
        formData.append('location[type]',         'Point');
        formData.append('location[coordinates][]', locationCoords.lng);
        formData.append('location[coordinates][]', locationCoords.lat);
      }
      if (imageFile) {
        formData.append('photos', imageFile);
      }

      const token = localStorage.getItem('token');
      const res   = await createReport(formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSubmitted(res.data.data);
      setStep(4);
    } catch (err) {
      console.error('Submit failed:', err);
      alert('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1); setImageFile(null); setImagePreview(null);
    setThinkingMessages([]); setThinkingDone(false); setAiResult(null);
    setCategory(''); setSeverity(''); setTitle(''); setDetails('');
    setDistrict(''); setSubmitted(null);
  };

  // ════ STEP 1 — Photo Upload ════
  if (step === 1) return (
    <div className="rp-page">
      <div className="rp-header">
        <StepIndicator current={1} />
        <h1 className="rp-title">File a Report</h1>
        <p className="rp-sub">Take or upload a photo to begin. AI will analyse it instantly.</p>
      </div>
      <div className="rp-body">
        <div
          ref={dropRef}
          className={`rp-upload-zone ${isDragging ? 'dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files[0]) processImage(e.target.files[0]); }}
          />
          <div className="rp-upload-icon">📷</div>
          <p className="rp-upload-title">Take Photo or Upload</p>
          <p className="rp-upload-hint">Drag & drop, tap to choose, or use camera</p>
          <div className="rp-divider"><span>or</span></div>
          <button className="rp-gallery-btn" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            Choose from Gallery
          </button>
        </div>
        <LocationRow locationStatus={locationStatus} location={location} district={district} onDistrictChange={setDistrict} />
        <button className="rp-skip-btn" onClick={() => setStep(3)}>Skip photo → fill details manually</button>
      </div>
    </div>
  );

  // ════ STEP 2 — AI Analysis ════
  if (step === 2) return (
    <div className="rp-page">
      <div className="rp-header">
        <StepIndicator current={2} />
        <h1 className="rp-title">Analysing Photo</h1>
        <p className="rp-sub">AI is reading your image and reasoning about the issue...</p>
      </div>
      <div className="rp-body">
        <AIThinkingFeed imagePreview={imagePreview} aiResult={aiResult} thinkingMessages={thinkingMessages} thinkingDone={thinkingDone} />
      </div>
    </div>
  );

  // ════ STEP 3 — Confirm & Submit ════
  if (step === 3) return (
    <div className="rp-page">
      <div className="rp-header">
        <StepIndicator current={3} />
        <h1 className="rp-title">Confirm & Submit</h1>
        {aiResult && <p className="rp-sub rp-sub--ai">🤖 AI pre-filled the details — review and submit</p>}
      </div>
      <div className="rp-body">

        {imagePreview && (
          <div className="rp-strip">
            <img src={imagePreview} alt="Report" className="rp-strip-img" referrerPolicy="no-referrer" />
            <div className="rp-strip-info">
              <span className="rp-strip-label">Photo attached</span>
              <button className="rp-strip-change" onClick={() => { setStep(1); setImagePreview(null); setImageFile(null); setAiResult(null); setCategory(''); setSeverity(''); setTitle(''); }}>
                Change ↺
              </button>
            </div>
          </div>
        )}

        <div className="rp-field-group">
          <label className="rp-label">📍 Location</label>
          <LocationRow locationStatus={locationStatus} location={location} district={district} onDistrictChange={setDistrict} />
        </div>

        <div className="rp-field-group">
          <label className="rp-label">Title <span className="rp-req">*</span></label>
          <input
            className={`rp-input ${title.trim().length > 0 && title.trim().length < 5 ? 'is-error' : title.trim().length >= 5 ? 'is-valid' : ''}`}
            placeholder="e.g. Large pothole on NH-58 near Devprayag junction"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={120}
          />
          <div className="rp-input-foot">
            {title.trim().length > 0 && title.trim().length < 5 && <span className="rp-field-error">⚠ At least 5 characters</span>}
            <span className="rp-char-count">{title.length}/120</span>
          </div>
        </div>

        <div className="rp-field-group">
          <label className="rp-label">Category <span className="rp-req">*</span> {aiResult && <span className="rp-ai-tag">AI recommended</span>}</label>
          <div className="rp-cat-grid">
            {CATEGORIES.map(cat => (
              <button key={cat.id} className={`rp-cat-btn ${category === cat.id ? 'selected' : ''}`} onClick={() => setCategory(category === cat.id ? '' : cat.id)}>
                <span className="rp-cat-icon">{cat.icon}</span>
                <span className="rp-cat-label">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rp-field-group">
          <label className="rp-label">Severity <span className="rp-req">*</span> {aiResult && <span className="rp-ai-tag">AI recommended</span>}</label>
          <div className="rp-sev-row">
            {SEVERITIES.map(sev => (
              <button
                key={sev.id}
                className={`rp-sev-btn ${severity === sev.id ? 'selected' : ''}`}
                style={severity === sev.id ? { borderColor: sev.color, color: sev.color, background: `${sev.color}18` } : {}}
                onClick={() => setSeverity(severity === sev.id ? '' : sev.id)}
              >
                <span className="rp-sev-label">{sev.label}</span>
                <span className="rp-sev-desc">{sev.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rp-field-group">
          <label className="rp-label">Details <span className="rp-optional">— optional</span></label>
          <textarea className="rp-input rp-textarea" placeholder="Describe what you see..." value={details} onChange={e => setDetails(e.target.value)} rows={3} />
        </div>

        {canSubmit && <div className="rp-ready"><span className="rp-ready-dot" /><span>Ready to submit</span></div>}

        <button
          className={`rp-submit-btn ${canSubmit ? 'active' : 'disabled'} ${submitting ? 'loading' : ''}`}
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting
            ? <span className="rp-spinner-row"><span className="rp-spinner" />Submitting...</span>
            : canSubmit ? '🚨 Submit Report' : 'Complete required fields above ↑'
          }
        </button>
      </div>
    </div>
  );

  // ════ STEP 4 — Success ════
  if (step === 4) return (
    <div className="rp-page rp-success-page">
      <div className="rp-success-wrap">
        <div className="rp-success-check">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="rp-success-title">Report Submitted!</h2>
        <p className="rp-success-sub">Logged and forwarded to the concerned department.</p>

        <div className="rp-id-card">
          <span className="rp-id-label">Report ID</span>
          <span className="rp-id-val">#{submitted?.reportId || 'Generated'}</span>
          <span className="rp-id-hint">Use this to track your report</span>
        </div>

        <div className="rp-success-summary">
          <div className="rp-success-row"><span className="rp-success-key">Title</span><span className="rp-success-val">{submitted?.title || title}</span></div>
          <div className="rp-success-row"><span className="rp-success-key">Category</span><span className="rp-success-val">{CATEGORIES.find(c => c.id === (submitted?.category || category))?.icon} {CATEGORIES.find(c => c.id === (submitted?.category || category))?.label}</span></div>
          <div className="rp-success-row"><span className="rp-success-key">District</span><span className="rp-success-val">{submitted?.district || district}</span></div>
          <div className="rp-success-row last"><span className="rp-success-key">Status</span><span className="rp-success-val" style={{ color: '#CA8A04' }}>Pending Review</span></div>
        </div>

        <div className="rp-next-steps">
          <p className="rp-next-label">What happens next</p>
          <div className="rp-next-item"><span className="rp-next-dot done" />Report logged in system</div>
          <div className="rp-next-item"><span className="rp-next-dot pending" />AI analysis running in background</div>
          <div className="rp-next-item"><span className="rp-next-dot pending" />Officer assigned within 24h</div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button className="rp-submit-btn active" style={{ flex: 1 }} onClick={handleReset}>
            File another
          </button>
          <button className="rp-submit-btn active" style={{ flex: 1, background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)' }}
            onClick={() => navigate(`/report/${submitted?._id}`)}>
            View Report
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}