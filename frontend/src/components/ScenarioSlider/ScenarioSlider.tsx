import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import type { RawHeatPoint } from '../../types';
import { fetchFullGrid } from '../../services/api';
import { GridHeatOverlay } from '../PublicExplorer/GridHeatOverlay';
import { Sliders, Sparkles, TreePine, Flame } from 'lucide-react';

export const ScenarioSlider: React.FC = () => {
  const [sliderVal, setSliderVal] = useState<number>(0); // 0 = Today (Baseline), 100 = Full Interventions
  const [selectedStrategy, setSelectedStrategy] = useState<'greening' | 'coolroofs' | 'hybrid'>('hybrid');
  const [fullGrid, setFullGrid] = useState<RawHeatPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchFullGrid().then((pts) => {
      setFullGrid(pts);
      setIsLoading(false);
    });
  }, []);

  // Compute simulated per-cell temperatures interpolated dynamically by slider percentage
  const simulatedPoints = useMemo(() => {
    let maxCooling = 5.64; // Hybrid strategy (FR6 optimal)
    if (selectedStrategy === 'greening') maxCooling = 4.2;
    else if (selectedStrategy === 'coolroofs') maxCooling = 2.1;

    return fullGrid.map((pt) => {
      const is_hotspot = pt[11] === 1;
      if (!is_hotspot) return pt;
      const appliedCooling = (maxCooling * sliderVal) / 100.0;
      const simLst = Math.max(26.0, pt[2] - appliedCooling);
      const newPt = [...pt] as RawHeatPoint;
      newPt[2] = simLst;
      return newPt;
    });
  }, [fullGrid, sliderVal, selectedStrategy]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px', padding: '16px' }}>
      {/* Control Header */}
      <div className="gov-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', zIndex: 1000, background: '#0f172a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '4px',
            background: '#1d4ed8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sliders size={20} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              Before & After Intervention Heat Scenario Slider
            </h2>
            <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
              Drag slider to morph baseline satellite heat to post-intervention cooling state (FR5/FR6 model predictions).
            </span>
          </div>
        </div>

        {/* Strategy Selector Chips */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Strategy:
          </span>
          <button
            onClick={() => setSelectedStrategy('hybrid')}
            className={`btn ${selectedStrategy === 'hybrid' ? 'btn-primary' : 'btn-secondary'}`}
            aria-label="Select Hybrid Optimal Strategy (-5.64°C cooling)"
            style={{ fontSize: '0.775rem', padding: '6px 12px', minHeight: '34px', fontWeight: 600 }}
          >
            <Sparkles size={13} /> Hybrid Optimal (-5.64°C)
          </button>
          <button
            onClick={() => setSelectedStrategy('greening')}
            className={`btn ${selectedStrategy === 'greening' ? 'btn-primary' : 'btn-secondary'}`}
            aria-label="Select Urban Greening Strategy (-4.2°C cooling)"
            style={{ fontSize: '0.775rem', padding: '6px 12px', minHeight: '34px', fontWeight: 600 }}
          >
            <TreePine size={13} /> Urban Greening (-4.2°C)
          </button>
        </div>
      </div>

      {/* Main Interactive Map */}
      <div style={{ flex: 1, position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid #27354a' }}>
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '14px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '6px 16px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            color: '#60a5fa',
            background: '#0f172a',
            border: '1px solid #334155',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            Loading scenario spatial grid...
          </div>
        )}

        <MapContainer
          center={[19.0760, 72.8777]}
          zoom={11}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; CARTO &copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Dynamic grid heat overlay re-rendered on slider movement */}
          <GridHeatOverlay points={simulatedPoints} opacity={0.85} />
        </MapContainer>

        {/* Bottom Floating Interactive Slider Control */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '600px',
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '6px',
          padding: '16px 20px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={16} color="#fca5a5" /> Baseline Heat (0%)
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#60a5fa', fontFamily: 'var(--font-heading)' }}>
              {sliderVal === 0 ? 'Baseline (0%)' : sliderVal === 100 ? 'Full Implementation (100%)' : `Simulating: ${sliderVal}% Deployment`}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TreePine size={16} color="#6ee7b7" /> Post-Intervention (100%)
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            value={sliderVal}
            onChange={(e) => setSliderVal(Number(e.target.value))}
            aria-label="Before and after heat scenario morphing slider"
            style={{ width: '100%', accentColor: '#2563eb', height: '6px', cursor: 'pointer', borderRadius: '3px' }}
          />
        </div>
      </div>
    </div>
  );
};
