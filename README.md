# WeatherSphere Full Stack Weather Application

## Overview

WeatherSphere is a full-stack weather application that provides real-time weather information, forecasts, traveler insights, and location-based services through a modern React frontend and a robust Node.js backend.

The project includes advanced weather search capabilities, geolocation support, weather analytics, data export functionality, and a complete RESTful API backed by MongoDB.

---

## Assessments Completed

- Frontend Development (React.js)
- Backend Development (Node.js, Express.js, MongoDB)

---

## Features

### Frontend

- Search weather by city, ZIP code, GPS coordinates, or landmarks
- Automatic geolocation detection
- Current weather conditions with detailed statistics:
  - Temperature
  - Humidity
  - Wind Speed
  - Atmospheric Pressure
  - Visibility
  - Cloud Coverage
  - Sunrise and Sunset Times
- 5-day weather forecast
- Traveler insights including:
  - Clothing recommendations
  - UV index guidance
  - Driving conditions
  - Rain and umbrella recommendations
  - Outdoor activity suitability
  - Humidity comfort analysis
- Celsius/Fahrenheit unit conversion
- Recent search history using local storage
- Comprehensive error handling
- Responsive user interface for desktop, tablet, and mobile devices
- Dynamic weather-based background themes

### Backend

- Complete CRUD operations for weather query management
- Date-range weather query support
- Location validation through OpenWeatherMap Geocoding API
- Travel video enrichment using YouTube Data API
- OpenStreetMap integration with static map support
- Data export functionality in multiple formats:
  - JSON
  - CSV
  - XML
  - PDF
  - Markdown
- Input validation and sanitization
- Rate limiting and security middleware
- RESTful API architecture

---

## Technology Stack

| Layer | Technologies |
|---------|-------------|
| Frontend | React 18, CSS3 |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Weather API | OpenWeatherMap API |
| Maps | OpenStreetMap |
| Media Integration | YouTube Data API v3 |
| Export Services | PDFKit, XML2JS, Custom CSV Processing |
| Security | Helmet, Express Rate Limit, Express Validator |

---

## Project Structure

```text
weather-app/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.js
│   │   │   ├── WeatherCard.js
│   │   │   ├── ForecastStrip.js
│   │   │   ├── ExtraInsights.js
│   │   │   └── ErrorBanner.js
│   │   ├── utils/
│   │   │   └── weatherApi.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── .env.example
│   └── package.json
│
└── backend/
    ├── config/
    │   └── weatherService.js
    ├── controllers/
    │   ├── weatherController.js
    │   └── exportController.js
    ├── models/
    │   └── WeatherQuery.js
    ├── routes/
    │   ├── weather.js
    │   ├── history.js
    │   ├── forecast.js
    │   └── export.js
    ├── .env.example
    ├── package.json
    └── server.js
```

---

## Installation

### Prerequisites

- Node.js 18 or later
- MongoDB (Local Installation or MongoDB Atlas)
- OpenWeatherMap API Key
- YouTube Data API Key (Optional)

---

## Backend Setup

```bash
cd weather-app/backend

npm install

cp .env.example .env
```

Configure the `.env` file:

```env
OPENWEATHER_API_KEY=your_api_key
MONGODB_URI=your_mongodb_connection_string
YOUTUBE_API_KEY=your_youtube_api_key
```

Run the backend server:

```bash
npm run dev
```

or

```bash
npm start
```

Backend URL:

```text
http://localhost:5000
```

---

## Frontend Setup

```bash
cd weather-app/frontend

npm install

cp .env.example .env
```

Configure the `.env` file:

```env
REACT_APP_OPENWEATHER_API_KEY=your_api_key
```

Start the development server:

```bash
npm start
```

Frontend URL:

```text
http://localhost:3000
```

---

## API Documentation

### Current Weather

```http
GET /api/weather/current?location=London&units=metric
```

---

### Weather Query CRUD Operations

```http
POST   /api/weather
GET    /api/weather
GET    /api/weather/:id
PUT    /api/weather/:id
DELETE /api/weather/:id
DELETE /api/weather
```

Bulk deletion requires:

```http
x-confirm-delete: DELETE_ALL
```

---

### Create Weather Query

#### Request

```http
POST /api/weather
```

#### Body

```json
{
  "location": "Tokyo, Japan",
  "startDate": "2024-06-01",
  "endDate": "2024-06-07",
  "units": "metric",
  "notes": "Planning a trip",
  "tags": ["travel", "japan"]
}
```

---

### Forecast Endpoint

```http
GET /api/forecast?location=Paris&startDate=2024-06-01&endDate=2024-06-05&units=metric
```

---

### Export Endpoints

```http
GET /api/export?format=json
GET /api/export?format=csv
GET /api/export?format=xml
GET /api/export?format=pdf
GET /api/export?format=markdown
```

Example with filters:

```http
GET /api/export?format=csv&city=Tokyo&from=2024-01-01&to=2024-12-31&limit=50
```

---

### Query Filters

```http
GET /api/weather?page=1&limit=20&city=London&from=2024-01-01&to=2024-12-31&favorite=true&search=tokyo
```

---

## Obtaining API Keys

### OpenWeatherMap API

1. Create an account at https://openweathermap.org/api
2. Generate an API key from your dashboard
3. Add the key to your environment variables
4. Allow up to two hours for activation on the free tier

### YouTube Data API v3 (Optional)

1. Visit https://console.cloud.google.com
2. Create a new project
3. Enable the YouTube Data API v3
4. Generate API credentials
5. Add the key to the backend environment configuration

---

## Error Handling

The application includes comprehensive error handling for:

- Invalid locations or city names
- Invalid API credentials
- Network timeouts
- Geolocation permission denial
- Invalid date ranges
- Database connection failures
- API rate limiting
- Input validation errors

All errors return structured responses with descriptive messages to improve user experience and debugging.

---

## Future Enhancements

- User authentication and profiles
- Weather alerts and notifications
- Historical weather analytics
- Interactive weather maps
- Dashboard and reporting features
- Cloud deployment support
- Progressive Web App (PWA) support

---

## License

This project is intended for educational, portfolio, and research purposes.

---
GitHub: https://github.com/tehrimaly

LinkedIn: https://linkedin.com/in/tehrimaly
