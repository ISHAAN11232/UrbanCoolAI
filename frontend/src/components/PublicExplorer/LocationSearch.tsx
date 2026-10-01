import React, { useState, useEffect } from 'react';
import { Search, MapPin, Compass } from 'lucide-react';
import type { Neighborhood } from '../../types';
import { fetchNeighborhoods } from '../../services/api';

interface LocationSearchProps {
  onSelectLocation: (query: string) => void;
  isLoading: boolean;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({ onSelectLocation, isLoading }) => {
  const [query, setQuery] = useState('');
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [filtered, setFiltered] = useState<Neighborhood[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNeighborhoods().then((data) => {
      setNeighborhoods(data);
    });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (val.trim().length > 0) {
      const matches = neighborhoods.filter(
        (n) => n.name.toLowerCase().includes(val.toLowerCase()) || n.region.toLowerCase().includes(val.toLowerCase())
      );
      setFiltered(matches);
      setIsOpen(true);
    } else {
      setFiltered([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (name: string) => {
    setQuery(name);
    setIsOpen(false);
    onSelectLocation(name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      onSelectLocation(query);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', zIndex: 500 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <div style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
        }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', zIndex: 10, pointerEvents: 'none' }} />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => query.trim() && setIsOpen(true)}
            placeholder="Search neighborhood, landmark, or address (e.g., Dharavi, Marine Drive, Juhu)..."
            aria-label="Search location by neighborhood, landmark or address"
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              minHeight: '40px',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border-color 0.15s ease'
            }}
            onFocusCapture={(e) => {
              e.currentTarget.style.borderColor = '#2563eb';
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.borderColor = '#334155';
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
          aria-label="Submit location search"
          style={{ minWidth: '90px', minHeight: '40px', fontSize: '0.825rem', fontWeight: 600 }}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Auto-complete suggestions popup */}
      {isOpen && filtered.length > 0 && (
        <div className="gov-card" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '6px',
          maxHeight: '260px',
          overflowY: 'auto',
          padding: '6px',
          zIndex: 600,
          background: '#0f172a',
          border: '1px solid #334155'
        }}>
          {filtered.map((item) => (
            <div
              key={item.name}
              onClick={() => handleSelect(item.name)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelect(item.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                minHeight: '36px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1e293b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={14} color="#60a5fa" />
                <span style={{ fontSize: '0.875rem', color: '#fff', fontWeight: 600 }}>{item.name}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>{item.region}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick selection chips */}
      <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Quick Locations:
        </span>
        {['Andheri', 'Bandra', 'Powai', 'Kurla', 'Vashi', 'Thane'].map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => handleSelect(name)}
            aria-label={`Select ${name} neighborhood`}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '4px 10px',
              minHeight: '28px',
              color: '#cbd5e1',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'background-color 0.15s ease, border-color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#60a5fa';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#334155';
              e.currentTarget.style.color = '#cbd5e1';
              e.currentTarget.style.background = '#1e293b';
            }}
          >
            <Compass size={12} color="#60a5fa" />
            {name}
          </button>
        ))}
      </div>
    </div>
  );
};
