import React from 'react';
import { getIconUrl, getDayName } from '../utils/weatherApi';

const ForecastStrip = ({ forecast, unit }) => {
  if (!forecast || forecast.length === 0) return null;
  const tempUnit = unit === 'metric' ? '°C' : '°F';

  return (
    <div className="forecast-card">
      <div className="forecast-title">📅 5-Day Forecast</div>
      <div className="forecast-row">
        {forecast.map((day, i) => (
          <div key={i} className="forecast-day">
            <div className="fd-day">{getDayName(day.dt_txt)}</div>
            <div className="fd-icon">
              <img src={getIconUrl(day.weather[0].icon)} alt={day.weather[0].description} />
            </div>
            <div className="fd-high">{Math.round(day.main.temp_max)}{tempUnit}</div>
            <div className="fd-low">{Math.round(day.main.temp_min)}{tempUnit}</div>
            <div className="fd-desc">{day.weather[0].description}</div>
            {day.pop > 0.1 && (
              <div className="fd-rain">💧 {Math.round(day.pop * 100)}% rain</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForecastStrip;
