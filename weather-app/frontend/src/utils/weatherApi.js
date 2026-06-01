import axios from 'axios';

// Use environment variable for API key - never hardcode keys
const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || 'YOUR_OPENWEATHERMAP_API_KEY';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

const weatherAxios = axios.create({
  timeout: 10000,
});

/**
 * Fetch current weather by city name, zip code, landmark, or coordinates string
 * @param {string} query - city name, zip code, "lat,lon", or landmark
 * @param {string} units - 'metric' | 'imperial'
 */
export const fetchWeatherByCity = async (query, units = 'metric') => {
  // Detect if it's a coordinate pair e.g. "40.7128,-74.006"
  const coordMatch = query.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (coordMatch) {
    return fetchWeatherByCoords(parseFloat(coordMatch[1]), parseFloat(coordMatch[2]), units);
  }

  const response = await weatherAxios.get(`${BASE_URL}/weather`, {
    params: { q: query, appid: API_KEY, units },
  });
  return response.data;
};

/**
 * Fetch current weather by GPS coordinates
 */
export const fetchWeatherByCoords = async (lat, lon, units = 'metric') => {
  const response = await weatherAxios.get(`${BASE_URL}/weather`, {
    params: { lat, lon, appid: API_KEY, units },
  });
  return response.data;
};

/**
 * Fetch 5-day forecast (returns one entry per day — midday reading)
 * @param {string} query - city or "lat,lon"
 * @param {string} units
 * @param {boolean} isCoords - true if query is "lat,lon"
 */
export const fetchForecast = async (query, units = 'metric', isCoords = false) => {
  let params = { appid: API_KEY, units, cnt: 40 };

  const coordMatch = query.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (isCoords || coordMatch) {
    const parts = coordMatch || query.split(',');
    params.lat = parseFloat(parts[0]);
    params.lon = parseFloat(parts[1]);
  } else {
    params.q = query;
  }

  const response = await weatherAxios.get(`${BASE_URL}/forecast`, { params });
  const list = response.data.list;

  // Group by date, pick one reading per day (closest to noon = 12:00:00)
  const dailyMap = {};
  list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    const hour = parseInt(item.dt_txt.split(' ')[1]);
    if (!dailyMap[date]) {
      dailyMap[date] = item;
    } else {
      const existing = parseInt(dailyMap[date].dt_txt.split(' ')[1]);
      if (Math.abs(hour - 12) < Math.abs(existing - 12)) {
        dailyMap[date] = item;
      }
    }
  });

  // Return next 5 days (skip today if we already have current weather)
  const today = new Date().toISOString().split('T')[0];
  return Object.entries(dailyMap)
    .filter(([date]) => date > today)
    .slice(0, 5)
    .map(([, item]) => item);
};

/**
 * Get weather icon URL from icon code
 */
export const getIconUrl = (iconCode) =>
  `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

/**
 * Convert Unix timestamp + timezone offset to local time string
 */
export const formatLocalTime = (unixTs, timezoneOffset) => {
  const date = new Date((unixTs + timezoneOffset) * 1000);
  return date.toUTCString().replace('GMT', '').trim();
};

/**
 * Convert wind degrees to cardinal direction
 */
export const windDirection = (deg) => {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
};

/**
 * Format day name from dt_txt
 */
export const getDayName = (dtTxt) => {
  const date = new Date(dtTxt);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

/**
 * Compute UV index advisory level
 */
export const uvLevel = (uvi) => {
  if (uvi <= 2)  return { label: 'Low', cls: 'uv-low' };
  if (uvi <= 5)  return { label: 'Moderate', cls: 'uv-mod' };
  if (uvi <= 7)  return { label: 'High', cls: 'uv-high' };
  if (uvi <= 10) return { label: 'Very High', cls: 'uv-vhigh' };
  return { label: 'Extreme', cls: 'uv-vhigh' };
};

/**
 * Format sunrise/sunset from unix ts + timezone
 */
export const formatSunTime = (unixTs, timezoneOffset) => {
  const d = new Date((unixTs + timezoneOffset) * 1000);
  const h = d.getUTCHours().toString().padStart(2, '0');
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};
