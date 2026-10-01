import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { RawHeatPoint, ActiveLayerType } from '../../types';

function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);

  const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
  const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;

  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  return `rgb(${r}, ${g}, ${b})`;
}

export function getHeatColor(lst: number): string {
  if (lst >= 42.0) return '#ef4444'; // Extreme Heat (Deep Red)
  if (lst >= 38.0) {
    const t = (lst - 38.0) / 4.0;
    return interpolateColor('#f97316', '#ef4444', Math.min(1, Math.max(0, t)));
  }
  if (lst >= 32.0) {
    const t = (lst - 32.0) / 6.0;
    return interpolateColor('#eab308', '#f97316', Math.min(1, Math.max(0, t)));
  }
  const t = Math.max(0, (lst - 24.0) / 8.0);
  return interpolateColor('#10b981', '#eab308', Math.min(1, Math.max(0, t)));
}

export function getLayerColor(pt: RawHeatPoint, layer: ActiveLayerType): { color: string; alpha: number } {
  const lst = pt[2] ?? 30.0;
  const ndvi = pt[3] ?? 0.2;
  const lulc = pt[4] ?? 1;
  const height = pt[5] ?? 0;
  const built = pt[6] ?? 0;
  const pop = pt[7] ?? 0;
  const airTemp = pt[8] ?? 29.0;
  const wind = pt[9] ?? 2.0;
  const dew = pt[10] ?? 21.0;

  switch (layer) {
    case 'ndvi': {
      if (ndvi >= 0.60) return { color: '#047857', alpha: 0.85 }; // Deep Forest Green
      if (ndvi >= 0.45) return { color: '#10b981', alpha: 0.75 }; // Emerald Green
      if (ndvi >= 0.25) return { color: '#84cc16', alpha: 0.65 }; // Light Olive
      if (ndvi >= 0.10) return { color: '#eab308', alpha: 0.50 }; // Grass / Sparse
      return { color: '#a16207', alpha: 0.40 };                   // Sandy Brown / Bare
    }
    case 'lulc': {
      if (lulc === 1) return { color: '#64748b', alpha: 0.75 }; // Built-up (Slate)
      if (lulc === 2) return { color: '#22c55e', alpha: 0.80 }; // Vegetation (Green)
      if (lulc === 3) return { color: '#0284c7', alpha: 0.85 }; // Water (Blue)
      if (lulc === 4) return { color: '#d97706', alpha: 0.65 }; // Bare Soil (Amber)
      if (lulc === 5) return { color: '#84cc16', alpha: 0.70 }; // Agriculture (Lime)
      return { color: '#64748b', alpha: 0.70 };
    }
    case 'height': {
      if (height >= 25.0) return { color: '#e0e7ff', alpha: 0.90 }; // Skyscraper / Tower
      if (height >= 15.0) return { color: '#a855f7', alpha: 0.80 }; // High-rise
      if (height >= 8.0) return { color: '#06b6d4', alpha: 0.65 };  // Mid-rise
      if (height >= 2.0) return { color: '#0284c7', alpha: 0.50 };  // Residential
      return { color: '#475569', alpha: 0.35 };                    // Ground / Low
    }
    case 'built': {
      if (built >= 80.0) return { color: '#be123c', alpha: 0.85 }; // Dense Impervious
      if (built >= 50.0) return { color: '#f97316', alpha: 0.70 }; // High Built
      if (built >= 20.0) return { color: '#fbbf24', alpha: 0.55 }; // Moderate Built
      return { color: '#94a3b8', alpha: 0.38 };                    // Open / Low Paved
    }
    case 'pop': {
      if (pop >= 600) return { color: '#9333ea', alpha: 0.85 }; // Extreme Density
      if (pop >= 200) return { color: '#f97316', alpha: 0.70 }; // High Density
      if (pop >= 50) return { color: '#fde047', alpha: 0.55 };  // Moderate Density
      return { color: '#fef08a', alpha: 0.38 };                 // Low Density
    }
    case 'air_temp': {
      if (airTemp >= 29.3) return { color: '#f43f5e', alpha: 0.80 }; // Elevated Ambient
      if (airTemp >= 28.7) return { color: '#fde047', alpha: 0.60 }; // Baseline Air
      return { color: '#38bdf8', alpha: 0.40 };                       // Cool Sea Air
    }
    case 'wind': {
      if (wind >= 2.3) return { color: '#06b6d4', alpha: 0.80 }; // Strong Breeze
      if (wind >= 1.7) return { color: '#14b8a6', alpha: 0.60 }; // Moderate Breeze
      return { color: '#3730a3', alpha: 0.40 };                  // Calm / Stagnant
    }
    case 'dewpoint': {
      if (dew >= 21.8) return { color: '#1e40af', alpha: 0.80 }; // High Humidity
      if (dew >= 20.5) return { color: '#2dd4bf', alpha: 0.60 }; // Moderate Moisture
      return { color: '#fef08a', alpha: 0.40 };                  // Dry Air
    }
    case 'lst':
    default: {
      const color = getHeatColor(lst);
      let alpha = 0.38;
      if (lst >= 42.0) alpha = 0.85;
      else if (lst >= 38.0) alpha = 0.70;
      else if (lst >= 32.0) alpha = 0.55;
      return { color, alpha };
    }
  }
}

