export interface Neighborhood {
  name: string;
  lat: number;
  lon: number;
  region: string;
}

// Multi-variable raw spatial grid point tuple:
// [lat, lon, lst, ndvi, lulc_code, height, built_pct, pop_density, air_temp, wind_speed, dewpoint, is_hotspot]
export type RawHeatPoint = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

export type ActiveLayerType =
  | 'lst'
  | 'ndvi'
  | 'lulc'
  | 'height'
  | 'built'
  | 'pop'
  | 'air_temp'
  | 'wind'
  | 'dewpoint';

export interface GridPoint {
  lat: number;
  lon: number;
  lst: number;
  risk: 'Low' | 'Moderate' | 'High' | 'Extreme';
  is_hotspot: boolean;
  gi_class: string;
}

export interface NearestIntervention {
  type: string;
  cost_usd: number;
  predicted_cooling_c: number;
  distance_km: number;
  in_current_plan?: boolean;
  message?: string;
  is_low_confidence?: boolean;
  confidence_note?: string | null;
}

export interface CellDetails {
  query_lat: number;
  query_lon: number;
  matched_lat: number;
  matched_lon: number;
  distance_km: number;
  lst_celsius: number;
  heat_risk_tier: 'Low' | 'Moderate' | 'High' | 'Extreme';
  heat_risk_description: string;
  plain_language_drivers: string[];
  is_hotspot: boolean;
  gi_confidence_text?: string;
  gi_class: string;
  gi_z_score: number;
  is_low_confidence?: boolean;
  lulc_label: string;
  ndvi: number;
  built_surface_m2: number;
  building_height_m: number;
  nearest_intervention: NearestIntervention | null;
  neighborhood_name?: string;
  region?: string;
}

export interface SearchResponse {
  status: 'success' | 'out_of_bounds' | 'not_found';
  message?: string;
  query?: string;
  matches: Neighborhood[];
  details: CellDetails | null;
}

export interface DriverData {
  Feature: string;
  Pearson_r: number;
  Spearman_rho: number;
  RF_Importance: number;
  Mean_Abs_SHAP: number;
  'SHAP_Share_%': number;
}

export interface OptimizationResult {
  input_budget_usd: number;
  actual_allocated_usd: number;
  selected_cell_count: number;
  total_region_cells?: number;
  spatial_coverage_pct?: number;
  avg_cooling_per_cell_c: number;
  cumulative_cooling_yield_c_cells: number;
  flagged_low_confidence_cells: number;
  primary_intervention: string;
  cost_per_cell_usd: number;
}

export interface ChatResponse {
  reply: string;
  target_location: {
    lat: number;
    lon: number;
    zoom: number;
    name: string;
  } | null;
}

