const WeatherQuery = require('../models/WeatherQuery');
const {
  resolveLocation, fetchCurrentWeather,
  fetchWeatherForDateRange, searchYoutube, getMapData
} = require('../config/weatherService');

/**
 * GET /api/weather/current?location=...&units=...
 * Returns live weather without storing
 */
exports.getCurrentWeather = async (req, res, next) => {
  try {
    const { location, units = 'metric' } = req.query;
    const resolved = await resolveLocation(location);
    if (!resolved) {
      return res.status(404).json({ error: `Location "${location}" could not be found. Try a different name.` });
    }
    const weatherData = await fetchCurrentWeather(resolved.lat, resolved.lon, units);
    res.json({ resolved, weatherData });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'Location not found' });
    }
    next(err);
  }
};

/**
 * POST /api/weather
 * CREATE - store a query with date range
 */
exports.createWeatherQuery = async (req, res, next) => {
  try {
    const { location, startDate, endDate, units = 'metric', notes, tags } = req.body;

    // Validate location exists
    const resolved = await resolveLocation(location);
    if (!resolved) {
      return res.status(422).json({
        error: `Location "${location}" could not be validated. Please try a more specific name or a zip code.`
      });
    }

    // Validate date range - can't query more than 2 years back or 5 days forward (API limit)
    const start = new Date(startDate);
    const end   = new Date(endDate);
    const dayDiff = (end - start) / (1000 * 60 * 60 * 24);
    if (dayDiff > 730) {
      return res.status(400).json({ error: 'Date range cannot exceed 730 days (2 years).' });
    }

    // Fetch weather for the date range
    let weatherDataRaw;
    try {
      const forecast = await fetchWeatherForDateRange(resolved.lat, resolved.lon, startDate, endDate, units);
      const first = forecast[0];
      weatherDataRaw = {
        currentTemp:   first.main.temp,
        minTemp:       Math.min(...forecast.map(d => d.main.temp_min)),
        maxTemp:       Math.max(...forecast.map(d => d.main.temp_max)),
        feelsLike:     first.main.feels_like,
        humidity:      first.main.humidity,
        pressure:      first.main.pressure,
        windSpeed:     first.wind.speed,
        windDirection: first.wind.deg,
        description:   first.weather[0].description,
        icon:          first.weather[0].icon,
        visibility:    first.visibility,
        cloudCover:    first.clouds.all,
      };
    } catch {
      // Fallback: fetch current weather
      const current = await fetchCurrentWeather(resolved.lat, resolved.lon, units);
      weatherDataRaw = {
        currentTemp:   current.main.temp,
        minTemp:       current.main.temp_min,
        maxTemp:       current.main.temp_max,
        feelsLike:     current.main.feels_like,
        humidity:      current.main.humidity,
        pressure:      current.main.pressure,
        windSpeed:     current.wind.speed,
        windDirection: current.wind.deg,
        description:   current.weather[0].description,
        icon:          current.weather[0].icon,
        visibility:    current.visibility,
        cloudCover:    current.clouds.all,
      };
    }

    // Fetch enrichments in parallel
    const [ytVideos, mapData] = await Promise.all([
      searchYoutube(`${resolved.city} ${resolved.country}`),
      getMapData(resolved.lat, resolved.lon, `${resolved.city}, ${resolved.country}`)
    ]);

    const record = new WeatherQuery({
      location,
      resolvedLocation: { city: resolved.city, country: resolved.country, lat: resolved.lat, lon: resolved.lon },
      startDate: start,
      endDate:   end,
      unit:      units,
      weatherData: weatherDataRaw,
      youtubeVideos: ytVideos,
      mapData,
      notes,
      tags,
    });

    await record.save();
    res.status(201).json({ message: 'Weather query stored', data: record });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

/**
 * GET /api/weather
 * READ - list all stored queries with pagination + filtering
 */
exports.getWeatherQueries = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, city, from, to,
      favorite, search
    } = req.query;

    const filter = {};
    if (city)     filter['resolvedLocation.city'] = { $regex: city, $options: 'i' };
    if (from)     filter.startDate = { $gte: new Date(from) };
    if (to)       filter.endDate   = { ...(filter.endDate || {}), $lte: new Date(to) };
    if (favorite === 'true') filter.isFavorite = true;
    if (search)   filter.location  = { $regex: search, $options: 'i' };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await WeatherQuery.countDocuments(filter);
    const records = await WeatherQuery.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      data: records,
      pagination: {
        total, page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/weather/:id
 * READ single
 */
exports.getWeatherQueryById = async (req, res, next) => {
  try {
    const record = await WeatherQuery.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json({ data: record });
  } catch (err) { next(err); }
};

/**
 * PUT /api/weather/:id
 * UPDATE - allows updating user-editable fields (location, dates, notes, tags, favorite)
 * Weather data is re-fetched if location/dates change
 */
exports.updateWeatherQuery = async (req, res, next) => {
  try {
    const record = await WeatherQuery.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const { location, startDate, endDate, notes, tags, isFavorite, unit } = req.body;
    let needsRefetch = false;

    if (location && location !== record.location) {
      // Validate new location
      const resolved = await resolveLocation(location);
      if (!resolved) {
        return res.status(422).json({ error: `Location "${location}" could not be validated.` });
      }
      record.location = location;
      record.resolvedLocation = { city: resolved.city, country: resolved.country, lat: resolved.lat, lon: resolved.lon };
      needsRefetch = true;
    }

    if (startDate) {
      const newStart = new Date(startDate);
      if (newStart > (endDate ? new Date(endDate) : record.endDate)) {
        return res.status(400).json({ error: 'startDate cannot be after endDate' });
      }
      record.startDate = newStart;
      needsRefetch = true;
    }
    if (endDate) {
      const newEnd = new Date(endDate);
      if (newEnd < record.startDate) {
        return res.status(400).json({ error: 'endDate cannot be before startDate' });
      }
      record.endDate = newEnd;
      needsRefetch = true;
    }

    // Re-fetch weather if key fields changed
    if (needsRefetch) {
      try {
        const current = await fetchCurrentWeather(
          record.resolvedLocation.lat, record.resolvedLocation.lon, record.unit
        );
        record.weatherData = {
          currentTemp:   current.main.temp,
          minTemp:       current.main.temp_min,
          maxTemp:       current.main.temp_max,
          feelsLike:     current.main.feels_like,
          humidity:      current.main.humidity,
          pressure:      current.main.pressure,
          windSpeed:     current.wind.speed,
          windDirection: current.wind.deg,
          description:   current.weather[0].description,
          icon:          current.weather[0].icon,
          visibility:    current.visibility,
          cloudCover:    current.clouds.all,
        };
      } catch { /* keep old data if refetch fails */ }
    }

    if (notes     !== undefined) record.notes      = notes;
    if (tags      !== undefined) record.tags        = tags;
    if (isFavorite !== undefined) record.isFavorite = isFavorite;
    if (unit      !== undefined) record.unit        = unit;

    await record.save();
    res.json({ message: 'Record updated', data: record });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

/**
 * DELETE /api/weather/:id
 * DELETE single record
 */
exports.deleteWeatherQuery = async (req, res, next) => {
  try {
    const record = await WeatherQuery.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted', id: req.params.id });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/weather
 * DELETE all records (with confirmation header)
 */
exports.deleteAllWeatherQueries = async (req, res, next) => {
  try {
    if (req.headers['x-confirm-delete'] !== 'DELETE_ALL') {
      return res.status(400).json({
        error: 'To delete all records, include header: x-confirm-delete: DELETE_ALL'
      });
    }
    const result = await WeatherQuery.deleteMany({});
    res.json({ message: `Deleted ${result.deletedCount} records` });
  } catch (err) { next(err); }
};
