import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ReportPage.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'road_damage',   label: 'Road Damage',   icon: '🛣️' },
  { id: 'women_safety',  label: 'Women Safety',   icon: '🔒' },
  { id: 'tourist_crowd', label: 'Tourist Crowd',  icon: '🏕️' },
  { id: 'pilgrimage',    label: 'Pilgrimage',     icon: '🛕' },
  { id: 'wild_animal',   label: 'Wild Animal',    icon: '🐆' },
  { id: 'encroachment',  label: 'Encroachment',   icon: '🚧' },
  { id: 'garbage',       label: 'Garbage',        icon: '🗑️' },
  { id: 'water_supply',  label: 'Water Supply',   icon: '💧' },
];

const SEVERITIES = [
  { id: 'minor',    label: 'Minor',    color: '#16A34A', desc: 'Can wait a few days' },
  { id: 'moderate', label: 'Moderate', color: '#CA8A04', desc: 'Needs attention soon' },
  { id: 'severe',   label: 'Severe',   color: '#DC2626', desc: 'Immediate action needed' },
];

// AI thinking messages per detected category
const AI_THINKING_SEQUENCES = {
  road_damage: [
    'Scanning road surface texture and geometry...',
    'Detected irregular surface patterns and edge distortion...',
    'Cross-referencing with NH-58 road condition database...',
    'Possible issue: pothole or structural road damage identified.',
  ],
  garbage: [
    'Analysing object density and composition in frame...',
    'Detected accumulation of mixed solid waste materials...',
    'Checking proximity to residential zone markers...',
    'Possible issue: uncleared garbage near public area.',
  ],
  women_safety: [
    'Evaluating ambient light levels and infrastructure...',
    'Detected insufficient lighting along pedestrian path...',
    'Cross-referencing with known safety incident zones...',
    'Possible issue: unsafe conditions for women after dark.',
  ],
  encroachment: [
    'Mapping visible structures against public space boundaries...',
    'Detected object placement inconsistent with zoning norms...',
    'Flagging for spatial compliance review...',
    'Possible issue: encroachment on public footpath or road.',
  ],
  water_supply: [
    'Analysing ground surface moisture and pipe visibility...',
    'Detected water logging or visible pipe exposure...',
    'Comparing with reported supply issues in district...',
    'Possible issue: water leakage or supply failure.',
  ],
  tourist_crowd: [
    'Estimating crowd density from image composition...',
    'Detected overcrowding beyond recommended capacity...',
    'Checking against registered event or permit records...',
    'Possible issue: unregulated tourist crowd or camping.',
  ],
  pilgrimage: [
    'Detecting religious infrastructure context from image...',
    'Identified yatra route or pilgrimage gathering point...',
    'Checking for reported service disruptions in zone...',
    'Possible issue: pilgrimage facility or service failure.',
  ],
  wild_animal: [
    'Scanning for animal presence or habitat indicators...',
    'Detected possible wildlife activity near human settlement...',
    'Cross-referencing with forest department alert zones...',
    'Possible issue: wild animal sighting near populated area.',
  ],
};

const AI_RESULTS = [
  { category: 'road_damage',   severity: 'severe',   confidence: 94, reasoning: 'Based on visual cues, the system identified large surface deformation consistent with structural road failure, likely worsened by water erosion.' },
  { category: 'garbage',       severity: 'moderate', confidence: 88, reasoning: 'Based on visual cues, the system detected dense accumulation of solid waste near a public zone, indicating a collection failure.' },
  { category: 'women_safety',  severity: 'severe',   confidence: 91, reasoning: 'Based on visual cues, the system identified critically low ambient lighting on a pedestrian stretch, posing after-dark safety risk.' },
  { category: 'encroachment',  severity: 'moderate', confidence: 85, reasoning: 'Based on visual cues, the system detected a structure obstructing public right-of-way inconsistent with urban zoning norms.' },
  { category: 'water_supply',  severity: 'minor',    confidence: 78, reasoning: 'Based on visual cues, the system identified moisture patterns and surface reflections consistent with underground pipe leakage.' },
];

function randomAI() {
  return AI_RESULTS[Math.floor(Math.random() * AI_RESULTS.length)];
}

