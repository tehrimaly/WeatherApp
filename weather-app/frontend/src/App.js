import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import WeatherCard from './components/WeatherCard';
import ForecastStrip from './components/ForecastStrip';
import SearchBar from './components/SearchBar';
import ErrorBanner from './components/ErrorBanner';
import ExtraInsights from './components/ExtraInsights';
import { fetchWeatherByCity, fetchWeatherByCoords, fetchForecast } from './utils/weatherApi';

// PM Accelerator description
const PM_ACCELERATOR_DESC =
  "PM Accelerator is a world-class product management accelerator that empowers aspiring and experienced PMs through mentorship, hands-on projects, and a global community. We fast-track careers by connecting talent with industry leaders across top technology companies.";

function App() {
  const [query, setQuery] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [unit, setUnit] = useState('metric'); // metric = Celsius, imperial = Fahrenheit
  const [searchHistory, setSearchHistory] = useState([]);
  const [showInfo, setShowInfo] = useState(false);

  // Load search history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('weatherSearchHistory');
    if (stored) {
      try { setSearchHistory(JSON.parse(stored)); } catch (_) {}
    }
  }, []);

  const saveToHistory = (cityName) => {
    setSearchHistory(prev => {
      const updated = [cityName, ...prev.filter(c => c.toLowerCase() !== cityName.toLowerCase())].slice(0, 5);
      localStorage.setItem('weatherSearchHistory', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setError('Please enter a location to search.');
      return;
    }
    setLoading(true);
    setError(null);
    setWeather(null);
    setForecast([]);
    try {
      const [weatherData, forecastData] = await Promise.all([
        fetchWeatherByCity(searchQuery.trim(), unit),
        fetchForecast(searchQuery.trim(), unit)
      ]);
      setWeather(weatherData);
      setForecast(forecastData);
      saveToHistory(weatherData.name + ', ' + weatherData.sys.country);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError(`Location "${searchQuery}" not found. Try a different city name, zip code, or coordinates.`);
      } else if (err.response && err.response.status === 401) {
        setError('API key is invalid or not activated yet. Please check configuration.');
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('Request timed out. Please check your internet connection and try again.');
      } else {
        setError('Unable to fetch weather data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [unit]);

  const handleGeoLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocationLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          setLoading(true);
          const [weatherData, forecastData] = await Promise.all([
            fetchWeatherByCoords(latitude, longitude, unit),
            fetchForecast(`${latitude},${longitude}`, unit, true)
          ]);
          setWeather(weatherData);
          setForecast(forecastData);
          setQuery(weatherData.name + ', ' + weatherData.sys.country);
          saveToHistory(weatherData.name + ', ' + weatherData.sys.country);
        } catch (err) {
          setError('Failed to get weather for your location. Please try searching manually.');
        } finally {
          setLoading(false);
          setLocationLoading(false);
        }
      },
      (geoErr) => {
        setLocationLoading(false);
        if (geoErr.code === 1) {
          setError('Location access denied. Please allow location access or search manually.');
        } else if (geoErr.code === 2) {
          setError('Location unavailable. Please search manually.');
        } else {
          setError('Location request timed out. Please try again or search manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [unit]);

  // Re-fetch on unit toggle if weather is already loaded
  const handleUnitToggle = useCallback(() => {
    const newUnit = unit === 'metric' ? 'imperial' : 'metric';
    setUnit(newUnit);
    if (weather) {
      // Re-fetch with new unit
      const cityQuery = weather.name + ',' + weather.sys.country;
      setLoading(true);
      setError(null);
      Promise.all([
        fetchWeatherByCity(cityQuery, newUnit),
        fetchForecast(cityQuery, newUnit)
      ]).then(([w, f]) => {
        setWeather(w);
        setForecast(f);
      }).catch(() => {
        setError('Failed to reload with new units. Please search again.');
      }).finally(() => setLoading(false));
    }
  }, [unit, weather]);

  const getBackgroundClass = () => {
    if (!weather) return 'bg-default';
    const code = weather.weather[0].id;
    if (code >= 200 && code < 300) return 'bg-storm';
    if (code >= 300 && code < 400) return 'bg-drizzle';
    if (code >= 500 && code < 600) return 'bg-rain';
    if (code >= 600 && code < 700) return 'bg-snow';
    if (code >= 700 && code < 800) return 'bg-mist';
    if (code === 800) return 'bg-clear';
    return 'bg-clouds';
  };

  return (
    <div className={`app ${getBackgroundClass()}`}>
      {/* Animated background particles */}
      <div className="particles">
        {[...Array(12)].map((_, i) => <div key={i} className="particle" style={{ '--i': i }} />)}
      </div>

      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div className="header-left">
            <div className="logo">
              <span className="logo-icon">◎</span>
              <span className="logo-text">WeatherSphere</span>
            </div>
            <span className="header-sub">by Muhammad Hamza</span>
          </div>
          <div className="header-right">
            <button
              className="unit-toggle"
              onClick={handleUnitToggle}
              title={`Switch to ${unit === 'metric' ? 'Fahrenheit' : 'Celsius'}`}
            >
              {unit === 'metric' ? '°C → °F' : '°F → °C'}
            </button>
            <button className="info-btn" onClick={() => setShowInfo(v => !v)} title="About PM Accelerator">
              ℹ
            </button>
          </div>
        </header>

        {/* PM Accelerator Info Banner */}
        {showInfo && (
          <div className="info-banner">
            <strong>About PM Accelerator</strong>
            <p>{PM_ACCELERATOR_DESC}</p>
            <a href="https://www.linkedin.com/school/pmaccelerator/" target="_blank" rel="noreferrer">
              Visit LinkedIn Page →
            </a>
          </div>
        )}

        {/* Search Section */}
        <SearchBar
          query={query}
          setQuery={setQuery}
          onSearch={() => handleSearch(query)}
          onGeoLocation={handleGeoLocation}
          loading={loading}
          locationLoading={locationLoading}
          searchHistory={searchHistory}
          onHistorySelect={(h) => { setQuery(h); handleSearch(h); }}
        />

        {/* Error Banner */}
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Fetching weather data...</p>
          </div>
        )}

        {/* Weather Display */}
        {!loading && weather && (
          <div className="results-grid">
            <WeatherCard weather={weather} unit={unit} />
            <ExtraInsights weather={weather} unit={unit} />
            {forecast.length > 0 && <ForecastStrip forecast={forecast} unit={unit} />}
          </div>
        )}

        {/* Empty State */}
        {!loading && !weather && !error && (
          <div className="empty-state">
            <div className="empty-icon">🌍</div>
            <h2>Search any location worldwide</h2>
            <p>Enter a city, zip code, landmark, or use your current location</p>
            <div className="example-chips">
              {['New York', 'Tokyo', 'London', 'Dubai', '10001'].map(ex => (
                <button key={ex} className="example-chip" onClick={() => { setQuery(ex); handleSearch(ex); }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        <footer className="app-footer">
          <span>WeatherSphere · PM Accelerator Technical Assessment · Muhammad Hamza</span>
          <span>Powered by OpenWeatherMap API</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
