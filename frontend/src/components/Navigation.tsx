import React from 'react';
import { Flame, Map, BarChart3, Sliders, Bot } from 'lucide-react';

export type ActiveTab = 'public' | 'planner' | 'slider';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  isChatOpen,
  setIsChatOpen,
}) => {
  return (
    <header className="nav-header" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      background: '#0f172a',
      borderBottom: '1px solid #1e293b',
      zIndex: 1000,
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
    }}>
      {/* Brand & Platform Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '4px',
          background: '#1d4ed8',
          border: '1px solid #2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Flame size={22} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.2, fontFamily: 'var(--font-heading)' }}>
            Urban Heat Mitigation Platform
          </h1>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
            Mumbai & Navi Mumbai • Public Geospatial Thermal Data Service
          </span>
        </div>
      </div>

      {/* Navigation Modes */}
      <nav
        aria-label="Main mode navigation"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#0b1320',
          padding: '4px',
          borderRadius: '4px',
          border: '1px solid #1e293b'
        }}
      >
        <button
          onClick={() => setActiveTab('public')}
          className={`btn ${activeTab === 'public' ? 'btn-primary' : 'btn-secondary'}`}
          aria-label="Switch to Public Heat Explorer mode"
          style={{ fontSize: '0.825rem', padding: '6px 14px', minHeight: '36px', fontWeight: 600 }}
        >
          <Map size={15} />
          Public Heat Explorer
        </button>

        <button
          onClick={() => setActiveTab('planner')}
          className={`btn ${activeTab === 'planner' ? 'btn-primary' : 'btn-secondary'}`}
          aria-label="Switch to Planner Dashboard mode"
          style={{ fontSize: '0.825rem', padding: '6px 14px', minHeight: '36px', fontWeight: 600 }}
        >
          <BarChart3 size={15} />
          Planner Dashboard
        </button>

        <button
          onClick={() => setActiveTab('slider')}
          className={`btn ${activeTab === 'slider' ? 'btn-primary' : 'btn-secondary'}`}
          aria-label="Switch to Before/After Slider mode"
          style={{ fontSize: '0.825rem', padding: '6px 14px', minHeight: '36px', fontWeight: 600 }}
        >
          <Sliders size={15} />
          Before/After Slider
        </button>
      </nav>

      {/* AI Assistant Drawer Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`btn ${isChatOpen ? 'btn-primary' : 'btn-secondary'}`}
          aria-label={isChatOpen ? 'Close AI Assistant drawer' : 'Open AI Assistant drawer'}
          style={{
            fontSize: '0.825rem',
            minHeight: '36px',
            padding: '6px 14px',
            fontWeight: 600
          }}
        >
          <Bot size={16} />
          {isChatOpen ? 'Close AI Assistant' : 'AI Assistant'}
        </button>
      </div>
    </header>
  );
};
