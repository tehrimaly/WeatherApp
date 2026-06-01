import React from 'react';
import { getIconUrl, formatLocalTime, windDirection, formatSunTime } from '../utils/weatherApi';

const WeatherCard = ({ weather, unit }) => {
  if (!weather) return null;

  const {
    name, sys, main, weather: conditions, wind, visibility,
    clouds, rain, snow, dt, timezone
  } = weather;

  const condition = conditions[0];
  const tempUnit = unit === 'metric' ? '°C' : '°F';
  const speedUnit = unit === 'metric' ? 'm/s' : 'mph';
  const localTime = formatLocalTime(dt, timezone);
  const sunrise = formatSunTime(sys.sunrise, timezone);
  const sunset  = formatSunTime(sys.sunset,  timezone);

  const stats = [
    { label: 'Humidity',       value: `${main.humidity}%`,           emoji: '💧' },
    { label: 'Wind',           value: `${wind.speed} ${speedUnit} ${windDirection(wind.deg)}`, emoji: '💨' },
    { label: 'Pressure',       value: `${main.pressure} hPa`,        emoji: '🌡️' },
    { label: 'Visibility',     value: `${visibility ? (visibility / 1000).toFixed(1) + ' km' : 'N/A'}`, emoji: '👁️' },
    { label: 'Cloud Cover',    value: `${clouds.all}%`,               emoji: '☁️' },
    { label: 'Sunrise / Set',  value: `${sunrise} / ${sunset}`,      emoji: '🌅' },
    { label: 'Min / Max Temp', value: `${Math.round(main.temp_min)}${tempUnit} / ${Math.round(main.temp_max)}${tempUnit}`, emoji: '🌡️' },
    ...(rain ? [{ label: 'Rain (1h)', value: `${rain['1h'] || rain['3h'] || 0} mm`, emoji: '🌧️' }] : []),
    ...(snow ? [{ label: 'Snow (1h)', value: `${snow['1h'] || snow['3h'] || 0} mm`, emoji: '❄️' }] : []),
  ];

  return (
    <div className="weather-card">
      <div className="wc-left">
        <div>
          <div className="wc-location">{name}</div>
          <div className="wc-country">{sys.country} · {localTime}</div>
        </div>
        <div className="wc-temp">{Math.round(main.temp)}{tempUnit}</div>
        <div className="wc-feels">Feels like {Math.round(main.feels_like)}{tempUnit}</div>
        <div className="wc-desc">{condition.description}</div>
      </div>
      <div className="wc-right">
        <div className="wc-icon">
          <img src={getIconUrl(condition.icon)} alt={condition.description} />
        </div>
        <div className="wc-time">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      <div className="wc-stats">
        {stats.map((s, i) => (
          <div key={i} className="wc-stat">
            <div className="wc-stat-label">{s.emoji} {s.label}</div>
            <div className="wc-stat-value">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherCard;
