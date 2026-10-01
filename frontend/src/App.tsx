import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import type { ActiveTab } from './components/Navigation';
import { LocationSearch } from './components/PublicExplorer/LocationSearch';
import { PublicInfoPanel } from './components/PublicExplorer/PublicInfoPanel';
import { HeatMap2D } from './components/PublicExplorer/HeatMap2D';
import { PlannerDashboard } from './components/PlannerDashboard/PlannerDashboard';
import { ScenarioSlider } from './components/ScenarioSlider/ScenarioSlider';
import { ChatDrawer } from './components/ChatAssistant/ChatDrawer';
import { fetchGridSummary, fetchCellDetails, searchLocation } from './services/api';
import type { GridPoint, CellDetails, ActiveLayerType } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('public');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [activeLayer, setActiveLayer] = useState<ActiveLayerType>('lst');

  const [grid, setGrid] = useState<GridPoint[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<CellDetails | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Load initial 2D map grid and default location (Bandra)
    fetchGridSummary().then(setGrid);
    handleSelectLocation('Bandra');
  }, []);

  const handleSelectLocation = async (query: string) => {
    setIsLoading(true);
    setSearchError(null);
    try {
      const res = await searchLocation(query);
      if (res.status === 'success' && res.details) {
        setSelectedDetails(res.details);
      } else {
        setSelectedDetails(null);
        setSearchError(res.message || `No results found for '${query}'.`);
      }
    } catch (err) {
      console.error('Failed to search location:', err);
      setSelectedDetails(null);
      setSearchError(`Unable to complete search for '${query}'.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapClick = async (lat: number, lon: number) => {
    setIsLoading(true);
    setSearchError(null);
    try {
      const details = await fetchCellDetails(lat, lon);
      setSelectedDetails(details);
    } catch (err) {
      console.error('Failed to fetch point details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--bg-dark)' }}>
      {/* Top Header & Mode Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
      />

      {/* Main Experience Body */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* PHASE 1: PUBLIC HEAT RISK EXPLORER */}
        {activeTab === 'public' && (
          <div style={{ display: 'flex', width: '100%', height: '100%', padding: '16px', gap: '16px' }}>
            {/* Left Control & Info Sidebar */}
            <div style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 100 }}>
              <LocationSearch onSelectLocation={handleSelectLocation} isLoading={isLoading} />
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <PublicInfoPanel details={selectedDetails} isLoading={isLoading} searchError={searchError} activeLayer={activeLayer} />
              </div>
            </div>

            {/* Main Interactive 2D Leaflet Heat Map */}
            <div style={{ flex: 1, height: '100%' }}>
              <HeatMap2D
                grid={grid}
                selectedDetails={selectedDetails}
                onMapClick={handleMapClick}
                activeLayer={activeLayer}
                onLayerChange={setActiveLayer}
              />
            </div>
          </div>
        )}

        {/* PHASE 2: PLANNER DASHBOARD */}
        {activeTab === 'planner' && <PlannerDashboard />}

        {/* PHASE 3: BEFORE / AFTER HEAT SLIDER */}
        {activeTab === 'slider' && <ScenarioSlider />}

        {/* PHASE 5: AI CHAT ASSISTANT DRAWER */}
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onSelectLocation={handleSelectLocation}
        />
      </main>
    </div>
  );
};

export default App;
