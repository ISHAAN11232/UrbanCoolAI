import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GridPoint, CellDetails, RawHeatPoint, ActiveLayerType } from '../../types';
import { fetchFullGrid } from '../../services/api';
import { GridHeatOverlay } from './GridHeatOverlay';
import { Layers, Map as MapIcon } from 'lucide-react';

// Fix Leaflet marker icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export type BasemapStyle = 'light' | 'satellite' | 'dark';

const BASEMAP_CONFIGS: Record<BasemapStyle, { name: string; url: string; attribution: string }> = {
  light: {
    name: 'Standard Light',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  },
  satellite: {
    name: 'Satellite Aerial',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS User Community'
  },
  dark: {
    name: 'Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }
};

interface HeatMap2DProps {
  grid: GridPoint[];
  selectedDetails: CellDetails | null;
  onMapClick: (lat: number, lon: number) => void;
  activeLayer?: ActiveLayerType;
  onLayerChange?: (layer: ActiveLayerType) => void;
}

// Controller component to smoothly fly map to selected location
const MapFlyTo: React.FC<{ lat: number; lon: number }> = ({ lat, lon }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 13, { duration: 1.2 });
  }, [lat, lon, map]);
  return null;
};

// Component listening for click events anywhere on the map
const MapClickListener: React.FC<{ onMapClick: (lat: number, lon: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const DynamicLegend: React.FC<{ activeLayer: ActiveLayerType }> = ({ activeLayer }) => {
  switch (activeLayer) {
    case 'ndvi':
      return (
        <>
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Vegetation Canopy (NDVI)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#047857' }} /><span>Dense Forest (&ge;0.60)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#10b981' }} /><span>Emerald Greenery (0.45–0.60)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#84cc16' }} /><span>Moderate Veg (0.25–0.45)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#eab308' }} /><span>Sparse Veg (0.10–0.25)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#a16207' }} /><span>Bare Surface (&lt;0.10)</span></div>
        </>
      );
    case 'lulc':
      return (
        <>
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Land Use & Cover (LULC)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#64748b' }} /><span>Built-up / Urban Structure</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#22c55e' }} /><span>Vegetation & Trees</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#0284c7' }} /><span>Water Bodies & Rivers</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#d97706' }} /><span>Bare Soil / Sand</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#84cc16' }} /><span>Agricultural Land</span></div>
        </>
      );
    case 'height':
      return (
        <>
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Building Height (m)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#e0e7ff' }} /><span>Tower / Skyscraper (&ge;25m)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#a855f7' }} /><span>High-Rise (15–25m)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#06b6d4' }} /><span>Mid-Rise (8–15m)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#0284c7' }} /><span>Low-Rise (2–8m)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#475569' }} /><span>Ground Level (&lt;2m)</span></div>
        </>
      );
    case 'built':
      return (
        <>
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Built Surface Cover (%)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#be123c' }} /><span>Dense Impervious (&ge;80%)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#ea580c' }} /><span>High Built (50–80%)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#d97706' }} /><span>Moderate Built (20–50%)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#94a3b8' }} /><span>Open / Low Paved (&lt;20%)</span></div>
        </>
      );
    case 'pop':
      return (
        <>
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Population Density Index</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#9333ea' }} /><span>Extreme Density (&ge;600)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#ea580c' }} /><span>High Density (200–600)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#d97706' }} /><span>Moderate Density (50–200)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#fef08a' }} /><span>Low Density (&lt;50)</span></div>
        </>
      );
    case 'air_temp':
      return (
        <>
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Air Temperature (°C)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#dc2626' }} /><span>Elevated Ambient (&ge;29.3°C)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#d97706' }} /><span>Baseline Air (28.7–29.3°C)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#0284c7' }} /><span>Cool Sea Breeze (&lt;28.7°C)</span></div>
        </>
      );
    case 'wind':
      return (
        <>
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Wind Speed (m/s)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#0284c7' }} /><span>Strong Breeze (&ge;2.3 m/s)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#059669' }} /><span>Moderate Breeze (1.7–2.3 m/s)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#3730a3' }} /><span>Calm / Stagnant (&lt;1.7 m/s)</span></div>
        </>
      );
    case 'dewpoint':
      return (
        <>
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Dewpoint / Humidity (°C)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#1d4ed8' }} /><span>High Coastal Humidity (&ge;21.8°C)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#059669' }} /><span>Moderate Moisture (20.5–21.8°C)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#d97706' }} /><span>Dry Air (&lt;20.5°C)</span></div>
        </>
      );
    case 'lst':
    default:
      return (
        <>
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Surface Temperature (LST °C)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#dc2626' }} /><span>Extreme Heat (&ge;42°C)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#ea580c' }} /><span>High Heat (38–42°C)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#d97706' }} /><span>Moderate Heat (32–38°C)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#059669' }} /><span>Cool Baseline (&lt;32°C)</span></div>
        </>
      );
  }
};

export const HeatMap2D: React.FC<HeatMap2DProps> = ({
  selectedDetails,
  onMapClick,
  activeLayer: externalActiveLayer,
  onLayerChange
}) => {
  const defaultCenter: [number, number] = [19.0760, 72.8777]; // Mumbai Center
  const [fullGrid, setFullGrid] = useState<RawHeatPoint[]>([]);
  const [isGridLoading, setIsGridLoading] = useState<boolean>(true);

  // Basemap & Layer controls state
  const [basemap, setBasemap] = useState<BasemapStyle>('dark');
  const [internalActiveLayer, setInternalActiveLayer] = useState<ActiveLayerType>('lst');

  const currentActiveLayer = externalActiveLayer ?? internalActiveLayer;

  const handleLayerSelect = (layer: ActiveLayerType) => {
    setInternalActiveLayer(layer);
    if (onLayerChange) onLayerChange(layer);
  };

  useEffect(() => {
    fetchFullGrid().then((pts) => {
      setFullGrid(pts);
      setIsGridLoading(false);
    });
  }, []);

  const currentBasemapConfig = BASEMAP_CONFIGS[basemap];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '6px', overflow: 'hidden', border: '1px solid #27354a' }}>
      {isGridLoading && (
        <div style={{
          position: 'absolute',
          top: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '4px',
          padding: '6px 14px',
          fontSize: '0.8rem',
          color: '#60a5fa',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
        }}>
          Rendering 195,020 spatial cells...
        </div>
      )}

      {/* Top-Right Control Toolbar (Layer Selector & Basemap Style Switcher) */}
      <div style={{
        position: 'absolute',
        top: '14px',
        right: '14px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '6px'
      }}>
        {/* Dataset Layer Selector */}
        <div className="gov-card" style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a' }}>
          <Layers size={14} color="#60a5fa" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Dataset Layer:</span>
          <select
            value={currentActiveLayer}
            onChange={(e) => handleLayerSelect(e.target.value as ActiveLayerType)}
            style={{
              background: '#1e293b',
              color: '#fff',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '0.775rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="lst">Surface Temp (LST °C)</option>
            <option value="ndvi">Vegetation Canopy (NDVI)</option>
            <option value="lulc">Land Use & Cover (LULC)</option>
            <option value="height">Building Height (m)</option>
            <option value="built">Built Surface Cover (%)</option>
            <option value="pop">Population Density Index</option>
            <option value="air_temp">Ambient Air Temp (°C)</option>
            <option value="wind">Wind Speed (m/s)</option>
            <option value="dewpoint">Dewpoint / Moisture (°C)</option>
          </select>
        </div>

        {/* Basemap Style Switcher */}
        <div className="gov-card" style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', background: '#0f172a' }}>
          <MapIcon size={14} color="#60a5fa" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginRight: '4px' }}>Map View:</span>
          <button
            onClick={() => setBasemap('light')}
            className={`btn ${basemap === 'light' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.7rem', padding: '2px 8px', minHeight: '26px' }}
          >
            Light
          </button>
          <button
            onClick={() => setBasemap('satellite')}
            className={`btn ${basemap === 'satellite' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.7rem', padding: '2px 8px', minHeight: '26px' }}
          >
            Satellite
          </button>
          <button
            onClick={() => setBasemap('dark')}
            className={`btn ${basemap === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.7rem', padding: '2px 8px', minHeight: '26px' }}
          >
            Dark
          </button>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          key={basemap}
          attribution={currentBasemapConfig.attribution}
          url={currentBasemapConfig.url}
        />

        <MapClickListener onMapClick={onMapClick} />

        {/* Per-cell continuous spatial overlay for active dataset layer */}
        <GridHeatOverlay
          points={fullGrid}
          opacity={basemap === 'satellite' ? 0.72 : 0.60}
          activeLayer={currentActiveLayer}
        />

        {/* Fly map to selected details if available */}
        {selectedDetails && (
          <MapFlyTo lat={selectedDetails.matched_lat} lon={selectedDetails.matched_lon} />
        )}

        {/* Selected location pulse pin */}
        {selectedDetails && (
          <Marker position={[selectedDetails.matched_lat, selectedDetails.matched_lon]}>
            <Popup>
              <div style={{ fontSize: '0.825rem' }}>
                <strong>{selectedDetails.neighborhood_name || 'Selected Location'}</strong>
                <br />
                Temp: <strong>{selectedDetails.lst_celsius}°C</strong> ({selectedDetails.heat_risk_tier} Risk)
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Dynamic Layer Legend Overlay */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '4px',
        padding: '10px 14px',
        zIndex: 1000,
        fontSize: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
      }}>
        <DynamicLegend activeLayer={currentActiveLayer} />
      </div>
    </div>
  );
};
