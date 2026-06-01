import React, { useRef } from 'react';

const SearchBar = ({
  query, setQuery, onSearch, onGeoLocation,
  loading, locationLoading, searchHistory, onHistorySelect
}) => {
  const inputRef = useRef();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="search-section">
      <div className="search-row">
        <div className="search-input-wrap">
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="City, zip code, coordinates (40.7,-74.0), or landmark..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            aria-label="Search location"
          />
          {query && (
            <button
              className="search-clear"
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <button
          className="btn-search"
          onClick={onSearch}
          disabled={loading || !query.trim()}
          aria-label="Search weather"
        >
          {loading ? '...' : '🔍 Search'}
        </button>
        <button
          className="btn-location"
          onClick={onGeoLocation}
          disabled={locationLoading || loading}
          aria-label="Use my location"
          title="Use my current location"
        >
          {locationLoading ? '📡' : '📍'} {locationLoading ? 'Locating...' : 'My Location'}
        </button>
      </div>

      {searchHistory.length > 0 && (
        <div className="search-history">
          <span className="history-label">Recent:</span>
          {searchHistory.map((h, i) => (
            <button key={i} className="history-chip" onClick={() => onHistorySelect(h)}>
              {h}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
