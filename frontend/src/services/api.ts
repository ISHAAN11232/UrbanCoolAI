import type { Neighborhood, GridPoint, CellDetails, DriverData, OptimizationResult, ChatResponse, SearchResponse, RawHeatPoint } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

export async function fetchNeighborhoods(): Promise<Neighborhood[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/neighborhoods`);
    const data = await res.json();
    return data.neighborhoods || [];
  } catch (err) {
    console.error('Error fetching neighborhoods:', err);
    return [];
  }
}

export async function searchLocation(query: string): Promise<SearchResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return {
      status: data.status || 'not_found',
      message: data.message,
      query: data.query || query,
      matches: data.matches || [],
      details: data.details || null
    };
  } catch (err) {
    console.error('Error searching location:', err);
    return {
      status: 'out_of_bounds',
      message: `Failed to complete search query '${query}'. Please check your connection.`,
      query,
      matches: [],
      details: null
    };
  }
}

export async function fetchCellDetails(lat: number, lon: number): Promise<CellDetails> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/cell?lat=${lat}&lon=${lon}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching cell details:', err);
    throw err;
  }
}

export async function fetchGridSummary(): Promise<GridPoint[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/grid?full=false`);
    const data = await res.json();
    return data.grid || [];
  } catch (err) {
    console.error('Error fetching grid summary:', err);
    return [];
  }
}

export async function fetchFullGrid(): Promise<RawHeatPoint[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/grid?full=true`);
    const data = await res.json();
    return data.grid || [];
  } catch (err) {
    console.error('Error fetching full grid:', err);
    return [];
  }
}

export async function fetchDriverAnalytics(): Promise<DriverData[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/planner/drivers`);
    const data = await res.json();
    return data.drivers || [];
  } catch (err) {
    console.error('Error fetching drivers:', err);
    return [];
  }
}

export async function fetchModelMetrics(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/planner/model-metrics`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching model metrics:', err);
    return null;
  }
}

export async function fetchOptimization(budgetUsd: number): Promise<OptimizationResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/planner/optimize?budget_usd=${budgetUsd}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching optimization:', err);
    throw err;
  }
}

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    return await res.json();
  } catch (err) {
    console.error('Error sending chat message:', err);
    return {
      reply: 'Unable to connect to AI Assistant backend.',
      target_location: null,
    };
  }
}