interface GridHeatOverlayProps {
  points: RawHeatPoint[];
  opacity?: number;
  activeLayer?: ActiveLayerType;
}

export const GridHeatOverlay: React.FC<GridHeatOverlayProps> = ({ points, opacity = 0.60, activeLayer = 'lst' }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    const pane = map.getPanes().overlayPane;
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '400';
    canvas.style.opacity = opacity.toString();
    pane.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    const renderCanvas = () => {
      if (!ctx) return;
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;

      const topLeft = map.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(canvas, topLeft);

      ctx.clearRect(0, 0, size.x, size.y);

      const bounds = map.getBounds();
      const zoom = map.getZoom();

      // Soft radial blur disc radius scaled by map zoom level
      const radius = Math.max(4.0, Math.pow(1.72, zoom - 10) * 4.4);

      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const lat = pt[0];
        const lon = pt[1];

        // Skip cells outside viewport bounds
        if (
          lat < bounds.getSouth() - 0.03 ||
          lat > bounds.getNorth() + 0.03 ||
          lon < bounds.getWest() - 0.03 ||
          lon > bounds.getEast() + 0.03
        ) {
          continue;
        }

        const point = map.latLngToContainerPoint([lat, lon]);
        const { color: hexOrRgb, alpha: cellAlpha } = getLayerColor(pt, activeLayer);

        // Convert hex to rgb format if needed
        let rgbString = hexOrRgb;
        if (hexOrRgb.startsWith('#')) {
          const hexNum = parseInt(hexOrRgb.slice(1), 16);
          const r = (hexNum >> 16) & 0xff;
          const g = (hexNum >> 8) & 0xff;
          const b = hexNum & 0xff;
          rgbString = `rgb(${r}, ${g}, ${b})`;
        }

        // Soft radial gradient disc for smooth continuous transitions
        const grad = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, radius
        );
        grad.addColorStop(0.0, rgbString);
        grad.addColorStop(0.55, rgbString);
        grad.addColorStop(1.0, rgbString.replace('rgb(', 'rgba(').replace(')', ', 0)'));

        ctx.globalAlpha = cellAlpha;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    renderCanvas();

    map.on('moveend zoomend resize', renderCanvas);

    return () => {
      map.off('moveend zoomend resize', renderCanvas);
      if (pane.contains(canvas)) {
        pane.removeChild(canvas);
      }
    };
  }, [map, points, opacity, activeLayer]);

  return null;
};

