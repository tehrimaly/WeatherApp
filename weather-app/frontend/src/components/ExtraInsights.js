import React from 'react';
import { uvLevel } from '../utils/weatherApi';

/**
 * Non-obvious insights a traveler/user would want to know.
 * Things like: UV risk, what to wear, pollen risk hint, driving conditions, etc.
 */
const ExtraInsights = ({ weather, unit }) => {
  if (!weather) return null;

  const { main, wind, weather: conditions, sys, rain, snow } = weather;
  const condition = conditions[0];
  const tempC = unit === 'metric' ? main.temp : (main.temp - 32) * 5/9;
  const tempUnit = unit === 'metric' ? '°C' : '°F';
  const speedUnit = unit === 'metric' ? 'm/s' : 'mph';

  // Clothing recommendation
  let clothing = '';
  if (tempC < 0)       clothing = '🧥 Heavy winter coat, gloves, hat';
  else if (tempC < 8)  clothing = '🧥 Warm coat and layers';
  else if (tempC < 15) clothing = '🧣 Light jacket or hoodie';
  else if (tempC < 22) clothing = '👕 Long sleeves / light layer';
  else if (tempC < 29) clothing = '👕 T-shirt & light clothing';
  else                 clothing = '🩳 Light, breathable clothing — stay hydrated!';

  // Driving conditions
  let driving = '';
  const precipStrong = rain?.['1h'] > 5 || rain?.['3h'] > 5;
  const snowing = condition.main === 'Snow' || snow?.['1h'] > 0;
  if (snowing)                           driving = '⛄ Snow — slow down, use winter tyres';
  else if (precipStrong)                 driving = '🌧️ Heavy rain — reduced visibility, caution';
  else if (condition.main === 'Fog' || condition.main === 'Mist') driving = '🌫️ Fog — use fog lights, slow down';
  else if (wind.speed > 15)             driving = '💨 High winds — watch for gusts, esp. trucks';
  else                                  driving = '✅ Clear driving conditions';

  // Umbrella needed?
  const umbrella = condition.main === 'Rain' || condition.main === 'Drizzle' || condition.main === 'Thunderstorm' || (rain?.['1h'] > 0);

  // Estimated UV index approximation (not from API without One Call — we estimate)
  const hour = new Date().getUTCHours() + (weather.timezone / 3600);
  const isDay = hour >= 6 && hour <= 18;
  const uvApprox = isDay
    ? (condition.main === 'Clear' ? Math.min(Math.round(3 + (Math.sin((hour-6)/12 * Math.PI)) * 6), 11) : 1)
    : 0;
  const uvInfo = uvLevel(uvApprox);

  // Outdoor activity suggestion
  let activity = '';
  if (condition.main === 'Clear' && tempC > 10 && tempC < 32) activity = '🏃 Great day for outdoor activities!';
  else if (condition.main === 'Rain' || condition.main === 'Thunderstorm') activity = '🏠 Stay indoors or carry rain gear';
  else if (condition.main === 'Snow') activity = '⛷️ Snow activities, but dress warm';
  else if (tempC > 35) activity = '🥵 Extreme heat — limit outdoor exposure';
  else if (tempC < -5) activity = '🥶 Very cold — keep outdoor time short';
  else activity = '🌤️ Moderate conditions — light outdoor activity okay';

  // Humidity comfort
  let humidityNote = '';
  if (main.humidity > 85)    humidityNote = 'Very humid — may feel hotter than actual temp';
  else if (main.humidity < 20) humidityNote = 'Very dry — stay hydrated, use moisturizer';
  else                         humidityNote = 'Comfortable humidity level';

  const insights = [
    { icon: '👗', label: 'What to Wear', value: clothing, sub: `${Math.round(main.temp)}${tempUnit} feels like ${Math.round(main.feels_like)}${tempUnit}` },
    { icon: '☀️', label: 'UV Index', value: `~${uvApprox} (${uvInfo.label})`, sub: uvApprox > 2 ? 'Apply sunscreen SPF 30+' : 'Low UV risk today', valueClass: uvInfo.cls },
    { icon: '🚗', label: 'Driving Conditions', value: driving, sub: `Wind: ${wind.speed} ${speedUnit}` },
    { icon: '☂️', label: 'Umbrella Needed?', value: umbrella ? 'Yes — bring one!' : 'Not necessary', sub: condition.description },
    { icon: '🏃', label: 'Outdoor Activity', value: activity, sub: '' },
    { icon: '💦', label: 'Humidity Note', value: humidityNote, sub: `${main.humidity}% relative humidity` },
  ];

  return (
    <div className="insights-card">
      <div className="insights-title">✦ Traveler Insights</div>
      <div className="insights-grid">
        {insights.map((item, i) => (
          <div key={i} className="insight-item">
            <div className="insight-icon">{item.icon}</div>
            <div className="insight-text">
              <div className="insight-label">{item.label}</div>
              <div className={`insight-value ${item.valueClass || ''}`}>{item.value}</div>
              {item.sub && <div className="insight-sub">{item.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExtraInsights;