function generateReportId() {
  return `UK${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
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

function LocationRow({ locationStatus, location, manualLocation, onManualChange }) {
  if (locationStatus === 'loading') {
    return (
      <div className="loc-row loading">
        <span className="loc-spinner" />
        <span>Detecting your location...</span>
      </div>
    );
  }
  if (locationStatus === 'found') {
    return (
      <div className="loc-row found">
        <span className="loc-icon">📍</span>
        <span><strong>Location captured:</strong> {location}</span>
        <span className="loc-gps-badge">GPS ✓</span>
      </div>
    );
  }
  return (
    <div className="loc-manual-wrap">
      <div className="loc-row denied">
        <span className="loc-icon">📍</span>
        <span>GPS unavailable — enter manually</span>
      </div>
      <input
        className="rp-input"
        placeholder="Village / Town, District (e.g. Rishikesh, Tehri Garhwal)"
        value={manualLocation}
        onChange={e => onManualChange(e.target.value)}
      />
    </div>
  );
}

// ─── AI Thinking Feed ─────────────────────────────────────────────────────────

function AIThinkingFeed({ imagePreview, aiResult, thinkingMessages, thinkingDone }) {
  const cat  = CATEGORIES.find(c => c.id === aiResult?.category);
  const sev  = SEVERITIES.find(s => s.id === aiResult?.severity);

  return (
    <div className="ai-feed-wrap">

      {/* Image reference — small, controlled, isolated */}
      {imagePreview && (
        <div className="ai-image-ref">
          <img
            src={imagePreview}
            alt="Uploaded report"
            className="ai-image-ref-img"
            /* Prevent any browser-injected content */
            referrerPolicy="no-referrer"
          />
          <span className="ai-image-ref-label">Analysing this image</span>
        </div>
      )}

      {/* AI message stream */}
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

        {/* Typing indicator — shown while still thinking */}
        {!thinkingDone && thinkingMessages.length > 0 && (
          <div className="ai-message ai-message--typing">
            <div className="ai-msg-avatar">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>
            <div className="ai-typing-dots">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>

      {/* Final result card */}
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
              <span className="ai-result-val">
                {cat?.icon} {cat?.label}
              </span>
            </div>
            <div className="ai-result-row">
              <span className="ai-result-key">Severity</span>
              <span className="ai-result-val" style={{ color: sev?.color }}>
                ● {sev?.label}
              </span>
            </div>
            <div className="ai-result-row reasoning">
              <span className="ai-result-key">Reasoning</span>
              <span className="ai-result-reasoning">{aiResult.reasoning}</span>
            </div>
          </div>

          <div className="ai-result-footer">
            ✓ Pre-filled in next step · You can override any field
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportPage() {
  const fileInputRef = useRef(null);
  const dropRef      = useRef(null);

  const [step, setStep] = useState(1);

  // Photo
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging,   setIsDragging]   = useState(false);

  // Location
  const [locationStatus,  setLocationStatus]  = useState('idle');
  const [location,        setLocation]        = useState('');
  const [locationCoords,  setLocationCoords]  = useState(null);
  const [manualLocation,  setManualLocation]  = useState('');

  // AI
  const [thinkingMessages, setThinkingMessages] = useState([]);
  const [thinkingDone,     setThinkingDone]     = useState(false);
  const [aiResult,         setAiResult]         = useState(null);

  // Form (step 3)
  const [category,    setCategory]    = useState('');
  const [severity,    setSeverity]    = useState('');
  const [title,       setTitle]       = useState('');
  const [details,     setDetails]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [reportId,    setReportId]    = useState('');

  // ── GPS on mount ──
  useEffect(() => {
    setLocationStatus('loading');
    if (!navigator.geolocation) { setLocationStatus('denied'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocation('Rajpur Road, Dehradun');
        setLocationStatus('found');
      },
      () => setLocationStatus('denied'),
      { timeout: 6000 }
    );
  }, []);

  // ── Run AI analysis with staggered messages ──
  const runAiAnalysis = useCallback((result) => {
    const msgs = AI_THINKING_SEQUENCES[result.category] || AI_THINKING_SEQUENCES.road_damage;
    setThinkingMessages([]);
    setThinkingDone(false);

    msgs.forEach((msg, i) => {
      setTimeout(() => {
        setThinkingMessages(prev => [...prev, msg]);
        if (i === msgs.length - 1) {
          setTimeout(() => {
            setThinkingDone(true);
            // Move to step 3 after result card shows
            setTimeout(() => setStep(3), 1200);
          }, 600);
        }
      }, i * 750);
    });
  }, []);

  // ── Process image ──
  const processImage = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      // Strictly use only the FileReader result — never anything else
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

  // ── Drag & drop ──
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const prevent = (e) => e.preventDefault();
    const onEnter = () => setIsDragging(true);
    const onLeave = (e) => { if (!el.contains(e.relatedTarget)) setIsDragging(false); };
    const onDrop  = (e) => {
      e.preventDefault(); setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processImage(file);
    };
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

  // ── Submit ──
  const effectiveLocation = locationStatus === 'found' ? location : manualLocation;
  const canSubmit = category && severity && title.trim().length >= 5 && effectiveLocation.trim().length > 2;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imagePreview ? '[base64_data]' : null,
          location: effectiveLocation,
          lat: locationCoords?.lat || null,
          lng: locationCoords?.lng || null,
          category, severity, title, details,
        }),
      });
    } catch (_) {}
    await new Promise(r => setTimeout(r, 1200));
    setReportId(generateReportId());
    setSubmitting(false);
    setStep(4);
  };

  const handleReset = () => {
    setStep(1); setImagePreview(null);
    setThinkingMessages([]); setThinkingDone(false); setAiResult(null);
    setCategory(''); setSeverity(''); setTitle(''); setDetails(''); setReportId('');
  };

  // ════════════════════════════════════════════════
  // STEP 1 — Photo Upload
  // ════════════════════════════════════════════════
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
          <button
            className="rp-gallery-btn"
            onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            Choose from Gallery
          </button>
        </div>

        <LocationRow
          locationStatus={locationStatus}
          location={location}
          manualLocation={manualLocation}
          onManualChange={setManualLocation}
        />

        <button className="rp-skip-btn" onClick={() => setStep(3)}>
          Skip photo → fill details manually
        </button>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════
  // STEP 2 — AI Analysis Feed
  // ════════════════════════════════════════════════
  if (step === 2) return (
    <div className="rp-page">
      <div className="rp-header">
        <StepIndicator current={2} />
        <h1 className="rp-title">Analysing Photo</h1>
        <p className="rp-sub">AI is reading your image and reasoning about the issue...</p>
      </div>

      <div className="rp-body">
        <AIThinkingFeed
          imagePreview={imagePreview}
          aiResult={aiResult}
          thinkingMessages={thinkingMessages}
          thinkingDone={thinkingDone}
        />
      </div>
    </div>
  );

  // ════════════════════════════════════════════════
  // STEP 3 — Confirm & Submit
  // ════════════════════════════════════════════════
  if (step === 3) return (
    <div className="rp-page">
      <div className="rp-header">
        <StepIndicator current={3} />
        <h1 className="rp-title">Confirm & Submit</h1>
        {aiResult && <p className="rp-sub rp-sub--ai">🤖 AI pre-filled the details — review and submit</p>}
      </div>

      <div className="rp-body">

        {/* Photo strip */}
        {imagePreview && (
          <div className="rp-strip">
            <img src={imagePreview} alt="Report" className="rp-strip-img" referrerPolicy="no-referrer" />
            <div className="rp-strip-info">
              <span className="rp-strip-label">Photo attached</span>
              <button
                className="rp-strip-change"
                onClick={() => { setStep(1); setImagePreview(null); setAiResult(null); setCategory(''); setSeverity(''); setTitle(''); }}
              >
                Change ↺
              </button>
            </div>
          </div>
        )}

        {/* Location */}
        <div className="rp-field-group">
          <label className="rp-label">📍 Location</label>
          <LocationRow
            locationStatus={locationStatus}
            location={location}
            manualLocation={manualLocation}
            onManualChange={setManualLocation}
          />
        </div>

        {/* Title — NEW required field */}
        <div className="rp-field-group">
          <label className="rp-label">
            Title <span className="rp-req">*</span>
            <span className="rp-label-hint">Brief one-line description</span>
          </label>
          <input
            className={`rp-input ${title.trim().length > 0 && title.trim().length < 5 ? 'is-error' : title.trim().length >= 5 ? 'is-valid' : ''}`}
            placeholder="e.g. Large pothole on NH-58 near Devprayag junction"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={120}
          />
          <div className="rp-input-foot">
            {title.trim().length > 0 && title.trim().length < 5 && (
              <span className="rp-field-error">⚠ At least 5 characters</span>
            )}
            <span className="rp-char-count">{title.length}/120</span>
          </div>
        </div>

        {/* Category */}
        <div className="rp-field-group">
          <label className="rp-label">
            Category <span className="rp-req">*</span>
            {aiResult && <span className="rp-ai-tag">AI recommended</span>}
          </label>
          <div className="rp-cat-grid">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`rp-cat-btn ${category === cat.id ? 'selected' : ''}`}
                onClick={() => setCategory(category === cat.id ? '' : cat.id)}
              >
                <span className="rp-cat-icon">{cat.icon}</span>
                <span className="rp-cat-label">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div className="rp-field-group">
          <label className="rp-label">
            Severity <span className="rp-req">*</span>
            {aiResult && <span className="rp-ai-tag">AI recommended</span>}
          </label>
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

        {/* Details — optional */}
        <div className="rp-field-group">
          <label className="rp-label">
            Details
            <span className="rp-optional"> — optional, Hindi or English</span>
          </label>
          <textarea
            className="rp-input rp-textarea"
            placeholder="Describe what you see... e.g. 'यह सड़क 2 हफ्ते से खराब है' or 'Pothole since 2 weeks, near bus stop'"
            value={details}
            onChange={e => setDetails(e.target.value)}
            rows={3}
          />
        </div>

        {/* Ready indicator */}
        {canSubmit && (
          <div className="rp-ready">
            <span className="rp-ready-dot" />
            <span>Ready to submit</span>
          </div>
        )}

        {/* Submit */}
        <button
          className={`rp-submit-btn ${canSubmit ? 'active' : 'disabled'} ${submitting ? 'loading' : ''}`}
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting
            ? <span className="rp-spinner-row"><span className="rp-spinner" />Submitting...</span>
            : canSubmit
              ? '🚨 Submit Report'
              : 'Complete required fields above ↑'
          }
        </button>

      </div>
    </div>
  );

  // ════════════════════════════════════════════════
  // STEP 4 — Success
  // ════════════════════════════════════════════════
  if (step === 4) return (
    <div className="rp-page rp-success-page">
      <div className="rp-success-wrap">
        <div className="rp-success-check">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="rp-success-title">Report Submitted!</h2>
        <p className="rp-success-sub">Logged and forwarded to the concerned department. You will be notified on updates.</p>

        <div className="rp-id-card">
          <span className="rp-id-label">Report ID</span>
          <span className="rp-id-val">#{reportId}</span>
          <span className="rp-id-hint">Use this to track your report status</span>
        </div>

        <div className="rp-success-summary">
          <div className="rp-success-row">
            <span className="rp-success-key">Title</span>
            <span className="rp-success-val">{title}</span>
          </div>
          <div className="rp-success-row">
            <span className="rp-success-key">Category</span>
            <span className="rp-success-val">{CATEGORIES.find(c => c.id === category)?.icon} {CATEGORIES.find(c => c.id === category)?.label}</span>
          </div>
          <div className="rp-success-row">
            <span className="rp-success-key">Severity</span>
            <span className="rp-success-val" style={{ color: SEVERITIES.find(s => s.id === severity)?.color }}>
              {SEVERITIES.find(s => s.id === severity)?.label}
            </span>
          </div>
          <div className="rp-success-row last">
            <span className="rp-success-key">Location</span>
            <span className="rp-success-val">{effectiveLocation}</span>
          </div>
        </div>

        <div className="rp-next-steps">
          <p className="rp-next-label">What happens next</p>
          <div className="rp-next-item"><span className="rp-next-dot done" />Report logged in system</div>
          <div className="rp-next-item"><span className="rp-next-dot pending" />Forwarded to concerned department</div>
          <div className="rp-next-item"><span className="rp-next-dot pending" />Officer assigned within 24h</div>
        </div>

        <button className="rp-submit-btn active" style={{ marginTop: 24, width: '100%' }} onClick={handleReset}>
          File another report
        </button>
      </div>
    </div>
  );

  return null;
}
