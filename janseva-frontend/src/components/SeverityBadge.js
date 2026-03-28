import React from 'react';
import './SeverityBadge.css';

const SEVERITY_STYLES = {
  severe:   { color: '#C53030', bg: 'rgba(197,48,48,0.08)',   label: 'SEVERE' },
  moderate: { color: '#B7781A', bg: 'rgba(183,120,26,0.08)',  label: 'MODERATE' },
  minor:    { color: '#2D7D4F', bg: 'rgba(45,125,79,0.08)',   label: 'MINOR' },
};

function SeverityBadge({ severity }) {
  const level = severity?.toLowerCase() || 'minor';
  const style = SEVERITY_STYLES[level] || SEVERITY_STYLES.minor;

  return (
    <span
      className="severity-badge"
      style={{
        color: style.color,
        backgroundColor: style.bg,
        borderColor: style.color,
      }}
    >
      {style.label}
    </span>
  );
}

export default SeverityBadge;
