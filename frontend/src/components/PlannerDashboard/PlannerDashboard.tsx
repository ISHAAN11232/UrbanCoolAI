import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { fetchDriverAnalytics, fetchModelMetrics, fetchOptimization } from '../../services/api';
import type { DriverData, OptimizationResult } from '../../types';
import { BarChart3, Cpu, IndianRupee, FileText, Download, ShieldAlert, Award } from 'lucide-react';

export const PlannerDashboard: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'drivers' | 'metrics' | 'optimizer' | 'report'>('drivers');
  
  // Drivers state
  const [drivers, setDrivers] = useState<DriverData[]>([]);

  // Model metrics state
  const [_metrics, setMetrics] = useState<any>(null);

  // Optimizer state
  const [budgetUsd, setBudgetUsd] = useState<number>(10000000); // $10M / ₹83 Cr default
  const [optResult, setOptResult] = useState<OptimizationResult | null>(null);

  useEffect(() => {
    fetchDriverAnalytics().then(setDrivers);
    fetchModelMetrics().then(setMetrics);
  }, []);

  useEffect(() => {
    fetchOptimization(budgetUsd).then(setOptResult);
  }, [budgetUsd]);

  const COLORS = ['#dc2626', '#ea580c', '#0284c7', '#059669', '#c084fc', '#d97706', '#64748b', '#2563eb'];
  const SHAP_ACCENT_COLORS = ['#fca5a5', '#fdba74', '#38bdf8', '#6ee7b7', '#c084fc', '#fde047', '#94a3b8', '#60a5fa'];

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px', height: '100%', overflowY: 'auto' }}>
      {/* Dashboard Sub-Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
            Municipal Planner Dashboard
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '2px' }}>
            Inspect FR1–FR8 models, SHAP drivers, PINN physics loss validation, and simulate budget allocation plans.
          </p>
        </div>

        {/* Sub-Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: '#0b1320',
          padding: '4px',
          borderRadius: '4px',
          border: '1px solid #1e293b'
        }}>
          <button
            onClick={() => setActiveSubTab('drivers')}
            className={`btn ${activeSubTab === 'drivers' ? 'btn-primary' : 'btn-secondary'}`}
            aria-label="View SHAP feature drivers"
            style={{ fontSize: '0.8rem', minHeight: '34px', padding: '4px 12px', fontWeight: 600 }}
          >
            <BarChart3 size={14} /> Drivers (SHAP)
          </button>

          <button
            onClick={() => setActiveSubTab('metrics')}
            className={`btn ${activeSubTab === 'metrics' ? 'btn-primary' : 'btn-secondary'}`}
            aria-label="View PINN model validation metrics"
            style={{ fontSize: '0.8rem', minHeight: '34px', padding: '4px 12px', fontWeight: 600 }}
          >
            <Cpu size={14} /> PINN Model Metrics
          </button>

          <button
            onClick={() => setActiveSubTab('optimizer')}
            className={`btn ${activeSubTab === 'optimizer' ? 'btn-primary' : 'btn-secondary'}`}
            aria-label="View budget optimization simulation"
            style={{ fontSize: '0.8rem', minHeight: '34px', padding: '4px 12px', fontWeight: 600 }}
          >
            <IndianRupee size={14} /> Budget Optimizer
          </button>

          <button
            onClick={() => setActiveSubTab('report')}
            className={`btn ${activeSubTab === 'report' ? 'btn-primary' : 'btn-secondary'}`}
            aria-label="View final report and exports"
            style={{ fontSize: '0.8rem', minHeight: '34px', padding: '4px 12px', fontWeight: 600 }}
          >
            <FileText size={14} /> Reports & Data Exports
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: SHAP DRIVERS */}
      {activeSubTab === 'drivers' && (
        <div className="gov-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700, marginBottom: '4px' }}>
              SHAP Feature Importance Share (%)
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.45 }}>
              Random Forest model ($R^2 = 0.925$, RMSE = 1.82°C). Land Use / Land Cover (LULC) and Vegetation Canopy Index (NDVI) account for over 74% of urban heat variance.
            </p>
          </div>

          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={drivers} layout="vertical" margin={{ left: 30, right: 30, top: 10, bottom: 10 }}>
                <XAxis type="number" unit="%" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis dataKey="Feature" type="category" stroke="#ffffff" tick={{ fill: '#ffffff', fontSize: 13, fontWeight: 500 }} width={120} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '4px', color: '#fff' }}
                  formatter={(value: any) => [`${value}% Share`, 'SHAP Impact']}
                />
                <Bar dataKey="SHAP_Share_%" radius={[0, 4, 4, 0]}>
                  {drivers.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Driver Summary Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #27354a', borderRadius: '4px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left', background: '#141e30' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid #27354a' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: '#60a5fa', background: '#0f172a' }}>Feature</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: '#60a5fa', background: '#0f172a' }}>Pearson (r) Correlation</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: '#60a5fa', background: '#0f172a' }}>RF Feature Importance</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: '#60a5fa', background: '#0f172a' }}>SHAP Importance Share</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: '1px solid #1e293b', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#ffffff' }}>{d.Feature}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: d.Pearson_r < 0 ? '#60a5fa' : '#fca5a5' }}>
                      {d.Pearson_r > 0 ? `+${d.Pearson_r.toFixed(3)}` : d.Pearson_r.toFixed(3)}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>{(d.RF_Importance * 100).toFixed(1)}%</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: SHAP_ACCENT_COLORS[i % SHAP_ACCENT_COLORS.length] }}>
                      {d['SHAP_Share_%'].toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MODEL PERFORMANCE */}
      {activeSubTab === 'metrics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div className="gov-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Award size={22} color="#059669" />
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700 }}>Validation Accuracy (FR7)</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>$R^2$ Variance Explained</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#6ee7b7', fontFamily: 'var(--font-heading)' }}>91.5%</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#0f172a', padding: '10px', borderRadius: '4px', border: '1px solid #1e293b' }}>
                  <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>Test RMSE</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>2.15 °C</div>
                </div>
                <div style={{ background: '#0f172a', padding: '10px', borderRadius: '4px', border: '1px solid #1e293b' }}>
                  <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>Test MAE</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>1.64 °C</div>
                </div>
              </div>
              <div style={{ background: '#0f172a', padding: '10px 12px', borderRadius: '4px', border: '1px solid #2563eb' }}>
                <span style={{ fontSize: '0.725rem', color: '#60a5fa', fontWeight: 600, display: 'block', marginBottom: '2px' }}>95% Prediction Interval Bounds</span>
                <div style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 700 }}>[-4.50°C, +3.82°C]</div>
              </div>
            </div>
          </div>

          <div className="gov-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Cpu size={22} color="#60a5fa" />
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700 }}>Physics-Informed Neural Network (FR4)</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.45 }}>
              PyTorch PINN model trained with Surface Energy Balance PDE loss constraint:
            </p>
            <div style={{
              background: '#0f172a',
              border: '1px solid #334155',
              padding: '12px 14px',
              borderRadius: '4px',
              margin: '12px 0',
              fontFamily: 'monospace',
              fontSize: '0.825rem',
              color: '#60a5fa'
            }}>
              L = MSE(T_pred, T_true) + λ * Loss_energy_balance
            </div>
            <div style={{ fontSize: '0.875rem', color: '#ffffff', fontWeight: 600 }}>
              Best Validation RMSE: <strong style={{ color: '#6ee7b7' }}>2.023 °C</strong> (15 Epochs)
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: BUDGET OPTIMIZER */}
      {activeSubTab === 'optimizer' && (
        <div className="gov-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700, marginBottom: '4px' }}>
              Municipal Infrastructure Budget Allocator
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.45 }}>
              Adjust municipal funding to calculate optimal hotspot intervention cells and total predicted degree cooling yield.
            </p>
          </div>

          {/* Budget Slider Control */}
          <div style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            padding: '18px',
            borderRadius: '4px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label htmlFor="planner-budget-slider" style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>
                Municipal Infrastructure Funding (INR / ₹):
              </label>
              <span style={{ fontSize: '1.35rem', fontWeight: 700, color: '#60a5fa', fontFamily: 'var(--font-heading)' }}>
                ₹{((budgetUsd * 83) / 10000000).toFixed(1)} Crore
              </span>
            </div>

            <input
              id="planner-budget-slider"
              type="range"
              min={1000000}
              max={50000000}
              step={500000}
              value={budgetUsd}
              onChange={(e) => setBudgetUsd(Number(e.target.value))}
              aria-label="Municipal infrastructure budget slider"
              style={{ width: '100%', height: '6px', accentColor: '#2563eb', cursor: 'pointer', borderRadius: '3px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', fontWeight: 500 }}>
              <span>₹8.3 Cr</span>
              <span>₹83 Cr (Baseline Plan)</span>
              <span>₹207.5 Cr</span>
              <span>₹415 Cr (Full Scale)</span>
            </div>
          </div>

          {/* Allocation Stats Cards */}
          {optResult && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ background: '#0f172a', padding: '14px', borderRadius: '4px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Priority Target Cells</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
                  {optResult.selected_cell_count.toLocaleString()} cells
                </div>
              </div>

              <div style={{ background: '#0f172a', padding: '14px', borderRadius: '4px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Regional Coverage %</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#60a5fa', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
                  {optResult.spatial_coverage_pct || ((optResult.selected_cell_count / 195202) * 100).toFixed(2)}%
                </div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px', display: 'block' }}>of 195,202 total cells</span>
              </div>

              <div style={{ background: '#0f172a', padding: '14px', borderRadius: '4px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Avg Cooling Yield</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#6ee7b7', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
                  -{optResult.avg_cooling_per_cell_c}°C / cell
                </div>
              </div>

              <div style={{ background: '#0f172a', padding: '14px', borderRadius: '4px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Cumulative Cooling Yield</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
                  {optResult.cumulative_cooling_yield_c_cells.toLocaleString()} °C-cells
                </div>
              </div>

              <div style={{ background: 'rgba(217, 119, 6, 0.12)', padding: '14px', borderRadius: '4px', border: '1px solid rgba(217, 119, 6, 0.4)' }}>
                <span style={{ fontSize: '0.75rem', color: '#fde047', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={14} color="#fde047" /> Model Caveat Flags
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fde047', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
                  {optResult.flagged_low_confidence_cells} cells (1.93%)
                </div>
                <span style={{ fontSize: '0.7rem', color: '#fde047', marginTop: '2px', display: 'block', opacity: 0.9 }}>FR5/FR6 predictions at upper safety bound</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: REPORT & DATA */}
      {activeSubTab === 'report' && (
        <div className="gov-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700, marginBottom: '4px' }}>
              Executive Methodology Report & Ranked Data Export
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.45 }}>
              Download precomputed CSV action plans or export spatial statistical datasets.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href="http://localhost:8000/api/public/grid"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              aria-label="Export ranked interventions CSV file"
              style={{ padding: '10px 18px', fontSize: '0.85rem' }}
            >
              <Download size={16} /> Export Ranked Interventions CSV
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
