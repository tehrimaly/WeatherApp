# WeatherSphere — Full Stack Weather App
**PM Accelerator | Full Stack Engineer Intern | Muhammad Hamza**

---

## About PM Accelerator
PM Accelerator empowers aspiring and experienced product managers through mentorship, hands-on projects, and a vibrant global community. We accelerate careers by connecting talent with industry leaders across the world's top technology companies, equipping participants with real-world skills to drive product innovation and leadership.

🔗 [PM Accelerator on LinkedIn](https://www.linkedin.com/school/pmaccelerator/)

---

## Assessments Completed
- ✅ **Tech Assessment #1** — Frontend (React.js)
- ✅ **Tech Assessment #2** — Backend (Node.js + Express + MongoDB)

This submission covers **Full Stack** (highest priority candidate profile).

---

## Features

### Frontend (Assessment #1)
- 🔍 Search by city, zip code, GPS coordinates, or landmark
- 📍 Geolocation — detect user's current location
- 🌡️ Current weather with full stats (humidity, wind, pressure, visibility, cloud cover, sunrise/sunset)
- 📅 5-day forecast with daily high/low and precipitation probability
- ✈️ Traveler Insights — clothing advice, UV index, driving conditions, umbrella needed, outdoor activity suitability, humidity comfort
- 🌗 °C / °F unit toggle with live re-fetch
- 🕓 Recent search history (localStorage)
- ⚠️ Graceful error handling (404, timeout, geolocation denied, invalid API key)
- 🎨 Responsive design — desktop, tablet, mobile
- 🌤️ Dynamic background changes based on weather condition

### Backend (Assessment #2)
- 📦 Full **CRUD** on weather queries stored in MongoDB
- 📅 Date-range queries with validation
- 🌍 Location validation via OpenWeatherMap Geocoding API
- 🎬 YouTube video enrichment (location travel videos)
- 🗺️ OpenStreetMap map data + static map URL
- 📤 Data export in **5 formats**: JSON, CSV, XML, PDF, Markdown
- 🔒 Input validation, rate limiting, error handling middleware
- 📖 RESTful API design

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, CSS3, OpenWeatherMap API |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| APIs | OpenWeatherMap, YouTube Data API v3, OpenStreetMap |
| Export | PDFKit, xml2js, custom CSV |
| Security | Helmet, express-rate-limit, express-validator |

---

## Project Structure
```
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

## Setup & Run

### Prerequisites
- Node.js >= 18
- MongoDB (local) or MongoDB Atlas (cloud)
- OpenWeatherMap API key (free at https://openweathermap.org/api)
- YouTube Data API v3 key (optional, from https://console.cloud.google.com)

---

### Backend Setup
```bash
cd weather-app/backend
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env: add OPENWEATHER_API_KEY, MONGODB_URI, YOUTUBE_API_KEY

npm run dev       # Development (nodemon)
# or
npm start         # Production
```
Backend runs at: `http://localhost:5000`

---

### Frontend Setup
```bash
cd weather-app/frontend
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env: add REACT_APP_OPENWEATHER_API_KEY

npm start
```
Frontend runs at: `http://localhost:3000`

---

## API Reference (Backend)

### Current Weather (no DB)
```
GET /api/weather/current?location=London&units=metric
```

### CRUD Operations
```
POST   /api/weather              Create a weather query record
GET    /api/weather              List all records (paginated, filterable)
GET    /api/weather/:id          Get single record
PUT    /api/weather/:id          Update record
DELETE /api/weather/:id          Delete record
DELETE /api/weather              Delete all (requires header: x-confirm-delete: DELETE_ALL)
```

### POST /api/weather — Request Body
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

### Forecast
```
GET /api/forecast?location=Paris&startDate=2024-06-01&endDate=2024-06-05&units=metric
```

### Export
```
GET /api/export?format=json        → JSON file download
GET /api/export?format=csv         → CSV file download
GET /api/export?format=xml         → XML file download
GET /api/export?format=pdf         → PDF file download
GET /api/export?format=markdown    → Markdown file download

# Optional filters:
GET /api/export?format=csv&city=Tokyo&from=2024-01-01&to=2024-12-31&limit=50
```

### GET Filters
```
GET /api/weather?page=1&limit=20&city=London&from=2024-01-01&to=2024-12-31&favorite=true&search=tokyo
```

---

## Getting API Keys

### OpenWeatherMap (required for both frontend + backend)
1. Go to https://openweathermap.org/api
2. Sign up for a free account
3. Navigate to "My API Keys"
4. Copy your key to `.env`
5. Note: free tier key activates within ~2 hours of registration

### YouTube Data API v3 (optional — enables travel video enrichment)
1. Go to https://console.cloud.google.com
2. Create a project → Enable "YouTube Data API v3"
3. Create credentials → API Key
4. Add to backend `.env` as `YOUTUBE_API_KEY`

---

## Error Handling Examples
- `404` — City/location not found → friendly message with suggestions
- `401` — Invalid API key → clear configuration error message
- Timeout → retry message with connection advice
- Geolocation denied → fallback to manual search
- Invalid date range → validation message
- MongoDB connection failure → logged, API continues with error response
