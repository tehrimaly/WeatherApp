const mongoose = require('mongoose');

/**
 * WeatherQuery - stores each user search + retrieved data
 * Supports CRUD, date-range queries, and export
 */
const weatherQuerySchema = new mongoose.Schema(
  {
    // User-provided inputs
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [200, 'Location too long']
    },
    resolvedLocation: {
      city:    { type: String },
      country: { type: String },
      lat:     { type: Number },
      lon:     { type: Number },
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },

    // Retrieved weather data
    weatherData: {
      currentTemp:    Number,
      minTemp:        Number,
      maxTemp:        Number,
      feelsLike:      Number,
      humidity:       Number,
      pressure:       Number,
      windSpeed:      Number,
      windDirection:  Number,
      description:    String,
      icon:           String,
      visibility:     Number,
      cloudCover:     Number,
    },
    unit: {
      type: String,
      enum: ['metric', 'imperial'],
      default: 'metric'
    },

    // API enrichments
    youtubeVideos:  [{ title: String, videoId: String, thumbnail: String, url: String }],
    mapData: {
      lat: Number, lon: Number, displayName: String,
      mapUrl: String, staticMapUrl: String
    },

    // Metadata
    queryTimestamp: { type: Date, default: Date.now },
    notes:          { type: String, maxlength: 1000 },
    tags:           [{ type: String, trim: true }],
    isFavorite:     { type: Boolean, default: false },
  },
  {
    timestamps: true,   // adds createdAt / updatedAt
    versionKey: false,
  }
);

// Index for fast lookups
weatherQuerySchema.index({ location: 1, queryTimestamp: -1 });
weatherQuerySchema.index({ 'resolvedLocation.city': 1 });
weatherQuerySchema.index({ startDate: 1, endDate: 1 });

// Validate endDate >= startDate
weatherQuerySchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    return next(new Error('End date must be on or after start date'));
  }
  next();
});

const WeatherQuery = mongoose.model('WeatherQuery', weatherQuerySchema);
module.exports = WeatherQuery;
