import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { getMarkers, getTrending } from '../api';
import './MapPage.css';

const SEV_COLOR = {
  critical: '#DC2626',
  high:     '#EA580C',
  medium:   '#CA8A04',
  low:      '#16A34A',
};

const SEV_RADIUS = {
  critical: 14,
  high:     11,
  medium:   8,
  low:      6,
};

const FILTERS = ['All', 'Critical', 'High', 'Road', 'Safety', 'Wildlife'];

const FILTER_MAP = {
  Critical: (m) => m.severity === 'critical',
  High:     (m) => m.severity === 'high' || m.severity === 'critical',
  Road:     (m) => m.category === 'road_damage',
  Safety:   (m) => m.category === 'women_safety',
  Wildlife: (m) => m.category === 'wildlife',
};

// Uttarakhand center
const UK_CENTER = [30.0668, 79.0193];
const UK_ZOOM   = 8;

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, UK_ZOOM); }, [center]);
  return null;
}

export default function MapPage() {
  const [markers,  setMarkers]  = useState([]);
  const [trending, setTrending] = useState([]);
  const [filter,   setFilter]   = useState('All');
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [markersRes, trendingRes] = await Promise.all([
          getMarkers(),
          getTrending({ period: 7, limit: 13 }),
        ]);
        setMarkers(markersRes.data.data   || []);
        setTrending(trendingRes.data.data || []);
      } catch (err) {
        console.error("Map fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const visible = markers.filter(m => {
    if (filter === 'All') return true;
    return FILTER_MAP[filter]?.(m) ?? true;
  });

  const severeCount = markers.filter(m => m.severity === 'critical').length;

  return (
    <main className="page-content">

      {/* Header */}
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

      {/* Leaflet Map */}
      <div className="map-wrap" style={{ borderRadius: '12px', overflow: 'hidden', height: '420px' }}>
        {loading ? (
          <div style={{ height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
            Loading map...
          </div>
        ) : (
          <MapContainer
            center={UK_CENTER}
            zoom={UK_ZOOM}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={false}
          >
            {/* ✅ OpenStreetMap — no API key */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />

            {/* ✅ Real markers from backend */}
            {visible.map((m, i) => (
              <CircleMarker
                key={m.reportId || i}
                center={[m.lat, m.lng]}
                radius={SEV_RADIUS[m.severity] || 8}
                pathOptions={{
                  color:       SEV_COLOR[m.severity] || '#CA8A04',
                  fillColor:   SEV_COLOR[m.severity] || '#CA8A04',
                  fillOpacity: 0.85,
                  weight:      m.severity === 'critical' ? 2.5 : 1.5,
                }}
              >
                <Popup>
                  <div style={{ minWidth: '160px', fontFamily: 'inherit' }}>
                    <p style={{ fontWeight: 700, marginBottom: '4px', fontSize: '13px' }}>
                      {m.title}
                    </p>
                    <p style={{ fontSize: '11px', opacity: 0.7, marginBottom: '6px' }}>
                      📍 {m.district}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                        background: SEV_COLOR[m.severity], color: '#fff', fontWeight: 600
                      }}>
                        {m.severity}
                      </span>
                      <span style={{
                        fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                        background: 'rgba(0,0,0,0.08)'
                      }}>
                        {m.category?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {m.votes > 0 && (
                      <p style={{ fontSize: '11px', marginTop: '6px', opacity: 0.6 }}>
                        ▲ {m.votes} votes
                      </p>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Legend */}
      <div className="map-legend" style={{ marginTop: '12px' }}>
        {Object.entries(SEV_COLOR).map(([sev, color]) => (
          <div key={sev} className="map-legend-item">
            <span className="map-legend-dot" style={{ background: color }} />
            <span style={{ textTransform: 'capitalize' }}>{sev}</span>
          </div>
        ))}
      </div>

      {/* Summary strip */}
      <div className="map-summary">
        <div className="map-sum-item">
          <span className="map-sum-num" style={{ color: '#DC2626' }}>{severeCount}</span>
          <span className="map-sum-label">Critical zones</span>
        </div>
        <div className="map-sum-sep" />
        <div className="map-sum-item">
          <span className="map-sum-num">{markers.length}</span>
          <span className="map-sum-label">Active reports</span>
        </div>
        <div className="map-sum-sep" />
        <div className="map-sum-item">
          <span className="map-sum-num" style={{ color: 'var(--accent)' }}>
            {[...new Set(markers.map(m => m.district))].length}
          </span>
          <span className="map-sum-label">Districts</span>
        </div>
        <div className="map-sum-sep" />
        <div className="map-sum-item">
          <span className="map-sum-num" style={{ color: '#16A34A' }}>{trending.length}</span>
          <span className="map-sum-label">Trending</span>
        </div>
      </div>

      {/* Trending Districts */}
      <p className="section-label">Hotspot Districts</p>
      <div className="map-district-list">
        {trending.length > 0
          ? trending.map((d, i) => (
            <div
              key={d.district}
              className={`map-district-row ${selected === d.district ? 'active' : ''}`}
              onClick={() => setSelected(d.district === selected ? null : d.district)}
            >
              <span className="map-district-dot" style={{
                background: i === 0 ? '#DC2626' : i === 1 ? '#EA580C' : '#CA8A04'
              }} />
              <span className="map-district-name">{d.district}</span>
              <span className="map-district-cat">{d.topCategory?.replace(/_/g, ' ')}</span>
              <span className="map-district-count">{d.totalReports}</span>
            </div>
          ))
          : (
            <div className="empty-state">No hotspot data yet</div>
          )
        }
      </div>

    </main>
  );
}