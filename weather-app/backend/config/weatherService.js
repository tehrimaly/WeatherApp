const axios = require('axios');

const OWM_KEY = process.env.OPENWEATHER_API_KEY;
const OWM_BASE = 'https://api.openweathermap.org/data/2.5';
const GEO_BASE = 'https://api.openweathermap.org/geo/1.0';
const YOUTUBE_KEY = process.env.YOUTUBE_API_KEY;

const owmClient = axios.create({ timeout: 8000 });

/**
 * Resolve a freeform location string to {lat, lon, city, country}
 * Tries geocoding API, falls back to direct query
 */
async function resolveLocation(query) {
  try {
    // Try OpenWeatherMap geocoding
    const resp = await owmClient.get(`${GEO_BASE}/direct`, {
      params: { q: query, limit: 1, appid: OWM_KEY }
    });
    if (resp.data && resp.data.length > 0) {
      const loc = resp.data[0];
      return { lat: loc.lat, lon: loc.lon, city: loc.name, country: loc.country, resolved: true };
    }
    // Try zip code
    const zipResp = await owmClient.get(`${GEO_BASE}/zip`, {
      params: { zip: query, appid: OWM_KEY }
    });
    return { lat: zipResp.data.lat, lon: zipResp.data.lon, city: zipResp.data.name, country: zipResp.data.country, resolved: true };
  } catch {
    return null;
  }
}

/**
 * Fetch current weather for lat/lon
 */
async function fetchCurrentWeather(lat, lon, units = 'metric') {
  const resp = await owmClient.get(`${OWM_BASE}/weather`, {
    params: { lat, lon, appid: OWM_KEY, units }
  });
  return resp.data;
}

/**
 * Fetch historical weather (for date-range support, using forecast as approximation
 * since free tier doesn't have full historical API)
 * Returns temperature info for the range
 */
async function fetchWeatherForDateRange(lat, lon, startDate, endDate, units = 'metric') {
  // For a real implementation, use OpenWeather Historical API (paid) or Visual Crossing
  // Here we use the 5-day forecast as a best-effort for near-future dates
  const resp = await owmClient.get(`${OWM_BASE}/forecast`, {
    params: { lat, lon, appid: OWM_KEY, units, cnt: 40 }
  });

  const list = resp.data.list;
  const start = new Date(startDate);
  const end   = new Date(endDate);

  // Filter to requested range (may be partial for free API)
  const filtered = list.filter(item => {
    const d = new Date(item.dt_txt);
    return d >= start && d <= end;
  });

  if (filtered.length === 0) {
    // Return current as best effort
    return [list[0]];
  }

  return filtered;
}

/**
 * Search YouTube for videos of a location
 */
async function searchYoutube(location) {
  if (!YOUTUBE_KEY) return [];
  try {
    const resp = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        key: YOUTUBE_KEY,
        q: `${location} travel weather`,
        type: 'video',
        part: 'snippet',
        maxResults: 4,
        relevanceLanguage: 'en',
      },
      timeout: 6000
    });
    return resp.data.items.map(item => ({
      title:     item.snippet.title,
      videoId:   item.id.videoId,
      thumbnail: item.snippet.thumbnails.medium.url,
      url:       `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
  } catch (err) {
    console.warn('YouTube API error:', err.message);
    return [];
  }
}

/**
 * Get map data for a location using OSM Nominatim (free, no key needed)
 */
async function getMapData(lat, lon, displayName) {
  const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=12`;
  const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=11&size=600x300&markers=${lat},${lon},red`;
  return { lat, lon, displayName, mapUrl, staticMapUrl };
}

module.exports = { resolveLocation, fetchCurrentWeather, fetchWeatherForDateRange, searchYoutube, getMapData };
