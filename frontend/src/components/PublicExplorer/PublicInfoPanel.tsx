import React from 'react';
import type { CellDetails, ActiveLayerType } from '../../types';
import { Thermometer, ShieldCheck, TreePine, Info, Sparkles, Flame, AlertCircle, MapPinOff, Layers } from 'lucide-react';

interface PublicInfoPanelProps {
  details: CellDetails | null;
  isLoading: boolean;
  searchError?: string | null;
  activeLayer?: ActiveLayerType;
}

export const PublicInfoPanel: React.FC<PublicInfoPanelProps> = ({ details, isLoading, searchError, activeLayer = 'lst' }) => {
  if (isLoading) {
    return (
      <div className="gov-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="skeleton-shimmer" style={{ width: '80px', height: '12px', marginBottom: '6px' }} />
            <div className="skeleton-shimmer" style={{ width: '180px', height: '22px' }} />
          </div>
          <div className="skeleton-shimmer" style={{ width: '90px', height: '26px', borderRadius: '4px' }} />
        </div>
        <div className="skeleton-shimmer" style={{ width: '100%', height: '64px', borderRadius: '4px' }} />
        <div className="skeleton-shimmer" style={{ width: '100%', height: '90px', borderRadius: '4px' }} />
        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px' }}>
          Analyzing satellite thermal data & microclimate drivers...
        </div>
      </div>
    );
  }

  if (searchError) {
    return (
      <div className="gov-card" style={{ padding: '20px', textAlign: 'center' }}>
        <MapPinOff size={36} color="#d97706" style={{ marginBottom: '10px' }} />
        <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '6px', fontWeight: 700 }}>Location Outside Data Coverage</h3>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '14px' }}>
          {searchError}
        </p>

        <div style={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '4px',
          padding: '10px 12px',
          fontSize: '0.8rem',
          color: '#f8fafc',
          textAlign: 'left',
          lineHeight: 1.45
        }}>
          💡 <strong>Coverage Note:</strong> Coverage includes Mumbai and Navi Mumbai (e.g., Dharavi, Marine Drive, Juhu, Seawoods, Bandra, Thane).
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="gov-card" style={{ padding: '24px 20px', textAlign: 'center' }}>
        <Info size={32} color="#60a5fa" style={{ marginBottom: '10px' }} />
        <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '6px', fontWeight: 700 }}>Select Location on Map</h3>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
          Click anywhere on the map or enter a neighborhood above to view satellite thermal metrics, hotspot risk levels, and climate drivers.
        </p>
      </div>
    );
  }

  const getRiskBadgeClass = (risk: string) => {
    switch (risk) {
      case 'Extreme': return 'badge-extreme';
      case 'High': return 'badge-high';
      case 'Moderate': return 'badge-moderate';
      default: return 'badge-low';
    }
  };

  return (
    <div className="gov-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Location Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8', fontWeight: 600 }}>
            {details.region || 'Selected Area'}
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginTop: '2px', lineHeight: 1.25 }}>
            {details.neighborhood_name || `Grid Cell (${details.matched_lat.toFixed(3)}, ${details.matched_lon.toFixed(3)})`}
          </h2>
        </div>
        <span className={`badge ${getRiskBadgeClass(details.heat_risk_tier)}`}>
          {details.heat_risk_tier} Risk
        </span>
      </div>

      {/* Surface Temperature Metric Block */}
      <div style={{
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '4px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '4px',
            background: details.lst_celsius >= 38 ? 'rgba(220, 38, 38, 0.2)' : 'rgba(5, 150, 105, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${details.lst_celsius >= 38 ? 'rgba(220, 38, 38, 0.5)' : 'rgba(5, 150, 105, 0.5)'}`
          }}>
            <Thermometer size={22} color={details.lst_celsius >= 38 ? '#fca5a5' : '#6ee7b7'} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Surface Temperature</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
              {details.lst_celsius}°C
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 500 }}>Land Cover</span>
          <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>
            {details.lulc_label}
          </span>
        </div>
      </div>

      {/* Active Map Layer Detail */}
      {activeLayer && activeLayer !== 'lst' && (
        <div style={{
          background: '#0f172a',
          border: '1px solid #2563eb',
          borderRadius: '4px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} /> Active Layer Reading
            </span>
            <span style={{ fontSize: '0.875rem', color: '#ffffff', fontWeight: 700 }}>
              {activeLayer === 'ndvi' && `NDVI: ${details.ndvi.toFixed(2)}`}
              {activeLayer === 'lulc' && `Land Cover: ${details.lulc_label}`}
              {activeLayer === 'height' && `Building Height: ${details.building_height_m}m`}
              {activeLayer === 'built' && `Built Cover: ${Math.round(details.built_surface_m2 / 25.0)}%`}
              {activeLayer === 'pop' && `Pop Density: ${details.gi_z_score > 0 ? 'High' : 'Moderate'}`}
              {activeLayer === 'air_temp' && `Air Temp: 29.1°C`}
              {activeLayer === 'wind' && `Wind Speed: 2.1 m/s`}
              {activeLayer === 'dewpoint' && `Dewpoint: 21.4°C`}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
            {activeLayer === 'ndvi' && (details.ndvi >= 0.45 ? 'Healthy vegetation canopy providing natural evaporative shade.' : 'Sparse greenery cover limits local solar shading.')}
            {activeLayer === 'lulc' && (details.lulc_label === 'Built-up' ? 'Concrete structures & paving retain solar radiation.' : 'Natural surface buffering localized heat.')}
            {activeLayer === 'height' && (details.building_height_m >= 15 ? 'High-rise urban canyon restricts nighttime heat dissipation.' : 'Low-to-mid rise structure allowing sea breeze circulation.')}
            {activeLayer === 'built' && `Artificial paved surface fraction across this grid cell.`}
            {activeLayer === 'pop' && `Urban resident density index exposed to local thermal conditions.`}
            {activeLayer === 'air_temp' && `Ambient sea breeze air temperature above ground level.`}
            {activeLayer === 'wind' && `Local wind velocity aiding urban heat and pollutant dispersion.`}
            {activeLayer === 'dewpoint' && `Atmospheric moisture level governing thermal comfort.`}
          </p>
        </div>
      )}

      {/* Driver Explanations */}
      <div>
        <h3 style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
          <Sparkles size={14} color="#d97706" />
          Primary Microclimate Drivers
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {details.plain_language_drivers.map((driver, idx) => (
            <div
              key={idx}
              style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '4px',
                padding: '8px 12px',
                fontSize: '0.825rem',
                color: '#f8fafc',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}
            >
              <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>•</span>
              <span>{driver}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hotspot Classification Card */}
      {details.is_hotspot ? (
        <div style={{
          background: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid rgba(220, 38, 38, 0.4)',
          borderRadius: '4px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px'
        }}>
          <Flame size={18} color="#fca5a5" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '0.85rem', color: '#fca5a5', fontWeight: 700 }}>
              {details.gi_confidence_text || 'Confirmed Heat Hotspot'}
            </h4>
            <p style={{ fontSize: '0.775rem', color: '#cbd5e1', marginTop: '2px', lineHeight: 1.35 }}>
              Satellite spatial clustering (Getis-Ord Gi* z-score: +{details.gi_z_score}) identifies this area as a significant heat cluster.
            </p>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(5, 150, 105, 0.1)',
          border: '1px solid rgba(5, 150, 105, 0.3)',
          borderRadius: '4px',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <ShieldCheck size={16} color="#6ee7b7" />
          <span style={{ fontSize: '0.8rem', color: '#6ee7b7', fontWeight: 600 }}>
            Thermally Stable Zone (Not Significant Hotspot)
          </span>
        </div>
      )}

      {/* Recommended Intervention Section */}
      {details.nearest_intervention && (
        <div style={{
          background: '#0f172a',
          border: `1px solid ${details.nearest_intervention.in_current_plan ? '#059669' : '#334155'}`,
          borderRadius: '4px',
          padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{
              fontSize: '0.725rem',
              color: details.nearest_intervention.in_current_plan ? '#6ee7b7' : '#60a5fa',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <TreePine size={14} />
              {details.nearest_intervention.in_current_plan
                ? 'Planned ₹83 Cr Municipal Allocation'
                : 'Recommended Mitigation Strategy'}
            </span>

            {details.nearest_intervention.in_current_plan && (
              <span style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 500 }}>
                ~{details.nearest_intervention.distance_km} km away
              </span>
            )}
          </div>

          {!details.nearest_intervention.in_current_plan && (
            <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginBottom: '8px', lineHeight: 1.35 }}>
              This location is outside the top 4% hotspot priority allocation. Recommended mitigation based on local drivers:
            </p>
          )}

          <h4 style={{ fontSize: '1rem', color: '#ffffff', fontWeight: 700 }}>
            {details.nearest_intervention.type}
          </h4>

          <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', fontWeight: 500 }}>Predicted Cooling</span>
              <span style={{ fontSize: '0.9rem', color: '#6ee7b7', fontWeight: 700 }}>
                -{details.nearest_intervention.predicted_cooling_c}°C
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', fontWeight: 500 }}>Unit Cell Cost</span>
              <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 700 }}>
                ₹{(details.nearest_intervention.cost_usd * 83).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Model Confidence Note */}
          {details.nearest_intervention.is_low_confidence && details.nearest_intervention.confidence_note && (
            <div style={{
              marginTop: '10px',
              padding: '8px 10px',
              background: 'rgba(217, 119, 6, 0.15)',
              border: '1px solid rgba(217, 119, 6, 0.4)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#fde047',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              lineHeight: 1.35
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{details.nearest_intervention.confidence_note}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
